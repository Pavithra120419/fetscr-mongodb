//header.js
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Header.css";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hook must be called unconditionally
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const user = JSON.parse(localStorage.getItem("fetscr_user"));
  const token = localStorage.getItem("fetscr_token");

  const getFirstLetter = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const handleMenuToggle = () => setShowMobileMenu((prev) => !prev);

  return (
    <header className="header">
      <div className="header-left">
        <h2 className="logo">FETSCR</h2>
      </div>

      <button className="hamburger" onClick={handleMenuToggle}>
        &#9776;
      </button>

      <nav className="header-center">
        <Link to="/home" onClick={() => setShowMobileMenu(false)}>Home</Link>
        <Link to="/pricing" onClick={() => setShowMobileMenu(false)}>Pricing</Link>
        <Link to="/community" onClick={() => setShowMobileMenu(false)}>Community</Link>
        <Link to="/docs" onClick={() => setShowMobileMenu(false)}>Docs</Link>
      </nav>

      <div className="header-right">
        {token && user ? (
          <div
            className="profile-avatar"
            onClick={() => {
              setShowMobileMenu(false);
              navigate("/profile");
            }}
          >
            {getFirstLetter(user.name)}
          </div>
        ) : (
          <>
            <Link to="/login" onClick={() => setShowMobileMenu(false)}>
              <button className="btn-login">Login</button>
            </Link>
            <Link to="/signup" onClick={() => setShowMobileMenu(false)}>
              <button className="btn-primary">Sign Up</button>
            </Link>
          </>
        )}
      </div>

      {showMobileMenu && (
        <div className="mobile-menu">
          <Link to="/home" onClick={() => setShowMobileMenu(false)}>Home</Link>
          <Link to="/pricing" onClick={() => setShowMobileMenu(false)}>Pricing</Link>
          <Link to="/community" onClick={() => setShowMobileMenu(false)}>Community</Link>
          <Link to="/docs" onClick={() => setShowMobileMenu(false)}>Docs</Link>
          <div className="mobile-menu-buttons">
            {token && user ? (
              <div
                className="profile-avatar"
                onClick={() => {
                  setShowMobileMenu(false);
                  navigate("/profile");
                }}
              >
                {getFirstLetter(user.name)}
              </div>
            ) : (
              <>
                <Link to="/login" onClick={() => setShowMobileMenu(false)}>
                  <button className="btn-login">Login</button>
                </Link>
                <Link to="/signup" onClick={() => setShowMobileMenu(false)}>
                  <button className="btn-primary">Sign Up</button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
