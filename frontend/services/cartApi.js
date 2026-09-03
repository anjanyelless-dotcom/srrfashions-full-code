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

export async function addToCartApi(productId, variantId, quantity) {
  const token = getToken();
  if (!token) {
    throw new Error('Please log in to add items to your cart.');
  }

  const res = await fetch(`${API_BASE}/api/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      product_id: productId,
      variant_id: variantId,
      quantity,
    }),
  });

  return handleResponse(res);
}

export async function getCartApi() {
  const token = getToken();
  if (!token) {
    throw new Error('Please log in to view your cart.');
  }

  const res = await fetch(`${API_BASE}/api/cart`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(res);
}

export async function updateCartItemApi(itemId, quantity) {
  const token = getToken();
  if (!token) {
    throw new Error('Please log in to update your cart.');
  }

  const res = await fetch(`${API_BASE}/api/cart/items/${encodeURIComponent(itemId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ quantity }),
  });

  return handleResponse(res);
}

export async function removeCartItemApi(itemId) {
  const token = getToken();
  if (!token) {
    throw new Error('Please log in to remove cart items.');
  }

  const res = await fetch(`${API_BASE}/api/cart/items/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(res);
}
