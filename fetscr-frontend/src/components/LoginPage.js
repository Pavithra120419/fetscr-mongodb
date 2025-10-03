import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

import "./LoginPages.css";

const SERVER = "http://localhost:5000";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetData, setResetData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  // ---------------- Email/Password Login ----------------
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${SERVER}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Login failed");
      } else {
        setSuccess("Login successful! Redirecting...");
        localStorage.setItem("fetscr_token", data.token);
        localStorage.setItem("fetscr_user", JSON.stringify(data.user));
        setTimeout(() => navigate("/home"), 1500);
      }
    } catch (err) {
      setError("Server error: " + err.message);
    }
  };

  // ---------------- Password Reset ----------------
  const handleResetChange = (e) => {
    setResetData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");

    const { email, newPassword, confirmPassword } = resetData;
    if (!email || !newPassword || !confirmPassword) {
      setResetError("All fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    try {
      setResetLoading(true);
      const res = await fetch(`${SERVER}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();

      if (!data.success) {
        setResetError(data.error || "Reset failed");
      } else {
        setResetSuccess("Password reset successful! Please login.");
        setTimeout(() => {
          setShowReset(false);
          setResetData({ email: "", newPassword: "", confirmPassword: "" });
        }, 2000);
      }
    } catch (err) {
      setResetError("Server error: " + err.message);
    } finally {
      setResetLoading(false);
    }
  };

  // ---------------- Google Login ----------------
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
        navigate("/home");
      } else {
        setError(data.error || "Google login failed");
      }
    } catch (err) {
      setError("Google login error: " + err.message);
    }
  };

  return (
    <div className="login-page">
      {!showReset ? (
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Login</h2>

          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}

          <label>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </label>

          <button type="submit" className="btn-primary">Login</button>

          <p className="link-row">
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setShowReset(true);
                setResetError("");
              }}
            >
              Forgot password?
            </button>
          </p>

          {/* 🔹 Social login section */}
          <div className="social-login">
            <p>Or continue with</p>
            <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google login failed")}
              />
            </GoogleOAuthProvider>
          </div>
        </form>
      ) : (
        <form className="auth-card" onSubmit={handleResetSubmit}>
          <h2>Reset Password</h2>

          {resetError && <div className="alert error">{resetError}</div>}
          {resetSuccess && <div className="alert success">{resetSuccess}</div>}

          <label>
            Email
            <input
              type="email"
              name="email"
              value={resetData.email}
              onChange={handleResetChange}
              required
            />
          </label>

          <label>
            New Password
            <input
              type="password"
              name="newPassword"
              value={resetData.newPassword}
              onChange={handleResetChange}
              required
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              name="confirmPassword"
              value={resetData.confirmPassword}
              onChange={handleResetChange}
              required
            />
          </label>

          <div className="btn-row">
            <button type="submit" className="btn-primary" disabled={resetLoading}>
              {resetLoading ? "Resetting..." : "Reset Password"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowReset(false);
                setResetError("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default LoginPage;
