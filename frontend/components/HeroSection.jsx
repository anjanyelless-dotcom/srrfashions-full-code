import React, { useState, useEffect, useRef } from 'react';

const heroImage = 'wp-content/uploads/sites/383/2026/07/16-1.png';
const heroImageMobile = 'wp-content/uploads/sites/383/2026/07/Warm%20Earthy%20Saree%20Fashion%20Editorial%20%282%29.png';
const heroImage1 = 'wp-content/uploads/sites/383/2026/07/1.png';
const heroImage2 = 'wp-content/uploads/sites/383/2026/07/2.png';

const heroImages = [
  { desktop: heroImage, mobile: heroImageMobile },
  { desktop: heroImage1 },
  { desktop: heroImage2 },
];

const AUTOPLAY_MS = 4500;
const TRANSITION_MS = 1100;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export default function HeroSection() {
  const [{ current, previous }, setSlides] = useState({ current: 0, previous: -1 });
  const autoplayRef = useRef(null);

  useEffect(() => {
    autoplayRef.current = setInterval(() => {
      setSlides((s) => ({ current: (s.current + 1) % heroImages.length, previous: s.current }));
    }, AUTOPLAY_MS);

    return () => clearInterval(autoplayRef.current);
  }, []);

  // Once the outgoing slide finishes its transition, unmark it so it can
  // park back in the "enter" position invisibly before it is needed again.
  useEffect(() => {
    if (previous < 0) return;
    const t = setTimeout(() => {
      setSlides((s) => (s.previous === previous ? { ...s, previous: -1 } : s));
    }, TRANSITION_MS + 100);
    return () => clearTimeout(t);
  }, [previous, current]);

  return (
    <div className="srr-hero-section">
      <div className="srr-hero-container">
        {heroImages.map((item, index) => {
          const isActive = index === current;
          const isLeaving = index === previous;
          return (
            <div
              key={item.desktop}
              className={`srr-hero-slide${isActive ? ' is-active' : ''}${isLeaving ? ' is-leaving' : ''}`}
              aria-hidden={!isActive}
            >
              <picture className="srr-hero-picture">
                {item.mobile && (
                  <source srcSet={item.mobile} media="(max-width: 767px)" />
                )}
                <img
                  src={item.desktop}
                  alt="SRR Selections Fashion"
                  className="srr-hero-image"
                />
              </picture>
            </div>
          );
        })}
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

        .srr-hero-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          transform: translateX(30px);
          pointer-events: none;
          will-change: transform, opacity;
        }

        .srr-hero-slide.is-active {
          z-index: 2;
          opacity: 1;
          transform: translateX(0);
          transition:
            transform ${TRANSITION_MS}ms ${EASE},
            opacity ${TRANSITION_MS}ms ${EASE};
        }

        .srr-hero-slide.is-leaving {
          z-index: 1;
          opacity: 0;
          transform: translateX(-30px) scale(0.985);
          transition:
            transform ${TRANSITION_MS}ms ${EASE},
            opacity ${TRANSITION_MS}ms ${EASE};
        }

        .srr-hero-picture {
          display: block;
          width: 100%;
          height: 100%;
        }

        .srr-hero-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
        }

        /* Subtle editorial zoom on the active slide */
        .srr-hero-slide.is-active .srr-hero-image {
          animation: srrHeroZoom ${AUTOPLAY_MS}ms ${EASE} forwards;
        }

        @keyframes srrHeroZoom {
          from { transform: scale(1.02); }
          to { transform: scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .srr-hero-slide,
          .srr-hero-slide.is-active,
          .srr-hero-slide.is-leaving {
            transform: none;
            transition: opacity 200ms linear;
          }
          .srr-hero-slide.is-active .srr-hero-image {
            animation: none;
          }
        }

        @media (max-width: 1024px) {
          .srr-hero-section {
            height: calc(92svh - 70px);
            min-height: 460px;
          }
        }

        /* Mobile: hero height auto-derives from the mobile image's own
           2:3 aspect ratio (1024x1536), so the full portrait banner is
           visible with no crop and no white space below it. */
        @media (max-width: 767px) {
          .srr-hero-section {
            height: auto;
            min-height: 0;
            aspect-ratio: 2 / 3;
          }
          .srr-hero-image {
            object-position: 50% 30%;
          }
        }
      `}</style>
    </div>
  );
}
