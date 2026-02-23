import api from './api';

export const teamService = {
  createTeam: (teamData) =>
    api.post('/teams', teamData),

  getTeams: () =>
    api.get('/teams'),

  getTeamDetails: (teamId) =>
    api.get(`/teams/${teamId}`),

  updateTeam: (teamId, teamData) =>
    api.put(`/teams/${teamId}`, teamData),

  deleteTeam: (teamId) =>
    api.delete(`/teams/${teamId}`),

  addTeamMember: (teamId, userId) =>
    api.post(`/teams/${teamId}/members`, { userId }),

  removeTeamMember: (teamId, userId) =>
    api.delete(`/teams/${teamId}/members`, { data: { userId } }),
};
