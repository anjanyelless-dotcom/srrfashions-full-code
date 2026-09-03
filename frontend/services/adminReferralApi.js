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
  return window.localStorage.getItem('admin_token');
}

function headers() {
  const token = getToken();
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function getAllReferrals() {
  const res = await fetch(`${API_BASE}/api/admin/referrals`, {
    method: 'GET',
    headers: headers(),
  });
  return handleResponse(res);
}

export async function disableReferral(id) {
  const res = await fetch(`${API_BASE}/api/admin/referrals/${encodeURIComponent(id)}/disable`, {
    method: 'PATCH',
    headers: headers(),
  });
  return handleResponse(res);
}

export async function approveReward(id) {
  const res = await fetch(`${API_BASE}/api/admin/referrals/referral-rewards/${encodeURIComponent(id)}/approve`, {
    method: 'PATCH',
    headers: headers(),
  });
  return handleResponse(res);
}

export async function rejectReward(id) {
  const res = await fetch(`${API_BASE}/api/admin/referrals/referral-rewards/${encodeURIComponent(id)}/reject`, {
    method: 'PATCH',
    headers: headers(),
  });
  return handleResponse(res);
}
