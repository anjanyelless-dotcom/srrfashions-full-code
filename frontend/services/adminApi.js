const API_BASE = 'http://localhost:3000';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || data?.error || data?.errors || `Request failed with status ${res.status}`;
    const error = new Error(Array.isArray(message) ? message.join(', ') : message);
    error.data = data;
    throw error;
  }
  return data;
}

function getToken() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage.getItem('admin_token');
}

function authHeaders(isMultipart = false) {
  const token = getToken();
  const h = {};
  if (!isMultipart) h['Content-Type'] = 'application/json';
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function jsonRequest(method, path, body) {
  return fetch(`${API_BASE}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
}

function formRequest(method, path, fields, files = {}) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  Object.entries(files).forEach(([key, fileOrFiles]) => {
    if (Array.isArray(fileOrFiles)) {
      fileOrFiles.forEach((file) => formData.append(key, file));
    } else if (fileOrFiles) {
      formData.append(key, fileOrFiles);
    }
  });
  return fetch(`${API_BASE}${path}`, {
    method,
    headers: authHeaders(true),
    body: formData,
  });
}

/* ===================== ADMIN AUTH ===================== */

export async function adminLogin(credentials) {
  const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return handleResponse(res);
}

export async function changeAdminPassword(data) {
  const res = await jsonRequest('PUT', '/api/auth/admin/change-password', data);
  return handleResponse(res);
}

/* ===================== CATEGORIES ===================== */

export async function getAllCategories() {
  const res = await jsonRequest('GET', '/api/admin/categories');
  return handleResponse(res);
}

export async function createCategory(data) {
  const res = await jsonRequest('POST', '/api/admin/categories', data);
  return handleResponse(res);
}

export async function updateCategory(id, data) {
  const res = await jsonRequest('PUT', `/api/admin/categories/${encodeURIComponent(id)}`, data);
  return handleResponse(res);
}

export async function deleteCategory(id) {
  const res = await jsonRequest('DELETE', `/api/admin/categories/${encodeURIComponent(id)}`);
  return handleResponse(res);
}

export async function updateCategoryStatus(id, data) {
  const res = await jsonRequest('PATCH', `/api/admin/categories/${encodeURIComponent(id)}/status`, data);
  return handleResponse(res);
}

export async function updateCategoryOrder(id, data) {
  const res = await jsonRequest('PUT', `/api/admin/categories/${encodeURIComponent(id)}/order`, data);
  return handleResponse(res);
}

export async function uploadCategoryImage(id, imageFile) {
  const res = await formRequest('POST', `/api/admin/categories/${encodeURIComponent(id)}/image`, {}, { image: imageFile });
  return handleResponse(res);
}

/* ===================== PRODUCTS ===================== */

export async function getAllProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await jsonRequest('GET', `/api/admin/products${query ? `?${query}` : ''}`);
  return handleResponse(res);
}

export async function getProductById(id) {
  const res = await jsonRequest('GET', `/api/admin/products/${encodeURIComponent(id)}`);
  return handleResponse(res);
}

export async function createProduct(data) {
  const res = await jsonRequest('POST', '/api/admin/products', data);
  return handleResponse(res);
}

export async function updateProduct(id, data) {
  const res = await jsonRequest('PUT', `/api/admin/products/${encodeURIComponent(id)}`, data);
  return handleResponse(res);
}

export async function deleteProduct(id) {
  const res = await jsonRequest('DELETE', `/api/admin/products/${encodeURIComponent(id)}`);
  return handleResponse(res);
}

export async function updateProductStatus(id, data) {
  const res = await jsonRequest('PATCH', `/api/admin/products/${encodeURIComponent(id)}/status`, data);
  return handleResponse(res);
}

export async function uploadProductImages(id, imageFiles) {
  const res = await formRequest('POST', `/api/admin/products/${encodeURIComponent(id)}/images`, {}, { images: imageFiles });
  return handleResponse(res);
}

export async function deleteProductImage(productId, imageId) {
  const res = await jsonRequest('DELETE', `/api/admin/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`);
  return handleResponse(res);
}

export async function reorderProductImages(id, data) {
  const res = await jsonRequest('PUT', `/api/admin/products/${encodeURIComponent(id)}/images/order`, data);
  return handleResponse(res);
}

/* ===================== PRODUCT VARIANTS ===================== */

export async function getVariantsByProduct(productId) {
  const res = await jsonRequest('GET', `/api/admin/products/${encodeURIComponent(productId)}/variants`);
  return handleResponse(res);
}

export async function addVariant(productId, data) {
  const res = await jsonRequest('POST', `/api/admin/products/${encodeURIComponent(productId)}/variants`, data);
  return handleResponse(res);
}

export async function updateVariant(variantId, data) {
  const res = await jsonRequest('PUT', `/api/admin/variants/${encodeURIComponent(variantId)}`, data);
  return handleResponse(res);
}

export async function deleteVariant(variantId) {
  const res = await jsonRequest('DELETE', `/api/admin/variants/${encodeURIComponent(variantId)}`);
  return handleResponse(res);
}

/* ===================== COUPONS ===================== */

export async function getAllCoupons() {
  const res = await jsonRequest('GET', '/api/admin/coupons');
  return handleResponse(res);
}

export async function createCoupon(data) {
  const res = await jsonRequest('POST', '/api/admin/coupons', data);
  return handleResponse(res);
}

export async function updateCoupon(id, data) {
  const res = await jsonRequest('PUT', `/api/admin/coupons/${encodeURIComponent(id)}`, data);
  return handleResponse(res);
}

export async function deleteCoupon(id) {
  const res = await jsonRequest('DELETE', `/api/admin/coupons/${encodeURIComponent(id)}`);
  return handleResponse(res);
}

export async function updateCouponStatus(id, data) {
  const res = await jsonRequest('PATCH', `/api/admin/coupons/${encodeURIComponent(id)}/status`, data);
  return handleResponse(res);
}

/* ===================== REFERRAL SETTINGS ===================== */

export async function getReferralSettings() {
  const res = await jsonRequest('GET', '/api/admin/referral-settings');
  return handleResponse(res);
}

export async function updateReferralSettings(data) {
  const res = await jsonRequest('PUT', '/api/admin/referral-settings', data);
  return handleResponse(res);
}

/* ===================== DASHBOARD ===================== */

export async function getDashboard() {
  const res = await jsonRequest('GET', '/api/admin/dashboard');
  return handleResponse(res);
}

/* ===================== INVENTORY ===================== */

export async function getInventory(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await jsonRequest('GET', `/api/admin/inventory${query ? `?${query}` : ''}`);
  return handleResponse(res);
}

export async function updateVariantStock(variantId, data) {
  const res = await jsonRequest('PUT', `/api/admin/inventory/variants/${encodeURIComponent(variantId)}/stock`, data);
  return handleResponse(res);
}

export async function getLowStock() {
  const res = await jsonRequest('GET', '/api/admin/inventory/low-stock');
  return handleResponse(res);
}

export async function getOutOfStock() {
  const res = await jsonRequest('GET', '/api/admin/inventory/out-of-stock');
  return handleResponse(res);
}

/* ===================== ORDERS ===================== */

export async function getAdminOrders(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await jsonRequest('GET', `/api/admin/orders${query ? `?${query}` : ''}`);
  return handleResponse(res);
}

export async function getAdminOrderDetail(id) {
  const res = await jsonRequest('GET', `/api/admin/orders/${encodeURIComponent(id)}`);
  return handleResponse(res);
}

export async function updateOrderStatus(id, data) {
  const res = await jsonRequest('PATCH', `/api/admin/orders/${encodeURIComponent(id)}/status`, data);
  return handleResponse(res);
}

export async function cancelAdminOrder(id, data = {}) {
  const res = await jsonRequest('PATCH', `/api/admin/orders/${encodeURIComponent(id)}/cancel`, data);
  return handleResponse(res);
}

/* ===================== CUSTOMERS ===================== */

export async function getCustomers(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await jsonRequest('GET', `/api/admin/customers${query ? `?${query}` : ''}`);
  return handleResponse(res);
}

export async function getCustomerDetail(id) {
  const res = await jsonRequest('GET', `/api/admin/customers/${encodeURIComponent(id)}`);
  return handleResponse(res);
}

export async function updateCustomerStatus(id, data) {
  const res = await jsonRequest('PATCH', `/api/admin/customers/${encodeURIComponent(id)}/status`, data);
  return handleResponse(res);
}

/* ===================== BANNERS ===================== */

export async function getBanners() {
  const res = await jsonRequest('GET', '/api/admin/banners');
  return handleResponse(res);
}

export async function createBanner(data, imageFile) {
  const res = await formRequest('POST', '/api/admin/banners', data, { image: imageFile });
  return handleResponse(res);
}

export async function updateBanner(id, data, imageFile) {
  const res = await formRequest('PUT', `/api/admin/banners/${encodeURIComponent(id)}`, data, { image: imageFile });
  return handleResponse(res);
}

export async function deleteBanner(id) {
  const res = await jsonRequest('DELETE', `/api/admin/banners/${encodeURIComponent(id)}`);
  return handleResponse(res);
}

export async function updateBannerStatus(id, data) {
  const res = await jsonRequest('PATCH', `/api/admin/banners/${encodeURIComponent(id)}/status`, data);
  return handleResponse(res);
}
