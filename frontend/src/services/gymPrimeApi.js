import { api } from './api.js';

export const gymPrimeApi = {
  getSession() {
    return api('/auth/session');
  },

  login(payload) {
    return api('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  logout() {
    return api('/auth/logout', { method: 'POST' });
  },

  register(payload) {
    return api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  listProducts() {
    return api('/products');
  },

  getCart() {
    return api('/cart');
  },

  addCartItem(payload) {
    return api('/cart/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  checkoutCart() {
    return api('/cart/checkout', { method: 'POST' });
  },

  checkoutTotem(payload) {
    return api('/totem/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  listOrders() {
    return api('/orders');
  },

  updateOrderStatus(orderId, status) {
    return api(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  listInventory() {
    return api('/inventory');
  },

  listAuditLogs() {
    return api('/audit-logs');
  },

  getAdminAnalyticsSummary() {
    return api('/admin/analytics/summary');
  },

  createProduct(payload) {
    return api('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateProduct(productId, payload) {
    return api(`/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteProduct(productId) {
    return api(`/products/${productId}`, { method: 'DELETE' });
  },

  createVariant(productId, payload) {
    return api(`/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateInventory(inventoryId, payload) {
    return api(`/inventory/${inventoryId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  uploadProductImage(productId, file) {
    const formData = new FormData();
    formData.append('file', file);
    return api(`/uploads/products/${productId}/image`, {
      method: 'POST',
      body: formData,
    });
  },
};
