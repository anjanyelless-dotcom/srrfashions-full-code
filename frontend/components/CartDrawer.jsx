import React from 'react';
import { useCart } from './CartContext.jsx';
import { formatPrice } from '../services/price.js';
import './CartDrawer.css';

const bagIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: '24px', height: '24px' }}>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
    <path d="M3.103 6.034h17.794"></path>
    <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"></path>
  </svg>
);

const CartDrawer = () => {
  const { cart, isOpen, closeCart, removeFromCart, updateQuantity, subtotal, clearCart } = useCart();

  const handleContinueShopping = (e) => {
    e.preventDefault();
    closeCart();
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    closeCart();
    window.location.hash = '#checkout';
  };

  return (
    <div className={`taiowc taiowc-model-wrap ${isOpen ? 'model-cart-active' : ''}`} aria-hidden={!isOpen}>
      <div className="taiowc-model-overlay" onClick={closeCart} />
      <div className="taiowc-cart-model" role="dialog" aria-modal="true" aria-label="Your Cart">
        <div className="taiowc-cart-model-wrap">
          <div className="taiowc-cart-model-header">
            <div className="cart-heading">
              {bagIcon}
              <h4>Your Cart</h4>
            </div>
            <a className="taiowc-cart-close" href="#" onClick={(e) => { e.preventDefault(); closeCart(); }} aria-label="Close cart" role="button"> </a>
          </div>

          <div className="taiowc-cart-model-body">
            {cart.length === 0 ? (
              <>
                <div className="back-toshop-wrap">
                  <div className="svg-wrapper">{bagIcon}</div>
                  <p className="woocommerce-mini-cart__empty-message">Your Cart is Empty</p>
                  <a href="#" className="woocommerce-back-to-shop" onClick={handleContinueShopping}>
                    Start Shopping
                  </a>
                </div>
                <a className="taiowc-continue-shop" href="#" onClick={handleContinueShopping}>
                  Continue Shopping
                </a>
              </>
            ) : (
              <>
                <div className="taiowc-cart-items">
                  {cart.map((item) => (
                    <div key={item.id} className="taiowc-woocommerce-mini-cart-item">
                      <div className="item-product-wrap">
                        <div className="item-image">
                          {item.image ? (
                            <img src={item.image} alt={item.name} loading="lazy" />
                          ) : (
                            <div className="item-no-image">{bagIcon}</div>
                          )}
                        </div>
                        <div className="item-details">
                          <h4 className="item-name">{item.name}</h4>
                          <div className="item-price">{formatPrice(item.price)}</div>
                          <div className="item-actions">
                            <div className="item-quantity">
                              <button
                                type="button"
                                className="qty-btn qty-minus"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                aria-label="Decrease quantity"
                              >
                                &minus;
                              </button>
                              <span className="qty-value">{item.quantity}</span>
                              <button
                                type="button"
                                className="qty-btn qty-plus"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              className="item-remove"
                              onClick={() => removeFromCart(item.id)}
                            >
                              Remove
                            </button>
                          </div>
                          <div className="item-line-total">{formatPrice(item.price * item.quantity)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <a className="taiowc-continue-shop" href="#" onClick={handleContinueShopping}>
                  Continue Shopping
                </a>
              </>
            )}
          </div>

          {cart.length > 0 && (
            <div className="taiowc-cart-model-footer">
              <div className="taiowc-total-wrap">
                <span className="taiowc-total-label">Subtotal</span>
                <span className="taiowc-total-amount">{formatPrice(subtotal)}</span>
              </div>
              <div className="taiowc-cart-actions">
                <button type="button" className="taiowc-clear-cart" onClick={clearCart}>
                  Clear Cart
                </button>
                <a href="#" className="taiowc-checkout-btn" onClick={handleCheckout}>
                  Checkout
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
