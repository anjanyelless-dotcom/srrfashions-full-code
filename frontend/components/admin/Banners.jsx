import React, { useEffect, useState } from 'react';
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  updateBannerStatus,
} from '../../services/adminApi.js';

const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: 12 };
const thStyle = { textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' };
const tdStyle = { padding: '8px 4px', borderBottom: '1px solid #eee' };
const inputStyle = { display: 'block', width: '100%', marginBottom: 8, padding: 8 };
const btnStyle = { padding: '4px 8px', marginRight: 4, cursor: 'pointer' };

const VALID_TYPES = ['HOME', 'OFFER'];

function isUnauthorized(err) {
  const message = (err.message || '').toLowerCase();
  return message.includes('unauthorized') || message.includes('401');
}

function Banners({ onAuthError }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    link_url: '',
    banner_type: 'HOME',
    display_order: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [editingId, setEditingId] = useState(null);

  const fetchBanners = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getBanners();
      setData(res.banners || res || []);
    } catch (err) {
      if (isUnauthorized(err)) {
        onAuthError?.();
      } else {
        setError(err.message || 'Failed to load banners.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleError = (err) => {
    if (isUnauthorized(err)) {
      onAuthError?.();
    } else {
      setError(err.message || 'Request failed.');
    }
  };

  const clearForm = () => {
    setForm({ link_url: '', banner_type: 'HOME', display_order: '' });
    setImageFile(null);
    setImagePreview('');
    setEditingId(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const displayOrder = Number(form.display_order);
    if (Number.isNaN(displayOrder)) {
      setError('Display order must be a valid number.');
      return;
    }
    if (!editingId && !imageFile) {
      setError('Please select a banner image.');
      return;
    }
    if (!VALID_TYPES.includes(form.banner_type)) {
      setError('Please select a valid banner type.');
      return;
    }

    const payload = {
      link_url: form.link_url.trim() || null,
      banner_type: form.banner_type,
      display_order: displayOrder,
    };

    setError('');
    try {
      if (editingId) {
        await updateBanner(editingId, payload, imageFile);
      } else {
        await createBanner(payload, imageFile);
      }
      clearForm();
      await fetchBanners();
    } catch (err) {
      handleError(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await deleteBanner(id);
      await fetchBanners();
    } catch (err) {
      handleError(err);
    }
  };

  const handleStatus = async (id, isActive) => {
    try {
      await updateBannerStatus(id, { is_active: !isActive });
      await fetchBanners();
    } catch (err) {
      handleError(err);
    }
  };

  const startEdit = (banner) => {
    setForm({
      link_url: banner.link_url || '',
      banner_type: banner.banner_type || 'HOME',
      display_order: String(banner.display_order || 0),
    });
    setImageFile(null);
    setImagePreview(banner.image_url || '');
    setEditingId(banner.id);
  };

  return (
    <div>
      <form
        onSubmit={handleSave}
        style={{
          marginBottom: 16,
          padding: 16,
          border: '1px solid #ddd',
          borderRadius: 8,
          background: '#fff',
        }}
      >
        <h4 style={{ marginTop: 0 }}>{editingId ? 'Edit Banner' : 'Add Banner'}</h4>
        <input
          style={inputStyle}
          placeholder="Link URL"
          value={form.link_url}
          onChange={(e) => setForm({ ...form, link_url: e.target.value })}
        />
        <select
          style={inputStyle}
          value={form.banner_type}
          onChange={(e) => setForm({ ...form, banner_type: e.target.value })}
        >
          <option value="HOME">HOME</option>
          <option value="OFFER">OFFER</option>
        </select>
        <input
          style={inputStyle}
          type="number"
          placeholder="Display Order"
          value={form.display_order}
          onChange={(e) => setForm({ ...form, display_order: e.target.value })}
          required
        />
        <input
          style={inputStyle}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        {imagePreview && (
          <div style={{ marginBottom: 12 }}>
            <img
              src={imagePreview}
              alt="Preview"
              style={{ maxWidth: 120, maxHeight: 80, objectFit: 'cover', borderRadius: 4 }}
            />
          </div>
        )}
        <button type="submit" style={btnStyle}>
          {editingId ? 'Update' : 'Add'}
        </button>
        <button type="button" onClick={clearForm} style={btnStyle}>
          Cancel
        </button>
      </form>

      {loading && <p>Loading banners…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && data.length === 0 && <p>No banners found.</p>}

      {!loading && data.length > 0 && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Image</th>
              <th style={thStyle}>Link URL</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Order</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((b) => (
              <tr key={b.id}>
                <td style={tdStyle}>{b.id}</td>
                <td style={tdStyle}>
                  {b.image_url ? (
                    <img
                      src={b.image_url}
                      alt="Banner"
                      style={{ width: 100, height: 60, objectFit: 'cover', borderRadius: 4 }}
                    />
                  ) : (
                    '-'
                  )}
                </td>
                <td style={tdStyle}>{b.link_url || '-'}</td>
                <td style={tdStyle}>{b.banner_type}</td>
                <td style={tdStyle}>{b.display_order}</td>
                <td style={tdStyle}>{b.is_active ? 'Active' : 'Inactive'}</td>
                <td style={tdStyle}>
                  <button onClick={() => startEdit(b)} style={btnStyle}>
                    Edit
                  </button>
                  <button onClick={() => handleStatus(b.id, b.is_active)} style={btnStyle}>
                    {b.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(b.id)} style={btnStyle}>
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

export default Banners;
