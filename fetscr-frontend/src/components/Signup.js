// src/components/Signup.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google"; // ✅ import
import "./Signup.css";

const SERVER = "http://localhost:5000";

const SignUpPage = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ---------------- Manual Signup ----------------
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckboxChange = (e) => {
    setAgreeTerms(e.target.checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${SERVER}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Signup failed");
      } else {
        alert("Signup successful! Please login.");
        navigate("/login");
      }
    } catch (err) {
      setError("Server error: " + err.message);
    }
  };

  // ---------------- Google Signup ----------------
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch(`${SERVER}/social-login/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem("fetscr_token", data.token);
        localStorage.setItem("fetscr_user", JSON.stringify(data.user));
        navigate("/home"); // ✅ directly log them in
      } else {
        setError(data.error || "Google signup failed");
      }
    } catch (err) {
      setError("Google signup error: " + err.message);
    }
  };

  return (
    <div className="signup-page">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h2>Sign Up</h2>

        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

        <label>
          Name
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </label>

        <label>
          Email
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </label>

        <label>
          Password
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </label>
        <label>
          Confirm Password
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
        </label>



        <label style={{ marginTop: '12px', display: 'block' }}>
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={handleCheckboxChange}
            required
          />{" "}
          I agree to the{" "}
          <Link to="/terms" target="_blank" rel="noopener noreferrer">
            Terms and Privacy Policy
          </Link>
        </label>

        <button type="submit">Sign Up</button>

        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>

        {/* 🔹 Google Signup */}
        <div className="social-signup">
          <p>Or continue with</p>
          <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google signup failed")}
            />
          </GoogleOAuthProvider>
        </div>
      </form>
    </div>
  );
};

export default SignUpPage;
