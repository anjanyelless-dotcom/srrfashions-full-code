const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getToken() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage.getItem('admin_token') || window.localStorage.getItem('customer_token');
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
    const message = data?.error || data?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export async function getSmsCampaigns() {
  const res = await fetch(`${API_BASE}/api/admin/sms/campaigns`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getSmsCampaign(id) {
  const res = await fetch(`${API_BASE}/api/admin/sms/campaigns/${id}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function createSmsCampaign(data) {
  const res = await fetch(`${API_BASE}/api/admin/sms/campaigns`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function getSmsRecipients(params) {
  const url = new URL(`${API_BASE}/api/admin/sms/recipients`);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function sendSmsCampaign(id, data) {
  const res = await fetch(`${API_BASE}/api/admin/sms/campaigns/${id}/send`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function sendTestSms(data) {
  const res = await fetch(`${API_BASE}/api/admin/sms/test`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}
