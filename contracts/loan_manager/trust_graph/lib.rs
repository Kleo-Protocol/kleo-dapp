#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod trust_graph {
    use ink::storage::Mapping;
    use ink::prelude::vec::Vec;

    /// All information that needs to be stored in the contract
    /// In this case, a mapping of trusted addresses
    #[ink(storage)]
    pub struct TrustGraph {
        /// Asigning a Vector of Addresses to each Address that calls the contract
        trusted: Mapping<Address, Vec<Address>>,
    }

    // Custom error types for the contract
    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]  
    pub enum Error {
        NoTrustedAddresses,
        NotTrusted
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
            let caller = self.env().caller();
            let mut trusted_addresses = self.trusted.get(caller).unwrap_or_default();
            trusted_addresses.push(new_trusted);
            self.trusted.insert(&caller, &trusted_addresses);
            Ok(())
        }

        #[ink(message)]
        pub fn delete_trusted(&mut self, to_delete: Address) -> TrustGraphResult<()> {
            let caller = self.env().caller();
            let mut trusted_addresses = self.trusted.get(caller).unwrap_or_default();
            if trusted_addresses.contains(&to_delete) {
                trusted_addresses.retain(|addr| addr != &to_delete);
                self.trusted.insert(&caller, &trusted_addresses);
                Ok(())
            } else {
                Err(Error::NotTrusted)
            }
        }


        /// Getter function for getting trusted addresses

        #[ink(message)]
        pub fn get_all_trusted(&self, lender: Address) -> TrustGraphResult<Vec<Address>> {
            match self.trusted.get(lender) {
                Some(addrs) if !addrs.is_empty() => Ok(addrs),
                _ => Err(Error::NoTrustedAddresses),
            }
        }

        #[ink(message)]
        pub fn is_trusted(&self, lender: Address, borrower: Address) -> bool {
            let trusted_addresses = self.trusted.get(lender);
            trusted_addresses.map(|addrs| addrs.contains(&borrower)).unwrap_or(false)
        }

         }
    }
    #[cfg(test)]
    mod tests {
        use ink::env::test;
        use ink::primitives::Address;
        use crate::trust_graph::TrustGraph;
        use crate::trust_graph::Error;

        /// Helper function to set the caller in tests
        fn set_caller(caller: Address) {
            test::set_caller(caller);
        }

        /// Default test addresses
        fn alice() -> Address {
            "d43593c715fdd31c61141abd04a99fd6822c8558"
                .parse()
                .expect("valid H160")
        }

        fn bob() -> Address {
            "8eaf04151687736326c9fea17e25fc5287613693"
                .parse()
                .expect("valid H160")
        }

        fn charlie() -> Address {
            "306721211d5404bd9da88e0204360a1a9ab8b87c"
                .parse()
                .expect("valid H160")
        }

        /// Test adding a new trusted address
        #[ink::test]
        fn test_set_new_trusted() {
            let mut graph = TrustGraph::new();
            let alice_addr = alice();
            let bob_addr = bob();

            set_caller(alice_addr);
            let result = graph.set_new_trusted(bob_addr);
            
            assert_eq!(result, Ok(()));
            assert!(graph.is_trusted(alice_addr, bob_addr));
        }

        /// Test adding multiple trusted addresses
        #[ink::test]
        fn test_set_multiple_trusted() {
            let mut graph = TrustGraph::new();
            let alice_addr = alice();
            let bob_addr = bob();
            let charlie_addr = charlie();

            set_caller(alice_addr);
            graph.set_new_trusted(bob_addr).unwrap();
            graph.set_new_trusted(charlie_addr).unwrap();

            assert!(graph.is_trusted(alice_addr, bob_addr));
            assert!(graph.is_trusted(alice_addr, charlie_addr));
        }

        /// Test deleting a trusted address
        #[ink::test]
        fn test_delete_trusted() {
            let mut graph = TrustGraph::new();
            let alice_addr = alice();
            let bob_addr = bob();

            set_caller(alice_addr);
            graph.set_new_trusted(bob_addr).unwrap();
            assert!(graph.is_trusted(alice_addr, bob_addr));

            let result = graph.delete_trusted(bob_addr);
            assert_eq!(result, Ok(()));
            assert!(!graph.is_trusted(alice_addr, bob_addr));
        }

        /// Test deleting a non-existent trusted address returns error
        #[ink::test]
        fn test_delete_non_trusted() {
            let mut graph = TrustGraph::new();
            let alice_addr = alice();
            let bob_addr = bob();

            set_caller(alice_addr);
            let result = graph.delete_trusted(bob_addr);
            
            assert_eq!(result, Err(Error::NotTrusted));
        }

        /// Test is_trusted returns false for non-trusted address
        #[ink::test]
        fn test_is_trusted_false() {
            let graph = TrustGraph::new();
            let alice_addr = alice();
            let bob_addr = bob();

            set_caller(alice_addr);
            assert!(!graph.is_trusted(alice_addr, bob_addr));
        }

        /// Test is_trusted returns false when caller has no trusted list
        #[ink::test]
        fn test_is_trusted_empty_list() {
            let graph = TrustGraph::new();
            let alice_addr = alice();
            let bob_addr = bob();

            set_caller(alice_addr);
            assert!(!graph.is_trusted(alice_addr, bob_addr));
        }

        /// Test get_all_trusted returns correct addresses
        #[ink::test]
        fn test_get_all_trusted() {
            let mut graph = TrustGraph::new();
            let alice_addr = alice();
            let bob_addr = bob();
            let charlie_addr = charlie();

            set_caller(alice_addr);
            graph.set_new_trusted(bob_addr).unwrap();
            graph.set_new_trusted(charlie_addr).unwrap();

            let trusted = graph.get_all_trusted(alice_addr).unwrap();
            assert_eq!(trusted.len(), 2);
        }

        /// Test get_all_trusted returns error when no trusted addresses
        #[ink::test]
        fn test_get_all_trusted_empty() {
            let graph = TrustGraph::new();
            let alice_addr = alice();

            set_caller(alice_addr);
            let result = graph.get_all_trusted(alice_addr);

            assert_eq!(result, Err(Error::NoTrustedAddresses));
        }

        /// Test different callers have independent trusted lists
        #[ink::test]
        fn test_independent_trusted_lists() {
            let mut graph = TrustGraph::new();
            let alice_addr = alice();
            let bob_addr = bob();
            let charlie_addr = charlie();

            // Alice trusts Bob
            set_caller(alice_addr);
            graph.set_new_trusted(bob_addr).unwrap();
            assert!(graph.is_trusted(alice_addr, bob_addr));

            // Bob trusts Charlie (not Alice)
            set_caller(bob_addr);
            graph.set_new_trusted(charlie_addr).unwrap();
            assert!(graph.is_trusted(bob_addr, charlie_addr));
            assert!(!graph.is_trusted(bob_addr, alice_addr));

            // Alice still only trusts Bob
            set_caller(alice_addr);
            assert!(graph.is_trusted(alice_addr, bob_addr));
            assert!(!graph.is_trusted(alice_addr, charlie_addr));
        }
}