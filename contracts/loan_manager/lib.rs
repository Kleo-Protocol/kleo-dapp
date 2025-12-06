#![cfg_attr(not(feature = "std"), no_std, no_main)]

use other_contract::OtherContractRef;


// Traits, errors and result type for cross-contract calls
#[ink::trait_definition]
pub trait ConfigTrait {
    #[ink(message)]
    fn get_protocol_info(&self) -> (u32, u64, u64, u64, u64, Address);
}

#[ink::trait_definition]
pub trait TrustGraphTrait {
    #[ink(message)]
    fn get_all_trusted(&self) -> TrustGraphResult<Vec<Address>>;
    #[ink(message)]
    fn is_trusted(&self, addr: Address) -> bool;
}

#[derive(Debug, PartialEq, Eq)]
#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub enum TrustError {
    NoTrustedAddresses,
}

pub type TrustGraphResult<T> = core::result::Result<T, TrustError>;

#[ink::contract]
mod loan_manager {
    use ink::storage::Mapping;
    use ink::env::DefaultEnvironment;
    use ink::env::hash::{Blake2x256, HashOutput};
    use ink::env::call::build_call;

    /// Enum for loan status
    #[derive(Debug, PartialEq, Eq, Copy, Clone)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum LoanStatus {
        Pending,
        Active,
        Repaid,
        Defaulted,
    }

    /// Struct for loan information
    #[derive(Debug, Clone)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub struct Loan {
        loan_id: Hash, // Unique identifier for the loan
        borrower: Address, // Address of borrower (loan creator)
        requested_amount: Balance, // Amount requested by borrower
        funded_amount: Balance, // Amount funded by lenders
        lenders: Mapping<Address, Balance>, // Mapping of lender addresses to amounts funded
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
        config_address: OtherContractRef, // Contract address of Config
        trust_graph_address: OtherContractRef, // Contract address of TrustGraph
        credit_score: Mapping<Address, u32>, // Mapping of address to credit score
        loans: Mapping<Hash, Loan>, // Mapping of loan ID to Loan struct
        borrower_loans: Mapping<Address, Vec<Hash>>,  // Support multiple loans per borrower
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

            let trusted = self.get_all_trusted(caller)?;
            if trusted.is_empty() {
                return Err(Error::NotTrusted);
            }

            /// TODO: If users credit score is 0, create here, but if no, just update accourding, here it will change all the time and it is not the idea that after every loan the credit score is reset
            /// Initial credit score when loan is created is number of trusted addresses
            self.credit_score.insert(caller, trusted.len() as u32);

            let (min_lenders, overfunding_factor, base_interest_rate, late_penalty_rate, max_loan_duration, _admin) = self.get_config()?;

            if duration > max_loan_duration || duration == 0 {
                return Err(Error::InvalidDuration);
            }

            /// This part creates a unique loan ID based on caller and timestamp
            let mut input = Vec::new();
            input.extend_from_slice(caller.as_ref());
            input.extend_from_slice(&self.env().block_timestamp().to_be_bytes());
            let mut loan_id_bytes = <Blake2x256 as HashOutput>::Type::default();
            ink::env::hash_bytes::<Blake2x256>(&input, &mut loan_id_bytes);
            let loan_id = Hash::try_from(loan_id_bytes).unwrap();

            /// Create loan and save it so storage
            let loan = Loan {
                loan_id,
                borrower: caller,
                requested_amount,
                funded_amount: 0,
                lenders: Mapping::default(),
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
            self.loans.insert(loan_id, loan);

            /// Save loan ID in borrowers mapping of all loans (can have more than 1)
            let mut loans = self.borrower_loans.get(caller).unwrap_or_default();
            loans.push(loan_id);
            self.borrower_loans.insert(caller, loans);

            self.env().emit_event(LoanCreated { loan_id, borrower: caller });
            Ok(loan_id)
        }

        /// Lenders can lend to a loan by sending funds into it
        /// The lender must trust the borrower in their TrustGraph
        #[ink(message, payable)]
        pub fn fund_loan(&mut self, loan_id: Hash) -> Result<()> {
            let caller = self.env().caller();
            let amount = self.env().transferred_value();
            if amount == 0 {
                return Err(Error::ZeroAmount);
            }

            let mut loan = self.loans.get(loan_id).ok_or(Error::LoanNotFound)?;
            // This means the loan is fully funded and active
            if loan.status != LoanStatus::Pending {
                return Err(Error::LoanNotPending);
            }

            /// Check if lender trusts borrower
            /// In the frontend, users will only see loans from trusted borrowers
            /// but this is an extra check
            let is_trusted = self.is_trusted(caller, loan.borrower)?;
            if !is_trusted {
                return Err(Error::NotTrusted);
            }

            /// Here, we're adding the lender to the loan's lenders mapping
            /// and updating the funded amount
            let existing = loan.lenders.get(caller).unwrap_or(0);
            if existing == 0 {
                loan.lender_count += 1;
            }
            loan.lenders.insert(caller, existing + amount);
            loan.funded_amount += amount;

            self.env().emit_event(LoanFunded { loan_id, lender: caller, amount });

            /// If threshold for activation is met, activate the loan
            let (min_lenders, overfunding_factor, _, _, _, _) = self.get_config()?;
            // Here, divide by 100 as overfunding_factor is the percentage and an extra 0
            let required_funded = loan.requested_amount * overfunding_factor as Balance / 100;

            if loan.funded_amount >= required_funded && loan.lender_count >= min_lenders {
                loan.status = LoanStatus::Active;
                loan.start_time = self.env().block_timestamp();
                // Here, due date will be in ms, but loan duration is in seconds
                loan.due_time = loan.start_time + loan.duration * 1000;

                // Move overfund to reserve
                let overfund = loan.funded_amount - loan.requested_amount;
                loan.reserve = overfund;

                // Transfer requested amount to borrower
                self.env().transfer(loan.borrower, loan.requested_amount).map_err(|_| Error::TransferFailed)?;
                self.env().emit_event(LoanActivated { loan_id, borrower: loan.borrower });
            }

            self.loans.insert(loan_id, loan);
            Ok(())
        }

        /// tengo que seguir aqui, recordar que el overfunding estaba mal, esto piensa que 50% va de una a la persona lender y no es cierto, todo el 100% va directo a la reserva
        #[ink(message)]
        pub fn activate_loan(&mut self, loan_id: Hash) -> Result<()> {
            let caller = self.env().caller();
            let mut loan = self.loans.get(loan_id).ok_or(Error::LoanNotFound)?;
            if loan.borrower != caller {
                return Err(Error::Unauthorized);
            }
            if loan.status != LoanStatus::Pending {
                return Err(Error::LoanNotPending);
            }

            let (min_lenders, overfunding_factor, _, _, _, _) = self.get_config()?;
            let required_funded = loan.requested_amount * overfunding_factor as Balance / 100;
            if loan.funded_amount < required_funded || loan.lender_count < min_lenders {
                return Err(Error::InsufficientOverfunding);
            }

            loan.status = LoanStatus::Active;
            loan.start_time = self.env().block_timestamp();
            loan.due_time = loan.start_time + loan.duration * 1000;
            let overfund = loan.funded_amount - loan.requested_amount;
            loan.reserve = overfund / 2;  // Placeholder 0.5x reserve
            self.env().transfer(loan.borrower, loan.requested_amount).map_err(|_| Error::CrossContractCallFailed)?;
            self.loans.insert(loan_id, loan);
            self.env().emit_event(LoanActivated { loan_id, borrower: caller });
            Ok(())
        }

        #[ink(message, payable)]
        pub fn pay_loan(&mut self, loan_id: Hash) -> Result<()> {
            let caller = self.env().caller();
            let amount = self.env().transferred_value();
            if amount == 0 {
                return Err(Error::ZeroAmount);
            }

            let mut loan = self.loans.get(loan_id).ok_or(Error::LoanNotFound)?;
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
                let penalty = total_due * loan.penalty_rate as Balance / 10000 * (overdue_time / 86400000);  // Per day
                total_due += penalty;
            }

            loan.repaid_amount += amount;
            self.env().emit_event(LoanRepaid { loan_id, amount });

            if loan.repaid_amount >= total_due {
                self.end_loan(loan_id)?;
            } else if amount < (total_due - loan.repaid_amount) {
                // Partial pay ok, but prompt via event if near due
                if now > loan.due_time - 86400000 {  // 1 day before due
                    // Emit custom OverdueWarning event if added
                }
            }

            self.loans.insert(loan_id, loan);
            Ok(())
        }

        #[ink(message)]
        pub fn check_default(&mut self, loan_id: Hash) -> Result<()> {
            let mut loan = self.loans.get(loan_id).ok_or(Error::LoanNotFound)?;
            if loan.status != LoanStatus::Active {
                return Err(Error::AlreadyDefaulted);
            }
            let now = self.env().block_timestamp();
            if now <= loan.due_time {
                return Err(Error::Overdue);  // Not yet
            }

            loan.status = LoanStatus::Defaulted;
            // Logic: Distribute reserve to lenders proportionally (simplified)
            // For each lender, transfer share of reserve
            self.loans.insert(loan_id, loan);
            self.env().emit_event(LoanDefaulted { loan_id });
            Ok(())
        }

        fn end_loan(&mut self, loan_id: Hash) -> Result<()> {
            let mut loan = self.loans.get(loan_id).ok_or(Error::LoanNotFound)?;
            if loan.status == LoanStatus::Repaid || loan.status == LoanStatus::Defaulted {
                // Distribute remaining funds/interest to lenders (simplified: assume done off-chain or add withdraw_lender)
                self.loans.remove(loan_id);
                // Remove from borrower_loans
                if let Some(mut loans) = self.borrower_loans.get(loan.borrower) {
                    loans.retain(|&id| id != loan_id);
                    self.borrower_loans.insert(loan.borrower, loans);
                }
                self.env().emit_event(LoanEnded { loan_id });
                Ok(())
            } else {
                Err(Error::InsufficientPayment)
            }
        }

        #[ink(message)]
        pub fn get_user_loans(&self, borrower: Address) -> Vec<Hash> {
            self.borrower_loans.get(borrower).unwrap_or_default()
        }

        #[ink(message)]
        pub fn get_loan(&self, loan_id: Hash) -> Option<Loan> {
            self.loans.get(loan_id)
        }

        #[ink(message)]
        pub fn get_trusted_loans(&self, page: u32, page_size: u32) -> Vec<Loan> {
            let caller = self.env().caller();
            let trusted = match self.get_all_trusted(caller) {
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
            // Paginate (simple slice)
            let start = (page * page_size) as usize;
            let end = (start + page_size as usize).min(result.len());
            result[start..end].to_vec()
        }

        #[ink(message)]
        pub fn get_credit_score(&self, addr: Address) -> u32 {
            self.credit_score.get(addr).unwrap_or(0)
        }
    }
}