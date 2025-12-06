#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod loan_manager {
    use other_contract::OtherContractRef;

    #[ink(storage)]
    pub struct LoanManager {
        config_contract: OtherContractRef,
        trust_graph_contract: OtherContractRef,
    }

    /// Custom error types for the contract
    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]  
    pub enum Error {
        /// TODO: ACTUAL ERRORS
        NoTrustedAddresses,
        NotTrusted
    }

    /// Custom result type for the contract
    pub type LoanManagerResult<T> = core::result::Result<T, Error>;

    impl LoanManager {
        #[ink(constructor)]
        pub fn new(config_address: ink::Address, trust_graph_address: ink::Address) -> Self {
            let config_contract =
                ink::env::call::FromAddr::from_addr(config_address);
            let trust_graph_contract =
                ink::env::call::FromAddr::from_addr(trust_graph_address);
            Self { config_contract, trust_graph_contract }
        }

        #[ink(message)]
        pub fn create_loan(&mut self) -> LoanManagerResult<()> {
            let caller = self.env().caller();
            let is_trusted = self.trust_graph_contract.is_trusted(caller);
            if !is_trusted {
                return Err(Error::NotTrusted);
            }
            // Further loan creation logic goes here
            Ok(())
        }
    }

}