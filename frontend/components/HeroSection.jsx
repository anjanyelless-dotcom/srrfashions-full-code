import React, { useState, useEffect } from 'react';

const heroImage = 'wp-content/uploads/sites/383/2026/07/16-1.png';
const heroImage1 = 'wp-content/uploads/sites/383/2026/07/1.png';
const heroImage2 = 'wp-content/uploads/sites/383/2026/07/2.png';

const heroImages = [
  heroImage,
  heroImage1,
  heroImage2,
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="srr-hero-section">
      <div className="srr-hero-container">
        <img
          src={heroImages[currentSlide]}
          alt="SRR Selections Fashion"
          className="srr-hero-image"
        />
      </div>
      <style>{`
        .srr-hero-section {
          position: relative;
          width: 100%;
          height: calc(100svh - 80px);
          min-height: 500px;
          overflow: hidden;
        }

        .srr-hero-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .srr-hero-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
        }

        @media (max-width: 1024px) {
          .srr-hero-section {
            height: calc(100svh - 70px);
            min-height: 450px;
          }
        }

        @media (max-width: 768px) {
          .srr-hero-section {
            height: calc(100svh - 60px);
            min-height: 400px;
          }
        }

        @media (max-width: 480px) {
          .srr-hero-section {
            height: calc(100svh - 55px);
            min-height: 350px;
          }
        }
      `}</style>
    </div>
  );
}
