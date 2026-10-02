const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function getCategories() {
  const res = await fetch(`${API_BASE}/api/categories`);
  return handleResponse(res);
}

export async function getCategoryBySlug(slug) {
  if (!slug) {
    throw new Error('Category slug is required');
  }
  const res = await fetch(`${API_BASE}/api/categories/slug/${encodeURIComponent(slug)}`);
  return handleResponse(res);
}

export async function getCategoryProductsBySlug(slug, params = {}) {
  if (!slug) {
    throw new Error('Category slug is required');
  }
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/categories/slug/${encodeURIComponent(slug)}/products${query ? `?${query}` : ''}`);
  return handleResponse(res);
}
