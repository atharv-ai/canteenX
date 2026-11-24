import api from './axios';

export const createOrder = (data) => api.post('/api/orders/create/', data);
export const createRazorpayOrder = (data) => api.post('/api/orders/razorpay/create-order/', data);
export const verifyRazorpayPayment = (data) => api.post('/api/orders/razorpay/verify/', data);
export const getStudentOrders = (params) => api.get('/api/orders/', { params });
export const getOrderDetail = (id) => api.get(`/api/orders/${id}/`);
export const cancelOrder = (id, data) => api.post(`/api/orders/${id}/cancel/`, data);
export const rateOrder = (id, data) => api.post(`/api/orders/${id}/rate/`, data);

export const getAdminOrders = (params) => api.get('/api/orders/admin/orders/', { params });
export const updateOrderStatus = (id, data) => api.patch(`/api/orders/admin/orders/${id}/status/`, data);
export const verifyOrderPin = (data) => api.post('/api/orders/admin/verify-pin/', data);
