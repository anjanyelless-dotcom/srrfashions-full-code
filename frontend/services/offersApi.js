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

const DISPLAY_ORDER = ['FIRST_ORDER', 'REFERRAL', 'NEXT_ORDER', 'SPECIAL', 'BIRTHDAY'];

export function sortOffers(offers = []) {
  const orderMap = Object.fromEntries(DISPLAY_ORDER.map((type, i) => [type, i]));
  return [...offers].sort((a, b) => {
    const aIdx = orderMap[a.offerType] ?? Infinity;
    const bIdx = orderMap[b.offerType] ?? Infinity;
    return aIdx - bIdx;
  });
}

export async function getPublicOffers() {
  const res = await fetch(`${API_BASE}/api/offers`);
  return handleResponse(res);
}

export async function getOffersEligibility() {
  const token = getToken();
  if (!token) return { success: true, eligibility: {} };
  const res = await fetch(`${API_BASE}/api/offers/eligibility`, {
    method: 'GET',
    headers: headers(),
  });
  return handleResponse(res);
}

export async function applyOffer(offerType, subtotal) {
  const res = await fetch(`${API_BASE}/api/offers/apply`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ offer_type: offerType, subtotal }),
  });
  return handleResponse(res);
}

export async function getMyReferrals() {
  const res = await fetch(`${API_BASE}/api/referrals/me`, {
    method: 'GET',
    headers: headers(),
  });
  return handleResponse(res);
}
