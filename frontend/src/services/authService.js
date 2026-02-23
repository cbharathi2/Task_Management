import api from './api';

export const authService = {
  register: (name, email, password, role = 'employee') =>
    api.post('/auth/register', { name, email, password, role }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  getUsers: () =>
    api.get('/auth/users'),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  saveToken: (token) => {
    localStorage.setItem('token', token);
  },

  getToken: () => localStorage.getItem('token'),

  saveUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => !!localStorage.getItem('token'),
};
