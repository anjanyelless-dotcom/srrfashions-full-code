import React, { useEffect, useState } from 'react';
import {
  getCustomerOrders,
  getCustomerOrderDetail,
  cancelCustomerOrder,
} from '../services/customerOrderApi.js';
import { formatPrice } from '../services/price.js';

const CANCELLABLE_STATUSES = ['PENDING', 'PAYMENT_VERIFICATION_PENDING', 'PAYMENT_REJECTED', 'CONFIRMED'];

const money = (value) => formatPrice(value);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function resolveUrl(src) {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return `${API_BASE}${src.startsWith('/') ? '' : '/'}${src}`;
}

function isUnauthorized(err) {
  const message = (err?.message || '').toLowerCase();
  return message.includes('unauthorized') || message.includes('401');
}

function redirectToLogin() {
  try {
    sessionStorage.setItem('redirectAfterLogin', window.location.hash);
  } catch {
    // ignore
  }
  window.location.hash = '#my-account';
}

function clearCustomerAuth() {
  localStorage.removeItem('customer_token');
  localStorage.removeItem('customer_user');
}

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleString();
}

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const fetchOrders = async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) {
      redirectToLogin();
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await getCustomerOrders();
      setOrders(data.orders || []);
    } catch (err) {
      if (isUnauthorized(err)) {
        clearCustomerAuth();
        redirectToLogin();
      } else {
        setError(err.message || 'Failed to load orders.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleView = async (id) => {
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    setError('');

    const token = localStorage.getItem('customer_token');
    if (!token) {
      redirectToLogin();
      return;
    }

    try {
      const data = await getCustomerOrderDetail(id);
      setDetail(data);
    } catch (err) {
      if (isUnauthorized(err)) {
        clearCustomerAuth();
        redirectToLogin();
      } else {
        setError(err.message || 'Failed to load order details.');
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedId(null);
    setDetail(null);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    const token = localStorage.getItem('customer_token');
    if (!token) {
      redirectToLogin();
      return;
    }

    setCanceling(true);
    setError('');
    try {
      await cancelCustomerOrder(id);
      await fetchOrders();
      if (selectedId === id) {
        await handleView(id);
      }
    } catch (err) {
      if (isUnauthorized(err)) {
        clearCustomerAuth();
        redirectToLogin();
      } else {
        setError(err.message || 'Failed to cancel order.');
      }
    } finally {
      setCanceling(false);
    }
  };

  const canCancel = (status) => CANCELLABLE_STATUSES.includes(status);

  const formatAddress = (o) => {
    const parts = [o.house_flat, o.street_area, o.city, o.state, o.pincode].filter(Boolean);
    return parts.join(', ');
  };

  if (loading) {
    return <p>Loading your orders…</p>;
  }

  return (
    <div className="srfashion-orders">
      <h2 className="srfashion-form-title">My Orders</h2>

      {error && (
        <ul className="woocommerce-error" role="alert">
          <li>{error}</li>
        </ul>
      )}

      {orders.length === 0 ? (
        <p>You have not placed any orders yet.</p>
      ) : (
        <div className="srfashion-orders-list">
          {orders.map((o) => (
            <div
              key={o.id}
              style={{
                border: '1px solid #e5e5e5',
                padding: '1rem',
                marginBottom: '1rem',
                borderRadius: 4,
                background: '#fff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <strong>Order #{o.order_number || o.id}</strong>
                <span>{formatDate(o.created_at)}</span>
              </div>
              <div style={{ margin: '0.5rem 0', color: '#555' }}>
                Status: <strong>{o.order_status}</strong>
                {o.payment_status && (
                  <span style={{ marginLeft: 12 }}>Payment: <strong>{o.payment_status}</strong></span>
                )}
              </div>
              <div style={{ margin: '0.5rem 0' }}>
                Total: <strong>{money(o.final_amount)}</strong>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem' }}>
                <button
                  type="button"
                    className="woocommerce-button button"
                    onClick={() => handleView(o.id)}
                    disabled={detailLoading && selectedId === o.id}
                  >
                    {detailLoading && selectedId === o.id ? 'Loading…' : 'View'}
                  </button>
                  {canCancel(o.order_status) && (
                    <button
                      type="button"
                      className="woocommerce-button button"
                      onClick={() => handleCancel(o.id)}
                      disabled={canceling}
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {selectedId === o.id && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e5e5' }}>
                    {detailLoading ? (
                      <p>Loading order details…</p>
                    ) : detail ? (
                      <>
                        <h4>Order Items</h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                          {(detail.items || []).map((item, i) => (
                            <li
                              key={i}
                              style={{
                                padding: '0.5rem',
                                marginBottom: '0.5rem',
                                background: '#fafafa',
                                borderRadius: 4,
                              }}
                            >
                              <div><strong>{item.product_name}</strong></div>
                              {item.color && <div style={{ fontSize: '0.85rem' }}>Color: {item.color}</div>}
                              {item.size && <div style={{ fontSize: '0.85rem' }}>Size: {item.size}</div>}
                              <div style={{ fontSize: '0.85rem' }}>
                                Qty: {item.quantity} × {money(item.price_at_purchase)}
                              </div>
                            </li>
                          ))}
                        </ul>

                        <h4>Shipping Address</h4>
                        <p style={{ fontSize: '0.9rem' }}>
                          {detail.order.address_name && <>{detail.order.address_name}<br /></>}
                          {detail.order.address_mobile && <>{detail.order.address_mobile}<br /></>}
                          {formatAddress(detail.order)}
                        </p>

                        <div style={{ marginTop: '0.5rem' }}>
                          <strong>Subtotal:</strong> {money(detail.order.subtotal)}<br />
                          {Number(detail.order.coupon_discount) > 0 && (
                            <>Coupon Discount: {money(detail.order.coupon_discount)}<br /></>
                          )}
                          {Number(detail.order.referral_discount) > 0 && (
                            <>Referral Discount: {money(detail.order.referral_discount)}<br /></>
                          )}
                          <strong>Total:</strong> {money(detail.order.final_amount)}
                        </div>

                        <h4 style={{ marginTop: '1rem' }}>Payment Details</h4>
                        <p style={{ fontSize: '0.9rem' }}>
                          <strong>Payment Status:</strong> {detail.order.payment_status || 'PENDING'}<br />
                          {detail.order.utr_number && <><strong>UTR Number:</strong> {detail.order.utr_number}<br /></>}
                          {detail.order.payment_notes && <><strong>Remarks:</strong> {detail.order.payment_notes}<br /></>}
                          {detail.order.verified_at && <><strong>Verified At:</strong> {formatDate(detail.order.verified_at)}<br /></>}
                          {detail.order.rejection_reason && (
                            <span style={{ color: '#c0392b' }}>
                              <strong>Rejection Reason:</strong> {detail.order.rejection_reason}
                            </span>
                          )}
                        </p>
                        {detail.order.screenshot_url && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <a href={resolveUrl(detail.order.screenshot_url)} target="_blank" rel="noreferrer">
                              View Payment Screenshot
                            </a>
                          </div>
                        )}

                        <button
                          type="button"
                          className="woocommerce-button button"
                          onClick={handleCloseDetail}
                          style={{ marginTop: '0.75rem' }}
                        >
                          Close
                        </button>
                      </>
                    ) : (
                      <p>Could not load order details.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
