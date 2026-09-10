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
import Admin from './components/admin/index.jsx';
import Wishlist from './components/Wishlist.jsx';
import AboutUs from './components/AboutUs.jsx';
import CashfreeTest from './components/CashfreeTest.jsx';
import { useCart } from './components/CartContext.jsx';
import { useWishlist } from './components/WishlistContext.jsx';
import { formatPrice } from './services/price.js';
import './components/Wishlist.css';

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
  const [hash, setHash] = useState(window.location.hash);
  const { addToCart, openCart, totalQuantity, subtotal } = useCart();
  const { wishlist, wishlistCount, toggleWishlist } = useWishlist();

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);



  useEffect(() => {
    function handleDocumentClick(e) {
      if (e.target.closest('.taiowc-cart-model')) return;

      const cartTrigger = e.target.closest('a.taiowc-content, .cart-contents a, .taiowc_cart_empty');
      const addButton = e.target.closest('a.add_to_cart_button, a.th-shopable-btn');
      const wishlistButton = e.target.closest('.thw-add-to-wishlist-button');
      const productLink = e.target.closest(
        'a[href*="product/"], a.woocommerce-LoopProduct-link, a.th-shopable-product-link, .elemento-product-title a'
      );

      function goToProductPage(product) {
        if (product.id && product.id !== '0') {
          const slugMatch = (product.link || '').match(/product\/([^\/]+)\/index\.html/);
          const slug = slugMatch ? slugMatch[1] : `product-${product.id}`;
          window.location.hash = `#/product/${encodeURIComponent(slug)}/?id=${product.id}`;
        }
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

      if (productLink) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const product = getProductFromButton(productLink);
        goToProductPage(product);
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

  const isAdmin =
    hash === '#admin' ||
    hash === '#/admin' ||
    hash === '#/admin/' ||
    hash === '#/admin/login' ||
    hash.startsWith('#/admin/');

  if (isAdmin) {
    return <Admin hash={hash} />;
  }

  const renderPage = () => {
    if (hash === '#contact-us') return <ContactUs />;
    if (hash === '#my-account') return <MyAccount />;
    if (hash.startsWith('#/product/')) return <ProductDetails />;
    if (hash === '#checkout' || hash === '#/checkout') return <Checkout />;
    if (hash.startsWith('#/payment')) return <Payment />;
    if (hash === '#wishlist' || hash === '#/wishlist') return <Wishlist />;
    if (hash === '#about-us' || hash === '#/about-us') return <AboutUs />;
    if (hash === '#cashfree-test' || hash === '#/cashfree-test') return <CashfreeTest />;
    return <PageContent />;
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
    </>
  );
}

export default App;
