import React, { useEffect, useMemo, useState } from 'react';
import { useCart } from './CartContext.jsx';
import { useOffers } from './OffersContext.jsx';
import { createOrder, getPaymentSettings } from '../services/checkoutApi.js';
import { getAddresses } from '../services/addressApi.js';
import { formatPrice } from '../services/price.js';
import './Checkout.css';

function isValidAddressId(value) {
  return /^(\d+)$/.test(value || '');
}

export default function Checkout() {
  const { cart, subtotal, closeCart, fetchCart, clearCart } = useCart();
  const { appliedOffer } = useOffers();

  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(true);
  const [error, setError] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [placing, setPlacing] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState(null);

  console.log('Checkout component - cart state:', cart.length, 'items', cart);

  useEffect(() => {
    closeCart();
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const [addressRes, settingsRes] = await Promise.all([
          getAddresses().catch(() => ({ addresses: [] })),
          getPaymentSettings().catch(() => ({}))
        ]);
        const addrList = addressRes.addresses || [];
        if (!cancelled) {
          setAddresses(addrList);
          setPaymentSettings(settingsRes);
          const defaultAddr = addrList.find((a) => a.is_default) || addrList[0];
          if (defaultAddr) setSelectedAddress(String(defaultAddr.id));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load checkout details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [closeCart]);

  // Refresh cart when component mounts to ensure latest data
  useEffect(() => {
    const refreshCart = async () => {
      setCartLoading(true);
      try {
        await fetchCart();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for cart to update
        console.log('Cart refreshed, current cart length:', cart.length);
      } catch (error) {
        console.error('Failed to refresh cart:', error);
      } finally {
        setCartLoading(false);
      }
    };
    refreshCart();
  }, [fetchCart]);

  const finalCart = useMemo(() => {
    const filtered = cart.filter((item) => item && item.quantity > 0);
    console.log('Checkout finalCart:', filtered.length, 'items', filtered);
    return filtered;
  }, [cart]);

  const cartTotal = useMemo(() => {
    return finalCart.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0);
  }, [finalCart]);

  const discount = appliedOffer?.discount || 0;
  const discountedSubtotal = cartTotal - discount;
  const shippingFee = discountedSubtotal >= 999 ? 0 : 50;
  const total = discountedSubtotal + shippingFee;

  const disabledReason = useMemo(() => {
    if (placing) return 'Please wait while your order is being placed…';
    if (finalCart.length === 0) return 'Your cart is empty. Add products before placing an order.';
    if (addresses.length === 0) return 'Please add a delivery address before placing an order.';
    if (!isValidAddressId(selectedAddress)) return 'Please select a delivery address.';
    return '';
  }, [placing, finalCart.length, addresses.length, selectedAddress]);

  const handlePlaceOrder = async () => {
    setError('');

    if (finalCart.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    if (!isValidAddressId(selectedAddress)) {
      setError('Please select a delivery address.');
      return;
    }

    setPlacing(true);
    try {
      const res = await createOrder({
        address_id: Number(selectedAddress),
        payment_method: 'UPI',
        offer_type: appliedOffer?.offer?.type || appliedOffer?.offerType || undefined
      });

      console.log('Checkout response:', res);

      // Note: Cart is NOT cleared here - it will be cleared after successful payment
      // Pass payment session ID to payment page
      const paymentSessionId = res.payment?.payment_session_id;
      const paymentUrl = `#/payment?orderId=${res.order.id}`;

      console.log('Payment session ID exists:', !!paymentSessionId);
      console.log('Payment session ID length:', paymentSessionId?.length || 0);
      console.log('Payment session ID prefix:', paymentSessionId?.substring(0, 8) || 'none');
      console.log('Payment session ID suffix:', paymentSessionId?.substring(paymentSessionId.length - 8) || 'none');

      if (paymentSessionId && typeof paymentSessionId === 'string') {
        // Store session ID in sessionStorage to avoid URL length limits
        try {
          sessionStorage.setItem('cashfree_payment_session_id', paymentSessionId);
          sessionStorage.setItem('cashfree_order_id', String(res.order.id));

          // Verify it was stored correctly
          const stored = sessionStorage.getItem('cashfree_payment_session_id');
          console.log('Session ID stored in sessionStorage:', {
            storedLength: stored?.length || 0,
            matchesOriginal: stored === paymentSessionId,
            storedPrefix: stored?.substring(0, 8),
            storedSuffix: stored?.substring(stored.length - 8)
          });

          window.location.hash = paymentUrl;
        } catch (error) {
          console.error('Failed to store session ID in sessionStorage:', error);
          // Fallback to URL if sessionStorage fails
          window.location.hash = `${paymentUrl}&session=${encodeURIComponent(paymentSessionId)}`;
        }
      } else {
        console.error('No valid payment session ID in response');
        setError('Failed to create payment session. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading || cartLoading) {
    return (
      <div style={{ padding: '140px 20px', textAlign: 'center' }}>
        <p>Loading checkout…</p>
      </div>
    );
  }

  if (finalCart.length === 0) {
    return (
      <div style={{ padding: '140px 20px', textAlign: 'center' }}>
        <p>Your cart is empty. Add some products before checkout.</p>
        <button className="srfashion-checkout-btn" onClick={() => { window.location.hash = ''; }}>
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="srfashion-checkout" style={{ padding: '120px 20px 60px' }}>
      <div className="srfashion-checkout-inner" style={{ maxWidth: 800, margin: '0 auto', background: '#fff', padding: 24, borderRadius: 8 }}>
        <h1 className="srfashion-checkout-title">Checkout</h1>

        {error && <div className="srfashion-checkout-error">{error}</div>}

        {paymentSettings?.live_payment_test_mode && (
          <div
            className="srfashion-checkout-test-mode"
            style={{
              background: '#fff3cd',
              color: '#856404',
              padding: '12px 16px',
              borderRadius: 6,
              marginBottom: 16,
              border: '1px solid #ffeeba',
              fontWeight: 600
            }}
          >
            LIVE PAYMENT TEST MODE — You will be charged exactly ₹{Number(paymentSettings.live_payment_test_amount || 1).toFixed(2)} for this test
          </div>
        )}

        <section className="srfashion-checkout-section">
          <h2>Order Summary</h2>
          <div className="srfashion-checkout-items">
            {finalCart.map((item) => (
              <div key={item.id} className="srfashion-checkout-item">
                <div className="srfashion-checkout-item-image">
                  {item.image ? <img src={item.image} alt={item.name} /> : <div className="srfashion-checkout-no-image" />}
                </div>
                <div className="srfashion-checkout-item-details">
                  <h4>{item.name}</h4>
                  <p className="srfashion-checkout-item-meta">
                    Qty: {item.quantity} {item.color ? `· ${item.color}` : ''} {item.size ? `· ${item.size}` : ''}
                  </p>
                  <p className="srfashion-checkout-item-price">{formatPrice(item.price)} each</p>
                </div>
                <div className="srfashion-checkout-item-total">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="srfashion-checkout-summary">
            <div className="srfashion-checkout-row">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {appliedOffer && (
              <div className="srfashion-checkout-row srfashion-checkout-discount">
                <span>{appliedOffer.offer.title} discount</span>
                <span>-{formatPrice(appliedOffer.discount)}</span>
              </div>
            )}
            <div className="srfashion-checkout-row">
              <span>Shipping</span>
              <span>{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</span>
            </div>
            <div className="srfashion-checkout-row srfashion-checkout-total">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </section>

        <section className="srfashion-checkout-section">
          <h2>Delivery Address</h2>
          {addresses.length === 0 ? (
            <div>
              <p style={{ marginBottom: '0.75rem' }}>
                No addresses found. Please add a delivery address before placing an order.
              </p>
              <button
                type="button"
                className="srfashion-checkout-btn srfashion-checkout-secondary"
                onClick={() => {
                  sessionStorage.setItem('goToAddresses', 'true');
                  sessionStorage.setItem('returnToCheckout', 'true');
                  window.location.hash = '#my-account';
                }}
                style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                Add Address in My Account
              </button>
            </div>
          ) : (
            <div className="srfashion-checkout-addresses">
              {addresses.map((addr) => (
                <label key={addr.id} className="srfashion-checkout-address-option">
                  <input
                    type="radio"
                    name="address"
                    value={String(addr.id)}
                    checked={selectedAddress === String(addr.id)}
                    onChange={(e) => setSelectedAddress(e.target.value)}
                  />
                  <span>
                    <strong>{addr.name}</strong> · {addr.mobile_number}
                    <br />
                    {addr.house_flat}, {addr.street_area}, {addr.city}, {addr.state} - {addr.pincode}
                  </span>
                </label>
              ))}
            </div>
          )}
        </section>

        {disabledReason && (
          <p className="srfashion-checkout-reason" style={{ color: '#c0392b', margin: '0 0 0.75rem' }}>
            {disabledReason}
          </p>
        )}

        <button
          className="srfashion-checkout-btn"
          onClick={handlePlaceOrder}
          disabled={!!disabledReason || placing}
          title={placing ? 'Placing your order…' : (disabledReason || 'Click to place your order and proceed to payment')}
        >
          {placing ? 'Placing Order…' : 'Place Order & Proceed to Payment'}
        </button>
      </div>
    </div>
  );
}
