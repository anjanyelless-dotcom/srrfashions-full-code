import React from 'react';
import './AdminLayout.css';

const SIDEBAR = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'categories', label: 'Categories' },
  { key: 'products', label: 'Products' },
  { key: 'orders', label: 'Orders' },
  { key: 'payments', label: 'Payments' },
  { key: 'customers', label: 'Customers' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'banners', label: 'Banners' },
  { key: 'sms-campaigns', label: 'SMS Campaigns' },
];

function AdminLayout({ view, user, onLogout, onNavigate, children }) {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-logo">SR Selections</div>
          <div className="admin-sidebar-portal">Admin Portal</div>
        </div>
        <nav className="admin-sidebar-nav">
          {SIDEBAR.map((item) => (
            <button
              key={item.key}
              className={view === item.key ? 'active' : ''}
              onClick={() => onNavigate(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-user">{user?.full_name || 'Admin'}</div>
          <button onClick={onLogout} className="admin-logout-button">
            Logout
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <h1 className="admin-header-title">{view.replace(/-/g, ' ')}</h1>
          <div className="admin-header-user">{user?.full_name || 'Admin'}</div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}

export default AdminLayout;
