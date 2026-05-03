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

  listMyOrders() {
    return api('/orders/me');
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

  listAdminCustomers() {
    return api('/admin/customers');
  },

  getAdminSettings() {
    return api('/admin/settings');
  },

  updateAdminSettings(payload) {
    return api('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  getPublicSettings() {
    return api('/settings/public');
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

  updateVariant(productId, variantId, payload) {
    return api(`/products/${productId}/variants/${variantId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteVariant(productId, variantId) {
    return api(`/products/${productId}/variants/${variantId}`, { method: 'DELETE' });
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
