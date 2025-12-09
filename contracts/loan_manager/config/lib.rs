#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod config {
    /// All information that needs to be stored in the contract
    #[ink(storage)]
    pub struct Config {
        min_lenders: u32, // Minimum number of lenders required for a loan
        overfunding_factor: u64, // Percentage overfunding allowed (e.g., 150 means 150%)
        base_interest_rate: u64, // Base interest rate for loans (e.g., 5 means 5%)
        late_penalty_rate: u64, // Penalty rate for late payments (e.g., 2 means 2%)
        max_loan_duration: u64, // Maximum duration for a loan in minutes
        admin: Address,
    }

    // Custom error types for the contract
    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]  
    pub enum Error {
        NotAdmin,
    }

    // Custom result type for the contract
    pub type ConfigResult<T> = core::result::Result<T, Error>;

    impl Config {
        /// Constructor that initializes configuration of the Kleo Protocol
        #[ink(constructor)]
        pub fn new(
            min_lenders: u32,
            overfunding_factor: u64,
            base_interest_rate: u64,
            late_penalty_rate: u64,
            max_loan_duration: u64,
        ) -> Self {
            let caller = Self::env().caller();
            Self {
                admin: caller,
                min_lenders,
                overfunding_factor,
                base_interest_rate,
                late_penalty_rate,
                max_loan_duration,
            }
        }

        /// Ensure that the caller of other functions is the admin
        /// Not meant to be called externally, so private
        fn ensure_admin(&self) -> ConfigResult<()> {
            let caller = self.env().caller();
            if caller != self.admin {
                return Err(Error::NotAdmin);
            }
            Ok(())
        }

        /// Setter functions for configuration parameters

        #[ink(message)]
        pub fn set_min_lenders(&mut self, new_min: u32) -> ConfigResult<()> {
            self.ensure_admin()?;
            self.min_lenders = new_min;
            Ok(())
        }

        #[ink(message)]
        pub fn set_overfunding_factor(&mut self, new_factor: u64) -> ConfigResult<()> {
            self.ensure_admin()?;
            self.overfunding_factor = new_factor;
            Ok(())
        }

        #[ink(message)]
        pub fn set_base_interest_rate(&mut self, new_rate: u64) -> ConfigResult<()> {
            self.ensure_admin()?;
            self.base_interest_rate = new_rate;
            Ok(())
        }

        #[ink(message)]
        pub fn set_late_penalty_rate(&mut self, new_rate: u64) -> ConfigResult<()> {
            self.ensure_admin()?;
            self.late_penalty_rate = new_rate;
            Ok(())
        }

        #[ink(message)]
        pub fn set_max_loan_duration(&mut self, new_duration: u64) -> ConfigResult<()> {
            self.ensure_admin()?;
            self.max_loan_duration = new_duration;
            Ok(())
        }

        /// Getter function for configuration parameters

        #[ink(message)]
        pub fn get_protocol_info(&self) -> (u32, u64, u64, u64, u64, Address) {
            (
                self.min_lenders,
                self.overfunding_factor,
                self.base_interest_rate,
                self.late_penalty_rate,
                self.max_loan_duration,
                self.admin
            )
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