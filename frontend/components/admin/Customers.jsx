import React, { useEffect, useState } from 'react';
import { getCustomers, updateCustomerStatus } from '../../services/adminApi.js';

const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: 12 };
const thStyle = { textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' };
const tdStyle = { padding: '8px 4px', borderBottom: '1px solid #eee' };
const btnStyle = { padding: '4px 8px', marginRight: 4, cursor: 'pointer' };
const pageBtnStyle = { padding: '6px 12px', cursor: 'pointer' };

const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleString();
};

function isUnauthorized(err) {
  const message = (err.message || '').toLowerCase();
  return message.includes('unauthorized') || message.includes('401');
}

function Customers({ onAuthError }) {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCustomers = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await getCustomers({ page: targetPage, limit });
      setData(res.customers || []);
      setPagination(res.pagination || { page: targetPage, totalPages: 1, total: 0, limit });
      setPage(targetPage);
    } catch (err) {
      if (isUnauthorized(err)) {
        onAuthError?.();
      } else {
        setError(err.message || 'Failed to load customers.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, []);

  const handleError = (err) => {
    if (isUnauthorized(err)) {
      onAuthError?.();
    } else {
      setError(err.message || 'Request failed.');
    }
  };

  const handleStatus = async (id, isActive) => {
    setError('');
    try {
      await updateCustomerStatus(id, { is_active: !isActive });
      await fetchCustomers(page);
    } catch (err) {
      handleError(err);
    }
  };

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchCustomers(newPage);
  };

  return (
    <div>
      {loading && <p>Loading customers…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && data.length === 0 && <p>No customers found.</p>}

      {!loading && data.length > 0 && (
        <>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Customer ID</th>
                <th style={thStyle}>Customer Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Mobile</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Created Date</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td style={tdStyle}>{c.id}</td>
                  <td style={tdStyle}>{c.full_name || '-'}</td>
                  <td style={tdStyle}>{c.email || '-'}</td>
                  <td style={tdStyle}>{c.mobile_number || '-'}</td>
                  <td style={tdStyle}>{c.is_active ? 'Active' : 'Inactive'}</td>
                  <td style={tdStyle}>{formatDate(c.created_at)}</td>
                  <td style={tdStyle}>
                    <button onClick={() => handleStatus(c.id, c.is_active)} style={btnStyle}>
                      {c.is_active ? 'Deactivate' : 'Activate'}
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

export default Customers;
