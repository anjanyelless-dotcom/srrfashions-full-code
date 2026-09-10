import React, { useEffect, useState } from 'react';
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../services/addressApi.js';

const initialForm = {
  first_name: '',
  last_name: '',
  mobile_number: '',
  house_flat: '',
  street_area: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  landmark: '',
};

function isUnauthorized(err) {
  const message = (err?.message || '').toLowerCase();
  return message.includes('unauthorized') || message.includes('401');
}

function redirectToLogin() {
  try {
    sessionStorage.setItem('redirectAfterLogin', window.location.hash);
  } catch {
    // ignore
  }
  window.location.hash = '#my-account';
}

function clearCustomerAuth() {
  localStorage.removeItem('customer_token');
  localStorage.removeItem('customer_user');
}

function formatAddress(addr) {
  const parts = [
    addr.house_flat,
    addr.street_area,
    addr.city,
    addr.state,
    addr.pincode,
  ].filter(Boolean);
  return parts.join(', ');
}

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const fetchAddresses = async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) {
      redirectToLogin();
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await getAddresses();
      setAddresses(res.addresses || []);
    } catch (err) {
      if (isUnauthorized(err)) {
        clearCustomerAuth();
        redirectToLogin();
      } else {
        setError(err.message || 'Failed to load addresses.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const required = ['first_name', 'last_name', 'mobile_number', 'house_flat', 'street_area', 'city', 'state', 'pincode'];
    for (const field of required) {
      if (!String(form[field] || '').trim()) {
        setError(`${field.replace('_', ' ')} is required.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('customer_token');
    if (!token) {
      redirectToLogin();
      return;
    }

    if (!validate()) return;

    const payload = {
      name: `${form.first_name.trim()} ${form.last_name.trim()}`,
      mobile_number: form.mobile_number.trim(),
      house_flat: form.house_flat.trim(),
      street_area: form.street_area.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      landmark: form.landmark.trim() || null,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateAddress(editingId, payload);
        setSuccess('Address updated successfully.');
      } else {
        await addAddress(payload);
        setSuccess('Address added successfully.');
      }
      setForm(initialForm);
      setEditingId(null);
      await fetchAddresses();

      // Return to checkout if flag is set
      const returnToCheckout = sessionStorage.getItem('returnToCheckout');
      if (returnToCheckout === 'true') {
        sessionStorage.removeItem('returnToCheckout');
        window.location.hash = '#checkout';
      }
    } catch (err) {
      if (isUnauthorized(err)) {
        clearCustomerAuth();
        redirectToLogin();
      } else {
        setError(err.message || 'Failed to save address.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (addr) => {
    const nameParts = (addr.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    setForm({
      first_name: firstName,
      last_name: lastName,
      mobile_number: addr.mobile_number || '',
      house_flat: addr.house_flat || '',
      street_area: addr.street_area || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      country: addr.country || 'India',
      landmark: addr.landmark || '',
    });
    setEditingId(addr.id);
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setForm(initialForm);
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this address?')) return;

    const token = localStorage.getItem('customer_token');
    if (!token) {
      redirectToLogin();
      return;
    }

    try {
      await deleteAddress(id);
      setSuccess('Address removed successfully.');
      if (editingId === id) {
        setForm(initialForm);
        setEditingId(null);
      }
      await fetchAddresses();
    } catch (err) {
      if (isUnauthorized(err)) {
        clearCustomerAuth();
        redirectToLogin();
      } else {
        setError(err.message || 'Failed to remove address.');
      }
    }
  };

  const handleSetDefault = async (id) => {
    const token = localStorage.getItem('customer_token');
    if (!token) {
      redirectToLogin();
      return;
    }

    try {
      await setDefaultAddress(id);
      setSuccess('Default address updated successfully.');
      await fetchAddresses();
    } catch (err) {
      if (isUnauthorized(err)) {
        clearCustomerAuth();
        redirectToLogin();
      } else {
        setError(err.message || 'Failed to set default address.');
      }
    }
  };

  return (
    <div className="srfashion-addresses">
      <h2 className="srfashion-form-title">
        {editingId ? 'Update Address' : 'Add Address'}
      </h2>

      {error && (
        <ul className="woocommerce-error" role="alert">
          <li>{error}</li>
        </ul>
      )}
      {success && (
        <div className="woocommerce-message" role="status">
          {success}
        </div>
      )}

      <form className="woocommerce-form" onSubmit={handleSubmit} noValidate>
        <p className="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
          <label htmlFor="addr_first_name">
            First Name <span className="required" aria-hidden="true">*</span>
          </label>
          <input
            id="addr_first_name"
            name="first_name"
            className="woocommerce-Input woocommerce-Input--text input-text"
            value={form.first_name}
            onChange={handleChange}
            disabled={saving}
            required
          />
        </p>
        <p className="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
          <label htmlFor="addr_last_name">
            Last Name <span className="required" aria-hidden="true">*</span>
          </label>
          <input
            id="addr_last_name"
            name="last_name"
            className="woocommerce-Input woocommerce-Input--text input-text"
            value={form.last_name}
            onChange={handleChange}
            disabled={saving}
            required
          />
        </p>
        <p className="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
          <label htmlFor="addr_mobile">
            Mobile number <span className="required" aria-hidden="true">*</span>
          </label>
          <input
            id="addr_mobile"
            name="mobile_number"
            className="woocommerce-Input woocommerce-Input--text input-text"
            value={form.mobile_number}
            onChange={handleChange}
            disabled={saving}
            required
          />
        </p>
        <p className="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
          <label htmlFor="addr_house_flat">
            House / Flat <span className="required" aria-hidden="true">*</span>
          </label>
          <input
            id="addr_house_flat"
            name="house_flat"
            className="woocommerce-Input woocommerce-Input--text input-text"
            value={form.house_flat}
            onChange={handleChange}
            disabled={saving}
            required
          />
        </p>
        <p className="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
          <label htmlFor="addr_street_area">
            Street / Area <span className="required" aria-hidden="true">*</span>
          </label>
          <input
            id="addr_street_area"
            name="street_area"
            className="woocommerce-Input woocommerce-Input--text input-text"
            value={form.street_area}
            onChange={handleChange}
            disabled={saving}
            required
          />
        </p>
        <p className="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
          <label htmlFor="addr_city">
            City <span className="required" aria-hidden="true">*</span>
          </label>
          <input
            id="addr_city"
            name="city"
            className="woocommerce-Input woocommerce-Input--text input-text"
            value={form.city}
            onChange={handleChange}
            disabled={saving}
            required
          />
        </p>
        <p className="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
          <label htmlFor="addr_state">
            State <span className="required" aria-hidden="true">*</span>
          </label>
          <input
            id="addr_state"
            name="state"
            className="woocommerce-Input woocommerce-Input--text input-text"
            value={form.state}
            onChange={handleChange}
            disabled={saving}
            required
          />
        </p>
        <p className="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
          <label htmlFor="addr_pincode">
            PIN/ZIP Code <span className="required" aria-hidden="true">*</span>
          </label>
          <input
            id="addr_pincode"
            name="pincode"
            className="woocommerce-Input woocommerce-Input--text input-text"
            value={form.pincode}
            onChange={handleChange}
            disabled={saving}
            required
          />
        </p>
        <p className="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
          <label htmlFor="addr_country">
            Country <span className="required" aria-hidden="true">*</span>
          </label>
          <input
            id="addr_country"
            name="country"
            className="woocommerce-Input woocommerce-Input--text input-text"
            value={form.country}
            onChange={handleChange}
            disabled={saving}
            required
          />
        </p>
        <p className="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
          <label htmlFor="addr_landmark">Landmark (optional)</label>
          <input
            id="addr_landmark"
            name="landmark"
            className="woocommerce-Input woocommerce-Input--text input-text"
            value={form.landmark}
            onChange={handleChange}
            disabled={saving}
          />
        </p>

        <p className="form-row" style={{ display: 'flex', gap: 8 }}>
          <button
            type="submit"
            className="woocommerce-button button"
            disabled={saving}
          >
            {saving
              ? editingId
                ? 'Updating…'
                : 'Adding…'
              : editingId
                ? 'Update Address'
                : 'Add Address'}
          </button>
          {editingId && (
            <button
              type="button"
              className="woocommerce-button button"
              onClick={handleCancelEdit}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </p>
      </form>

      <h3 className="srfashion-form-title" style={{ marginTop: 32 }}>
        Saved Addresses
      </h3>

      {loading && <p>Loading addresses…</p>}

      {!loading && addresses.length === 0 && (
        <p>You have no saved addresses yet.</p>
      )}

      {!loading && addresses.map((addr) => (
        <div
          key={addr.id}
          style={{
            border: '1px solid #e5e5e5',
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: 4,
            background: addr.is_default ? '#f9f9f9' : '#fff',
          }}
        >
          <div style={{ fontWeight: 600 }}>{addr.name}</div>
          <div style={{ fontSize: '0.9rem', color: '#555' }}>{addr.mobile_number}</div>
          <div style={{ margin: '0.5rem 0' }}>{formatAddress(addr)}</div>
          {addr.landmark && (
            <div style={{ fontSize: '0.85rem', color: '#777' }}>
              Landmark: {addr.landmark}
            </div>
          )}
          {addr.is_default && (
            <span
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.5rem',
                background: '#111',
                color: '#fff',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                marginTop: '0.5rem',
              }}
            >
              Default
            </span>
          )}
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="woocommerce-button button"
              onClick={() => handleEdit(addr)}
            >
              Edit
            </button>
            <button
              type="button"
              className="woocommerce-button button"
              onClick={() => handleDelete(addr.id)}
            >
              Remove
            </button>
            {!addr.is_default && (
              <button
                type="button"
                className="woocommerce-button button"
                onClick={() => handleSetDefault(addr.id)}
              >
                Set as Default
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
