#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod trust_oracle {
    use ink::storage::Mapping;
    use ink::H160;

    /// Tipo de evento lógico.
    #[derive(
        scale::Encode,
        scale::Decode,
        Debug,
        PartialEq,
        Eq,
        Copy,
        Clone,
    )]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum EventKind {
        InstallmentPaid,
        MissedPayment,
        GuarantorAdded,
        IdentityVerified,
    }

    /// Evento on-chain (no se guarda como Vec en storage, solo logs).
    #[ink(event)]
    pub struct TrustEventRecorded {
        #[ink(topic)]
        borrower: H160,
        kind: EventKind,
        amount: Option<Balance>,
        timestamp: Timestamp,
        new_score: i32,
    }

    /// Contratos que pueden escribir en el oráculo.
    #[derive(
        scale::Encode,
        scale::Decode,
        Debug,
        PartialEq,
        Eq,
        Copy,
        Clone,
    )]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Role {
        Owner,
        Authorized,
    }

    #[ink(storage)]
    pub struct TrustOracle {
        /// Admin del contrato (controla autorizaciones y pesos).
        owner: H160,

        /// borrower -> trust score actual.
        scores: Mapping<H160, i32>,

        /// Pesos por tipo de evento (modelo simple).
        installment_paid_weight: i32,
        missed_payment_weight: i32,
        guarantor_added_weight: i32,
        identity_verified_weight: i32,

        /// Contratos autorizados a registrar eventos.
        authorized_callers: Mapping<H160, ()>,
    }

    impl TrustOracle {
        // ─────────────────────────────
        // Constructor
        // ─────────────────────────────

        #[ink(constructor)]
        pub fn new() -> Self {
            let caller = Self::env().caller();
            let mut authorized_callers = Mapping::default();
            // Owner auto-autorizado.
            authorized_callers.insert(caller, &());

            Self {
                owner: caller,
                scores: Mapping::default(),
                installment_paid_weight: 2,
                missed_payment_weight: -5,
                guarantor_added_weight: 3,
                identity_verified_weight: 5,
                authorized_callers,
            }
        }

        // ─────────────────────────────
        // Helpers internos
        // ─────────────────────────────

        fn ensure_owner(&self) -> bool {
            self.env().caller() == self.owner
        }

        fn is_authorized(&self, account: &H160) -> bool {
            self.authorized_callers.get(account).is_some()
        }

        fn get_score_internal(&self, borrower: &H160) -> i32 {
            self.scores.get(borrower).unwrap_or(0)
        }

        fn set_score_internal(&mut self, borrower: &H160, score: i32) -> i32 {
            let clamped = if score < 0 { 0 } else { score };
            self.scores.insert(borrower, &clamped);
            clamped
        }

        fn weight_for_event(&self, kind: EventKind) -> i32 {
            match kind {
                EventKind::InstallmentPaid => self.installment_paid_weight,
                EventKind::MissedPayment => self.missed_payment_weight,
                EventKind::GuarantorAdded => self.guarantor_added_weight,
                EventKind::IdentityVerified => self.identity_verified_weight,
            }
        }

        fn apply_event(
            &mut self,
            borrower: &H160,
            kind: EventKind,
            amount: Option<Balance>,
        ) {
            let w = self.weight_for_event(kind);
            let current = self.get_score_internal(borrower);
            let new_score = current.saturating_add(w).max(0);
            let new_score = self.set_score_internal(borrower, new_score);
            let ts = self.env().block_timestamp();

            self.env().emit_event(TrustEventRecorded {
                borrower: *borrower,
                kind,
                amount,
                timestamp: ts,
                new_score,
            });
        }

        // ─────────────────────────────
        // Admin (owner)
        // ─────────────────────────────

        /// Cambiar pesos de scoring. Si el caller no es owner, no hace nada.
        #[ink(message)]
        pub fn set_weights(
            &mut self,
            installment_paid_weight: i32,
            missed_payment_weight: i32,
            guarantor_added_weight: i32,
            identity_verified_weight: i32,
        ) {
            if !self.ensure_owner() {
                return;
            }
            self.installment_paid_weight = installment_paid_weight;
            self.missed_payment_weight = missed_payment_weight;
            self.guarantor_added_weight = guarantor_added_weight;
            self.identity_verified_weight = identity_verified_weight;
        }

        /// Autorizar un contrato para registrar eventos de trust.
        #[ink(message)]
        pub fn authorize_caller(&mut self, account: H160) {
            if !self.ensure_owner() {
                return;
            }
            self.authorized_callers.insert(account, &());
        }

        /// Revocar autorización.
        #[ink(message)]
        pub fn revoke_caller(&mut self, account: H160) {
            if !self.ensure_owner() {
                return;
            }
            self.authorized_callers.remove(account);
        }

        /// Consultar el rol de una cuenta (owner, authorized o ninguno).
        #[ink(message)]
        pub fn get_role(&self, account: H160) -> Option<Role> {
            if account == self.owner {
                Some(Role::Owner)
            } else if self.is_authorized(&account) {
                Some(Role::Authorized)
            } else {
                None
            }
        }

        /// Obtener el owner actual.
        #[ink(message)]
        pub fn get_owner(&self) -> H160 {
            self.owner
        }

        // ─────────────────────────────
        // API para LoanContracts
        // ─────────────────────────────

        /// Registrar pago (cuota o pago adaptativo).
        #[ink(message)]
        pub fn record_installment_paid(&mut self, borrower: H160, amount: Balance) {
            let caller = self.env().caller();
            if !self.is_authorized(&caller) {
                return;
            }
            self.apply_event(&borrower, EventKind::InstallmentPaid, Some(amount));
        }

        /// Registrar falta de pago.
        #[ink(message)]
        pub fn record_missed_payment(&mut self, borrower: H160) {
            let caller = self.env().caller();
            if !self.is_authorized(&caller) {
                return;
            }
            self.apply_event(&borrower, EventKind::MissedPayment, None);
        }

        /// Registrar que se agregó un garante.
        #[ink(message)]
        pub fn record_guarantor_added(&mut self, borrower: H160) {
            let caller = self.env().caller();
            if !self.is_authorized(&caller) {
                return;
            }
            self.apply_event(&borrower, EventKind::GuarantorAdded, None);
        }

        /// Registrar verificación de identidad (KYC, DID, etc.).
        #[ink(message)]
        pub fn record_identity_verified(&mut self, borrower: H160) {
            let caller = self.env().caller();
            if !self.is_authorized(&caller) {
                return;
            }
            self.apply_event(&borrower, EventKind::IdentityVerified, None);
        }

        // ─────────────────────────────
        // Lectura de datos
        // ─────────────────────────────

        /// Obtener trust score actual de un borrower.
        #[ink(message)]
        pub fn get_trust_score(&self, borrower: H160) -> i32 {
            self.get_score_internal(&borrower)
        }

        /// Obtener pesos de scoring (útil para frontend / debug).
        #[ink(message)]
        pub fn get_weights(&self) -> (i32, i32, i32, i32) {
            (
                self.installment_paid_weight,
                self.missed_payment_weight,
                self.guarantor_added_weight,
                self.identity_verified_weight,
            )
        }
    }

    // ─────────────────────────────
    // Tests
    // ─────────────────────────────
    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env;

        // Alias para el environment por defecto de ink!
        type Env = env::DefaultEnvironment;

fn default_accounts() -> env::test::DefaultAccounts {
            env::test::default_accounts()
        }

        fn set_caller(caller: H160) {
            env::test::set_caller(caller);
        }

        /// Helper: inicializa el contrato con `alice` como owner/caller
        fn init_with_alice_owner() -> (TrustOracle, env::test::DefaultAccounts) {
            let accounts = default_accounts();
            // IMPORTANTE: fijar caller antes de new()
            set_caller(accounts.alice);
            let contract = TrustOracle::new();
            (contract, accounts)
        }

        #[ink::test]
        fn new_sets_owner_and_authorization() {
            let (contract, accounts) = init_with_alice_owner();

            // El owner debe ser alice
            assert_eq!(contract.get_owner(), accounts.alice);

            // Alice debe tener rol Owner
            assert_eq!(contract.get_role(accounts.alice), Some(Role::Owner));

            // Bob no tiene ningún rol al inicio
            assert_eq!(contract.get_role(accounts.bob), None);
        }

        #[ink::test]
        fn owner_can_authorize_and_revoke_caller() {
            let (mut contract, accounts) = init_with_alice_owner();

            // Owner (alice) autoriza a bob
            set_caller(accounts.alice);
            contract.authorize_caller(accounts.bob);
            assert_eq!(contract.get_role(accounts.bob), Some(Role::Authorized));

            // Owner revoca a bob
            contract.revoke_caller(accounts.bob);
            assert_eq!(contract.get_role(accounts.bob), None);
        }

        #[ink::test]
        fn non_owner_cannot_change_weights_or_authorizations() {
            let (mut contract, accounts) = init_with_alice_owner();

            // Guardamos los pesos iniciales
            let initial_weights = contract.get_weights();

            // Bob intenta cambiar pesos y autorizar
            set_caller(accounts.bob);
            contract.set_weights(10, -10, 10, 10);
            contract.authorize_caller(accounts.bob);

            // Nada debería haber cambiado porque bob no es owner
            assert_eq!(contract.get_weights(), initial_weights);
            assert_eq!(contract.get_role(accounts.bob), None);
        }

        #[ink::test]
        fn authorized_caller_can_record_installment_paid() {
            let (mut contract, accounts) = init_with_alice_owner();

            // Owner (alice) ya está autorizado desde el constructor
            // Alice registra un pago para charlie
            set_caller(accounts.alice);
            let borrower = accounts.charlie;
            let amount: Balance = 100;

            assert_eq!(contract.get_trust_score(borrower), 0);
            contract.record_installment_paid(borrower, amount);

            // Score debe haber aumentado por el peso de InstallmentPaid
            let (installment_weight, _, _, _) = contract.get_weights();
            assert_eq!(contract.get_trust_score(borrower), installment_weight);
        }

        #[ink::test]
        fn unauthorized_caller_cannot_record_events() {
            let (mut contract, accounts) = init_with_alice_owner();

            // Bob no está autorizado; intenta registrar eventos
            set_caller(accounts.bob);
            let borrower = accounts.charlie;

            contract.record_installment_paid(borrower, 100);
            contract.record_missed_payment(borrower);
            contract.record_guarantor_added(borrower);
            contract.record_identity_verified(borrower);

            // Como bob no está autorizado, el score debe seguir en 0
            assert_eq!(contract.get_trust_score(borrower), 0);
        }

        #[ink::test]
        fn missed_payment_does_not_go_below_zero() {
            let (mut contract, accounts) = init_with_alice_owner();

            // Alice (owner/autorizada) registra faltas de pago
            set_caller(accounts.alice);
            let borrower = accounts.bob;

            // Score inicial 0
            assert_eq!(contract.get_trust_score(borrower), 0);

            // Registramos una falta de pago varias veces
            contract.record_missed_payment(borrower);
            contract.record_missed_payment(borrower);

            // Score nunca debe ser negativo
            assert_eq!(contract.get_trust_score(borrower), 0);
        }

        #[ink::test]
        fn positive_and_negative_events_combine_correctly() {
            let (mut contract, accounts) = init_with_alice_owner();

            set_caller(accounts.alice);
            let borrower = accounts.bob;

            // Pesos actuales
            let (w_installment, w_missed, w_guarantor, w_identity) =
                contract.get_weights();

            // Secuencia:
            // + identity verified
            // + guarantor added
            // + installment paid
            // - missed payment
            contract.record_identity_verified(borrower);
            contract.record_guarantor_added(borrower);
            contract.record_installment_paid(borrower, 100);
            contract.record_missed_payment(borrower);

            let expected = (0i32)
                .saturating_add(w_identity)
                .saturating_add(w_guarantor)
                .saturating_add(w_installment)
                .saturating_add(w_missed)
                .max(0);

            assert_eq!(contract.get_trust_score(borrower), expected);
        }

        #[ink::test]
        fn set_weights_changes_scoring_model_for_future_events() {
            let (mut contract, accounts) = init_with_alice_owner();

            set_caller(accounts.alice);
            let borrower = accounts.bob;

            // Score inicial 0
            assert_eq!(contract.get_trust_score(borrower), 0);

            // Cambiamos el modelo de scoring
            contract.set_weights(10, -1, 4, 7);
            assert_eq!(contract.get_weights(), (10, -1, 4, 7));

            // Un solo InstallmentPaid ahora debe sumar 10
            contract.record_installment_paid(borrower, 50);
            assert_eq!(contract.get_trust_score(borrower), 10);
        }
    }


}