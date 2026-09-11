import React, { useState } from 'react';
import './Footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="veloura-footer" id="colophon">
      <div className="veloura-footer-inner">
        <div className="veloura-footer-top">
          <div className="veloura-footer-brand">
            <h2 className="veloura-footer-logo" onClick={scrollToTop} role="button" tabIndex={0}>
              SR selections
            </h2>
            <p className="veloura-footer-tagline">
              Designed for the moments you remember. Crafted with intention, worn with confidence.
            </p>
          </div>

          <div className="veloura-footer-newsletter">
            <h3 className="veloura-footer-heading">Stay in the know</h3>
            <p className="veloura-footer-text">
              Sign up for new collections, stories, and exclusive updates.
            </p>
            <form className="veloura-newsletter-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="veloura-newsletter-input"
                required
              />
              <button type="submit" className="veloura-newsletter-button">
                Subscribe
              </button>
            </form>
            {subscribed && (
              <span className="veloura-newsletter-confirm">Thank you for subscribing.</span>
            )}
          </div>
        </div>

        <div className="veloura-footer-divider" />

        <div className="veloura-footer-links">
          <div className="veloura-footer-column">
            <h4 className="veloura-footer-column-title">Shop</h4>
            <ul className="veloura-footer-list">
              <li><a href="#new-arrivals">New Arrivals</a></li>
              <li><a href="#best-sellers">Best Sellers</a></li>
              <li><a href="#clothing">Clothing</a></li>
              <li><a href="#accessories">Accessories</a></li>
            </ul>
          </div>

          <div className="veloura-footer-column">
            <h4 className="veloura-footer-column-title">About</h4>
            <ul className="veloura-footer-list">
              <li><a href="#our-story">Our Story</a></li>
              <li><a href="#craftsmanship">Craftsmanship</a></li>
              <li><a href="#sustainability">Sustainability</a></li>
              <li><a href="#journal">Journal</a></li>
            </ul>
          </div>

          <div className="veloura-footer-column">
            <h4 className="veloura-footer-column-title">Customer Care</h4>
            <ul className="veloura-footer-list">
              <li><a href="#contact">Contact Us</a></li>
              <li><a href="#shipping">Shipping &amp; Returns</a></li>
              <li><a href="#size-guide">Size Guide</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>

          <div className="veloura-footer-column veloura-footer-contact">
            <h4 className="veloura-footer-column-title">Connect</h4>
            <a className="veloura-footer-email" href="mailto:anjanyelless@gmail.com">
              anjanyelless@gmail.com
            </a>
            <div className="veloura-footer-social">
              <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://pinterest.com" aria-label="Pinterest" target="_blank" rel="noopener noreferrer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="8" x2="12" y2="21"/><path d="M5.5 12.5A6.5 6.5 0 0 1 12 6a6.5 6.5 0 0 1 6.5 6.5c0 2.5-1.5 4.5-4 4.5s-4-1.5-4-4"/><circle cx="12" cy="12" r="10" opacity="0"/></svg>
              </a>
              <a href="https://x.com" aria-label="X / Twitter" target="_blank" rel="noopener noreferrer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="veloura-footer-divider" />

        <div className="veloura-footer-bottom">
          <p className="veloura-copyright">&copy; 2026 Veloura. All rights reserved.</p>
          <div className="veloura-legal-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms &amp; Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
