const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || data?.error || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data;
}

function getToken() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage.getItem('customer_token');
}

function headers() {
  const token = getToken();
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function getAddresses() {
  const res = await fetch(`${API_BASE}/api/customer/addresses`, {
    method: 'GET',
    headers: headers(),
  });
  return handleResponse(res);
}

export async function addAddress(address) {
  const res = await fetch(`${API_BASE}/api/customer/addresses`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(address),
  });
  return handleResponse(res);
}

export async function updateAddress(id, address) {
  const res = await fetch(`${API_BASE}/api/customer/addresses/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(address),
  });
  return handleResponse(res);
}

export async function deleteAddress(id) {
  const res = await fetch(`${API_BASE}/api/customer/addresses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: headers(),
  });
  return handleResponse(res);
}

export async function setDefaultAddress(id) {
  const res = await fetch(`${API_BASE}/api/customer/addresses/${encodeURIComponent(id)}/default`, {
    method: 'PATCH',
    headers: headers(),
  });
  return handleResponse(res);
}
