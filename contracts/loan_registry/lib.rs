#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod loan_registry {
    use ink::storage::Mapping;
    use scale_info::prelude::vec::Vec;
    use ink::H160;

    /// Evento: se crea un nuevo préstamo.
    #[ink(event)]
    pub struct LoanCreated {
        #[ink(topic)]
        borrower: H160,
        #[ink(topic)]
        loan_address: H160,
        principal: Balance,
        overfactor_bps: u32,
    }

    /// Evento: se actualiza el mínimo trust score.
    #[ink(event)]
    pub struct MinTrustScoreUpdated {
        old: i32,
        new: i32,
    }

    /// Evento: se actualiza la dirección del TrustOracle.
    #[ink(event)]
    pub struct TrustOracleUpdated {
        old: H160,
        new: H160,
    }

    /// Evento: se actualiza la dirección del Hydration Adapter.
    #[ink(event)]
    pub struct HydrationAdapterUpdated {
        old: H160,
        new: H160,
    }

    #[ink(storage)]
    pub struct LoanRegistry {
        /// Admin del contrato.
        owner: H160,

        /// Dirección del contrato TrustOracle.
        trust_oracle: H160,

        /// Dirección del Hydration Buffer Adapter.
        hydration_adapter: H160,

        /// Lista global de todos los loans creados.
        loans: Vec<H160>,

        /// borrower -> lista de loans.
        borrower_loans: Mapping<H160, Vec<H160>>,

        /// lender -> lista de loans (reservado para futuro).
        lender_loans: Mapping<H160, Vec<H160>>,

        /// Trust score mínimo requerido para abrir un nuevo préstamo.
        min_trust_score: i32,
    }

    impl LoanRegistry {
        // ─────────────────────────────
        // Helpers internos
        // ─────────────────────────────

        fn ensure_owner(&self) -> bool {
            self.env().caller() == self.owner
        }

        /// Llama a `trust_oracle.get_trust_score(borrower)` vía cross-contract call.
        fn fetch_trust_score(&self, borrower: &H160) -> i32 {
            use ink::env::{
                call::{build_call, ExecutionInput, Selector},
                DefaultEnvironment,
            };

            // Coincide con:
            // #[ink(message)]
            // pub fn get_trust_score(&self, borrower: H160) -> i32
            let selector = Selector::new(ink::selector_bytes!("get_trust_score"));

            build_call::<DefaultEnvironment>()
                .call(self.trust_oracle)
                .exec_input(
                    ExecutionInput::new(selector)
                        .push_arg(borrower),
                )
                .returns::<i32>()
                .invoke()
        }

        /// Genera una dirección pseudo-única de loan mientras no tenemos el contrato instanciable.
        /// (Se puede reemplazar más adelante por la dirección real del `loan_instance`).
        fn next_pseudo_loan_address(&self) -> H160 {
            let id: u64 = (self.loans.len() as u64) + 1;
            let mut bytes = [0u8; 20];
            // Guardamos el id en los últimos 8 bytes (big-endian).
            bytes[12..20].copy_from_slice(&id.to_be_bytes());
            H160::from(bytes)
        }

        // ─────────────────────────────
        // Constructor
        // ─────────────────────────────

        /// Crea un nuevo LoanRegistry.
        ///
        /// - `trust_oracle`: dirección del contrato TrustOracle.
        /// - `hydration_adapter`: dirección del adapter hacia Hydration.
        /// - `min_trust_score`: mínimo score requerido para crear loans.
        #[ink(constructor)]
        pub fn new(
            trust_oracle: H160,
            hydration_adapter: H160,
            min_trust_score: i32,
        ) -> Self {
            let caller = Self::env().caller();
            Self {
                owner: caller,
                trust_oracle,
                hydration_adapter,
                loans: Vec::new(),
                borrower_loans: Mapping::default(),
                lender_loans: Mapping::default(),
                min_trust_score,
            }
        }

        // ─────────────────────────────
        // Admin / Setup
        // ─────────────────────────────

        /// Actualiza el mínimo trust score requerido.
        /// Solo el owner puede cambiarlo.
        #[ink(message)]
        pub fn set_min_trust_score(&mut self, new_min: i32) {
            if !self.ensure_owner() {
                return;
            }
            let old = self.min_trust_score;
            self.min_trust_score = new_min;
            self.env().emit_event(MinTrustScoreUpdated { old, new: new_min });
        }

        /// Actualiza la dirección del TrustOracle.
        /// Solo el owner puede cambiarla.
        #[ink(message)]
        pub fn set_trust_oracle(&mut self, addr: H160) {
            if !self.ensure_owner() {
                return;
            }
            let old = self.trust_oracle;
            self.trust_oracle = addr;
            self.env().emit_event(TrustOracleUpdated { old, new: addr });
        }

        /// Actualiza la dirección del Hydration Adapter.
        /// Solo el owner puede cambiarla.
        #[ink(message)]
        pub fn set_hydration_adapter(&mut self, addr: H160) {
            if !self.ensure_owner() {
                return;
            }
            let old = self.hydration_adapter;
            self.hydration_adapter = addr;
            self.env().emit_event(HydrationAdapterUpdated { old, new: addr });
        }

        // ─────────────────────────────
        // Loan Creation
        // ─────────────────────────────

        /// Crea un nuevo loan para el caller (borrower).
        ///
        /// Requisitos:
        /// - `trust_oracle.get_trust_score(borrower) >= min_trust_score`
        ///
        /// Por ahora:
        /// - Genera una dirección pseudo-única para el loan (placeholder).
        /// - La idea es reemplazar esto por la address real del contrato `loan_instance`
        ///   cuando tengamos el tipo de referencia correcto.
        #[ink(message)]
        pub fn create_loan(
            &mut self,
            principal: Balance,
            overfactor_bps: u32,     // 15000 = 1.5x con 4 decimales
            max_duration: Timestamp, // aún no se usa aquí, pero se propaga al loan_instance más adelante
        ) -> H160 {
            let borrower = self.env().caller();

            // 1. Revisar trust score
            let score = self.fetch_trust_score(&borrower);
            if score < self.min_trust_score {
                panic!("Insufficient trust score to create loan");
            }

            // 2. (Futuro) Instanciar el loan_instance
            //    Aquí se usará build_create / InstantiateParams con el code_hash del loan.
            //    Por ahora generamos una dirección pseudo-única.
            let loan_addr = self.next_pseudo_loan_address();

            // 3. Index global
            self.loans.push(loan_addr);

            // 4. Index por borrower
            let mut list = self.borrower_loans.get(&borrower).unwrap_or_default();
            list.push(loan_addr);
            self.borrower_loans.insert(borrower, &list);

            // 5. Evento
            self.env().emit_event(LoanCreated {
                borrower,
                loan_address: loan_addr,
                principal,
                overfactor_bps,
            });

            // max_duration se usará en el loan_instance; lo dejamos en la firma para no romper la API
            let _ = max_duration;

            loan_addr
        }

        // ─────────────────────────────
        // Read-only Queries
        // ─────────────────────────────

        /// Devuelve la lista global de todos los loans.
        #[ink(message)]
        pub fn get_all_loans(&self) -> Vec<H160> {
            self.loans.clone()
        }

        /// Devuelve todos los loans creados por un borrower.
        #[ink(message)]
        pub fn get_loans_by_borrower(&self, borrower: H160) -> Vec<H160> {
            self.borrower_loans.get(&borrower).unwrap_or_default()
        }

        /// Devuelve todos los loans donde una cuenta actúa como lender.
        ///
        /// Nota: por ahora este mapping no se mantiene;
        /// se dejará para integración futura desde loan_instance.
        #[ink(message)]
        pub fn get_loans_by_lender(&self, lender: H160) -> Vec<H160> {
            self.lender_loans.get(&lender).unwrap_or_default()
        }

        /// Dirección actual del TrustOracle.
        #[ink(message)]
        pub fn get_trust_oracle(&self) -> H160 {
            self.trust_oracle
        }

        /// Dirección actual del Hydration Adapter.
        #[ink(message)]
        pub fn get_hydration_adapter(&self) -> H160 {
            self.hydration_adapter
        }

        /// Trust score mínimo requerido para crear loans.
        #[ink(message)]
        pub fn get_min_trust_score(&self) -> i32 {
            self.min_trust_score
        }

        /// Devuelve el owner del registry.
        #[ink(message)]
        pub fn get_owner(&self) -> H160 {
            self.owner
        }
    }
}
