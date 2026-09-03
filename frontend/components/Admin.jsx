import React, { useEffect, useState } from 'react';
import {
  adminLogin,
  getDashboard,
  getAllCategories,
  getAllProducts,
  getAdminOrders,
} from '../services/adminApi.js';
import { formatPrice } from '../services/price.js';

const cardStyle = {
  padding: 12,
  border: '1px solid #ddd',
  borderRadius: 6,
  minWidth: 120,
  textAlign: 'center',
};

const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' };
const tdStyle = { padding: '8px 4px', borderBottom: '1px solid #eee' };

function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => typeof window !== 'undefined' && !!window.localStorage.getItem('admin_token')
  );
  const [screen, setScreen] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [login, setLogin] = useState({ email: '', password: '' });

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    setData(null);
    setError('');

    const fetchData = async () => {
      try {
        let res;
        switch (screen) {
          case 'categories':
            res = await getAllCategories();
            break;
          case 'products':
            res = await getAllProducts();
            break;
          case 'orders':
            res = await getAdminOrders();
            break;
          default:
            res = await getDashboard();
        }
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [screen, isLoggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await adminLogin(login);
      window.localStorage.setItem('admin_token', res.token);
      window.localStorage.setItem('admin_user', JSON.stringify(res.user));
      setIsLoggedIn(true);
    } catch (err) {
      setError(err.message || 'Login failed.');
    }
  };

  const logout = () => {
    window.localStorage.removeItem('admin_token');
    window.localStorage.removeItem('admin_user');
    setIsLoggedIn(false);
    setData(null);
    setScreen('dashboard');
  };

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: 360, margin: '80px auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
        <h2>Admin Login</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={login.email}
            onChange={(e) => setLogin({ ...login, email: e.target.value })}
            style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={login.password}
            onChange={(e) => setLogin({ ...login, password: e.target.value })}
            style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
            required
          />
          <button type="submit" style={{ padding: '8px 16px' }}>
            Login
          </button>
        </form>
      </div>
    );
  }

  const renderDashboard = () => {
    const stats = data?.stats || data;
    if (stats && typeof stats === 'object' && !Array.isArray(stats)) {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} style={cardStyle}>
              <div style={{ fontSize: 12, color: '#666', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{value ?? '-'}</div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, overflow: 'auto' }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  const renderCategories = () => {
    const items = data?.categories || data || [];
    return (
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((cat) => (
            <tr key={cat.id}>
              <td style={tdStyle}>{cat.id}</td>
              <td style={tdStyle}>{cat.name}</td>
              <td style={tdStyle}>{cat.is_active ? 'Active' : 'Inactive'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderProducts = () => {
    const items = data?.products || data || [];
    return (
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Price</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <td style={tdStyle}>{p.id}</td>
              <td style={tdStyle}>{p.name}</td>
              <td style={tdStyle}>{formatPrice(p.selling_price)}</td>
              <td style={tdStyle}>{p.is_active ? 'Active' : 'Inactive'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderOrders = () => {
    const items = data?.orders || data || [];
    return (
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Customer</th>
            <th style={thStyle}>Total</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((o) => (
            <tr key={o.id}>
              <td style={tdStyle}>{o.id}</td>
              <td style={tdStyle}>{o.customer_name || o.user_id || '-'}</td>
              <td style={tdStyle}>{formatPrice(o.total)}</td>
              <td style={tdStyle}>{o.status || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderContent = () => {
    if (loading) return <p>Loading…</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!data) return <p>No data.</p>;
    switch (screen) {
      case 'categories':
        return renderCategories();
      case 'products':
        return renderProducts();
      case 'orders':
        return renderOrders();
      default:
        return renderDashboard();
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Admin</h1>
        <div>
          <button onClick={() => setScreen('dashboard')} style={{ marginRight: 8 }}>
            Dashboard
          </button>
          <button onClick={() => setScreen('categories')} style={{ marginRight: 8 }}>
            Categories
          </button>
          <button onClick={() => setScreen('products')} style={{ marginRight: 8 }}>
            Products
          </button>
          <button onClick={() => setScreen('orders')} style={{ marginRight: 8 }}>
            Orders
          </button>
          <button onClick={logout}>Logout</button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}

export default Admin;
