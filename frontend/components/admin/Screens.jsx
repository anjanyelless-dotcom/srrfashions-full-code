import React, { useEffect, useState } from 'react';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  getAdminOrders,
  updateOrderStatus,
  cancelAdminOrder,
  getCustomers,
  updateCustomerStatus,
  getInventory,
  getLowStock,
  getOutOfStock,
  updateVariantStock,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  updateBannerStatus,
} from '../../services/adminApi.js';
import { formatPrice } from '../../services/price.js';

const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: 12 };
const thStyle = { textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' };
const tdStyle = { padding: '8px 4px', borderBottom: '1px solid #eee' };
const inputStyle = { display: 'block', width: '100%', marginBottom: 8, padding: 8 };
const btnStyle = { padding: '4px 8px', marginRight: 4, cursor: 'pointer' };

const formatMoney = (value) => formatPrice(value);
const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');

function Screens({ view }) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    getAllCategories().then((res) => setCategories(res.categories || res || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    setData([]);
    setMeta(null);
    setForm({});
    setEditingId(null);

    const fetch = async () => {
      try {
        let res;
        switch (view) {
          case 'categories':
            res = await getAllCategories();
            break;
          case 'products':
            res = await getAllProducts();
            break;
          case 'orders':
            res = await getAdminOrders();
            break;
          case 'customers':
            res = await getCustomers();
            break;
          case 'inventory':
            res = await getInventory();
            break;
          case 'banners':
            res = await getBanners();
            break;
          default:
            res = [];
        }
        if (res && (res.categories || res.products || res.orders || res.customers || res.inventory || res.banners)) {
          setData(res.categories || res.products || res.orders || res.customers || res.inventory || res.banners);
          setMeta(res.pagination || null);
        } else {
          setData(Array.isArray(res) ? res : []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [view]);

  const refresh = () => {
    // trigger useEffect by toggling a state? Simpler: re-call fetch in place
    setLoading(true);
    setError('');
    (async () => {
      try {
        let res;
        switch (view) {
          case 'categories': res = await getAllCategories(); break;
          case 'products': res = await getAllProducts(); break;
          case 'orders': res = await getAdminOrders(); break;
          case 'customers': res = await getCustomers(); break;
          case 'inventory': res = await getInventory(); break;
          case 'banners': res = await getBanners(); break;
          default: res = [];
        }
        if (res && (res.categories || res.products || res.orders || res.customers || res.inventory || res.banners)) {
          setData(res.categories || res.products || res.orders || res.customers || res.inventory || res.banners);
          setMeta(res.pagination || null);
        } else {
          setData(Array.isArray(res) ? res : []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    })();
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (view === 'categories') {
        if (editingId) await updateCategory(editingId, form);
        else await createCategory(form);
      } else if (view === 'products') {
        if (editingId) await updateProduct(editingId, form);
        else await createProduct(form);
      } else if (view === 'banners') {
        const imageFile = form.imageFile || null;
        const { imageFile: _, ...payload } = form;
        if (editingId) await updateBanner(editingId, payload, imageFile);
        else await createBanner(payload, imageFile);
      }
      setForm({});
      setEditingId(null);
      refresh();
    } catch (err) {
      setError(err.message || 'Save failed.');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    setError('');
    try {
      if (view === 'categories') await deleteCategory(id);
      else if (view === 'products') await deleteProduct(id);
      else if (view === 'banners') await deleteBanner(id);
      refresh();
    } catch (err) {
      setError(err.message || 'Delete failed.');
    }
  };

  const toggleStatus = async (id, isActive) => {
    setError('');
    try {
      if (view === 'categories') await updateCategoryStatus(id, { is_active: !isActive });
      else if (view === 'products') await updateProductStatus(id, { is_active: !isActive });
      else if (view === 'banners') await updateBannerStatus(id, { is_active: !isActive });
      else if (view === 'customers') await updateCustomerStatus(id, { is_active: !isActive });
      refresh();
    } catch (err) {
      setError(err.message || 'Status update failed.');
    }
  };

  const updateStock = async (variantId, newStock) => {
    setError('');
    try {
      await updateVariantStock(variantId, { stock_quantity: newStock });
      refresh();
    } catch (err) {
      setError(err.message || 'Stock update failed.');
    }
  };

  const updateOrder = async (id, orderStatus) => {
    setError('');
    try {
      await updateOrderStatus(id, { order_status: orderStatus });
      refresh();
    } catch (err) {
      setError(err.message || 'Order status update failed.');
    }
  };

  const cancelOrder = async (id) => {
    const reason = window.prompt('Cancellation reason:');
    if (!reason) return;
    setError('');
    try {
      await cancelAdminOrder(id, { cancellation_reason: reason });
      refresh();
    } catch (err) {
      setError(err.message || 'Order cancel failed.');
    }
  };

  const inventoryTabs = async (tab) => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (tab === 'low') res = await getLowStock();
      else if (tab === 'out') res = await getOutOfStock();
      else res = await getInventory();
      setData(res.inventory || res.products || res || []);
      setMeta(res.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  const startAdd = () => {
    setForm({});
    setEditingId(null);
  };

  const startEdit = (item) => {
    setForm({ ...item });
    setEditingId(item.id);
  };

  const cancelForm = () => {
    setForm({});
    setEditingId(null);
  };

  const renderForm = () => {
    if (view === 'categories') {
      return (
        <form onSubmit={save} style={{ marginBottom: 20, padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
          <h4>{editingId ? 'Edit Category' : 'Add Category'}</h4>
          <input style={inputStyle} placeholder="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input style={inputStyle} type="number" placeholder="Parent ID" value={form.parent_id || ''} onChange={(e) => setForm({ ...form, parent_id: e.target.value ? Number(e.target.value) : '' })} />
          <input style={inputStyle} type="number" placeholder="Display Order" value={form.display_order || ''} onChange={(e) => setForm({ ...form, display_order: e.target.value ? Number(e.target.value) : 0 })} />
          <label style={{ display: 'block', marginBottom: 8 }}>
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
          <button type="submit" style={btnStyle}>{editingId ? 'Update' : 'Add'}</button>
          <button type="button" onClick={cancelForm} style={btnStyle}>Cancel</button>
        </form>
      );
    }

    if (view === 'products') {
      return (
        <form onSubmit={save} style={{ marginBottom: 20, padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
          <h4>{editingId ? 'Edit Product' : 'Add Product'}</h4>
          <input style={inputStyle} placeholder="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <textarea style={{ ...inputStyle, minHeight: 60 }} placeholder="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select style={inputStyle} value={form.category_id || ''} onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })} required>
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input style={inputStyle} type="number" step="0.01" placeholder="Regular Price" value={form.regular_price || ''} onChange={(e) => setForm({ ...form, regular_price: e.target.value })} required />
          <input style={inputStyle} type="number" step="0.01" placeholder="Selling Price" value={form.selling_price || ''} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} required />
          <input style={inputStyle} type="number" step="0.01" placeholder="Discount" value={form.discount || ''} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
          <button type="submit" style={btnStyle}>{editingId ? 'Update' : 'Add'}</button>
          <button type="button" onClick={cancelForm} style={btnStyle}>Cancel</button>
        </form>
      );
    }

    if (view === 'banners') {
      return (
        <form onSubmit={save} style={{ marginBottom: 20, padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
          <h4>{editingId ? 'Edit Banner' : 'Add Banner'}</h4>
          <select style={inputStyle} value={form.banner_type || 'HOME'} onChange={(e) => setForm({ ...form, banner_type: e.target.value })} required>
            <option value="HOME">Home</option>
            <option value="OFFER">Offer</option>
          </select>
          <input style={inputStyle} placeholder="Link URL" value={form.link_url || ''} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
          <input style={inputStyle} type="number" placeholder="Display Order" value={form.display_order || ''} onChange={(e) => setForm({ ...form, display_order: e.target.value ? Number(e.target.value) : 0 })} />
          <input style={inputStyle} type="file" accept="image/*" onChange={(e) => setForm({ ...form, imageFile: e.target.files[0] })} />
          <label style={{ display: 'block', marginBottom: 8 }}>
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
          <button type="submit" style={btnStyle}>{editingId ? 'Update' : 'Add'}</button>
          <button type="button" onClick={cancelForm} style={btnStyle}>Cancel</button>
        </form>
      );
    }

    return null;
  };

  const renderCategories = () => (
    <>
      <button onClick={startAdd} style={btnStyle}>Add Category</button>
      {renderForm()}
      <table style={tableStyle}>
        <thead><tr><th style={thStyle}>ID</th><th style={thStyle}>Name</th><th style={thStyle}>Parent</th><th style={thStyle}>Order</th><th style={thStyle}>Status</th><th style={thStyle}>Actions</th></tr></thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.id}>
              <td style={tdStyle}>{c.id}</td>
              <td style={tdStyle}>{c.name}</td>
              <td style={tdStyle}>{c.parent_id || '-'}</td>
              <td style={tdStyle}>{c.display_order}</td>
              <td style={tdStyle}>{c.is_active ? 'Active' : 'Inactive'}</td>
              <td style={tdStyle}>
                <button onClick={() => startEdit(c)} style={btnStyle}>Edit</button>
                <button onClick={() => toggleStatus(c.id, c.is_active)} style={btnStyle}>{c.is_active ? 'Deactivate' : 'Activate'}</button>
                <button onClick={() => remove(c.id)} style={btnStyle}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  const renderProducts = () => (
    <>
      <button onClick={startAdd} style={btnStyle}>Add Product</button>
      {renderForm()}
      <table style={tableStyle}>
        <thead><tr><th style={thStyle}>Image</th><th style={thStyle}>Name</th><th style={thStyle}>Category</th><th style={thStyle}>Regular</th><th style={thStyle}>Selling</th><th style={thStyle}>Status</th><th style={thStyle}>Actions</th></tr></thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.id}>
              <td style={tdStyle}>{p.main_image_url ? <img src={p.main_image_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover' }} /> : '-'}</td>
              <td style={tdStyle}>{p.name}</td>
              <td style={tdStyle}>{p.category_name || categories.find((c) => c.id === p.category_id)?.name || p.category_id}</td>
              <td style={tdStyle}>{formatMoney(p.regular_price)}</td>
              <td style={tdStyle}>{formatMoney(p.selling_price)}</td>
              <td style={tdStyle}>{p.is_active ? 'Active' : 'Inactive'}</td>
              <td style={tdStyle}>
                <button onClick={() => startEdit(p)} style={btnStyle}>Edit</button>
                <button onClick={() => toggleStatus(p.id, p.is_active)} style={btnStyle}>{p.is_active ? 'Deactivate' : 'Activate'}</button>
                <button onClick={() => remove(p.id)} style={btnStyle}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  const renderOrders = () => (
    <table style={tableStyle}>
      <thead><tr><th style={thStyle}>ID</th><th style={thStyle}>Customer</th><th style={thStyle}>Total</th><th style={thStyle}>Payment</th><th style={thStyle}>Status</th><th style={thStyle}>Date</th><th style={thStyle}>Actions</th></tr></thead>
      <tbody>
        {data.map((o) => (
          <tr key={o.id}>
            <td style={tdStyle}>{o.id}</td>
            <td style={tdStyle}>{o.customer_name}</td>
            <td style={tdStyle}>{formatMoney(o.final_amount)}</td>
            <td style={tdStyle}>{o.payment_status}</td>
            <td style={tdStyle}>
              <select value={o.order_status} onChange={(e) => updateOrder(o.id, e.target.value)} style={{ padding: 4 }}>
                {['PENDING','PAYMENT_VERIFICATION_PENDING','PAYMENT_REJECTED','CONFIRMED','PROCESSING','PACKED','SHIPPED','DELIVERED','CANCELLED'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </td>
            <td style={tdStyle}>{formatDate(o.created_at)}</td>
            <td style={tdStyle}>
              <button onClick={() => cancelOrder(o.id)} style={btnStyle}>Cancel</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderCustomers = () => (
    <table style={tableStyle}>
      <thead><tr><th style={thStyle}>Name</th><th style={thStyle}>Email</th><th style={thStyle}>Phone</th><th style={thStyle}>Registered</th><th style={thStyle}>Status</th><th style={thStyle}>Actions</th></tr></thead>
      <tbody>
        {data.map((c) => (
          <tr key={c.id}>
            <td style={tdStyle}>{c.full_name}</td>
            <td style={tdStyle}>{c.email}</td>
            <td style={tdStyle}>{c.mobile_number}</td>
            <td style={tdStyle}>{formatDate(c.created_at)}</td>
            <td style={tdStyle}>{c.is_active ? 'Active' : 'Inactive'}</td>
            <td style={tdStyle}>
              <button onClick={() => toggleStatus(c.id, c.is_active)} style={btnStyle}>{c.is_active ? 'Deactivate' : 'Activate'}</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderInventory = () => (
    <>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => inventoryTabs('all')} style={btnStyle}>All</button>
        <button onClick={() => inventoryTabs('low')} style={btnStyle}>Low Stock</button>
        <button onClick={() => inventoryTabs('out')} style={btnStyle}>Out of Stock</button>
      </div>
      <table style={tableStyle}>
        <thead><tr><th style={thStyle}>Product</th><th style={thStyle}>SKU</th><th style={thStyle}>Color</th><th style={thStyle}>Size</th><th style={thStyle}>Stock</th><th style={thStyle}>Actions</th></tr></thead>
        <tbody>
          {data.map((i) => (
            <tr key={i.variant_id || i.id}>
              <td style={tdStyle}>{i.product_name}</td>
              <td style={tdStyle}>{i.sku}</td>
              <td style={tdStyle}>{i.color}</td>
              <td style={tdStyle}>{i.size}</td>
              <td style={tdStyle}>
                <input
                  type="number"
                  defaultValue={i.stock_quantity}
                  onBlur={(e) => updateStock(i.variant_id, Number(e.target.value))}
                  style={{ width: 80, padding: 4 }}
                />
              </td>
              <td style={tdStyle}>
                {i.stock_quantity <= (meta?.low_stock_threshold || 10) && i.stock_quantity > 0 ? (
                  <span style={{ color: 'orange' }}>Low</span>
                ) : i.stock_quantity === 0 ? (
                  <span style={{ color: 'red' }}>Out</span>
                ) : (
                  <span style={{ color: 'green' }}>OK</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  const renderBanners = () => (
    <>
      <button onClick={startAdd} style={btnStyle}>Add Banner</button>
      {renderForm()}
      <table style={tableStyle}>
        <thead><tr><th style={thStyle}>Image</th><th style={thStyle}>Type</th><th style={thStyle}>Link</th><th style={thStyle}>Order</th><th style={thStyle}>Status</th><th style={thStyle}>Actions</th></tr></thead>
        <tbody>
          {data.map((b) => (
            <tr key={b.id}>
              <td style={tdStyle}>{b.image_url ? <img src={b.image_url} alt="" style={{ width: 80, height: 40, objectFit: 'cover' }} /> : '-'}</td>
              <td style={tdStyle}>{b.banner_type}</td>
              <td style={tdStyle}>{b.link_url || '-'}</td>
              <td style={tdStyle}>{b.display_order}</td>
              <td style={tdStyle}>{b.is_active ? 'Active' : 'Inactive'}</td>
              <td style={tdStyle}>
                <button onClick={() => startEdit(b)} style={btnStyle}>Edit</button>
                <button onClick={() => toggleStatus(b.id, b.is_active)} style={btnStyle}>{b.is_active ? 'Deactivate' : 'Activate'}</button>
                <button onClick={() => remove(b.id)} style={btnStyle}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  const renderContent = () => {
    if (loading) return <p>Loading…</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!data || data.length === 0) return <p>No data found.</p>;
    switch (view) {
      case 'categories': return renderCategories();
      case 'products': return renderProducts();
      case 'orders': return renderOrders();
      case 'customers': return renderCustomers();
      case 'inventory': return renderInventory();
      case 'banners': return renderBanners();
      default: return <p>Select a menu.</p>;
    }
  };

  return (
    <div>
      <h2 style={{ textTransform: 'capitalize' }}>{view}</h2>
      {renderContent()}
    </div>
  );
}

export default Screens;
