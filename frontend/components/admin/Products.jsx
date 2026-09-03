import React, { useEffect, useState } from 'react';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  getAllCategories,
  getProductById,
} from '../../services/adminApi.js';
import { formatPrice } from '../../services/price.js';

const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: 12 };
const thStyle = { textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' };
const tdStyle = { padding: '8px 4px', borderBottom: '1px solid #eee' };
const inputStyle = { display: 'block', width: '100%', marginBottom: 8, padding: 8 };
const btnStyle = { padding: '4px 8px', marginRight: 4, cursor: 'pointer' };

const formatMoney = (value) => formatPrice(value);

function isUnauthorized(err) {
  const message = (err.message || '').toLowerCase();
  return message.includes('unauthorized') || message.includes('401');
}

function isValidUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function Products({ onAuthError }) {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: '',
    regular_price: '',
    selling_price: '',
    discount: '',
  });
  const [images, setImages] = useState(['']);
  const [videoUrl, setVideoUrl] = useState('');
  const [editingId, setEditingId] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllProducts();
      const products = res.products || res || [];
      setData(products);
    } catch (err) {
      if (isUnauthorized(err)) {
        onAuthError?.();
      } else {
        setError(err.message || 'Failed to load products.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getAllCategories();
      setCategories(res.categories || res || []);
    } catch (err) {
      if (isUnauthorized(err)) onAuthError?.();
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleError = (err) => {
    if (isUnauthorized(err)) {
      onAuthError?.();
    } else {
      setError(err.message || 'Request failed.');
    }
  };

  const parseNumber = (value) => {
    const n = Number(value);
    return Number.isNaN(n) ? 0 : n;
  };

  const validate = () => {
    const filledImages = images
      .map((url) => url.trim())
      .filter(Boolean);

    if (filledImages.length === 0) {
      setError('At least one product image URL is required.');
      return false;
    }

    for (const url of filledImages) {
      if (!isValidUrl(url)) {
        setError(`Invalid image URL: ${url}`);
        return false;
      }
    }

    if (videoUrl.trim() && !isValidUrl(videoUrl.trim())) {
      setError(`Invalid video URL: ${videoUrl}`);
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      category_id: '',
      regular_price: '',
      selling_price: '',
      discount: '',
    });
    setImages(['']);
    setVideoUrl('');
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category_id: form.category_id ? Number(form.category_id) : null,
      regular_price: parseNumber(form.regular_price),
      selling_price: parseNumber(form.selling_price),
      discount: parseNumber(form.discount),
      images: images
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url, i) => ({ image_url: url, display_order: i + 1 })),
      video_url: videoUrl.trim() || null,
    };

    try {
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      resetForm();
      await fetchProducts();
    } catch (err) {
      handleError(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      await fetchProducts();
    } catch (err) {
      handleError(err);
    }
  };

  const handleStatus = async (id, isActive) => {
    try {
      await updateProductStatus(id, { is_active: !isActive });
      await fetchProducts();
    } catch (err) {
      handleError(err);
    }
  };

  const startEdit = async (product) => {
    setError('');
    try {
      const res = await getProductById(product.id);
      const p = res.product || {};
      const productImages = res.images || [];

      setForm({
        name: p.name || '',
        description: p.description || '',
        category_id: p.category_id ? String(p.category_id) : '',
        regular_price: String(p.regular_price || ''),
        selling_price: String(p.selling_price || ''),
        discount: String(p.discount || ''),
      });
      setImages(
        productImages.length > 0
          ? productImages.map((img) => img.image_url)
          : ['']
      );
      setVideoUrl(p.video_url || '');
      setEditingId(product.id);
    } catch (err) {
      handleError(err);
    }
  };

  const startAdd = () => {
    resetForm();
  };

  const addImageField = () => {
    setImages((prev) => [...prev, '']);
  };

  const removeImageField = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const updateImageField = (index, value) => {
    setImages((prev) => prev.map((url, i) => (i === index ? value : url)));
  };

  const getCategoryName = (product) => {
    if (product.category_name) return product.category_name;
    const cat = categories.find((c) => c.id === product.category_id);
    return cat ? cat.name : product.category_id || '-';
  };

  const getImage = (product) => {
    if (product.main_image_url) return product.main_image_url;
    if (product.images && product.images[0]) return product.images[0].image_url;
    return null;
  };

  const categoryOptions = editingId ? categories : categories.filter((c) => c.is_active);

  return (
    <div>
      <button onClick={startAdd} style={btnStyle}>
        Add Product
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
        <h4 style={{ marginTop: 0 }}>{editingId ? 'Edit Product' : 'Add Product'}</h4>
        <input
          style={inputStyle}
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <textarea
          style={{ ...inputStyle, minHeight: 80 }}
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <select
          style={inputStyle}
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          required
        >
          <option value="">Select Category</option>
          {categoryOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          style={inputStyle}
          type="number"
          step="0.01"
          placeholder="Regular Price"
          value={form.regular_price}
          onChange={(e) => setForm({ ...form, regular_price: e.target.value })}
          required
        />
        <input
          style={inputStyle}
          type="number"
          step="0.01"
          placeholder="Selling Price"
          value={form.selling_price}
          onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
          required
        />
        <input
          style={inputStyle}
          type="number"
          step="0.01"
          placeholder="Discount"
          value={form.discount}
          onChange={(e) => setForm({ ...form, discount: e.target.value })}
        />

        <div style={{ marginBottom: 12 }}>
          <h5 style={{ margin: '0 0 8px' }}>Cloudinary Product Images</h5>
          {images.map((url, i) => (
            <div key={i} style={{ marginBottom: 12, border: '1px solid #eee', padding: 8, borderRadius: 6 }}>
              <input
                style={{ ...inputStyle, marginBottom: 6 }}
                type="text"
                placeholder={`Product Image URL ${i + 1}${i === 0 ? ' *' : ''}`}
                value={url}
                onChange={(e) => updateImageField(i, e.target.value)}
              />
              {isValidUrl(url) && (
                <img
                  src={url.trim()}
                  alt={`Preview ${i + 1}`}
                  style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 4, marginRight: 8 }}
                />
              )}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImageField(i)}
                  style={{ ...btnStyle, color: '#c00' }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {images.length < 3 && (
            <button type="button" onClick={addImageField} style={btnStyle}>
              + Add Image URL
            </button>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <h5 style={{ margin: '0 0 8px' }}>Cloudinary Product Video (optional)</h5>
          <input
            style={inputStyle}
            type="text"
            placeholder="Product Video URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          {isValidUrl(videoUrl) && (
            <video
              src={videoUrl.trim()}
              controls
              width="240"
              height="135"
              style={{ display: 'block', marginTop: 8, borderRadius: 4 }}
            />
          )}
        </div>

        <button type="submit" style={btnStyle}>
          {editingId ? 'Update' : 'Add'}
        </button>
        <button type="button" onClick={resetForm} style={btnStyle}>
          Cancel
        </button>
      </form>

      {loading && <p>Loading products…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && data.length === 0 && <p>No products found.</p>}

      {!loading && data.length > 0 && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Image</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Regular</th>
              <th style={thStyle}>Selling</th>
              <th style={thStyle}>Media</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id}>
                <td style={tdStyle}>
                  {getImage(p) ? (
                    <img
                      src={getImage(p)}
                      alt={p.name}
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                    />
                  ) : (
                    '-'
                  )}
                </td>
                <td style={tdStyle}>{p.name}</td>
                <td style={tdStyle}>{getCategoryName(p)}</td>
                <td style={tdStyle}>{formatMoney(p.regular_price)}</td>
                <td style={tdStyle}>{formatMoney(p.selling_price)}</td>
                <td style={tdStyle}>
                  <small>
                    {p.image_count > 0 ? `${p.image_count} image${p.image_count > 1 ? 's' : ''}` : 'No images'}
                    {p.video_url ? ' • Video' : ''}
                  </small>
                </td>
                <td style={tdStyle}>{p.is_active ? 'Active' : 'Inactive'}</td>
                <td style={tdStyle}>
                  <button onClick={() => startEdit(p)} style={btnStyle}>
                    Edit
                  </button>
                  <button onClick={() => handleStatus(p.id, p.is_active)} style={btnStyle}>
                    {p.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(p.id)} style={btnStyle}>
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

export default Products;
