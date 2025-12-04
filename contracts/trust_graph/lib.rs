#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod trust_graph {
    use ink::storage::Mapping;
    use ink::storage::StorageVec;

    /// All information that needs to be stored in the contract
    /// In this case, a mapping of trusted addresses
    #[ink(storage)]
    pub struct TrustGraph {
        trusted: Mapping<Address, StorageVec<Address>>,
    }

    // Custom error types for the contract
    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]  
    pub enum Error {
        NotTrusted,
        NoTrustedAddresses
    }

    // Custom result type for the contract
    pub type TrustGraphResult<T> = core::result::Result<T, Error>;

    impl TrustGraph {
        /// Constructor that initializes configuration of the Kleo Protocol
        #[ink(constructor)]
        pub fn new() -> Self {
            let trusted = Mapping::default();
            Self { trusted }
        }

        /// Setter functions for adding/deleting trusted addresses

        #[ink(message)]
        pub fn set_new_trusted(&mut self, new_trusted: Address) -> TrustGraphResult<()> {
            if 
        }


        /// Getter function for getting trusted addresses

        #[ink(message)]
        pub fn get_all_trusted(&self) -> TrustGraphResult<StorageVec<Address>> {
            let caller = self.env().caller();
            self.trusted.get(caller);
        }

        #[ink(message)]
        pub fn is_trusted(&self, addr: Address) -> bool {
            let caller = self.env().caller();
            let trusted_addresses = self.trusted.get(caller);
            trusted_addresses.map(|addrs| addrs.contains(&addr)).unwrap_or(false)
        }

        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::{test, DefaultEnvironment};

        /// Helper function to set the caller in tests
        pub fn set_caller(caller: Address) {
            test::set_caller(caller);
        }

        /// This will be the default admin address for tests
        fn default_admin() -> Address {
            // Example test address (H160)
            "d43593c715fdd31c61141abd04a99fd6822c8558"
                .parse()
                .expect("valid H160")
        }

        /// Test to make sure contract saves data correctly
        #[ink::test]
        fn saves_data_correctly() {
            let admin = default_admin();
            set_caller(admin);

            let config = Config::new(3, 150, 4, 2, 525960);
            assert_eq!(config.get_protocol_info(), (3, 150, 4, 2, 525960, admin));
        }

        /// Test to make sure changing data works correctly
        #[ink::test]
        fn changes_data_correctly() {
            let admin = default_admin();
            set_caller(admin);

            let mut config = Config::new(3, 150, 4, 2, 525960);
            config.set_overfunding_factor(200).unwrap();
            assert_eq!(config.get_protocol_info(), (3, 200, 4, 2, 525960, admin));
        }

        /// Test to make sure non admins can't change data
        #[ink::test]
        fn non_admin_cant_change_data() {
            let admin = default_admin();
            let non_admin: Address = "1111111111111111111111111111111111111111"
                .parse()
                .expect("valid H160");

            set_caller(admin);
            let mut config = Config::new(3, 150, 4, 2, 525960);

            set_caller(non_admin);
            let result = config.set_overfunding_factor(200);
            assert_eq!(result, Err(Error::NotAdmin));
        }
    }
}