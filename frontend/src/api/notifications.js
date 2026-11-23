import api from './axios';

export const getNotifications = () => api.get('/api/notifications/');
export const getUnreadNotificationCount = () => api.get('/api/notifications/unread-count/');
export const markNotificationRead = (id) => api.patch(`/api/notifications/${id}/read/`);
export const markAllNotificationsRead = () => api.post('/api/notifications/mark-all-read/');
