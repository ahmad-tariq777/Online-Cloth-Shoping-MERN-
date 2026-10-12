import React from "react";
import { Link } from "react-router-dom";
import { FaInstagram, FaFacebookF, FaTwitter } from "react-icons/fa";
import "../../css/Footer.css";

const Footer = () => {
  return (
    <footer className="luxury-footer">

      
      <div className="footer-brand">
        <h1>WARSAWSLOOK</h1>
      </div>

      
      <div className="footer-links">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/cart">Cart</Link>
      </div>

      
      <div className="footer-social">
        <a href="https://instagram.com" target="_blank" rel="noreferrer">
          <FaInstagram />
        </a>
        <a href="https://facebook.com" target="_blank" rel="noreferrer">
          <FaFacebookF />
        </a>
        <a href="https://twitter.com" target="_blank" rel="noreferrer">
          <FaTwitter />
        </a>
      </div>

      
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} WARSAWSLOOK — All Rights Reserved</p>
      </div>

    </footer>
  );
};

export default Footer;
