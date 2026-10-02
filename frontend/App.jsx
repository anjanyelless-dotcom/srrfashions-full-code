import React, { useCallback, useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import PageContent from './components/PageContent.jsx';
import Overlays from './components/Overlays.jsx';
import Footer from './components/Footer.jsx';
import ContactUs from './components/ContactUs.jsx';
import MyAccount from './components/MyAccount.jsx';

import ProductDetails from './components/ProductDetails.jsx';
import Checkout from './components/Checkout.jsx';
import Payment from './components/Payment.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import OffersDrawer from './components/OffersDrawer.jsx';
import { useOffers } from './components/OffersContext.jsx';
import Admin from './components/admin/index.jsx';
import Wishlist from './components/Wishlist.jsx';
import AboutUs from './components/AboutUs.jsx';
import CashfreeTest from './components/CashfreeTest.jsx';
import CategoryPage from './components/CategoryPage.jsx';
import WhatsAppButton from './components/WhatsAppButton.jsx';
import { useCart } from './components/CartContext.jsx';
import { useWishlist } from './components/WishlistContext.jsx';
import { formatPrice } from './services/price.js';
import { setHomepageSEO, setAboutSEO, setContactSEO, setNotFoundSEO } from './utils/seo.js';
import { setLocalBusinessSchema, setBreadcrumbSchema, removeBreadcrumbSchema } from './utils/structuredData.js';
import './components/Wishlist.css';

const SITE_URL = 'https://www.srrfashions.in';

// Routing helper functions
function getPathname() {
  return window.location.pathname;
}

function getHash() {
  return window.location.hash;
}

function navigateTo(path, options = {}) {
  if (options.replace) {
    window.history.replaceState({}, '', path);
  } else {
    window.history.pushState({}, '', path);
  }
  // Dispatch popstate event to trigger route update
  window.dispatchEvent(new PopStateEvent('popstate'));
}

// Parse route from pathname
function parseRoute(pathname) {
  const path = pathname || '/';
  
  // Admin routes (keep hash-based for now)
  const hash = getHash();
  if (hash && (hash === '#admin' || hash === '#/admin' || hash === '#/admin/' || hash.startsWith('#/admin/'))) {
    return { type: 'admin', hash };
  }
  
  // Transactional routes (keep hash-based for now)
  if (hash === '#checkout' || hash === '#/checkout') {
    return { type: 'checkout' };
  }
  if (hash.startsWith('#/payment')) {
    return { type: 'payment', hash };
  }
  if (hash === '#wishlist' || hash === '#/wishlist') {
    return { type: 'wishlist' };
  }
  if (hash === '#my-account') {
    return { type: 'my-account' };
  }
  if (hash === '#cashfree-test' || hash === '#/cashfree-test') {
    return { type: 'cashfree-test' };
  }
  
  // Legacy hash routes - redirect to clean URLs
  if (hash === '#contact-us') {
    return { type: 'redirect', to: '/contact-us' };
  }
  if (hash === '#/about-us') {
    return { type: 'redirect', to: '/about-us' };
  }
  if (hash.startsWith('#/product/')) {
    // Extract slug from hash: #/product/slug/?id=123
    const match = hash.match(/^#\/product\/([^\/\?]+)/);
    if (match) {
      return { type: 'redirect', to: `/product/${match[1]}` };
    }
  }
  
  // Legacy WordPress-style product URLs - redirect to clean URLs
  const productIndexMatch = path.match(/^\/product\/([^\/]+)\/index\.html$/);
  if (productIndexMatch) {
    return { type: 'redirect', to: `/product/${productIndexMatch[1]}` };
  }
  
  // Legacy WordPress-style category URLs - redirect to clean URLs
  const categoryIndexMatch = path.match(/^\/product-category\/([^\/]+)\/index\.html$/);
  if (categoryIndexMatch) {
    return { type: 'redirect', to: `/category/${categoryIndexMatch[1]}` };
  }
  const categoryMatch = path.match(/^\/product-category\/([^\/]+)\/?$/);
  if (categoryMatch) {
    return { type: 'redirect', to: `/category/${categoryMatch[1]}` };
  }
  
  // Clean public routes
  if (path === '/' || path === '/index.html') {
    return { type: 'home' };
  }
  if (path === '/about-us') {
    return { type: 'about-us' };
  }
  if (path === '/contact-us') {
    return { type: 'contact-us' };
  }
  
  // Product route: /product/{slug}
  const productMatch = path.match(/^\/product\/([^\/]+)$/);
  if (productMatch) {
    return { type: 'product', slug: productMatch[1] };
  }
  
  // Category route: /category/{slug}
  const categoryCleanMatch = path.match(/^\/category\/([^\/]+)$/);
  if (categoryCleanMatch) {
    return { type: 'category', slug: categoryCleanMatch[1] };
  }
  
  // Default to home
  return { type: 'home' };
}

function getProductFromButton(button) {
  const productEl = button.closest(
    '.th-shopable-product-content, .th-shopable-cnt, li.product, .type-product, [class*="post-"], .th-product-swiper .swiper-slide'
  );
  const dataId = button.getAttribute('data-product_id') || button.getAttribute('data-product-id');
  const id = dataId ? String(dataId) : (productEl?.className.match(/post-(\d+)/)?.[1] || '0');

  const aria = button.getAttribute('aria-label') || '';
  const nameMatch = aria.match(/(?:Add to cart|Buy now|Select options for|Out of stock):\s*["“”]([^"”]+)["”"]/);
  const titleEl = productEl?.querySelector(
    '.th-shopable-product-link .title, .th-shopable-cnt .title, .woocommerce-loop-product__title, .elemento-product-title a, .th-shopable-product-title, .product-title a, h2.woocommerce-loop-product__title'
  );
  const name = nameMatch ? nameMatch[1] : (titleEl?.textContent?.trim() || 'Product');

  const priceEl = productEl?.querySelector(
    '.th-shopable-cnt .price .woocommerce-Price-amount, .price .woocommerce-Price-amount, .elemento-product-price .woocommerce-Price-amount, .woocommerce-Price-amount'
  );
  const priceText = priceEl ? priceEl.textContent.split('–')[0] : '';
  const priceMatch = priceText.match(/[\d,]+\.?\d*/);
  const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;

  const imgEl = productEl?.querySelector(
    'img.attachment-woocommerce_thumbnail, img.wp-post-image, .thunk-product-image img, .th-shopable-product-image img, img'
  );
  const image = imgEl ? imgEl.getAttribute('src') : '';

  const linkEl =
    productEl?.querySelector(
      'a[href*="product/"], .woocommerce-LoopProduct-link, .th-shopable-product-link, .elemento-product-title a'
    ) || button;
  const link = linkEl.getAttribute('href') || '';

  return { id, name, price, image, link };
}

function App() {
  const [route, setRoute] = useState(() => parseRoute(getPathname()));
  const { addToCart, openCart, totalQuantity, subtotal } = useCart();
  const { wishlist, wishlistCount, toggleWishlist } = useWishlist();
  const { openOffers } = useOffers();

  useEffect(() => {
    // Handle popstate (browser back/forward)
    const handlePopState = () => {
      setRoute(parseRoute(getPathname()));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle legacy hash routes and redirects
  useEffect(() => {
    if (route.type === 'redirect' && route.to) {
      navigateTo(route.to, { replace: true });
    }
  }, [route]);

  // Initialize LocalBusiness structured data on mount
  useEffect(() => {
    setLocalBusinessSchema();
  }, []);

  // Update SEO metadata and breadcrumbs based on route
  useEffect(() => {
    switch (route.type) {
      case 'home':
        setHomepageSEO();
        setBreadcrumbSchema([
          { name: 'Home', url: SITE_URL }
        ]);
        break;
      case 'about-us':
        setAboutSEO();
        setBreadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'About Us', url: `${SITE_URL}/about-us` }
        ]);
        break;
      case 'contact-us':
        setContactSEO();
        setBreadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'Contact Us', url: `${SITE_URL}/contact-us` }
        ]);
        break;
      case 'product':
      case 'category':
        // SEO metadata and breadcrumbs are handled by the respective components
        // They have access to the actual product/category data
        break;
      default:
        // For transactional/admin routes, keep homepage metadata and remove breadcrumbs
        setHomepageSEO();
        removeBreadcrumbSchema();
    }
  }, [route.type]);



  useEffect(() => {
    function handleDocumentClick(e) {
      if (e.target.closest('.taiowc-cart-model')) return;

      const cartTrigger = e.target.closest('a.taiowc-content, .cart-contents a, .taiowc_cart_empty');
      const addButton = e.target.closest('a.add_to_cart_button, a.th-shopable-btn');
      const wishlistButton = e.target.closest('.thw-add-to-wishlist-button');
      const productLink = e.target.closest(
        'a[href*="product/"], a.woocommerce-LoopProduct-link, a.th-shopable-product-link, .elemento-product-title a'
      );

      const offersTrigger = e.target.closest('.srfashion-offers-trigger');

      function goToProductPage(product) {
        if (product.id && product.id !== '0') {
          const slugMatch = (product.link || '').match(/product\/([^\/]+)\/index\.html/);
          const slug = slugMatch ? slugMatch[1] : `product-${product.id}`;
          navigateTo(`/product/${encodeURIComponent(slug)}`);
        }
      }

      if (offersTrigger) {
        e.preventDefault();
        e.stopImmediatePropagation();
        openOffers();
        return;
      }

      if (cartTrigger) {
        e.preventDefault();
        e.stopImmediatePropagation();
        openCart();
        return;
      }

      if (wishlistButton) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const product = getProductFromButton(wishlistButton);
        if (product.id && product.id !== '0') {
          toggleWishlist(product);
        }
        return;
      }

      if (addButton) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const product = getProductFromButton(addButton);
        const buttonText = addButton.textContent?.trim() || '';
        if (buttonText === 'Select options' || buttonText === 'Read more' || buttonText === 'Out of stock') {
          goToProductPage(product);
          return;
        }
        if (
          product.id &&
          product.id !== '0' &&
          product.name !== 'Product' &&
          product.price > 0
        ) {
          addToCart(product);
          if (buttonText === 'Buy now') {
            window.location.hash = '#checkout';
          } else {
            openCart();
          }
        }
        return;
      }

      // Only intercept product links if they are legacy WordPress-style
      // Clean URLs (/product/{slug}) should navigate normally
      if (productLink) {
        const href = productLink.getAttribute('href') || '';
        // Check if it's a legacy WordPress-style link
        if (href.includes('product/') && (href.includes('/index.html') || href.startsWith('product/') && !href.startsWith('/product/'))) {
          e.preventDefault();
          e.stopImmediatePropagation();
          const product = getProductFromButton(productLink);
          goToProductPage(product);
        }
        // Clean URLs (/product/{slug}) are allowed to navigate normally
      }
    }

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, [addToCart, openCart]);

  const updateWishlistIcons = React.useCallback(() => {
    document.querySelectorAll('.thw-wishlist-count').forEach((el) => {
      el.innerHTML = wishlistCount > 0
        ? `<span class="cart-count-item">${wishlistCount}</span>`
        : '';
    });

    const ids = new Set(wishlist.map((item) => String(item.id)));
    document.querySelectorAll('.thw-add-to-wishlist-button').forEach((el) => {
      const productId =
        el.getAttribute('data-product-id') || el.getAttribute('data-product_id') || '';
      if (ids.has(String(productId))) {
        el.classList.add('srfashion-wishlist-active');
      } else {
        el.classList.remove('srfashion-wishlist-active');
      }
    });
  }, [wishlist, wishlistCount]);

  useEffect(() => {
    updateWishlistIcons();
    window.__srfashionUpdateWishlistIcons = updateWishlistIcons;
    return () => {
      delete window.__srfashionUpdateWishlistIcons;
    };
  }, [updateWishlistIcons]);

  useEffect(() => {
    document.querySelectorAll('.taiowc-cart-count').forEach((el) => {
      el.innerHTML = totalQuantity > 0
        ? `<span class="cart-count-item">${totalQuantity}</span>`
        : '';
    });
    document.querySelectorAll('.taiowc-cart-total-wrap').forEach((el) => {
      el.innerHTML = totalQuantity > 0
        ? `<span class="taiowc-total">${formatPrice(subtotal)}</span>`
        : '';
    });
  }, [totalQuantity, subtotal]);

  const isAdmin = route.type === 'admin';

  if (isAdmin) {
    return <Admin hash={route.hash} />;
  }

  const renderPage = () => {
    switch (route.type) {
      case 'home':
        return <PageContent />;
      case 'about-us':
        return <AboutUs />;
      case 'contact-us':
        return <ContactUs />;
      case 'product':
        return <ProductDetails />;
      case 'category':
        return <CategoryPage slug={route.slug} />;
      case 'checkout':
        return <Checkout />;
      case 'payment':
        return <Payment hash={route.hash} />;
      case 'wishlist':
        return <Wishlist />;
      case 'my-account':
        return <MyAccount />;
      case 'cashfree-test':
        return <CashfreeTest />;
      default:
        return <PageContent />;
    }
  };

  return (
    <>
      <div id="page" className="th-shop-mania-site">
        <Header />
        {renderPage()}
        <Footer />
      </div>
      <Overlays />
      <CartDrawer />
      <OffersDrawer />
      <WhatsAppButton />
    </>
  );
}

export default App;
