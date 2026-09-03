const API_BASE = 'http://localhost:3000';

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

export async function applyCoupon(code) {
  const res = await fetch(`${API_BASE}/api/cart/coupon/apply`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ code }),
  });
  return handleResponse(res);
}

export async function removeCoupon() {
  const res = await fetch(`${API_BASE}/api/cart/coupon`, {
    method: 'DELETE',
    headers: headers(),
  });
  return handleResponse(res);
}

export async function getAvailableCoupons() {
  const res = await fetch(`${API_BASE}/api/cart/coupon/available`, {
    method: 'GET',
    headers: headers(),
  });
  return handleResponse(res);
}
