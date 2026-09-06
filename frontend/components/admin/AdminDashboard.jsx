import React, { useEffect, useState } from 'react';
import { getDashboard } from '../../services/adminApi.js';

function AdminDashboard({ onAuthError }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
 
  useEffect(() => {
    setLoading(true);
    setError('');
    getDashboard()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        const message = err.message || '';
        if (message.toLowerCase().includes('unauthorized') || message.includes('401')) {
          onAuthError?.();
          return;
        }
        setError(err.message || 'Failed to load dashboard.');
        setLoading(false);
      });
  }, [onAuthError]);

  if (loading) return <p>Loading dashboard…</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  const stats = data?.dashboard || data || {};

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 8 }}>
        {Object.entries(stats).map(([key, value]) => (
          <div
            key={key}
            style={{
              flex: '1 1 200px',
              minWidth: 180,
              background: '#ffffff',
              padding: 26,
              borderRadius: 12,
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ fontSize: 13, color: '#6b7280', textTransform: 'capitalize', fontWeight: 500 }}>
              {key.replace(/_/g, ' ')}
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#111827', marginTop: 8 }}>
              {value ?? '-'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;
