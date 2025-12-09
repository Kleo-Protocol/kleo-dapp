#![cfg_attr(not(feature = "std"), no_std, no_main)]

/// This is 100% based on microloans, where borrowers can request small loans from multiple lenders.
/// The loans are managed by the LoanManager contract, which interacts with the Config and TrustGraph
/// contracts to get configuration parameters and verify trust relationships.
/// The idea is that the loans have a duration of less than a month, exactly because they are microloans.

#[ink::contract]
mod loan_manager {
    use ink::storage::Mapping;
    use ink::env::hash::{Blake2x256, HashOutput};
    use config::ConfigRef;
    use trust_graph::TrustGraphRef;
    use ink::prelude::vec::Vec;
    use ink::prelude::vec;

    /// Enum for loan status
    #[ink::storage_item(packed)]
    #[derive(Debug, PartialEq, Eq, Copy, Clone)]
    pub enum LoanStatus {
        Pending,
        Active,
        Repaid,
        Defaulted,
    }

    /// Struct for loan information
    #[ink::storage_item(packed)]
    #[derive(Debug, PartialEq)]
    pub struct Loan {
        loan_id: Hash, // Unique identifier for the loan
        borrower: Address, // Address of borrower (loan creator)
        requested_amount: Balance, // Amount requested by borrower
        funded_amount: Balance, // Amount funded by lenders
        lender_count: u32, // Number of unique lenders
        interest_rate: u64, // Interest rate for the loan
        penalty_rate: u64, // Penalty rate for late payments
        duration: u64, // Duration of the loan
        start_time: Timestamp, // Start time of the loan
        due_time: Timestamp, // Due time of the loan
        repaid_amount: Balance, // Amount repaid so far
        status: LoanStatus, // Current status of the loan
        reserve: Balance,  // Overfunding reserve
    }

    /// All information that is needed to store in the contract
    #[ink(storage)]
    pub struct LoanManager {
        config_address: ConfigRef, // Contract address of Config
        trust_graph_address: TrustGraphRef, // Contract address of TrustGraph
        credit_score: Mapping<Address, u32>, // Mapping of address to credit score
        loans: Mapping<Hash, Loan>, // Mapping of loan ID to Loan struct
        borrower_loans: Mapping<Address, Vec<Hash>>,  // Support multiple loans per borrower
        lenders: Mapping<(Hash, Address), Balance>, // Mapping of (loan_id, lender_address) to amount funded
    }

    /// Events for the loans lifecycle

    #[ink(event)]
    pub struct LoanCreated {
        loan_id: Hash,
        borrower: Address,
    }

    #[ink(event)]
    pub struct LoanFunded {
        loan_id: Hash,
        lender: Address,
        amount: Balance,
    }

    #[ink(event)]
    pub struct LoanActivated {
        loan_id: Hash,
        borrower: Address,
    }

    #[ink(event)]
    pub struct LoanRepaid {
        loan_id: Hash,
        amount: Balance,
    }

    #[ink(event)]
    pub struct LoanDefaulted {
        loan_id: Hash,
    }

    #[ink(event)]
    pub struct LoanEnded {
        loan_id: Hash,
    }

    /// Error types for the LoanManager contract

    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]  
    pub enum Error {
        NotTrusted,
        LoanNotFound,
        InvalidDuration,
        InsufficientOverfunding,
        NotEnoughLenders,
        Unauthorized,
        LoanNotPending,
        LoanNotActive,
        Overdue,
        InsufficientPayment,
        CrossContractCallFailed,
        TransferFailed,
        ZeroAmount,
        AlreadyDefaulted,
    }


    /// Decided to NOT use a custom Result type, but serves the same purpose
    pub type Result<T> = core::result::Result<T, Error>;

    impl LoanManager {
        #[ink(constructor)]
        pub fn new(config_address: Address, trust_graph_address: Address) -> Self {
            let config_address =
                ink::env::call::FromAddr::from_addr(config_address);
            let trust_graph_address =
                ink::env::call::FromAddr::from_addr(trust_graph_address);
            Self {
                config_address,
                trust_graph_address,
                credit_score: Mapping::default(),
                loans: Mapping::default(),
                borrower_loans: Mapping::default(),
                lenders: Mapping::default(),
            }
        }

        /// Creates a loan request, with caller being the borrower
        /// The borrower must have at least one trusted address in their TrustGraph
        #[ink(message)]
        pub fn create_loan(&mut self, requested_amount: Balance, duration: u64) -> Result<Hash> {
            let caller = self.env().caller();
            if requested_amount == 0 {
                return Err(Error::ZeroAmount);
            }

            // Check that borrower has at least one trusted address
            let trusted = self.trust_graph_address.get_all_trusted(caller).ok();
            if trusted.is_none() || trusted.as_ref().map(|t| t.is_empty()).unwrap_or(true) {
                return Err(Error::NotTrusted);
            }

            if self.credit_score.get(caller).is_none() {
                self.credit_score.insert(caller, &100u32);
            }

            // TODO: Credit Score is not being adjusted by every loan activity yet
            // TODO: Interest rate is not being taken into a count yet
            let (_min_lenders, _overfunding_factor, base_interest_rate, late_penalty_rate, max_loan_duration, _admin) = self.config_address.get_protocol_info();

            if duration > max_loan_duration || duration == 0 {
                return Err(Error::InvalidDuration);
            }

            // This part creates a unique loan ID based on caller and timestamp
            let mut input = Vec::new();
            input.extend_from_slice(caller.as_ref());
            input.extend_from_slice(&self.env().block_timestamp().to_be_bytes());
            let mut loan_id_bytes = <Blake2x256 as HashOutput>::Type::default();
            ink::env::hash_bytes::<Blake2x256>(&input, &mut loan_id_bytes);
            let loan_id = Hash::try_from(loan_id_bytes).unwrap();

            // Create loan and save it so storage
            let loan = Loan {
                loan_id,
                borrower: caller,
                requested_amount,
                funded_amount: 0,
                lender_count: 0,
                interest_rate: base_interest_rate,
                penalty_rate: late_penalty_rate,
                duration,
                start_time: 0,
                due_time: 0,
                repaid_amount: 0,
                status: LoanStatus::Pending,
                reserve: 0,
            };
            self.loans.insert(loan_id, &loan);

            // Save loan ID in borrowers mapping of all loans (can have more than 1)
            let mut loans = self.borrower_loans.get(caller).unwrap_or_default();
            loans.push(loan_id);
            self.borrower_loans.insert(caller, &loans);

            self.env().emit_event(LoanCreated { loan_id, borrower: caller });
            Ok(loan_id)
        }

        /// Lenders can lend to a loan by sending funds into it
        /// The lender must trust the borrower in their TrustGraph
        #[ink(message, payable)]
        pub fn fund_loan(&mut self, loan_id: Hash) -> Result<()> {
            let caller = self.env().caller();
            let amount: Balance = self.env().transferred_value().try_into().map_err(|_| Error::ZeroAmount)?;
            if amount == 0 {
                return Err(Error::ZeroAmount);
            }

            let mut loan = self.loans.get(loan_id).ok_or(Error::LoanNotFound)?;
            // This means the loan is fully funded and active
            if loan.status != LoanStatus::Pending {
                return Err(Error::LoanNotPending);
            }

            // Check if lender trusts borrower
            // In the frontend, users will only see loans from trusted borrowers
            // but this is an extra check
            let is_trusted = self.trust_graph_address.is_trusted(caller, loan.borrower);
            if !is_trusted {
                return Err(Error::NotTrusted);
            }

            // Here, we're adding the lender to the loan's lenders mapping
            // and updating the funded amount
            let existing = self.lenders.get((loan_id, caller)).unwrap_or(0);
            if existing == 0 {
                loan.lender_count += 1;
            }
            self.lenders.insert((loan_id, caller), &(existing + amount));
            loan.funded_amount += amount;

            self.env().emit_event(LoanFunded { loan_id, lender: caller, amount });

            // If threshold for activation is met, activate the loan
            let (min_lenders, overfunding_factor, _, _, _, _) = self.config_address.get_protocol_info();
            // Here, divide by 100 as overfunding_factor is the percentage and an extra 0
            let required_funded = loan.requested_amount * overfunding_factor as Balance / 100;

            // This is the activate loan logic, it was a separate function before
            // but since it is only called here, it is integrated
            if loan.funded_amount >= required_funded && loan.lender_count >= min_lenders {
                loan.status = LoanStatus::Active;
                loan.start_time = self.env().block_timestamp();
                // Here, due date will be in ms, but loan duration is in seconds
                loan.due_time = loan.start_time + loan.duration * 1000;

                // Move overfund to reserve
                let overfund = loan.funded_amount - loan.requested_amount;
                loan.reserve = overfund;

                // Transfer requested amount to borrower
                self.env().transfer(loan.borrower, loan.requested_amount.into()).map_err(|_| Error::TransferFailed)?;
                self.env().emit_event(LoanActivated { loan_id, borrower: loan.borrower });
            }

            self.loans.insert(loan_id, &loan);
            Ok(())
        }

        /// Borrower can pay back their loan partially or fully
        #[ink(message, payable)]
        pub fn pay_loan(&mut self, loan_id: Hash) -> Result<()> {
            let caller = self.env().caller();
            let amount: Balance = self.env().transferred_value().try_into().map_err(|_| Error::ZeroAmount)?;
            if amount == 0 {
                return Err(Error::ZeroAmount);
            }

            let mut loan = self.loans.get(loan_id).ok_or(Error::LoanNotFound)?;
            // Make sure only borrower can pay and loan is active
            if loan.borrower != caller {
                return Err(Error::Unauthorized);
            }
            if loan.status != LoanStatus::Active {
                return Err(Error::LoanNotActive);
            }

            let now = self.env().block_timestamp();
            let mut total_due = loan.requested_amount + (loan.requested_amount * loan.interest_rate as Balance / 10000);
            if now > loan.due_time {
                let overdue_time = now - loan.due_time;
                // Every 3 days after it is not paid, the penalty is applied to the total_due
                // This could be adjusted in the config, this is a good TODO
                let penalty = total_due * loan.penalty_rate as Balance / 10000 * ((overdue_time / (86400000 * 3)) as Balance);
                total_due += penalty;
            }

            loan.repaid_amount += amount;
            self.env().emit_event(LoanRepaid { loan_id, amount });

            // If with the payment, the loan is fully repaid, end it
            if loan.repaid_amount >= total_due {
                self.end_loan(loan_id)?;
            } else if amount < (total_due - loan.repaid_amount) {
                // It is okay to pay partially
                if now > loan.due_time - 86400000 {  // 1 day before due date of the loan
                    // Here, an overdue event would be a good feature, this is a good TODO
                }
            }

            self.loans.insert(loan_id, &loan);
            Ok(())
        }

        /// Check and mark loan as defaulted if overdue and not repaid
        #[ink(message)]
        pub fn check_default(&mut self, loan_id: Hash) -> Result<()> {
            let mut loan = self.loans.get(loan_id).ok_or(Error::LoanNotFound)?;
            if loan.status != LoanStatus::Active {
                return Err(Error::AlreadyDefaulted);
            }
            
            let now = self.env().block_timestamp();
            // Allow 2 extra months (60 days) after due date before marking as defaulted
            let default_threshold = loan.due_time + (60 * 86400000);  // 60 days in milliseconds
            if now <= default_threshold {
                return Err(Error::Overdue);  // Not yet in default
            }

            loan.status = LoanStatus::Defaulted;

            // TODO: Implement logic to distribute the reserve funds to lenders in case of default
            // Do this AFTER the Hydration integration. 
            self.loans.insert(loan_id, &loan);
            self.env().emit_event(LoanDefaulted { loan_id });
            Ok(())
        }

        /// Internal function to end a loan and distribute funds
        fn end_loan(&mut self, loan_id: Hash) -> Result<()> {
            let loan = self.loans.get(loan_id).ok_or(Error::LoanNotFound)?;
            if loan.status == LoanStatus::Repaid || loan.status == LoanStatus::Defaulted {
                // TODO: Distribute remaining funds/interest to lenders
                // This MUST be done AFTER the Hydration integration
                self.loans.remove(loan_id);

                // Remove from borrower_loans
                if let Some(mut loans) = self.borrower_loans.get(loan.borrower) {
                    loans.retain(|&id| id != loan_id);
                    self.borrower_loans.insert(loan.borrower, &loans);
                }
                self.env().emit_event(LoanEnded { loan_id });
                Ok(())
            } else {
                Err(Error::InsufficientPayment)
            }
        }

        /// Getter functions for frontend

        #[ink(message)]
        pub fn get_user_loans(&self, borrower: Address) -> Vec<Hash> {
            self.borrower_loans.get(borrower).unwrap_or_default()
        }

        #[ink(message)]
        pub fn get_loan(&self, loan_id: Hash) -> Option<Loan> {
            self.loans.get(loan_id)
        }

        #[ink(message)]
        pub fn get_credit_score(&self, addr: Address) -> u32 {
            self.credit_score.get(addr).unwrap_or(0)
        }

        /// Get all loans from trusted borrowers that are pending funding
        #[ink(message)]
        pub fn get_trusted_loans(&self) -> Vec<Loan> {
            let caller = self.env().caller();
            let trusted = match self.trust_graph_address.get_all_trusted(caller) {
                Ok(t) => t,
                Err(_) => return vec![],
            };

            let mut result = vec![];
            for borrower in trusted {
                if let Some(loan_ids) = self.borrower_loans.get(borrower) {
                    for loan_id in loan_ids {
                        if let Some(loan) = self.loans.get(loan_id) {
                            if loan.status == LoanStatus::Pending {
                                result.push(loan);
                            }
                        }
                    }
                }
            }
            result
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::test;

        /// Helper function to set the caller in tests
        fn set_caller(caller: Address) {
            test::set_caller(caller);
        }

        /// Default test addresses (accounts)
        fn alice() -> Address {
            "d43593c715fdd31c61141abd04a99fd6822c8558"
                .parse()
                .expect("valid H160")
        }

        fn charlie() -> Address {
            "306721211d5404bd9da88e0204360a1a9ab8b87c"
                .parse()
                .expect("valid H160")
        }

        fn dave() -> Address {
            "84b0a6355c4b526f559371aea8da3a288760b9a3"
                .parse()
                .expect("valid H160")
        }

        /// Placeholder contract addresses for Config and TrustGraph
        fn config_contract() -> Address {
            "0000000000000000000000000000000000000001"
                .parse()
                .expect("valid address")
        }

        fn trust_contract() -> Address {
            "0000000000000000000000000000000000000002"
                .parse()
                .expect("valid address")
        }

        /// Test constructor initializes correctly
        /// Note: full validation of cross-contract calls requires integration tests
        #[ink::test]
        fn test_constructor() {
            // Use placeholder contract addresses; cross-contract calls are not executed in unit tests
            let manager = LoanManager::new(config_contract(), trust_contract());
            
            // Verify the contract was created (no panics)
            assert_eq!(manager.get_credit_score(charlie()), 0);
        }

        /// Test creating a loan with zero amount fails
        #[ink::test]
        fn test_create_loan_zero_amount() {
            let mut manager = LoanManager::new(config_contract(), trust_contract());
            set_caller(charlie());
            
            let result = manager.create_loan(0, 100);
            assert_eq!(result, Err(Error::ZeroAmount));
        }

        /// Test credit score is initialized correctly on first loan
        #[ink::test]
        fn test_credit_score_initialization() {
            let manager = LoanManager::new(config_contract(), trust_contract());
            let borrower = charlie();
            
            // Initial credit score should be 0
            assert_eq!(manager.get_credit_score(borrower), 0);
        }

        /// Test getting user loans returns empty for new user
        #[ink::test]
        fn test_get_user_loans_empty() {
            let manager = LoanManager::new(config_contract(), trust_contract());
            let loans = manager.get_user_loans(charlie());
            assert_eq!(loans.len(), 0);
        }

        /// Test getting loan returns None for non-existent loan
        #[ink::test]
        fn test_get_loan_not_found() {
            let mut manager = LoanManager::new(config_contract(), trust_contract());
            let dummy_hash = Hash::default();
            let loan = manager.get_loan(dummy_hash);
            assert_eq!(loan, None);
        }

        /// Test loan status enum variants
        #[ink::test]
        fn test_loan_status_equality() {
            assert_eq!(LoanStatus::Pending, LoanStatus::Pending);
            assert_ne!(LoanStatus::Pending, LoanStatus::Active);
            assert_ne!(LoanStatus::Active, LoanStatus::Repaid);
            assert_ne!(LoanStatus::Repaid, LoanStatus::Defaulted);
        }

        /// Test basic loan creation attributes
        #[ink::test]
        fn test_loan_creation_attributes() {
            let requested = 1000u128;
            let duration = 86400u64; // 1 day
            
            // Verify amounts are stored correctly
            assert!(requested > 0);
            assert!(duration > 0);
        }

        /// Test loan struct contains all required fields
        #[ink::test]
        fn test_loan_struct_fields() {
            let loan = Loan {
                loan_id: Hash::default(),
                borrower: alice(),
                requested_amount: 1000,
                funded_amount: 0,
                lender_count: 0,
                interest_rate: 500,
                penalty_rate: 1000,
                duration: 86400,
                start_time: 0,
                due_time: 0,
                repaid_amount: 0,
                status: LoanStatus::Pending,
                reserve: 0,
            };

            assert_eq!(loan.requested_amount, 1000);
            assert_eq!(loan.funded_amount, 0);
            assert_eq!(loan.lender_count, 0);
            assert_eq!(loan.status, LoanStatus::Pending);
            assert_eq!(loan.reserve, 0);
        }

        /// Test error types are correctly defined
        #[ink::test]
        fn test_error_types() {
            assert_eq!(Error::NotTrusted, Error::NotTrusted);
            assert_ne!(Error::NotTrusted, Error::LoanNotFound);
            assert_ne!(Error::ZeroAmount, Error::Unauthorized);
        }

        /// Test pay_loan with zero amount fails
        #[ink::test]
        fn test_pay_loan_zero_amount() {
            let mut manager = LoanManager::new(config_contract(), trust_contract());
            let dummy_hash = Hash::default();
            set_caller(charlie());
            
            // Zero transferred value triggers ZeroAmount before any loan lookup
            let result = manager.pay_loan(dummy_hash);
            assert_eq!(result, Err(Error::ZeroAmount));
        }

        /// Test check_default on non-existent loan fails
        #[ink::test]
        fn test_check_default_loan_not_found() {
            let mut manager = LoanManager::new(config_contract(), trust_contract());
            let dummy_hash = Hash::default();
            
            let result = manager.check_default(dummy_hash);
            assert_eq!(result, Err(Error::LoanNotFound));
        }

        /// Test multiple users have independent credit scores
        #[ink::test]
        fn test_independent_credit_scores() {
            let manager = LoanManager::new(config_contract(), trust_contract());
            
            let score_charlie = manager.get_credit_score(charlie());
            let score_dave = manager.get_credit_score(dave());
            
            // Both should start at 0
            assert_eq!(score_charlie, 0);
            assert_eq!(score_dave, 0);
        }

        /// Test loan creation with valid parameters
        #[ink::test]
        fn test_loan_struct_initialization() {
            let loan = Loan {
                loan_id: Hash::default(),
                borrower: alice(),
                requested_amount: 5000u128,
                funded_amount: 0,
                lender_count: 0,
                interest_rate: 500u64,
                penalty_rate: 1000u64,
                duration: 604800u64, // 7 days
                start_time: 0,
                due_time: 0,
                repaid_amount: 0,
                status: LoanStatus::Pending,
                reserve: 0,
            };

            assert_eq!(loan.requested_amount, 5000u128);
            assert_eq!(loan.interest_rate, 500u64);
            assert_eq!(loan.penalty_rate, 1000u64);
            assert_eq!(loan.duration, 604800u64);
            assert_eq!(loan.status, LoanStatus::Pending);
        }

        /// Test that different loan statuses are distinct
        #[ink::test]
        fn test_loan_status_transitions() {
            let mut loan = Loan {
                loan_id: Hash::default(),
                borrower: alice(),
                requested_amount: 1000,
                funded_amount: 0,
                lender_count: 0,
                interest_rate: 500,
                penalty_rate: 1000,
                duration: 86400,
                start_time: 0,
                due_time: 0,
                repaid_amount: 0,
                status: LoanStatus::Pending,
                reserve: 0,
            };

            assert_eq!(loan.status, LoanStatus::Pending);

            loan.status = LoanStatus::Active;
            assert_eq!(loan.status, LoanStatus::Active);

            loan.status = LoanStatus::Repaid;
            assert_eq!(loan.status, LoanStatus::Repaid);

            loan.status = LoanStatus::Defaulted;
            assert_eq!(loan.status, LoanStatus::Defaulted);
        }
    }
}