## MILESTONE 2 PLAN: **Kleo – Collateral-Free Lending Protocol**

**Team:** Santiago Villarreal, Fabián Sánchez  
**Track:**  [x] SHIP-A-TON    [ ] IDEA-TON  
**Date:** November 2025  

---

## 📍 WHERE WE ARE NOW

### **What we built/validated this weekend:**
- The full **Kleo Mechanism**: overfunding, multi-lender pooling & risk-buffer math.  
- The **Trust Score v1**: basic behavior-based scoring model.  
- A minimal functional flow: request → fund → repay → update trust.  

### **What's working:**
- Overfunding logic is stable and deterministic.  
- Trust score updates correctly based on repayment events.  

### **What still needs work:**
- Relay + Hydration event syncing  
- Indexing repayment proofs and trust events  
- API endpoints for frontend consumption  

### **Blockers or hurdles we hit:**
- No real-time event listener  
- Trust-event format not fully standardized  
- Missing indexing layer for efficient queries  

---

## 🚀 WHAT WE'LL SHIP IN 30 DAYS

### **Our MVP will do this:**  
Kleo will enable real borrowers to request small collateral-free loans, and real lenders to fund them safely using overfunding and a decentralized trust score.  
The MVP will demonstrate complete loan lifecycle: issuance → trust validation → pooled funding → verifiable repayment.

---

## Features We'll Build (3–5 Total)

---

### **Week 1–2**

#### **Feature: Relay Integration with Hydration**
- **Why it matters:** Enables real-time syncing of on-chain loan events and repayment flows.  
- **Who builds it:** Santiago  

#### **Feature: Loan Event Standardization (LoanEvent struct)**
- **Why it matters:** All events (request, funding, repayment, trust updates) must follow a shared schema for indexing and trust computation.  
- **Who builds it:** Santiago  

---

### **Week 2–3**

#### **Feature: Repayment Proof System**
- **Why it matters:** Borrowers must submit timestamped, verifiable repayments; core to trust and risk reduction.  
- **Who builds it:** Santiago  

#### **Feature: Trust Score Upgrade v1.5**
- **Why it matters:** Integrates repayment proofs, missing payments, and behavior signals into a deterministic trust update model.  
- **Who builds it:** Santiago  

---

### **Week 3–4**

#### **Feature: Public API for Borrower/Lender Apps**
- **Why it matters:** Developers and frontends need quick access to loan states, trust scores, and repayment flows.  
- **Who builds it:** Fabián Sánchez  
 

---

## 🧑‍💻 Team Breakdown

### **Santiago Villarreal – Protocol Engineer | 20–25 hrs/week**
- Owns:  
  - Relay integration  
  - Trust score logic  
  - Repayment proofs  
  - Core architecture  
  - Protocol documentation  

### **Fabián Sánchez – Fullstack & Integration Engineer | 10–15 hrs/week**
- Owns:  
  - Public API design and development  
  - Frontend/relay integration  
  - Indexer logic and query performance  
  - Event formatting & data validation  

---

## 🧠 Mentoring & Expertise We Need

### **Areas where we need support:**
- Substrate/Hydration indexing best practices  
- Trust score parameter validation  

### **Specific expertise we're looking for:**
- Polkadot ecosystem engineer familiar with Hydration  
- Cryptography/DeFi expert to review repayment-proof flow  

---

## 🎯 WHAT HAPPENS AFTER

### **When M2 is done, we plan to…** 
- Launch the full Kleo MVP with real microloans beta ($5–$50)  
- Onboard early LATAM users (informal workers & micro-entrepreneurs)  
- Go for a growth grant to keep developing core features for adoption, the next step would be reducing barriers by getting people a good UX.

### **And 6 months out we see our project achieve:**
- Deploy to mainnet
- 1K–10K users building trust scores on-chain  
- Sustainable, collateral-free lending at scale  
- First Web3-native microcredit rails in the region  
- Real-world economic impact across LATAM  

---