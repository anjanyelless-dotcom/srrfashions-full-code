import React from 'react';
import './AboutUs.css';

export default function AboutUs() {
  return (
    <div className="srfashion-about-us-page">
      <div className="srfashion-container">
        {/* Intro Section */}
        <section className="srfashion-intro-section">
          <span className="srfashion-eyebrow">About Us</span>
          <h1 className="srfashion-heading">Inside the journal</h1>
          <p className="srfashion-description">
            Join 40,000 SRRwomen who receive first access to new arrivals, exclusive offers, and styling inspiration.
          </p>
          <a href="#/" className="srfashion-button">SHOP NOW</a>
        </section>

        {/* Hero Image Section */}
        <section className="srfashion-hero-section">
          <div className="srfashion-hero-image-wrapper">
            <img
              src="wp-content/uploads/sites/383/2026/07/16-1.png"
              alt="SRR Fashions Collection"
              className="srfashion-hero-image"
            />
          </div>
        </section>

        {/* Secondary Content Section */}
        <section className="srfashion-secondary-section">
          <div className="srfashion-secondary-content">
            <div className="srfashion-secondary-image-wrapper">
              <img
                src="wp-content/uploads/sites/383/2026/07/15-1.png"
                alt="SRR Fashions"
                className="srfashion-secondary-image"
              />
            </div>
            <div className="srfashion-secondary-text">
              <h2 className="srfashion-secondary-heading">Easy to wear, easy to return</h2>
              <p className="srfashion-secondary-description">
                Join 40,000 SRRwomen who receive first access to new arrivals, exclusive offers, and styling inspiration.
              </p>
              <a href="#/" className="srfashion-button">VIEW ALL PRODUCTS</a>
            </div>
          </div>
        </section>

        {/* Browse by Style Section */}
        <section className="srfashion-browse-section">
          <h2 className="srfashion-section-heading">Browse by Style</h2>
          <p className="srfashion-section-description">
            What &hellip;
          </p>
        </section>
      </div>
    </div>
  );
}
