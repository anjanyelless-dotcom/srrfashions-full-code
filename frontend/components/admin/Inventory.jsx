import React, { useEffect, useMemo, useState } from 'react';
import { getInventory, updateVariantStock } from '../../services/adminApi.js';

const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: 12 };
const thStyle = { textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' };
const tdStyle = { padding: '8px 4px', borderBottom: '1px solid #eee' };
const btnStyle = { padding: '4px 8px', marginRight: 4, cursor: 'pointer' };
const pageBtnStyle = { padding: '6px 12px', cursor: 'pointer' };
const filterBtnStyle = { padding: '6px 12px', marginRight: 8, cursor: 'pointer' };

function isUnauthorized(err) {
  const message = (err.message || '').toLowerCase();
  return message.includes('unauthorized') || message.includes('401');
}

function Inventory({ onAuthError }) {
  const [rawData, setRawData] = useState([]);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editValues, setEditValues] = useState({});

  const fetchInventory = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await getInventory({ page: targetPage, limit });
      setRawData(res.inventory || []);
      if (res.low_stock_threshold !== undefined) {
        setLowStockThreshold(Number(res.low_stock_threshold));
      }
      setPagination(res.pagination || { page: targetPage, totalPages: 1, total: 0, limit });
      setPage(targetPage);
    } catch (err) {
      if (isUnauthorized(err)) {
        onAuthError?.();
      } else {
        setError(err.message || 'Failed to load inventory.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory(1);
  }, []);

  const filteredData = useMemo(() => {
    let items = rawData;

    if (filter === 'low') {
      items = items.filter((i) => i.stock_quantity > 0 && i.stock_quantity <= lowStockThreshold);
    } else if (filter === 'out') {
      items = items.filter((i) => i.stock_quantity === 0);
    }

    const term = search.trim().toLowerCase();
    if (term) {
      items = items.filter((i) =>
        (i.product_name || '').toLowerCase().includes(term) ||
        (i.sku || '').toLowerCase().includes(term) ||
        (i.color || '').toLowerCase().includes(term) ||
        (i.size || '').toLowerCase().includes(term)
      );
    }

    return items;
  }, [rawData, filter, search, lowStockThreshold]);

  const handleError = (err) => {
    if (isUnauthorized(err)) {
      onAuthError?.();
    } else {
      setError(err.message || 'Request failed.');
    }
  };

  const handleStockChange = (variantId, value) => {
    setEditValues((prev) => ({ ...prev, [variantId]: value }));
  };

  const handleUpdateStock = async (variantId) => {
    const value = editValues[variantId];
    const newStock = Number(value);
    if (Number.isNaN(newStock) || newStock < 0) {
      window.alert('Please enter a valid non-negative stock quantity.');
      return;
    }
    const reason = window.prompt('Enter the reason for this stock change:');
    if (reason === null) return;
    if (!reason.trim()) {
      window.alert('Change reason is required.');
      return;
    }

    setError('');
    try {
      await updateVariantStock(variantId, {
        stock_quantity: newStock,
        change_reason: reason.trim(),
      });
      setEditValues((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
      await fetchInventory(page);
    } catch (err) {
      handleError(err);
    }
  };

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchInventory(newPage);
  };

  const getStockStatus = (qty) => {
    if (qty === 0) return { label: 'Out of Stock', color: 'red' };
    if (qty <= lowStockThreshold) return { label: 'Low Stock', color: 'orange' };
    return { label: 'In Stock', color: 'green' };
  };

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <button onClick={() => setFilter('all')} style={{ ...filterBtnStyle, fontWeight: filter === 'all' ? 'bold' : 'normal' }}>
          All
        </button>
        <button onClick={() => setFilter('low')} style={{ ...filterBtnStyle, fontWeight: filter === 'low' ? 'bold' : 'normal' }}>
          Low Stock
        </button>
        <button onClick={() => setFilter('out')} style={{ ...filterBtnStyle, fontWeight: filter === 'out' ? 'bold' : 'normal' }}>
          Out of Stock
        </button>
        <input
          type="text"
          placeholder="Search product, SKU, color, size…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 8, flex: 1, minWidth: 200 }}
        />
        <span style={{ fontSize: 13, color: '#666' }}>
          Low stock threshold: {lowStockThreshold}
        </span>
      </div>

      {loading && <p>Loading inventory…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && filteredData.length === 0 && <p>No inventory found.</p>}

      {!loading && filteredData.length > 0 && (
        <>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Product ID</th>
                <th style={thStyle}>Product Name</th>
                <th style={thStyle}>Variant ID</th>
                <th style={thStyle}>SKU</th>
                <th style={thStyle}>Color</th>
                <th style={thStyle}>Size</th>
                <th style={thStyle}>Stock</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((i) => {
                const status = getStockStatus(i.stock_quantity);
                return (
                  <tr key={i.variant_id}>
                    <td style={tdStyle}>{i.product_id}</td>
                    <td style={tdStyle}>{i.product_name || '-'}</td>
                    <td style={tdStyle}>{i.variant_id}</td>
                    <td style={tdStyle}>{i.sku || '-'}</td>
                    <td style={tdStyle}>{i.color || '-'}</td>
                    <td style={tdStyle}>{i.size || '-'}</td>
                    <td style={tdStyle}>
                      <input
                        type="number"
                        min="0"
                        value={editValues[i.variant_id] ?? i.stock_quantity}
                        onChange={(e) => handleStockChange(i.variant_id, e.target.value)}
                        style={{ width: 80, padding: 4 }}
                      />
                    </td>
                    <td style={{ ...tdStyle, color: status.color, fontWeight: 600 }}>
                      {status.label}
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => handleUpdateStock(i.variant_id)} style={btnStyle}>
                        Update Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {pagination.totalPages > 1 && (
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => goToPage(page - 1)} disabled={page <= 1} style={pageBtnStyle}>
                Previous
              </button>
              <span>
                Page {page} of {pagination.totalPages} ({pagination.total || 0} total)
              </span>
              <button onClick={() => goToPage(page + 1)} disabled={page >= pagination.totalPages} style={pageBtnStyle}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Inventory;
