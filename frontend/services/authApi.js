const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getToken() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage.getItem('customer_token');
}

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || data?.error || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export async function loginCustomer(identifier, password) {
  const res = await fetch(`${API_BASE}/api/auth/customer/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  return handleResponse(res);
}

export async function registerCustomer({ full_name, email, mobile_number, password }) {
  const res = await fetch(`${API_BASE}/api/auth/customer/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name, email, mobile_number, password }),
  });
  return handleResponse(res);
}

export async function getCustomerProfile() {
  const res = await fetch(`${API_BASE}/api/auth/customer/profile`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function updateCustomerProfile(profile) {
  const res = await fetch(`${API_BASE}/api/auth/customer/profile`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(profile),
  });
  return handleResponse(res);
}
