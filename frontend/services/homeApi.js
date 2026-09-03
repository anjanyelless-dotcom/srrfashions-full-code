const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || data?.error || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export async function getHomepage() {
  const res = await fetch(`${API_BASE}/api/home`, {
    method: 'GET',
  });
  return handleResponse(res);
}
