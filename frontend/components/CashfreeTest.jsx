import React, { useState } from 'react';
import { getCashfreeOrderApi } from '../services/cashfreeApi';
import './CashfreeTest.css';

const CashfreeTest = () => {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  const handleGetOrder = async (e) => {
    e.preventDefault();
    setError(null);
    setOrderData(null);
    setShowRaw(false);

    if (!orderId.trim()) {
      setError('Order ID is required');
      return;
    }

    setLoading(true);
    try {
      const data = await getCashfreeOrderApi(orderId.trim());
      setOrderData(data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cashfree-test-page">
      <div className="cashfree-test-container">
        <h1 className="cashfree-test-title">Cashfree Get Order Test</h1>
        <p className="cashfree-test-subtitle">
          Test the Cashfree Get Order API by entering an order ID.
        </p>

        <form className="cashfree-test-form" onSubmit={handleGetOrder}>
          <div className="cashfree-test-field">
            <label htmlFor="orderId">Order ID</label>
            <input
              type="text"
              id="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g., order_xxxxxxxxx"
              className="cashfree-test-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="cashfree-test-button"
          >
            {loading ? 'Loading...' : 'Get Order'}
          </button>
        </form>

        {error && (
          <div className="cashfree-test-error">
            Error: {error}
          </div>
        )}

        {orderData && (
          <div className="cashfree-test-result">
            <h2 className="cashfree-result-title">Order Details</h2>

            <div className="cashfree-result-grid">
              <div className="cashfree-result-item">
                <span className="cashfree-result-label">Order ID</span>
                <span className="cashfree-result-value">{orderData.order_id || 'N/A'}</span>
              </div>

              <div className="cashfree-result-item">
                <span className="cashfree-result-label">Order Status</span>
                <span className="cashfree-result-value">{orderData.order_status || 'N/A'}</span>
              </div>

              <div className="cashfree-result-item">
                <span className="cashfree-result-label">Order Amount</span>
                <span className="cashfree-result-value">
                  {orderData.order_amount ? `${orderData.order_currency || ''} ${orderData.order_amount}` : 'N/A'}
                </span>
              </div>

              <div className="cashfree-result-item">
                <span className="cashfree-result-label">Currency</span>
                <span className="cashfree-result-value">{orderData.order_currency || 'N/A'}</span>
              </div>

              <div className="cashfree-result-item">
                <span className="cashfree-result-label">Customer Name</span>
                <span className="cashfree-result-value">
                  {orderData.customer_details?.customer_name || 'N/A'}
                </span>
              </div>

              <div className="cashfree-result-item">
                <span className="cashfree-result-label">Customer Email</span>
                <span className="cashfree-result-value">
                  {orderData.customer_details?.customer_email || 'N/A'}
                </span>
              </div>

              <div className="cashfree-result-item">
                <span className="cashfree-result-label">Customer Phone</span>
                <span className="cashfree-result-value">
                  {orderData.customer_details?.customer_phone || 'N/A'}
                </span>
              </div>

              <div className="cashfree-result-item">
                <span className="cashfree-result-label">Created At</span>
                <span className="cashfree-result-value">{orderData.created_at || 'N/A'}</span>
              </div>

              <div className="cashfree-result-item">
                <span className="cashfree-result-label">Payment Session ID</span>
                <span className="cashfree-result-value">{orderData.payment_session_id || 'N/A'}</span>
              </div>

              <div className="cashfree-result-item">
                <span className="cashfree-result-label">CF Order ID</span>
                <span className="cashfree-result-value">{orderData.cf_order_id || 'N/A'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRaw(!showRaw)}
              className="cashfree-raw-button"
            >
              {showRaw ? 'Hide Raw Response' : 'View Raw Response'}
            </button>

            {showRaw && (
              <div className="cashfree-raw-response">
                <pre>{JSON.stringify(orderData, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CashfreeTest;