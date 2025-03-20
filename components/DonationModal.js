import React, { useState } from "react";
import styles from "../styles/DonationModal.module.css";

const DonationModal = ({ onClose, onSubmit, user }) => {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Predefined donation amounts
  const predefinedAmounts = [5000, 10000, 20000, 50000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!amount || isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      setLoading(false);
      return;
    }

    try {
      // Convert amount to kobo (Paystack uses kobo)
      const amountInKobo = parseInt(amount) * 100;

      // Initialize Paystack payment
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: amountInKobo,
          metadata: {
            name,
            user_id: user?.uid,
          },
        }),
      });

      const data = await response.json();

      if (data.status) {
        // Redirect to Paystack payment page
        window.location.href = data.data.authorization_url;
      } else {
        setError(data.message || "Payment initialization failed");
      }
    } catch (error) {
      console.error("Error initializing payment:", error);
      setError("An error occurred while processing your donation");
    }

    setLoading(false);
  };

  // Handle click outside the modal to close it
  const handleClickOutside = (e) => {
    if (e.target.className === styles.modalOverlay) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClickOutside}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Support EventEase</h2>
          <button className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.modalBody}>
          {successMessage ? (
            <div className={styles.successMessage}>
              <p>{successMessage}</p>
              <button onClick={onClose} className={styles.closeButton}>
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="amount">Amount (NGN)</label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className={styles.predefinedAmounts}>
                {predefinedAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`${styles.amountButton} ${
                      parseInt(amount) === amt ? styles.amountButtonActive : ""
                    }`}
                    onClick={() => setAmount(amt.toString())}
                  >
                    ₦{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {error && <p className={styles.errorMessage}>{error}</p>}

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={onClose}
                  className={styles.cancelButton}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Donate Now"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationModal;