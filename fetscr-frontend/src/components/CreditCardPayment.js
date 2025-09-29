import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const CreditCardPayment = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Move hooks here at the top level
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [error, setError] = useState("");

  // Early exit if no payment data
  if (!state || !state.amount) {
    return (
      <div>
        <h2>No payment info found.</h2>
        <button onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  const { amount, plan } = state;

  const handlePay = () => {
    if (!cardNumber || !expiry || !cvv) {
      setError("All fields are required.");
      return;
    }
    // Validate card number length
    if (cardNumber.length < 12 || cardNumber.length > 19) {
      setError("Invalid card number length.");
      return;
    }
    setError("");
    alert(`Processing credit card payment of ${amount} for plan ${plan}.`);
    // Actual payment processing logic to be added here
    navigate("/home");
  };

  return (
    <div className="payment-container">
      <h2>Credit Card Payment</h2>
      <p>Amount: <b>{amount}</b></p>
      <p>Plan: {plan}</p>

      <input
        type="text"
        placeholder="Card Number"
        value={cardNumber}
        maxLength={19}
        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
        required
      />
      <input
        type="text"
        placeholder="Expiry Date (MM/YY)"
        value={expiry}
        maxLength={5}
        onChange={(e) => setExpiry(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="CVV"
        value={cvv}
        maxLength={4}
        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
        required
      />
      {error && <p style={{ color: "red" }}>{error}</p>}

      <button onClick={handlePay}>Pay</button>
      <button onClick={() => navigate(-1)}>⬅ Back</button>
    </div>
  );
};

export default CreditCardPayment;
