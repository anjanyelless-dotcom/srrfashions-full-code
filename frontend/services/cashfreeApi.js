const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || data?.error || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export async function getCashfreeOrderApi(orderId) {
  if (!orderId || typeof orderId !== 'string' || orderId.trim().length === 0) {
    throw new Error('Order ID is required');
  }

  const sanitizedOrderId = orderId.trim();

  const res = await fetch(`${API_BASE}/api/cashfree/orders/${encodeURIComponent(sanitizedOrderId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse(res);
}