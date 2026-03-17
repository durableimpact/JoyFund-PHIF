# Solidarity Health Bridge (JoyFund) - Project Overview

## 1. The Mission: Bridging the Gap in Maternal Healthcare

**The Problem:** Cameroon faces a critical maternal health crisis. With less than 2% of the population insured, the vast majority rely on out-of-pocket payments for healthcare. This forces thousands of vulnerable pregnant women to either forgo essential medical care or face detention in hospitals over unpaid bills.

**Our Solution:** JoyFund is a transparent, tech-driven crowdfunding platform that transforms personal celebrations (birthdays, promotions, weddings) into a life-saving **People's Health Insurance Fund**. We digitize the traditional Cameroonian solidarity concept of "Njangi" to pool small, frequent donations and direct them toward the most urgent health needs.

---

## 2. The Actors: Who Powers the Platform?

The JoyFund ecosystem is powered by six key actors, each with a vital role.

| Actor | Role in the System |
| :--- | :--- |
| **1. The Donor** | The person celebrating an event. They **start a campaign** to raise funds from their network. |
| **2. The Contributor** | Friends, family, and colleagues of the Donor. They **make small donations** to the campaign using Mobile Money. |
| **3. The Beneficiary** | A vulnerable pregnant woman or elderly person. They are enrolled to **receive a digital voucher** for free medical care. |
| **4. The Social Worker** | A trusted community health worker. They **find, verify, and enroll** eligible Beneficiaries into the platform. |
| **5. The Hospital Staff** | Receptionists and medical staff at partner hospitals. They **validate the voucher** and **confirm care was provided** to trigger payment. |
| **6. The System Admin** | The JoyFund team. They **oversee the platform**, manage partnerships, and ensure the entire process runs smoothly. |

---

## 3. The Complete Workflow: From Donation to Delivery

This is the step-by-step journey that turns a celebratory gift into a safe childbirth.

### Phase 1: The Campaign (Raising Funds)
1.  **A Donor Starts a JoyFund**: A user celebrating a milestone (e.g., a new job) creates a campaign page with a personal story and an "Impact Goal" (e.g., "Sponsor 2 Safe Deliveries").
2.  **Contributors Donate**: The Donor shares the campaign link on WhatsApp. Friends and family contribute via MTN MoMo or Orange Money.
3.  **Funds are Pooled**: All donations are securely held in the JoyFund virtual escrow account, waiting to be matched with a person in need.

### Phase 2: The Enrollment (Finding a Beneficiary)
1.  **Identification & Verification**: A Social Worker identifies a pregnant woman in need (e.g., Mama Solange) and verifies her eligibility.
2.  **Digital ID Creation**: The Social Worker creates a `Beneficiary` profile in the system. The platform automatically generates a unique **Digital Health ID** (e.g., `BEN-0042`) for her.

### Phase 3: The Match & The "Instant-Care" Voucher
1.  **The Match**: The system's matching engine identifies Mama Solange as a high-priority case and assigns available funds from the escrow account.
2.  **The Approval**: A System Admin reviews and approves this match.
3.  **Voucher Generation**: Upon approval, the system creates a `CareVoucher` with two critical, secret codes:
    *   A **6-digit Voucher Code** (e.g., `X9K3L2`) for check-in.
    *   A **4-digit Patient PIN** for final confirmation (the "anti-fraud" key).
4.  **SMS Notification**: The system sends an SMS to Mama Solange with her Voucher Code, instructing her to present it at the designated partner hospital. The 4-digit PIN is kept secret for now.

### Phase 4: Receiving Care (The Hospital's Role)
1.  **Hospital Check-In**: Mama Solange arrives at the hospital and shows her SMS. The receptionist enters the 6-digit Voucher Code into the JoyFund Hospital Portal.
2.  **Funds Locked**: The system validates the code and "locks" the funds for her treatment. The Donor receives a real-time notification that their gift is now being used.
3.  **Care is Provided**: The hospital provides all necessary medical services to Mama Solange.

### Phase 5: Closing the Loop (Transparency & Payment)
1.  **The Anti-Fraud PIN**: After care is complete, the system sends a **second SMS** to Mama Solange containing her secret 4-digit Patient PIN.
2.  **Service Confirmation**: She provides this PIN to the nurse, who enters it into the portal. This is the **proof of service** and her confirmation that she is satisfied.
3.  **Instant Payout**: The correct PIN triggers the final step: the `CareVoucher` is marked as "Redeemed," and the funds are instantly transferred from the escrow account directly to the hospital's business account.
4.  **Final Notification**: The Donor receives a final, emotional update confirming that their contribution successfully funded a safe delivery.

---

## 4. Core Technology & Features

*   **Backend**: Built on Django, providing a robust and secure foundation for financial transactions and data management.
*   **Database**: PostgreSQL, ensuring data integrity and reliable record-keeping.
*   **Mobile Money Integration**: Connects with payment aggregators (like Flutterwave, Notch Pay) to handle seamless MTN MoMo and Orange Money transactions.
*   **Real-Time Transparency Dashboard**: A public-facing dashboard showing live stats on funds raised and lives impacted, building trust.
*   **SMS Gateway**: Uses services like Orange SMS API to deliver critical voucher codes and PINs to beneficiaries, ensuring accessibility even without a smartphone.
*   **Closed-Loop Audit Trail**: Every single action—from donation to payout—is recorded in the `VoucherAuditLog`, creating an immutable record for ultimate transparency.
