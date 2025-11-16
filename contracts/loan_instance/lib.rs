#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod loan_instance {
    #[cfg(not(test))]
    use ink::env::{
        call::{build_call, ExecutionInput, Selector},
        DefaultEnvironment,
    };
    use ink::{H160, U256};
    use ink::storage::traits::StorageLayout;
    use scale_info::prelude::vec::Vec;

    // ─────────────────────────────────────────────
    // DATA TYPES
    // ─────────────────────────────────────────────

    #[derive(Debug, scale::Encode, scale::Decode, Clone, Copy, PartialEq, Eq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    pub enum LoanState {
        Funding,
        Active,
        Defaulted,
        Completed,
    }

    #[derive(Debug, scale::Encode, scale::Decode, Clone)]
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

        /// Monto del buffer ( (α - 1)L ) que queda retenido en este contrato.
        buffer_amount: u128,

        trust_score_at_issuance: i32,
    }

    #[cfg(test)]
    mod test_helpers {
        use super::*;
        use std::cell::RefCell;

        thread_local! {
            static TRUST_SCORE: RefCell<i32> = RefCell::new(0);
            static INSTALLMENTS: RefCell<Vec<(H160, u128)>> = RefCell::new(Vec::new());
            static DEFAULTS: RefCell<Vec<H160>> = RefCell::new(Vec::new());
            static TRANSFERS: RefCell<Vec<(H160, u128)>> = RefCell::new(Vec::new());
        }

        pub fn reset() {
            TRUST_SCORE.with(|v| *v.borrow_mut() = 0);
            INSTALLMENTS.with(|v| v.borrow_mut().clear());
            DEFAULTS.with(|v| v.borrow_mut().clear());
            TRANSFERS.with(|v| v.borrow_mut().clear());
        }

        pub fn set_trust_score(score: i32) {
            TRUST_SCORE.with(|v| *v.borrow_mut() = score);
        }

        pub fn trust_score() -> i32 {
            TRUST_SCORE.with(|v| *v.borrow())
        }

        pub fn record_installment(borrower: H160, amount: u128) {
            INSTALLMENTS.with(|v| v.borrow_mut().push((borrower, amount)));
        }

        pub fn installments() -> Vec<(H160, u128)> {
            INSTALLMENTS.with(|v| v.borrow().clone())
        }

        pub fn record_default(borrower: H160) {
            DEFAULTS.with(|v| v.borrow_mut().push(borrower));
        }

        pub fn defaults() -> Vec<H160> {
            DEFAULTS.with(|v| v.borrow().clone())
        }

        pub fn record_transfer(to: H160, amount: u128) {
            TRANSFERS.with(|v| v.borrow_mut().push((to, amount)));
        }

        pub fn transfers() -> Vec<(H160, u128)> {
            TRANSFERS.with(|v| v.borrow().clone())
        }
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
            _max_duration: u64,        // parámetro estilo registry, no usado aún
            trust_oracle: H160,
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

                buffer_amount: 0,

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

            // 2. Guardar buffer internamente (ya está en el balance del contrato)
            self.buffer_amount = buffer_amount;

            // 3. Leer trust score al momento de emisión
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

            // Suposición simple:
            // - El borrower devolvió todo el principal.
            // - El contrato tiene: principal + buffer_amount.
            // Usamos `principal` como "buffer_principal" y `buffer_amount` como "extra/yield".
            let buffer_p = self.principal;
            let buffer_y = self.buffer_amount;

            self.distribute_pro_rata(buffer_p, buffer_y);
            self.buffer_amount = 0;
            self.state = LoanState::Completed;
        }

        fn finalize_default(&mut self) {
            self.state = LoanState::Defaulted;

            // En default:
            // - El buffer se usa primero para cubrir la deuda restante.
            // - Si sobra algo, se reparte pro-rata (como pequeño salvavidas).
            // - Si falta, se registra una pérdida implícita.
            let mut available = self.buffer_amount;

            if available >= self.remaining_debt {
                // Buffer cubre toda la deuda
                available -= self.remaining_debt;
                self.remaining_debt = 0;

                if available > 0 {
                    // Lo que queda de buffer se reparte (sin yield extra)
                    self.distribute_pro_rata(available, 0);
                }
            } else {
                // Buffer no alcanza para cubrir la deuda
                let shortfall = self.remaining_debt - available;
                self.remaining_debt -= available;
                self.distribute_loss(shortfall);
            }

            self.buffer_amount = 0;
            self.call_oracle_event_default();
        }

        // ─────────────────────────────────────────────
        // DISTRIBUTION
        // ─────────────────────────────────────────────

        fn distribute_pro_rata(&self, p: u128, y: u128) {
            if self.total_contributed == 0 {
                return;
            }

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
            // Las pérdidas se reflejan en que los lenders no recuperan todo.
            // Aquí podrías loguear o notificar, pero no hay transferencia.
        }

        // ─────────────────────────────────────────────
        // CROSS-CONTRACT CALLS (trust_oracle)
        // ─────────────────────────────────────────────

        #[cfg(not(test))]
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

        #[cfg(test)]
        fn call_oracle_get_score(&self, _borrower: H160) -> i32 {
            test_helpers::trust_score()
        }

        #[cfg(not(test))]
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

        #[cfg(test)]
        fn call_oracle_event_installment(&self, amount: u128) {
            test_helpers::record_installment(self.borrower, amount);
        }

        #[cfg(not(test))]
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

        #[cfg(test)]
        fn call_oracle_event_default(&self) {
            test_helpers::record_default(self.borrower);
        }

        // ─────────────────────────────────────────────
        // VALUE TRANSFER (ink! 6)
        // ─────────────────────────────────────────────

        #[cfg(not(test))]
        fn transfer_h160(&self, to: H160, amount: u128) {
            let selector = Selector::new(ink::selector_bytes!("transfer"));

            build_call::<DefaultEnvironment>()
                .call(to)
                .transferred_value(amount.into())
                .exec_input(ExecutionInput::new(selector))
                .returns::<()>()
                .invoke();
        }

        #[cfg(test)]
        fn transfer_h160(&self, to: H160, amount: u128) {
            test_helpers::record_transfer(to, amount);
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

        /// Antes era un flag de si el buffer fue depositado en Hydration.
        /// Ahora simplemente indica si hay buffer retenido en el contrato.
        #[ink(message)]
        pub fn get_buffer_deposited(&self) -> bool {
            self.buffer_amount > 0
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::{test, DefaultEnvironment};
        use std::collections::HashMap;

        fn default_accounts() -> test::DefaultAccounts {
            test::default_accounts()
        }

        fn contribute_as(contract: &mut LoanInstance, lender: H160, amount: u128) {
            test::set_caller(lender);
            test::set_value_transferred(amount.into());
            contract.contribute();
        }

        fn activate_with_three_lenders(contract: &mut LoanInstance, accounts: &test::DefaultAccounts) {
            contribute_as(contract, accounts.bob, 400);
            contribute_as(contract, accounts.charlie, 400);
            contribute_as(contract, accounts.django, 400);
        }

        #[ink::test]
        fn constructor_sets_defaults() {
            test_helpers::reset();
            let accounts = default_accounts();
            let contract = LoanInstance::new(accounts.alice, 1_000, 12_000, 30, accounts.eve);

            assert_eq!(contract.get_state(), LoanState::Funding);
            assert_eq!(contract.get_principal(), 1_000);
            assert_eq!(contract.get_remaining_debt(), 1_000);
            assert_eq!(contract.trust_oracle, accounts.eve);
            assert_eq!(contract.total_required, 1_200);
        }

        #[ink::test]
        fn funding_goes_active_after_threshold() {
            test_helpers::reset();
            let accounts = default_accounts();
            test_helpers::set_trust_score(800);

            let mut contract = LoanInstance::new(accounts.alice, 1_000, 12_000, 30, accounts.eve);
            activate_with_three_lenders(&mut contract, &accounts);

            assert_eq!(contract.get_state(), LoanState::Active);
            assert_eq!(contract.buffer_amount, 200);

            let transfers = test_helpers::transfers();
            assert_eq!(transfers, vec![(accounts.alice, 1_000)]);
            assert_eq!(contract.trust_score_at_issuance, 800);
        }

        #[ink::test]
        fn full_repayment_completes_loan() {
            test_helpers::reset();
            let accounts = default_accounts();
            test_helpers::set_trust_score(820);

            let mut contract = LoanInstance::new(accounts.alice, 1_000, 12_000, 30, accounts.eve);
            activate_with_three_lenders(&mut contract, &accounts);

            test::set_caller(accounts.alice);
            test::set_value_transferred(1_000.into());
            contract.repay();

            assert_eq!(contract.get_state(), LoanState::Completed);
            assert_eq!(contract.get_remaining_debt(), 0);
            assert_eq!(contract.buffer_amount, 0);

            let installments = test_helpers::installments();
            assert_eq!(installments.last().unwrap().1, 1_000);

            let transfers = test_helpers::transfers();
            assert_eq!(transfers[0], (accounts.alice, 1_000));

            let mut payouts: HashMap<H160, u128> = HashMap::new();
            for (to, amount) in transfers.into_iter().skip(1) {
                *payouts.entry(to).or_default() += amount;
            }

            assert_eq!(payouts.len(), 3);
            for lender in [accounts.bob, accounts.charlie, accounts.django] {
                assert!(payouts.get(&lender).copied().unwrap_or(0) > 0);
            }

            let total: u128 = payouts.values().copied().sum();
            assert!(total <= contract.total_required);
            assert!(total >= contract.total_required - 5);
        }

        #[ink::test]
        fn default_path_emits_events() {
            test_helpers::reset();
            let accounts = default_accounts();
            test_helpers::set_trust_score(790);

            let mut contract = LoanInstance::new(accounts.alice, 1_000, 12_000, 30, accounts.eve);
            activate_with_three_lenders(&mut contract, &accounts);

            contract.last_payment_at = 0;
            test::set_block_timestamp::<DefaultEnvironment>(100);
            contract.check_default(10);

            assert_eq!(contract.get_state(), LoanState::Defaulted);
            assert_eq!(contract.buffer_amount, 0);
            assert!(!test_helpers::defaults().is_empty());
        }
    }
}
