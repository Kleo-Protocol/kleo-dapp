#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod loan_instance {
    use ink::env::{
        call::{build_call, ExecutionInput, Selector},
        DefaultEnvironment,
    };
use ink::{H160, U256};
use scale_info::prelude::vec::Vec;
use ink::storage::traits::StorageLayout;

    // ─────────────────────────────────────────────
    // DATA TYPES
    // ─────────────────────────────────────────────

#[derive(scale::Encode, scale::Decode, Clone, Copy, PartialEq, Eq)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
pub enum LoanState {
        Funding,
        Active,
        Defaulted,
        Completed,
    }

    #[derive(scale::Encode, scale::Decode, Clone)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct LenderContribution {
        pub lender: H160,
        pub amount: u128,
    }

    // ─────────────────────────────────────────────
    // STORAGE
    // ─────────────────────────────────────────────

    #[ink(storage)]
    pub struct LoanInstance {
        borrower: H160,

        principal: u128,
        overfactor_bps: u32,
        total_required: u128,
        total_contributed: u128,

        min_lenders: u32,
        contributions: Vec<LenderContribution>,

        remaining_debt: u128,
        state: LoanState,

        created_at: u64,
        last_payment_at: u64,

        trust_oracle: H160,
        hydration_adapter: H160,

        buffer_deposited: bool,
        buffer_shares: u128,

        trust_score_at_issuance: i32,
    }

    impl LoanInstance {
        // ─────────────────────────────────────────────
        // CONSTRUCTOR
        // ─────────────────────────────────────────────

        #[ink(constructor)]
        pub fn new(
            borrower: H160,
            principal: u128,
            overfactor_bps: u32,
            max_duration: u64,        // parámetro estilo registry
            trust_oracle: H160,
            hydration_adapter: H160,
        ) -> Self {
            let total_required = principal * overfactor_bps as u128 / 10_000;
            let now = Self::env().block_timestamp();

            Self {
                borrower,
                principal,
                overfactor_bps,
                total_required,
                total_contributed: 0,

                min_lenders: 3,
                contributions: Vec::new(),

                remaining_debt: principal,
                state: LoanState::Funding,

                created_at: now,
                last_payment_at: now,

                trust_oracle,
                hydration_adapter,

                buffer_deposited: false,
                buffer_shares: 0,

                trust_score_at_issuance: 0,
            }
        }

        // ─────────────────────────────────────────────
        // FUNDING
        // ─────────────────────────────────────────────

        #[ink(message, payable)]
        pub fn contribute(&mut self) {
            assert!(self.state == LoanState::Funding, "Not funding");

            let lender: H160 = self.env().caller();
            let amount_u256: U256 = self.env().transferred_value();
            let amount: u128 = amount_u256.as_u128();

            assert!(amount > 0, "Contribution must be > 0");

            self.contributions.push(LenderContribution { lender, amount });

            self.total_contributed += amount;

            if self.total_contributed >= self.total_required {
                self.activate_loan();
            }
        }

        fn activate_loan(&mut self) {
            assert!(self.state == LoanState::Funding, "Already active");

            assert!(
                self.count_distinct_lenders() >= self.min_lenders,
                "Not enough lenders"
            );

            let principal_out = self.principal;
            let buffer_amount = self.total_required - self.principal;

            // 1. Transfer principal to borrower
            self.transfer_h160(self.borrower, principal_out);

            // 2. Deposit buffer into Hydration
            let shares = self.call_hydration_deposit(buffer_amount);
            self.buffer_shares = shares;
            self.buffer_deposited = true;

            // 3. Read trust score at issuance
            self.trust_score_at_issuance =
                self.call_oracle_get_score(self.borrower);

            self.state = LoanState::Active;
        }

        fn count_distinct_lenders(&self) -> u32 {
            let mut seen: Vec<H160> = Vec::new();
            for c in &self.contributions {
                if !seen.contains(&c.lender) {
                    seen.push(c.lender);
                }
            }
            seen.len() as u32
        }

        // ─────────────────────────────────────────────
        // REPAYMENTS
        // ─────────────────────────────────────────────

        #[ink(message, payable)]
        pub fn repay(&mut self) {
            assert!(self.state == LoanState::Active, "Not active");

            let amount_u256 = self.env().transferred_value();
            let amount: u128 = amount_u256.as_u128();
            assert!(amount > 0, "Repayment must be > 0");

            if amount >= self.remaining_debt {
                self.remaining_debt = 0;
                self.last_payment_at = self.env().block_timestamp();
                self.call_oracle_event_installment(amount);
                self.finalize_success();
            } else {
                self.remaining_debt -= amount;
                self.last_payment_at = self.env().block_timestamp();
                self.call_oracle_event_installment(amount);
            }
        }

        // ─────────────────────────────────────────────
        // DEFAULT DETECTION
        // ─────────────────────────────────────────────

        #[ink(message)]
        pub fn check_default(&mut self, grace_period: u64) {
            if self.state != LoanState::Active {
                return;
            }

            let now = self.env().block_timestamp();
            if now - self.last_payment_at > grace_period {
                self.finalize_default();
            }
        }

        fn finalize_success(&mut self) {
            assert!(self.remaining_debt == 0, "Debt not zero");

            let (buffer_p, buffer_y) = self.call_hydration_withdraw();

            self.distribute_pro_rata(buffer_p, buffer_y);
            self.state = LoanState::Completed;
        }

        fn finalize_default(&mut self) {
            self.state = LoanState::Defaulted;

            let (buffer_p, buffer_y) = self.call_hydration_withdraw();

            let mut available = buffer_p;

            if available >= self.remaining_debt {
                available -= self.remaining_debt;
                self.remaining_debt = 0;
                self.distribute_pro_rata(available, buffer_y);
            } else {
                let shortfall = self.remaining_debt - available;
                self.distribute_loss(shortfall);
            }

            self.call_oracle_event_default();
        }

        // ─────────────────────────────────────────────
        // DISTRIBUTION
        // ─────────────────────────────────────────────

        fn distribute_pro_rata(&self, p: u128, y: u128) {
            for c in &self.contributions {
                let share = c.amount * 1_000_000_000 / self.total_contributed;

                let p_part = p * share / 1_000_000_000;
                let y_part = y * share / 1_000_000_000;

                if p_part > 0 {
                    self.transfer_h160(c.lender, p_part);
                }
                if y_part > 0 {
                    self.transfer_h160(c.lender, y_part);
                }
            }
        }

        fn distribute_loss(&self, _shortfall: u128) {
            // Lenders simply do not receive some repayments
        }

        // ─────────────────────────────────────────────
        // CROSS-CONTRACT CALLS (ink! 6 format)
        // ─────────────────────────────────────────────

        fn call_oracle_get_score(&self, borrower: H160) -> i32 {
            let selector = Selector::new(ink::selector_bytes!("get_trust_score"));

            build_call::<DefaultEnvironment>()
                .call(self.trust_oracle)
                .transferred_value(U256::from(0))
                .exec_input(
                    ExecutionInput::new(selector)
                        .push_arg(borrower)
                )
                .returns::<i32>()
                .invoke()
        }

        fn call_oracle_event_installment(&self, amount: u128) {
            let selector = Selector::new(ink::selector_bytes!("notify_installment"));

            let _ = build_call::<DefaultEnvironment>()
                .call(self.trust_oracle)
                .transferred_value(U256::from(0))
                .exec_input(
                    ExecutionInput::new(selector)
                        .push_arg(self.borrower)
                        .push_arg(amount)
                )
                .returns::<()>()
                .invoke();
        }

        fn call_oracle_event_default(&self) {
            let selector = Selector::new(ink::selector_bytes!("notify_default"));

            let _ = build_call::<DefaultEnvironment>()
                .call(self.trust_oracle)
                .transferred_value(U256::from(0))
                .exec_input(
                    ExecutionInput::new(selector)
                        .push_arg(self.borrower)
                )
                .returns::<()>()
                .invoke();
        }

        fn call_hydration_deposit(&self, amount: u128) -> u128 {
            let selector = Selector::new(ink::selector_bytes!("deposit_for_loan"));

            build_call::<DefaultEnvironment>()
                .call(self.hydration_adapter)
                .transferred_value(amount.into())
                .exec_input(
                    ExecutionInput::new(selector)
                        .push_arg(self.borrower)
                )
                .returns::<u128>()
                .invoke()
        }

        fn call_hydration_withdraw(&self) -> (u128, u128) {
            let selector = Selector::new(ink::selector_bytes!("withdraw_for_loan"));

            build_call::<DefaultEnvironment>()
                .call(self.hydration_adapter)
                .transferred_value(U256::from(0))
                .exec_input(
                    ExecutionInput::new(selector)
                        .push_arg(self.borrower)
                )
                .returns::<(u128, u128)>()
                .invoke()
        }

        // ─────────────────────────────────────────────
        // VALUE TRANSFER (ink! 6)
        // ─────────────────────────────────────────────

        fn transfer_h160(&self, to: H160, amount: u128) {
            let selector = Selector::new(ink::selector_bytes!("transfer"));

            build_call::<DefaultEnvironment>()
                .call(to)
                .transferred_value(amount.into())
                .exec_input(ExecutionInput::new(selector))
                .returns::<()>()
                .invoke();
        }

        // ─────────────────────────────────────────────
        // GETTERS
        // ─────────────────────────────────────────────

        #[ink(message)]
        pub fn get_state(&self) -> LoanState {
            self.state
        }

        #[ink(message)]
        pub fn get_remaining_debt(&self) -> u128 {
            self.remaining_debt
        }

        #[ink(message)]
        pub fn get_contributions(&self) -> Vec<LenderContribution> {
            self.contributions.clone()
        }

        #[ink(message)]
        pub fn get_borrower(&self) -> H160 {
            self.borrower
        }

        #[ink(message)]
        pub fn get_principal(&self) -> u128 {
            self.principal
        }

        #[ink(message)]
        pub fn get_buffer_deposited(&self) -> bool {
            self.buffer_deposited
        }
    }
}
