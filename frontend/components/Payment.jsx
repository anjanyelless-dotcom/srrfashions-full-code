import React, { useEffect, useState, useRef } from 'react';
import { getCustomerOrderDetail } from '../services/customerOrderApi.js';
import { submitPayment } from '../services/customerPaymentApi.js';
import { getPaymentSettings } from '../services/paymentSettingsApi.js';
import { getPaymentStatusApi } from '../services/paymentStatusApi.js';
import { formatPrice } from '../services/price.js';
import { useCart } from './CartContext.jsx';
import { useOffers } from './OffersContext.jsx';
import './Checkout.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function resolveUrl(src) {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
  return `${API_BASE}/${src.replace(/^\//, '')}`;
}

function isValidUtr(value) {
  return /^[A-Za-z0-9]{12,22}$/.test(value || '');
}

function getOrderIdFromHash() {
  try {
    const hash = window.location.hash || '';
    let orderId = null;
    
    if (hash.includes('?')) {
      const query = hash.split('?')[1];
      const params = new URLSearchParams(query);
      orderId = params.get('orderId');
    }
    
    return orderId ? Number(orderId) : null;
  } catch (error) {
    console.error('Error getting order ID from hash:', error);
    return null;
  }
}

function getPaymentSessionIdFromHash() {
  // First try to get from sessionStorage (more reliable for long session IDs)
  const sessionFromStorage = sessionStorage.getItem('cashfree_payment_session_id');
  if (sessionFromStorage && typeof sessionFromStorage === 'string') {
    return sessionFromStorage;
  }

  // Fallback to URL hash parsing
  const hash = window.location.hash || '';
  const query = hash.includes('?') ? hash.split('?')[1] : '';
  const params = new URLSearchParams(query);
  const session = params.get('session');

  if (session && typeof session === 'string') {
    try {
      return decodeURIComponent(session);
    } catch {
      return session;
    }
  }
  
  return null;
}
 
function isReturningFromCashfree() {
  try {
    // Check both URL search params and hash params since the bridge redirects
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash || '';
    
    let hashFrom = null;
    if (hash.includes('?')) {
      const hashQuery = hash.split('?')[1];
      const hashParams = new URLSearchParams(hashQuery);
      hashFrom = hashParams.get('from');
    }
    
    const urlFrom = urlParams.get('from');
    return (urlFrom === 'cashfree') || (hashFrom === 'cashfree');
  } catch (error) {
    console.error('Error checking return from Cashfree:', error);
    return false;
  }
}

function formatOrderStatus(status) {
  if (!status) return 'Pending';
  return status.replace(/_/g, ' ');
}

export default function Payment() {
  const [orderId, setOrderId] = useState(getOrderIdFromHash);
  const [paymentSessionId, setPaymentSessionId] = useState(getPaymentSessionIdFromHash);
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { clearCart, fetchCart } = useCart();
  const { clearOffer } = useOffers();
  const cashfreeInitialized = useRef(false);
  const isPollingRef = useRef(null);
  const isCashfreeReturnRef = useRef(null);
  const pollCountRef = useRef(0);

  useEffect(() => {
    const handleHashChange = () => {
      try {
        setOrderId(getOrderIdFromHash);
        setPaymentSessionId(getPaymentSessionIdFromHash);
      } catch (error) {
        console.error('Hash change error:', error);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (isReturningFromCashfree()) {
      try {
        sessionStorage.removeItem('cashfree_payment_session_id');
        sessionStorage.removeItem('cashfree_order_id');
      } catch (err) {
        console.error('Error clearing sessionStorage:', err);
      }
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const [orderRes, settingsRes] = await Promise.all([
          getCustomerOrderDetail(orderId).catch(() => ({})),
          getPaymentSettings().catch(() => ({}))
        ]);
        if (!cancelled) {
          setOrder(orderRes.order || null);
          setItems(orderRes.items || []);
          setSettings(settingsRes);

          // Use payment session ID from order detail as fallback.
          // The backend returns the session ID stored in the database,
          // which came from the Cashfree Create Order API (not Get Order API).
          const orderSession = orderRes.order?.payment_session_id;
          if (!paymentSessionId && orderSession && typeof orderSession === 'string') {
            setPaymentSessionId(orderSession);
          }
        }
      } catch (err) {
        console.error('Error loading payment details:', err);
        if (!cancelled) setError(err.message || 'Failed to load payment details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [orderId]);

  // Initialize Cashfree checkout when payment session is available
  useEffect(() => {
    // If we have an order but no payment session ID, show an error
    if (order && !paymentSessionId && !cashfreeInitialized.current) {
      console.error('No payment session ID available for order:', orderId);
      setError('No payment session available. Please initiate checkout again.');
      return;
    }

    // Don't initialize Cashfree if we're returning from payment
    if (order && paymentSessionId && !cashfreeInitialized.current) {
      // If payment is already being processed or completed, don't open Cashfree
      if (order.payment_status === 'PAID' || 
          order.payment_status === 'CONFIRMED' || 
          order.payment_status === 'PAYMENT_VERIFICATION_PENDING' ||
          order.payment_status === 'FAILED') {
        cashfreeInitialized.current = true;
        return;
      }
      
      // Check if this is a return from Cashfree by looking at URL
      if (isReturningFromCashfree()) {
        cashfreeInitialized.current = true;
        return;
      }
    }

    if (!paymentSessionId || !order || cashfreeInitialized.current) {
      return;
    }

    // Load Cashfree SDK v3
    const loadCashfreeSDK = () => {
      return new Promise((resolve, reject) => {
        if (window.Cashfree) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const initializeCashfree = async () => {
      try {
        await loadCashfreeSDK();

        if (!window.Cashfree) {
          console.error('Cashfree SDK failed to load');
          setError('Failed to load payment gateway. Please refresh the page.');
          return;
        }

        // Validate session ID
        if (!paymentSessionId || typeof paymentSessionId !== 'string' || paymentSessionId.length < 10) {
          console.error('Invalid payment session ID:', {
            exists: !!paymentSessionId,
            type: typeof paymentSessionId,
            length: paymentSessionId?.length || 0
          });
          setError('Invalid payment session. Please try again.');
          return;
        }

        if (paymentSessionId.length < 20) {
          console.error('Payment session ID is too short:', paymentSessionId.length);
          setError('Invalid payment session format. Please try again.');
          return;
        }

        const cashfreeMode = settings?.cashfree_mode || 'production';
        cashfreeInitialized.current = true;

        // Cashfree SDK v3 initialization
        const cashfree = window.Cashfree({
          mode: cashfreeMode
        });

        // Use backend return URL to ensure proper return flow
        const returnUrl = `${API_BASE}/payment-return?orderId=${orderId}&from=cashfree`;

        const checkoutOptions = {
          paymentSessionId: paymentSessionId,
          returnUrl,
          redirectTarget: '_self'
        };

        cashfree.checkout(checkoutOptions);
      } catch (error) {
        console.error('Cashfree initialization error:', error);
        setError('Failed to initialize payment. Please try again.');
      }
    };

    initializeCashfree();
  }, [paymentSessionId, order, API_BASE]);

  // Poll payment status for Cashfree orders after return from payment
  useEffect(() => {
    // Only run once per orderId and only when returning from Cashfree
    if (!orderId || !order) {
      return;
    }

    // Check if this is a Cashfree return and if we haven't already started polling
    const isCashfreeReturn = isReturningFromCashfree();
    if (!isCashfreeReturn || isCashfreeReturnRef.current === orderId) {
      return;
    }

    // Prevent multiple polling processes for the same order
    if (isPollingRef.current === orderId) {
      return;
    }

    // Stop if payment is already in final state
    if (order.payment_status === 'PAID' || 
        order.payment_status === 'CONFIRMED' || 
        order.payment_status === 'PAYMENT_VERIFICATION_PENDING' ||
        order.payment_status === 'FAILED') {
      return;
    }

    // Only poll if this is a Cashfree order with payment session
    if (!order.payment_session_id) {
      return;
    }

    // Mark that we've detected the Cashfree return and started polling
    isCashfreeReturnRef.current = orderId;
    isPollingRef.current = orderId;
    setPolling(true);

    const MAX_POLL_COUNT = 20; // Max 20 polls = 100 seconds
    const POLL_INTERVAL = 5000; // 5 seconds
    let pollInterval = null;
    let timeoutId = null;
    let currentOrder = order; // Capture current order state

    const pollPaymentStatus = async () => {
      if (pollCountRef.current >= MAX_POLL_COUNT) {
        isPollingRef.current = null;
        setPolling(false);
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        if (currentOrder.payment_status === 'PAYMENT_PENDING') {
          setError('Payment verification is taking longer than expected. Please check your order status later.');
        }
        return;
      }

      try {
        setVerifying(true);
        const status = await getPaymentStatusApi(orderId);
        pollCountRef.current++;

        if (status.payment_status === 'PAID' || status.payment_status === 'CONFIRMED') {
          setOrder(prev => prev ? { ...prev, payment_status: status.payment_status, order_status: status.order_status } : prev);
          
          // Clear cart, offer state and redirect to orders page
          try {
            clearCart();
            fetchCart();
            clearOffer();
          } catch (err) {
            console.error('Error clearing cart:', err);
          }
          
          isPollingRef.current = null;
          setPolling(false);
          setVerifying(false);
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          
          // Redirect to orders page after successful payment
          timeoutId = setTimeout(() => {
            window.location.hash = '#my-account';
          }, 1000);
          
        } else if (status.payment_status === 'FAILED' || status.payment_status === 'CANCELLED') {
          setOrder(prev => prev ? { ...prev, payment_status: status.payment_status, order_status: status.order_status } : prev);
          
          isPollingRef.current = null;
          setPolling(false);
          setVerifying(false);
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          
        } else if (status.payment_status === 'PAYMENT_PENDING' || status.cf_order_status === 'ACTIVE' || status.cf_order_status === 'PENDING') {
          // Continue polling silently
        }
      } catch (err) {
        console.error('Payment status poll error:', err);
        pollCountRef.current++;
        if (pollCountRef.current >= MAX_POLL_COUNT - 1) {
          isPollingRef.current = null;
          setPolling(false);
          setVerifying(false);
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          setError('Unable to verify payment status. Please try again later.');
        }
      } finally {
        setVerifying(false);
      }
    };

    // Start polling immediately, then every 5 seconds
    pollPaymentStatus();
    pollInterval = setInterval(pollPaymentStatus, POLL_INTERVAL);

    // Cleanup function
    return () => {
      isPollingRef.current = null;
      setPolling(false);
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      setVerifying(false);
    };
  }, [orderId, order]); // Depend on order too so polling starts after order loads

  const copyUpiId = async () => {
    if (!settings?.upi_id) return;
    try {
      await navigator.clipboard.writeText(settings.upi_id);
      setSuccess('UPI ID copied to clipboard');
      setTimeout(() => setSuccess(''), 2000);
    } catch {
      setError('Could not copy UPI ID');
    }
  };

  const handleManualPayment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!order) return;

    const hasUtr = utr.trim().length > 0;
    const hasScreenshot = !!screenshot;

    if (!hasUtr && !hasScreenshot) {
      setError('Please enter a UTR number or upload a payment screenshot.');
      return;
    }

    if (hasUtr && !isValidUtr(utr)) {
      setError('UTR must be 12-22 alphanumeric characters.');
      return;
    }

    setSubmitting(true);
    try {
      await submitPayment(order.id, {
        screenshot,
        utrNumber: utr.trim() || undefined,
        notes
      });
      setSuccess(
        'Payment proof submitted. Your order is now pending verification. We will update you once the payment is verified.'
      );
      setOrder((prev) => prev ? { ...prev, payment_status: 'PAYMENT_VERIFICATION_PENDING', order_status: 'PAYMENT_VERIFICATION_PENDING' } : prev);
    } catch (err) {
      setError(err.message || 'Failed to submit payment details.');
    } finally {
      setSubmitting(false);
    }
  };

  const paymentDone = order && (
    order.payment_status === 'PAYMENT_VERIFICATION_PENDING' ||
    order.payment_status === 'PAID' ||
    order.payment_status === 'CONFIRMED'
  );

  if (loading) {
    return (
      <div style={{ padding: '140px 20px', textAlign: 'center' }}>
        <p>Loading payment details…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '140px 20px', textAlign: 'center' }}>
        <p>Order not found.</p>
        <button className="srfashion-checkout-btn" onClick={() => { window.location.hash = ''; }}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="srfashion-checkout" style={{ padding: '120px 20px 60px' }}>
      <div className="srfashion-checkout-inner" style={{ maxWidth: 640, margin: '0 auto', background: '#fff', padding: 24, borderRadius: 8 }}>
        <h1 className="srfashion-checkout-title">Complete Payment</h1>

        {error && <div className="srfashion-checkout-error">{error}</div>}
        {success && <div className="srfashion-checkout-success">{success}</div>}

        <section className="srfashion-checkout-section" style={{ textAlign: 'center' }}>
          <div className="srfashion-checkout-order-info">
            Order ID: <strong>#{order.order_number || order.id}</strong>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0' }}>
            Amount: {formatPrice(order.final_amount)}
          </div>
          <div style={{ color: '#555', marginBottom: '1.5rem' }}>
            Payment Status: <strong>{formatOrderStatus(order.payment_status || 'PENDING')}</strong>
          </div>

          <div
            className="srfashion-payment-address"
            style={{
              textAlign: 'left',
              background: '#f8f8f8',
              border: '1px solid #eee',
              borderRadius: 8,
              padding: 16,
              margin: '0 0 1.5rem'
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Deliver To</h3>
            {order.address_name ? (
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                <strong>{order.address_name}</strong>{order.address_mobile ? ` · ${order.address_mobile}` : ''}
                <br />
                {order.house_flat}, {order.street_area}
                <br />
                {order.city}, {order.state} - {order.pincode}
                {order.landmark && (
                  <><br />Landmark: {order.landmark}</>
                )}
              </p>
            ) : (
              <p style={{ margin: 0, color: '#c0392b' }}>Delivery address not available.</p>
            )}
          </div>

          {/* Cashfree Payment Integration */}
          {order.payment_session_id && order.payment_status !== 'PAID' && order.payment_status !== 'FAILED' ? (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <div style={{ padding: '1.5rem', background: '#f0f8ff', border: '1px solid #4a90e2', borderRadius: 8, marginBottom: '1rem' }}>
                <h3 style={{ margin: '0 0 1rem', color: '#4a90e2' }}>Redirecting to Secure Payment</h3>
                <p style={{ margin: '0', color: '#666' }}>
                  You will be redirected to Cashfree's secure payment gateway to complete your payment.
                </p>
                <p style={{ margin: '0.5rem 0 0', color: '#666' }}>
                  Supported payment methods include UPI (PhonePe, Google Pay, Paytm), Cards, Net Banking, and more.
                </p>
                {verifying && (
                  <p style={{ margin: '1rem 0 0', color: '#4a90e2', fontWeight: 500 }}>
                    Verifying payment status... ({pollCountRef.current}/20)
                  </p>
                )}
              </div>
              <button
                className="srfashion-checkout-btn"
                onClick={() => {
                  // Force Cashfree redirect
                  if (window.Cashfree && paymentSessionId) {
                    const cashfreeMode = settings?.cashfree_mode || 'production';
                    const cashfree = window.Cashfree({
                      mode: cashfreeMode
                    });
                    const returnUrl = `${API_BASE}/payment-return?orderId=${orderId}&from=cashfree`;
                    cashfree.checkout({
                      paymentSessionId,
                      returnUrl,
                      redirectTarget: '_self'
                    });
                  } else {
                    setError('Payment gateway not available. Please refresh the page.');
                  }
                }}
                disabled={polling}
              >
                {polling ? 'Processing Payment...' : 'Proceed to Payment'}
              </button>
            </div>
          ) : order.payment_status === 'PAID' || order.payment_status === 'CONFIRMED' ? (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <div style={{ padding: '1.5rem', background: '#f0fff4', border: '1px solid #48bb78', borderRadius: 8, marginBottom: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem', color: '#48bb78' }}>✅ Payment Successful</h3>
                <p style={{ margin: '0', color: '#666' }}>
                  Your payment has been confirmed. Thank you for your order!
                </p>
              </div>
              <button
                className="srfashion-checkout-btn"
                onClick={() => { window.location.hash = '#my-account'; }}
              >
                View My Orders
              </button>
            </div>
          ) : order.payment_status === 'FAILED' ? (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <div style={{ padding: '1.5rem', background: '#fff5f5', border: '1px solid #f56565', borderRadius: 8, marginBottom: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem', color: '#f56565' }}>❌ Payment Failed</h3>
                <p style={{ margin: '0', color: '#666' }}>
                  Your payment could not be completed. Please try again.
                </p>
              </div>
              <button
                className="srfashion-checkout-btn"
                onClick={() => { window.location.hash = '#/checkout'; }}
              >
                Try Again
              </button>
            </div>
          ) : (
            /* Manual Payment Fallback */
            <>
              {settings?.upi_qr_url ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      padding: 16,
                      background: '#fff',
                      border: '1px solid #eee',
                      borderRadius: 12,
                      display: 'inline-block'
                    }}
                  >
                    <img
                      src={resolveUrl(settings.upi_qr_url)}
                      alt="UPI QR code"
                      style={{ width: 200, height: 200, objectFit: 'contain' }}
                    />
                  </div>
                  <p style={{ color: '#666' }}>Scan using PhonePe, Google Pay, Paytm, or any UPI application</p>
                </div>
              ) : settings?.upi_id ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <p>UPI ID: <strong>{settings.upi_id}</strong></p>
                  <button
                    type="button"
                    className="srfashion-checkout-btn srfashion-checkout-secondary"
                    onClick={copyUpiId}
                    style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    Copy UPI ID
                  </button>
                </div>
              ) : (
                <p style={{ color: '#c0392b' }}>Payment details are not configured. Please contact support.</p>
              )}

              {paymentDone ? (
                <section className="srfashion-checkout-section" style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '1.1rem' }}>
                    Your payment proof has been submitted. It is now pending verification.
                  </p>
                  <button
                    className="srfashion-checkout-btn"
                    onClick={() => { window.location.hash = '#my-account'; }}
                  >
                    View My Orders
                  </button>
                </section>
              ) : (
                <form onSubmit={handleManualPayment} className="srfashion-checkout-payment-form" style={{ borderTop: '1px solid #eee', paddingTop: 24 }}>
                  <h2 style={{ textAlign: 'center' }}>Submit Payment Proof</h2>

                  <div className="srfashion-checkout-field">
                    <label htmlFor="srfashion-utr">Transaction ID / UTR Number (optional if screenshot uploaded)</label>
                    <input
                      id="srfashion-utr"
                      type="text"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      placeholder="12-22 character UTR number"
                      maxLength={22}
                    />
                  </div>

                  <div className="srfashion-checkout-field">
                    <label htmlFor="srfashion-screenshot">Payment Screenshot (optional if UTR entered)</label>
                    <input
                      id="srfashion-screenshot"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      onChange={(e) => setScreenshot(e.target.files[0] || null)}
                    />
                    {screenshot && (
                      <p className="srfashion-checkout-file-name">Selected: {screenshot.name}</p>
                    )}
                  </div>

                  <div className="srfashion-checkout-field">
                    <label htmlFor="srfashion-notes">Payment Remarks (optional)</label>
                    <textarea
                      id="srfashion-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional payment details"
                      rows={3}
                    />
                  </div>

                  <button
                    type="submit"
                    className="srfashion-checkout-btn"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting…' : 'I Have Completed Payment — Submit'}
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}