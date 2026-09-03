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

function getAuthHeaders() {
  const token = getToken();
  const h = {};
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function submitPayment(orderId, { screenshot, utrNumber, notes = '' } = {}) {
  const formData = new FormData();
  if (screenshot) formData.append('screenshot', screenshot);
  if (utrNumber) formData.append('utr_number', utrNumber);
  if (notes) formData.append('notes', notes);

  const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}/payment/submit`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  return handleResponse(res);
}

export async function resubmitPayment(orderId, { screenshot, utrNumber, notes = '' } = {}) {
  const formData = new FormData();
  if (screenshot) formData.append('screenshot', screenshot);
  if (utrNumber) formData.append('utr_number', utrNumber);
  if (notes) formData.append('notes', notes);

  const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}/payment/resubmit`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  return handleResponse(res);
}
