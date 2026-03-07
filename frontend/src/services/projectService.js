import api from './api';

export const projectService = {
  getAllProjects: () => api.get('/projects'),
  getMyProjects: () => api.get('/projects/my'),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  completeProject: (id) => api.put(`/projects/${id}`, { status: 'Completed' }),
  getProjectTasks: (projectId) => api.get(`/projects/${projectId}/tasks`),
};

export default projectService;
