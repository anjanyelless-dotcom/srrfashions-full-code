import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import RawHtmlTag from './RawHtmlTag.jsx';

const NAV_ITEMS = [
  { label: 'Home', href: '#/' },
  { label: 'About Us', href: '#/about-us' },
  { label: 'Contact Us', href: '#contact-us' },
];

const headerAttribs = {
  className: 'thsm-header zta-transparent-header'
};

const mobileMenuStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.55)',
    zIndex: 11000,
    display: 'flex',
    justifyContent: 'flex-end',
    animation: 'overlayFadeIn 0.25s ease'
  },
  menu: {
    width: '80%',
    maxWidth: '320px',
    height: '100%',
    minHeight: '100vh',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
    animation: 'slideIn 0.25s ease',
    overflowY: 'auto',
    zIndex: 11001
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.25rem',
    borderBottom: '1px solid #f0f0f0',
    flexShrink: 0
  },
  title: {
    fontFamily: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#111'
  },
  close: {
    width: '44px',
    height: '44px',
    border: 'none',
    background: '#f5f5f5',
    color: '#111',
    fontSize: '1.5rem',
    lineHeight: 1,
    cursor: 'pointer',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0.75rem 0',
    flex: '1 1 auto'
  },
  link: {
    fontFamily: '"Montserrat", sans-serif',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#111',
    textDecoration: 'none',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '1.1rem 1.25rem',
    borderBottom: '1px solid #f5f5f5',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    outline: 'none'
  }
};

function generateDesktopNavItems() {
  return NAV_ITEMS.map((item) => `
    <li class="menu-item">
      <a href="${item.href}">
        <span class="th-shop-mania-menu-link">${item.label}</span>
      </a>
    </li>
  `).join('');
}

function MobileMenu({ isOpen, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Lock body scroll when menu is open
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      // Restore body scroll when menu closes
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div style={mobileMenuStyles.overlay} role="dialog" aria-modal="true" aria-label="Mobile navigation" onClick={onClose}>
      <div style={mobileMenuStyles.menu} ref={menuRef} onClick={(e) => e.stopPropagation()}>
        <div style={mobileMenuStyles.header}>
          <span style={mobileMenuStyles.title}>Menu</span>
          <button
            type="button"
            style={mobileMenuStyles.close}
            onClick={onClose}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        <nav style={mobileMenuStyles.nav}>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={mobileMenuStyles.link}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fafafa';
                e.currentTarget.style.color = '#8B9E7A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#111';
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </div>,
    document.body
  );
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef(null);

  const desktopHeaderHtml = `
            <a class="skip-link screen-reader-text" href="#content">Skip to content</a>
            <div class="main-header center-menu none cnv-none left-menu linkeffect-2 mhdrseven">
                <div class="container">
                    <div class="desktop-main-header">
                        <div class="main-header-bar thnk-col-3">
                            <div class="main-header-col1">
                                <span class="logo-content">
                                    <div class="thunk-logo">
                                        <a href="#/" class="custom-logo-link" rel="home"
                                            aria-current="page"><img fetchpriority="high" width="2000" height="601"
                                                src="wp-content/uploads/sites/383/2026/07/2-5.png" class="custom-logo"
                                                alt="Veloura" decoding="async" /></a>
                                    </div>
                                </span>
                            </div>
                            <div class="main-header-col2">
                                <nav>
                                    <div class="sider main th-shop-mania-menu-hide left">
                                        <div class="sider-inner">
                                            <ul id="th-shop-mania-menu" role="menu" class="th-shop-mania-menu"
                                                data-menu-style="horizontal">
                                                ${generateDesktopNavItems()}
                                            </ul>
                                        </div>
                                    </div>
                                </nav>
                            </div>
                            <div class="main-header-col3">
                                <div class="thunk-icon-market">
                                    <div class="th-icon-searchview">
                                        <div id='thaps-search-box' class="thaps-search-box icon_style">
                                            <form class="thaps-search-form"
                                                action='https://wpthemes.themehunk.com/veloura/' id='thaps-search-form'
                                                method='get'>
                                                <div class="thaps-from-wrap">
                                                    <input id='thaps-search-autocomplete-1' name='s'
                                                        placeholder='Search for products...'
                                                        class="thaps-search-autocomplete thaps-form-control" value=''
                                                        type='text' title='Search' />
                                                    <div class="thaps-preloader"></div>
                                                    <input type="hidden" name="post_type" value="product" />
                                                    <span class="label label-default" id="selected_option"></span>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                    <a class="whishlist" aria-label="Wishlist" href="#/wishlist">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                            stroke-linecap="round" stroke-linejoin="round"
                                            class="lucide lucide-heart w-6 h-6 stroke-[1.5px]" aria-hidden="true">
                                            <path
                                                d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5">
                                            </path>
                                        </svg>
                                        <span class="thw-wishlist-count"></span>
                                    </a>
                                    <a class="account" href="#my-account" aria-label="account">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                            stroke-linecap="round" stroke-linejoin="round"
                                            class="lucide lucide-user w-6 h-6 stroke-[1.5px]" aria-hidden="true">
                                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                    </a>
                                    <a class="srfashion-offers-trigger" href="#" aria-label="Offers &amp; Rewards" title="Offers &amp; Rewards">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                            stroke-linecap="round" stroke-linejoin="round"
                                            class="lucide lucide-gift w-6 h-6 stroke-[1.5px]" aria-hidden="true">
                                            <polyline points="20 12 20 22 4 22 4 12"></polyline>
                                            <rect x="2" y="7" width="20" height="5" rx="1"></rect>
                                            <path d="M12 22v-7"></path>
                                            <path d="M12 7V2"></path>
                                            <path d="M8 7a4 4 0 0 1 4-4 4 4 0 0 1 4 4"></path>
                                        </svg>
                                    </a>
                                    <div class="cart-contents">
                                        <div id="1" class="taiowc-wrap  taiowc-slide-right  fxd-right ">
                                            <a class="taiowc-content taiowc_cart_empty" href="#" aria-label="Cart">
                                                <h4>Your Cart</h4>
                                                <div class="taiowc-cart-count"></div>
                                                <div class="taiowc-cart-item">
                                                    <div class="taiowc-icon">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                                            fill="none" stroke="currentColor" stroke-width="2"
                                                            stroke-linecap="round" stroke-linejoin="round"
                                                            class="lucide lucide-shopping-bag w-6 h-6 stroke-[1.5px]"
                                                            aria-hidden="true">
                                                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                                                            <path d="M3.103 6.034h17.794"></path>
                                                            <path
                                                                d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z">
                                                            </path>
                                                        </svg>
                                                    </div>
                                                    <div class="taiowc-cart-total-wrap"></div>
                                                </div>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="below-header left-menu linkeffect-2 mhdrseven ">
                <div class="container">
                    <div class="below-header-bar thnk-col-3"></div>
                </div>
            </div>
        `;

  const mobileHeaderHtml = `
            <div class="responsive-main-header">
                <div class="main-header-bar thnk-col-3">
                    <div class="main-header-col1">
                        <div class="menu-toggle">
                            <button type="button" class="menu-btn" aria-label="Menu" id="menu-btn">
                                <div class="btn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                        stroke-linecap="round" stroke-linejoin="round"
                                        class="lucide lucide-text-align-justify w-5 h-5 text-gray-500 group-hover:text-gray-700"
                                        aria-hidden="true">
                                        <path d="M3 5h18"></path>
                                        <path d="M3 12h18"></path>
                                        <path d="M3 19h18"></path>
                                    </svg>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div class="main-header-col2">
                        <span class="logo-content">
                            <div class="thunk-logo">
                                <a href="#/" rel="home"><img
                                        src="wp-content/uploads/sites/383/2026/07/2-5.png"
                                        alt="No ALT text found"></a>
                            </div>
                        </span>
                    </div>
                    <div class="main-header-col3">
                        <div class="thunk-icon-market">
                            <a class="srfashion-offers-trigger" href="#" aria-label="Offers &amp; Rewards" title="Offers &amp; Rewards">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round"
                                    class="lucide lucide-gift w-6 h-6 stroke-[1.5px]" aria-hidden="true">
                                    <polyline points="20 12 20 22 4 22 4 12"></polyline>
                                    <rect x="2" y="7" width="20" height="5" rx="1"></rect>
                                    <path d="M12 22v-7"></path>
                                    <path d="M12 7V2"></path>
                                    <path d="M8 7a4 4 0 0 1 4-4 4 4 0 0 1 4 4"></path>
                                </svg>
                            </a>
                            <div class="cart-contents">
                                <div id="2" class="taiowc-wrap  taiowc-slide-right  fxd-right ">
                                    <a class="taiowc-content taiowc_cart_empty" href="#" aria-label="Cart">
                                        <h4>Your Cart</h4>
                                        <div class="taiowc-cart-count"></div>
                                        <div class="taiowc-cart-item">
                                            <div class="taiowc-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                                    fill="none" stroke="currentColor" stroke-width="2"
                                                    stroke-linecap="round" stroke-linejoin="round"
                                                    class="lucide lucide-shopping-bag w-6 h-6 stroke-[1.5px]"
                                                    aria-hidden="true">
                                                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                                                    <path d="M3.103 6.034h17.794"></path>
                                                    <path
                                                        d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z">
                                                    </path>
                                                </svg>
                                            </div>
                                            <div class="taiowc-cart-total-wrap"></div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

  const combinedHtml = desktopHeaderHtml + mobileHeaderHtml;

  useEffect(() => {
    if (headerRef.current) {
      const btn = headerRef.current.querySelector('#menu-btn');
      if (btn) {
        btn.setAttribute('aria-expanded', isMenuOpen ? 'true' : 'false');
        btn.setAttribute('aria-label', isMenuOpen ? 'Close menu' : 'Open menu');
      }
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const handleMenuToggle = (e) => {
      const btn = e.target.closest('.menu-btn');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        setIsMenuOpen((prev) => {
          const newState = !prev;
          // Dispatch event to close cart if menu is being opened
          if (newState) {
            document.dispatchEvent(new CustomEvent('menu-opened'));
          }
          return newState;
        });
      }
    };

    const headerEl = headerRef.current;
    if (headerEl) {
      headerEl.addEventListener('click', handleMenuToggle);
    }
    return () => {
      if (headerEl) {
        headerEl.removeEventListener('click', handleMenuToggle);
      }
    };
  }, []);

  useEffect(() => {
    const handleHashChange = () => setIsMenuOpen(false);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Close mobile menu when cart or offers drawer is opened (prevent stacking)
  useEffect(() => {
    const handleDrawerOpen = () => setIsMenuOpen(false);
    document.addEventListener('cart-opened', handleDrawerOpen);
    document.addEventListener('offers-opened', handleDrawerOpen);
    return () => {
      document.removeEventListener('cart-opened', handleDrawerOpen);
      document.removeEventListener('offers-opened', handleDrawerOpen);
    };
  }, []);

  return (
    <div ref={headerRef}>
      <RawHtmlTag tag="header" attribs={headerAttribs} html={combinedHtml} />
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <style>{`
        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .menu-btn {
          min-width: 44px !important;
          min-height: 44px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: transparent !important;
          border: none !important;
          cursor: pointer !important;
        }
        .menu-btn .btn {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .menu-toggle {
          display: block !important;
        }
        @media (min-width: 1025px) {
          .menu-toggle {
            display: none !important;
          }
        }
        @media (max-width: 1024px) {
          .responsive-main-header .main-header-bar {
            position: relative !important;
            height: 60px !important;
            display: block !important;
          }
          .responsive-main-header .main-header-col1 {
            position: absolute !important;
            left: 15px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            width: auto !important;
            max-width: none !important;
            z-index: 10 !important;
          }
          .responsive-main-header .main-header-col2 {
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: auto !important;
            max-width: 60% !important;
            text-align: center !important;
            z-index: 5 !important;
          }
          .responsive-main-header .main-header-col2 img {
            max-width: 150px !important;
            height: auto !important;
          }
          .responsive-main-header .main-header-col3 {
            position: absolute !important;
            right: 15px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            width: auto !important;
            max-width: none !important;
            z-index: 10 !important;
          }
          .responsive-main-header .logo-content {
            display: flex !important;
            justify-content: center !important;
          }
        }
        @media (max-width: 375px) {
          .responsive-main-header .main-header-col2 img {
            max-width: 120px !important;
          }
        }
        @media (max-width: 320px) {
          .responsive-main-header .main-header-col2 img {
            max-width: 100px !important;
          }
          .responsive-main-header .main-header-bar {
            padding: 0 10px !important;
          }
          .responsive-main-header .main-header-col1 {
            left: 10px !important;
          }
          .responsive-main-header .main-header-col3 {
            right: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
