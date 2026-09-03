const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function getProducts(params = {}) {
  const query = new URLSearchParams({ sort: 'newest', ...params }).toString();
  const res = await fetch(`${API_BASE}/api/products${query ? `?${query}` : ''}`);
  return handleResponse(res);
}

export async function getProductDetails(id) {
  if (!id) {
    throw new Error('Product ID is required');
  }
  const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(id)}`);
  return handleResponse(res);
}
