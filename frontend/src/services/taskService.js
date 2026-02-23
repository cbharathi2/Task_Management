import api from './api';

export const taskService = {
  createTask: (taskData) =>
    api.post('/tasks', taskData),

  getMyTasks: () =>
    api.get('/tasks/my'),

  getTasksAssignedByMe: () =>
    api.get('/tasks/assigned-by-me'),

  getDashboardStats: () =>
    api.get('/tasks/dashboard-stats'),

  updateTask: (taskId, taskData) =>
    api.put(`/tasks/${taskId}`, taskData),

  deleteTask: (taskId) =>
    api.delete(`/tasks/${taskId}`),
};
