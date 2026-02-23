import api from './api';

export const goalService = {
  createGoal: (goalData) =>
    api.post('/goals', goalData),

  getMyGoals: () =>
    api.get('/goals/my'),

  getTeamGoals: () =>
    api.get('/goals/team'),

  updateGoal: (goalId, goalData) =>
    api.put(`/goals/${goalId}`, goalData),

  deleteGoal: (goalId) =>
    api.delete(`/goals/${goalId}`),
};
