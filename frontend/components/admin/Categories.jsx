import React, { useEffect, useState } from 'react';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus,
} from '../../services/adminApi.js';

const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: 12 };
const thStyle = { textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' };
const tdStyle = { padding: '8px 4px', borderBottom: '1px solid #eee' };
const inputStyle = { display: 'block', width: '100%', marginBottom: 8, padding: 8 };
const btnStyle = { padding: '4px 8px', marginRight: 4, cursor: 'pointer' };

function getParentName(categories, id) {
  const parent = categories.find((c) => c.id === id);
  return parent ? parent.name : id || '-';
}

function isUnauthorized(err) {
  const message = (err.message || '').toLowerCase();
  return message.includes('unauthorized') || message.includes('401');
}

function Categories({ onAuthError }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', parent_id: '', display_order: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllCategories();
      setData(res.categories || res || []);
    } catch (err) {
      if (isUnauthorized(err)) {
        onAuthError?.();
      } else {
        setError(err.message || 'Failed to load categories.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleError = (err) => {
    if (isUnauthorized(err)) {
      onAuthError?.();
    } else {
      setError(err.message || 'Request failed.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      parent_id:
        form.parent_id === '' || form.parent_id === null
          ? null
          : Number(form.parent_id),
      display_order: Number(form.display_order || 0),
    };
    try {
      if (editingId) {
        await updateCategory(editingId, payload);
      } else {
        await createCategory(payload);
      }
      setForm({ name: '', parent_id: '', display_order: '' });
      setEditingId(null);
      await fetchCategories();
    } catch (err) {
      handleError(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteCategory(id);
      await fetchCategories();
    } catch (err) {
      handleError(err);
    }
  };

  const handleStatus = async (id, isActive) => {
    try {
      await updateCategoryStatus(id, { is_active: !isActive });
      await fetchCategories();
    } catch (err) {
      handleError(err);
    }
  };

  const startEdit = (cat) => {
    setForm({
      name: cat.name,
      parent_id: cat.parent_id === null ? '' : String(cat.parent_id),
      display_order: String(cat.display_order || 0),
    });
    setEditingId(cat.id);
  };

  const startAdd = () => {
    setForm({ name: '', parent_id: '', display_order: '' });
    setEditingId(null);
  };

  const cancelForm = () => {
    setForm({ name: '', parent_id: '', display_order: '' });
    setEditingId(null);
  };

  const parentOptions = data.filter((c) => c.id !== editingId);

  return (
    <div>
      <button onClick={startAdd} style={btnStyle}>
        Add Category
      </button>

      <form
        onSubmit={handleSave}
        style={{
          margin: '16px 0',
          padding: 16,
          border: '1px solid #ddd',
          borderRadius: 8,
          background: '#fff',
        }}
      >
        <h4 style={{ marginTop: 0 }}>{editingId ? 'Edit Category' : 'Add Category'}</h4>
        <input
          style={inputStyle}
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <select
          style={inputStyle}
          value={form.parent_id}
          onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
        >
          <option value="">No Parent</option>
          {parentOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          style={inputStyle}
          type="number"
          placeholder="Display Order"
          value={form.display_order}
          onChange={(e) => setForm({ ...form, display_order: e.target.value })}
          required
        />
        <button type="submit" style={btnStyle}>
          {editingId ? 'Update' : 'Add'}
        </button>
        <button type="button" onClick={cancelForm} style={btnStyle}>
          Cancel
        </button>
      </form>

      {loading && <p>Loading categories…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && data.length === 0 && <p>No categories found.</p>}

      {!loading && data.length > 0 && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Parent</th>
              <th style={thStyle}>Order</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((cat) => (
              <tr key={cat.id}>
                <td style={tdStyle}>{cat.id}</td>
                <td style={tdStyle}>{cat.name}</td>
                <td style={tdStyle}>
                  {cat.parent_id ? getParentName(data, cat.parent_id) : '-'}
                </td>
                <td style={tdStyle}>{cat.display_order}</td>
                <td style={tdStyle}>{cat.is_active ? 'Active' : 'Inactive'}</td>
                <td style={tdStyle}>
                  <button onClick={() => startEdit(cat)} style={btnStyle}>
                    Edit
                  </button>
                  <button onClick={() => handleStatus(cat.id, cat.is_active)} style={btnStyle}>
                    {cat.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(cat.id)} style={btnStyle}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Categories;
