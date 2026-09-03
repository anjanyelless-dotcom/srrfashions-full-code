import React, { useEffect, useState } from 'react';
import { getPendingPayments, approvePayment, rejectPayment } from '../../services/adminPaymentApi.js';
import { formatPrice } from '../../services/price.js';

const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: 12 };
const thStyle = { textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' };
const tdStyle = { padding: '8px 4px', borderBottom: '1px solid #eee' };
const btnStyle = { padding: '4px 8px', marginRight: 4, cursor: 'pointer' };
const inputStyle = { display: 'block', width: '100%', marginBottom: 8, padding: 8 };

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleString();
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function resolveUrl(src) {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return `${API_BASE}${src.startsWith('/') ? '' : '/'}${src}`;
}

export default function Payments({ onAuthError }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPendingPayments();
      setPayments(data.pending_payments || []);
    } catch (err) {
      if (err.message.toLowerCase().includes('unauthorized') || err.message.includes('401')) {
        onAuthError && onAuthError();
      } else {
        setError(err.message || 'Failed to load pending payments.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleApprove = async (paymentId) => {
    if (!window.confirm('Approve this payment?')) return;
    setProcessing(true);
    setError('');
    try {
      await approvePayment(paymentId);
      await fetchPayments();
      setSelected(null);
    } catch (err) {
      setError(err.message || 'Failed to approve payment.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (paymentId) => {
    const reason = rejectionReason.trim() || 'Payment not verified';
    if (!window.confirm('Reject this payment?')) return;
    setProcessing(true);
    setError('');
    try {
      await rejectPayment(paymentId, reason);
      await fetchPayments();
      setSelected(null);
      setRejectionReason('');
    } catch (err) {
      setError(err.message || 'Failed to reject payment.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ padding: 12, background: '#ffffff', borderRadius: 12 }}>
      <h2>Payment Verifications</h2>

      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : payments.length === 0 ? (
        <p>No pending payment verifications.</p>
      ) : (
        <>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Order #</th>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>UTR</th>
                <th style={thStyle}>Submitted</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.payment_id}>
                  <td style={tdStyle}>{p.order_number}</td>
                  <td style={tdStyle}>
                    {p.customer_name}<br />
                    <small>{p.customer_mobile}</small>
                  </td>
                  <td style={tdStyle}>{formatPrice(p.amount)}</td>
                  <td style={tdStyle}>{p.utr_number || '-'}</td>
                  <td style={tdStyle}>{formatDate(p.payment_date)}</td>
                  <td style={tdStyle}>
                    <button
                      type="button"
                      style={btnStyle}
                      onClick={() => { setSelected(p); setRejectionReason(''); }}
                    >
                      Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selected && (
            <div style={{ marginTop: 24, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
              <h3>Verify Payment — Order #{selected.order_number}</h3>
              <p>
                <strong>Customer:</strong> {selected.customer_name} ({selected.customer_mobile})<br />
                <strong>Amount:</strong> {formatPrice(selected.amount)}<br />
                <strong>UTR:</strong> {selected.utr_number || '-'}<br />
                <strong>Submitted:</strong> {formatDate(selected.payment_date)}
              </p>

              {selected.screenshot_url ? (
                <div style={{ marginBottom: 16 }}>
                  <strong>Payment Screenshot:</strong><br />
                  <a href={resolveUrl(selected.screenshot_url)} target="_blank" rel="noreferrer">
                    <img
                      src={resolveUrl(selected.screenshot_url)}
                      alt="Payment screenshot"
                      style={{ maxWidth: 240, maxHeight: 320, borderRadius: 6, border: '1px solid #eee' }}
                    />
                  </a>
                </div>
              ) : (
                <p>No screenshot uploaded.</p>
              )}

              <div style={{ marginBottom: 12 }}>
                <label htmlFor="rejection-reason" style={{ display: 'block', marginBottom: 4 }}>
                  Rejection Reason (required only for reject)
                </label>
                <input
                  id="rejection-reason"
                  type="text"
                  style={inputStyle}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason if rejecting"
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  style={{ ...btnStyle, background: '#2d5f2e', color: '#fff', border: 'none' }}
                  onClick={() => handleApprove(selected.payment_id)}
                  disabled={processing}
                >
                  {processing ? 'Processing…' : 'Approve Payment'}
                </button>
                <button
                  type="button"
                  style={{ ...btnStyle, background: '#c0392b', color: '#fff', border: 'none' }}
                  onClick={() => handleReject(selected.payment_id)}
                  disabled={processing}
                >
                  {processing ? 'Processing…' : 'Reject Payment'}
                </button>
                <button
                  type="button"
                  style={btnStyle}
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
