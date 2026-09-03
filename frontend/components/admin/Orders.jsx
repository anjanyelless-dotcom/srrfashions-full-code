import React, { useEffect, useState } from 'react';
import { getAdminOrders, updateOrderStatus, cancelAdminOrder } from '../../services/adminApi.js';
import { formatPrice } from '../../services/price.js';

const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: 12 };
const thStyle = { textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' };
const tdStyle = { padding: '8px 4px', borderBottom: '1px solid #eee' };
const btnStyle = { padding: '4px 8px', marginRight: 4, cursor: 'pointer' };
const pageBtnStyle = { padding: '6px 12px', cursor: 'pointer' };

const VALID_TRANSITIONS = {
  'PENDING': ['PAYMENT_VERIFICATION_PENDING', 'CANCELLED'],
  'PAYMENT_VERIFICATION_PENDING': ['PAYMENT_REJECTED', 'CONFIRMED', 'CANCELLED'],
  'PAYMENT_REJECTED': ['PAYMENT_VERIFICATION_PENDING', 'CANCELLED'],
  'CONFIRMED': ['PROCESSING', 'CANCELLED'],
  'PROCESSING': ['PACKED', 'CANCELLED'],
  'PACKED': ['SHIPPED', 'CANCELLED'],
  'SHIPPED': ['DELIVERED', 'CANCELLED'],
  'DELIVERED': [],
  'CANCELLED': [],
};

const ALL_STATUSES = Object.keys(VALID_TRANSITIONS);

const formatMoney = (value) => formatPrice(value);
const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleString();
};

function isUnauthorized(err) {
  const message = (err.message || '').toLowerCase();
  return message.includes('unauthorized') || message.includes('401');
}

function Orders({ onAuthError }) {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await getAdminOrders({ page: targetPage, limit });
      setData(res.orders || []);
      setPagination(res.pagination || { page: targetPage, totalPages: 1, total: 0, limit });
      setPage(targetPage);
    } catch (err) {
      if (isUnauthorized(err)) {
        onAuthError?.();
      } else {
        setError(err.message || 'Failed to load orders.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const handleError = (err) => {
    if (isUnauthorized(err)) {
      onAuthError?.();
    } else {
      setError(err.message || 'Request failed.');
    }
  };

  const handleStatusChange = async (id, currentStatus, newStatus) => {
    setError('');

    if (currentStatus === newStatus) return;

    const allowed = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      setError(
        `Invalid transition from ${currentStatus} to ${newStatus}. ` +
          `Allowed next transitions: ${allowed.join(', ') || 'none'}.`
      );
      await fetchOrders(page);
      return;
    }

    try {
      await updateOrderStatus(id, { order_status: newStatus });
      await fetchOrders(page);
    } catch (err) {
      if (isUnauthorized(err)) {
        onAuthError?.();
        return;
      }
      const allowedFromBackend = err.data?.allowed_transitions || [];
      const baseMessage = err.data?.error || err.message || 'Failed to update status.';
      setError(
        allowedFromBackend.length > 0
          ? `${baseMessage}. Allowed transitions: ${allowedFromBackend.join(', ')}`
          : baseMessage
      );
      await fetchOrders(page);
    }
  };

  const handleCancel = async (id) => {
    const reason = window.prompt('Enter cancellation reason:');
    if (reason === null) return;
    if (!reason.trim()) {
      window.alert('Cancellation reason is required.');
      return;
    }
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setError('');
    try {
      await cancelAdminOrder(id, { cancellation_reason: reason.trim() });
      await fetchOrders(page);
    } catch (err) {
      handleError(err);
    }
  };

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchOrders(newPage);
  };

  return (
    <div>
      {loading && <p>Loading orders…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && data.length === 0 && <p>No orders found.</p>}

      {!loading && data.length > 0 && (
        <>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Order ID</th>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Total</th>
                <th style={thStyle}>Payment</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((o) => (
                <tr key={o.id}>
                  <td style={tdStyle}>{o.id}</td>
                  <td style={tdStyle}>{o.customer_name || o.customer_email || o.user_id || '-'}</td>
                  <td style={tdStyle}>{formatMoney(o.final_amount)}</td>
                  <td style={tdStyle}>{o.payment_status || '-'}</td>
                  <td style={tdStyle}>
                    <select
                      value={o.order_status || ''}
                      onChange={(e) => handleStatusChange(o.id, o.order_status, e.target.value)}
                      style={{ padding: 4 }}
                      disabled={o.order_status === 'CANCELLED' || o.order_status === 'DELIVERED'}
                    >
                      {ALL_STATUSES.map((s) => {
                        const allowed = VALID_TRANSITIONS[o.order_status] || [];
                        const isAllowed = s === o.order_status || allowed.includes(s);
                        return (
                          <option
                            key={s}
                            value={s}
                            disabled={!isAllowed}
                            title={
                              !isAllowed
                                ? `Cannot move from ${o.order_status} to ${s}`
                                : undefined
                            }
                          >
                            {s === o.order_status ? `${s} (current)` : s}
                          </option>
                        );
                      })}
                    </select>
                  </td>
                  <td style={tdStyle}>{formatDate(o.created_at)}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleCancel(o.id)}
                      disabled={o.order_status === 'CANCELLED' || o.order_status === 'DELIVERED'}
                      style={btnStyle}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination.totalPages > 1 && (
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                style={pageBtnStyle}
              >
                Previous
              </button>
              <span>
                Page {page} of {pagination.totalPages} ({pagination.total || 0} total)
              </span>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= pagination.totalPages}
                style={pageBtnStyle}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Orders;
