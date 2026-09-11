import React, { useCallback, useEffect, useState } from 'react';
import { adminLogin } from '../../services/adminApi.js';
import AdminLogin from './AdminLogin.jsx';
import AdminLayout from './AdminLayout.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import Categories from './Categories.jsx';
import Products from './Products.jsx';
import Orders from './Orders.jsx';
import Payments from './Payments.jsx';
import Customers from './Customers.jsx';
import Inventory from './Inventory.jsx';
import Banners from './Banners.jsx';
import SmsCampaigns from './SmsCampaigns.jsx';

function getAdminView(hash) {
  const parts = hash.replace(/^#/, '').split('/').filter(Boolean);
  if (parts[0] !== 'admin') return 'login';
  return parts[1] || 'dashboard';
}

function Admin({ hash }) {
  const [token, setToken] = useState(() => window.localStorage.getItem('admin_token'));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('admin_user'));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token && (hash === '#admin' || hash === '#/admin' || hash === '#/admin/')) {
      window.location.hash = '#/admin/dashboard';
    }
  }, [token, hash]);

  const handleLogin = async (creds) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminLogin(creds);
      window.localStorage.setItem('admin_token', res.token);
      window.localStorage.setItem('admin_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      window.location.hash = '#/admin/dashboard';
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    window.localStorage.removeItem('admin_token');
    window.localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
    window.location.hash = '#/admin';
  }, []);

  if (!token) {
    return <AdminLogin onLogin={handleLogin} loading={loading} error={error} />;
  }

  const view = getAdminView(hash);

  const renderContent = () => {
    if (view === 'dashboard') {
      return <AdminDashboard onAuthError={logout} />;
    }
    if (view === 'categories') {
      return <Categories onAuthError={logout} />;
    }
    if (view === 'products') {
      return <Products onAuthError={logout} />;
    }
    if (view === 'orders') {
      return <Orders onAuthError={logout} />;
    }
    if (view === 'payments') {
      return <Payments onAuthError={logout} />;
    }
    if (view === 'customers') {
      return <Customers onAuthError={logout} />;
    }
    if (view === 'inventory') {
      return <Inventory onAuthError={logout} />;
    }
    if (view === 'banners') {
      return <Banners onAuthError={logout} />;
    }
    if (view === 'sms-campaigns') {
      return <SmsCampaigns onAuthError={logout} />;
    }
    return (
      <div style={{ padding: 24, background: '#ffffff', borderRadius: 12 }}>
        <h3 style={{ textTransform: 'capitalize' }}>{view.replace(/-/g, ' ')}</h3>
        <p>This section is not integrated yet.</p>
      </div>
    );
  };

  return (
    <AdminLayout
      view={view}
      user={user}
      onLogout={logout}
      onNavigate={(key) => {
        window.location.hash = `#/admin/${key}`;
      }}
    >
      {renderContent()}
    </AdminLayout>
  );
}

export default Admin;
