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

export async function createOrder(orderData) {
  const res = await fetch(`${API_BASE}/api/checkout`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(orderData),
  });
  return handleResponse(res);
}

export async function getPaymentSettings() {
  const res = await fetch(`${API_BASE}/api/payment-settings`, {
    method: 'GET',
    headers: headers(),
  });
  return handleResponse(res);
}
