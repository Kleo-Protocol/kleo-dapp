#![cfg_attr(not(feature = "std"), no_std)]

#[ink::contract]
mod trust_oracle {
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    /// Type aliases para simplificar.
    pub type Balance = <ink::env::DefaultEnvironment as ink::env::Environment>::Balance;
    pub type Timestamp = <ink::env::DefaultEnvironment as ink::env::Environment>::Timestamp;

    /// Tipo de evento que afecta el trust score.
    #[derive(
        scale::Encode,
        scale::Decode,
        Clone,
        Copy,
        Debug,
        PartialEq,
        Eq,
    )]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum EventKind {
        /// Pago de cuota o abono (instalment paid).
        InstallmentPaid,
        /// Falta de pago / mora.
        MissedPayment,
        /// Nuevo garante agregado.
        GuarantorAdded,
        /// Identidad verificada (KYC u otro mecanismo off-chain).
        IdentityVerified,
    }

    /// Evento almacenado en el historial.
    #[derive(
        scale::Encode,
        scale::Decode,
        Clone,
        Debug,
        PartialEq,
        Eq,
    )]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct TrustEvent {
        pub kind: EventKind,
        pub timestamp: Timestamp,
        /// Monto opcional asociado al evento (por ejemplo pago realizado).
        pub amount: Option<Balance>,
    }

    /// Pesos configurables para cada tipo de evento.
    #[derive(
        scale::Encode,
        scale::Decode,
        Clone,
        Copy,
        Debug,
        PartialEq,
        Eq,
    )]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct WeightsConfig {
        pub installment_paid_weight: i32,
        pub missed_payment_weight: i32,
        pub guarantor_added_weight: i32,
        pub identity_verified_weight: i32,
    }

    impl Default for WeightsConfig {
        fn default() -> Self {
            Self {
                // Ajusta estos valores a tu modelo:
                installment_paid_weight: 2,
                missed_payment_weight: -5,
                guarantor_added_weight: 3,
                identity_verified_weight: 5,
            }
        }
    }

    #[ink(storage)]
    pub struct TrustOracle {
        /// Admin del contrato (puede actualizar weights, autorizar contratos, etc.).
        owner: AccountId,
        /// Borrower -> eventos de comportamiento.
        events: Mapping<AccountId, Vec<TrustEvent>>,
        /// Borrower -> trust score actual.
        scores: Mapping<AccountId, i32>,
        /// Config global de pesos.
        weights: WeightsConfig,
        /// Contratos autorizados para registrar eventos (loan contracts, etc.).
        authorized_callers: Mapping<AccountId, ()>,
    }

    impl TrustOracle {
        /// Constructor: owner = caller, weights por defecto.
        #[ink(constructor)]
        pub fn new() -> Self {
            let caller = Self::env().caller();
            let mut authorized_callers = Mapping::default();
            // Opcionalmente el owner se auto-autoriza.
            authorized_callers.insert(caller, &());
            Self {
                owner: caller,
                events: Mapping::default(),
                scores: Mapping::default(),
                weights: WeightsConfig::default(),
                authorized_callers,
            }
        }

        // ─────────────────────────────────────────────────────────
        //         Helpers internos
        // ─────────────────────────────────────────────────────────

        fn ensure_owner(&self) -> Result<(), TrustError> {
            if self.env().caller() != self.owner {
                return Err(TrustError::NotOwner);
            }
            Ok(())
        }

        fn ensure_authorized(&self) -> Result<(), TrustError> {
            let caller = self.env().caller();
            if self.authorized_callers.get(caller).is_none() {
                return Err(TrustError::NotAuthorized);
            }
            Ok(())
        }

        /// Lee el trust score actual (o 0 si no existe).
        fn internal_get_score(&self, borrower: &AccountId) -> i32 {
            self.scores.get(borrower).unwrap_or(0)
        }

        /// Escribe el nuevo score, clamp a mínimo 0.
        fn internal_set_score(&mut self, borrower: &AccountId, score: i32) {
            let clamped = if score < 0 { 0 } else { score };
            self.scores.insert(borrower, &clamped);
        }

        /// Actualiza score en función de un delta.
        fn apply_delta(&mut self, borrower: &AccountId, delta: i32) {
            let current = self.internal_get_score(borrower);
            let new_score = current.saturating_add(delta);
            self.internal_set_score(borrower, new_score);
        }

        /// Inserta evento en el historial del borrower.
        fn push_event(
            &mut self,
            borrower: &AccountId,
            event: TrustEvent,
        ) {
            let mut list = self.events.get(borrower).unwrap_or_default();
            list.push(event);
            self.events.insert(borrower, &list);
        }

        /// Helper genérico para registrar evento + aplicar peso.
        fn register_event(
            &mut self,
            borrower: AccountId,
            kind: EventKind,
            amount: Option<Balance>,
        ) {
            let ts = self.env().block_timestamp();
            let event = TrustEvent {
                kind,
                timestamp: ts,
                amount,
            };
            self.push_event(&borrower, event);

            let delta = match kind {
                EventKind::InstallmentPaid => self.weights.installment_paid_weight,
                EventKind::MissedPayment => self.weights.missed_payment_weight,
                EventKind::GuarantorAdded => self.weights.guarantor_added_weight,
                EventKind::IdentityVerified => self.weights.identity_verified_weight,
            };
            self.apply_delta(&borrower, delta);
        }

        // ─────────────────────────────────────────────────────────
        //         Mensajes: administración
        // ─────────────────────────────────────────────────────────

        /// Cambiar pesos globales (solo owner).
        #[ink(message)]
        pub fn set_weights(&mut self, weights: WeightsConfig) -> Result<(), TrustError> {
            self.ensure_owner()?;
            self.weights = weights;
            Ok(())
        }

        /// Autorizar un contrato (por ejemplo LoanRegistry/LoanInstance).
        #[ink(message)]
        pub fn authorize_caller(&mut self, account: AccountId) -> Result<(), TrustError> {
            self.ensure_owner()?;
            self.authorized_callers.insert(account, &());
            Ok(())
        }

        /// Revocar autorización.
        #[ink(message)]
        pub fn revoke_caller(&mut self, account: AccountId) -> Result<(), TrustError> {
            self.ensure_owner()?;
            self.authorized_callers.remove(account);
            Ok(())
        }

        /// Leer si una cuenta está autorizada.
        #[ink(message)]
        pub fn is_authorized(&self, account: AccountId) -> bool {
            self.authorized_callers.get(account).is_some()
        }

        // ─────────────────────────────────────────────────────────
        //         Mensajes: registro de eventos
        // ─────────────────────────────────────────────────────────

        /// Registrar pago de cuota o abono (llamado por LoanContract).
        #[ink(message)]
        pub fn record_installment_paid(
            &mut self,
            borrower: AccountId,
            amount: Balance,
        ) -> Result<(), TrustError> {
            self.ensure_authorized()?;
            self.register_event(borrower, EventKind::InstallmentPaid, Some(amount));
            Ok(())
        }

        /// Registrar falta de pago / mora.
        #[ink(message)]
        pub fn record_missed_payment(
            &mut self,
            borrower: AccountId,
        ) -> Result<(), TrustError> {
            self.ensure_authorized()?;
            self.register_event(borrower, EventKind::MissedPayment, None);
            Ok(())
        }

        /// Registrar nuevo garante social/económico.
        #[ink(message)]
        pub fn record_guarantor_added(
            &mut self,
            borrower: AccountId,
        ) -> Result<(), TrustError> {
            self.ensure_authorized()?;
            self.register_event(borrower, EventKind::GuarantorAdded, None);
            Ok(())
        }

        /// Registrar verificación de identidad (KYC / proof).
        #[ink(message)]
        pub fn record_identity_verified(
            &mut self,
            borrower: AccountId,
        ) -> Result<(), TrustError> {
            self.ensure_authorized()?;
            self.register_event(borrower, EventKind::IdentityVerified, None);
            Ok(())
        }

        // ─────────────────────────────────────────────────────────
        //         Mensajes: lectura
        // ─────────────────────────────────────────────────────────

        /// Devuelve el trust score actual de un borrower.
        #[ink(message)]
        pub fn get_trust_score(&self, borrower: AccountId) -> i32 {
            self.internal_get_score(&borrower)
        }

        /// Devuelve todos los eventos de un borrower.
        /// (Útil para debug / indexers; cuidado con tamaño si se usa en prod).
        #[ink(message)]
        pub fn get_events(&self, borrower: AccountId) -> Vec<TrustEvent> {
            self.events.get(borrower).unwrap_or_default()
        }

        /// Devuelve la configuración actual de pesos.
        #[ink(message)]
        pub fn get_weights(&self) -> WeightsConfig {
            self.weights
        }

        /// Devuelve el owner.
        #[ink(message)]
        pub fn get_owner(&self) -> AccountId {
            self.owner
        }
    }

    /// Errores simples para manejar auth.
    #[derive(scale::Encode, scale::Decode, Debug, PartialEq, Eq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum TrustError {
        NotOwner,
        NotAuthorized,
    }

    // ─────────────────────────────────────────────────────────
    //         Tests (opcionales, pero siempre buena idea)
    // ─────────────────────────────────────────────────────────
    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::DefaultEnvironment;
        use ink::env::test;

        fn set_caller(account: AccountId) {
            test::set_caller::<DefaultEnvironment>(account);
        }

        #[ink::test]
        fn basic_flow_works() {
            let accounts = test::default_accounts::<DefaultEnvironment>();
            set_caller(accounts.alice);
            let mut oracle = TrustOracle::new();

            // Autorizar a Bob como contrato de loans.
            assert!(oracle.authorize_caller(accounts.bob).is_ok());

            // Cambiar caller a Bob para registrar eventos.
            set_caller(accounts.bob);
            assert!(oracle
                .record_installment_paid(accounts.charlie, 1000)
                .is_ok());
            assert!(oracle
                .record_missed_payment(accounts.charlie)
                .is_ok());

            // Lectura de score desde cualquier cuenta.
            set_caller(accounts.alice);
            let score = oracle.get_trust_score(accounts.charlie);
            // Con los weights por defecto: +2 (pago) -5 (mora) = -3 → clamp a 0.
            assert_eq!(score, 0);
        }
    }
}
