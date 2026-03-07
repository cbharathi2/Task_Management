import api from './api';

export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

export default notificationService;