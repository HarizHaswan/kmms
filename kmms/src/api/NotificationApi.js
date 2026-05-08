import api from './http';

export const fetchNotifications = () => api.get('/notifications');
export const markAsRead = (id) => api.post(`/notifications/${id}/read`);
export const markAllRead = () => api.post('/notifications/read-all');
