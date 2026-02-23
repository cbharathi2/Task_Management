import React, { useState, useEffect, useContext } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUsers } from 'react-icons/fi';
import { teamService } from '../services/teamService';
import { authService } from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import { useRBAC } from '../hooks/useRBAC';

const Teams = () => {
  const { user } = useContext(AuthContext);
  const { can } = useRBAC();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teamLeaderId: '',
    teamMembers: []
  });

  useEffect(() => {
    fetchTeams();
    if (can('create', 'team')) {
      fetchUsers();
    }
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await teamService.getTeams();
      setTeams(response.data.teams || []);
      console.log('✅ Teams loaded:', response.data.teams?.length || 0);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await authService.getUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMemberToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.includes(userId)
        ? prev.teamMembers.filter(id => id !== userId)
        : [...prev.teamMembers, userId]
    }));
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.teamLeaderId) {
      alert('Team name and team leader are required');
      return;
    }

    try {
      await teamService.createTeam({
        name: formData.name,
        description: formData.description,
        teamLeaderId: parseInt(formData.teamLeaderId),
        teamMembers: formData.teamMembers.map(id => parseInt(id))
      });
      alert('Team created successfully!');
      setShowCreateModal(false);
      setFormData({ name: '', description: '', teamLeaderId: '', teamMembers: [] });
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    
    if (!editingTeam) return;

    try {
      await teamService.updateTeam(editingTeam.id, {
        name: formData.name,
        description: formData.description,
        teamLeaderId: parseInt(formData.teamLeaderId)
      });
      alert('Team updated successfully!');
      setEditingTeam(null);
      setFormData({ name: '', description: '', teamLeaderId: '', teamMembers: [] });
      fetchTeams();
    } catch (error) {
      console.error('Error updating team:', error);
      alert('Failed to update team: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;

    try {
      await teamService.deleteTeam(teamId);
      alert('Team deleted successfully!');
      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Failed to delete team: ' + (error.response?.data?.message || error.message));
    }
  };

  const openCreateModal = () => {
    setFormData({ name: '', description: '', teamLeaderId: '', teamMembers: [] });
    setEditingTeam(null);
    setShowCreateModal(true);
  };

  const openEditModal = (team) => {
    setFormData({
      name: team.name,
      description: team.description,
      teamLeaderId: team.team_leader_id,
      teamMembers: []
    });
    setEditingTeam(team);
    setShowCreateModal(true);
  };

  if (loading) {
    return <div className="text-center py-12 text-text-secondary">Loading teams...</div>;
  }

  return (
    <div className="ml-64 pt-24 px-8 pb-12 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">Teams</h1>
        <p className="text-text-secondary">Manage and view team information</p>
      </div>

      {/* Create Team Button - Only for Admins */}
      {can('create', 'team') && (
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus size={18} />
          Create Team
        </button>
      )}

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.length > 0 ? (
          teams.map(team => (
            <div key={team.id} className="card-base space-y-4">
              <div className="flex items-center gap-3">
                <FiUsers size={24} className="text-accent-teal" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-primary">{team.name}</h3>
                  <p className="text-xs text-text-secondary">Team Leader: {team.team_leader_name}</p>
                </div>
              </div>

              {team.description && (
                <p className="text-text-secondary text-sm">{team.description}</p>
              )}

              <button
                onClick={() => setSelectedTeam(selectedTeam?.id === team.id ? null : team)}
                className="w-full py-2 px-3 bg-accent-teal/10 hover:bg-accent-teal/20 text-accent-teal rounded-lg transition-smooth text-sm font-medium"
              >
                {selectedTeam?.id === team.id ? 'Hide Details' : 'View Details'}
              </button>

              {can('create', 'team') && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(team)}
                    className="flex-1 py-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-smooth text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <FiEdit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="flex-1 py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-smooth text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <FiTrash2 size={16} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-text-muted">
            {can('create', 'team') ? 'No teams yet. Create your first team!' : 'You are not part of any teams yet.'}
          </div>
        )}
      </div>

      {/* Team Details Modal */}
      {selectedTeam && (
        <TeamDetailsModal
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
          onRefresh={fetchTeams}
        />
      )}

      {/* Create/Edit Team Modal */}
      {showCreateModal && (
        <CreateTeamModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTeam(null);
          }}
          formData={formData}
          setFormData={setFormData}
          users={users}
          onSubmit={editingTeam ? handleUpdateTeam : handleCreateTeam}
          editingTeam={editingTeam}
          onMemberToggle={handleMemberToggle}
        />
      )}
    </div>
  );
};

const TeamDetailsModal = ({ team, onClose, onRefresh }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, [team.id]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await teamService.getTeamDetails(team.id);
      setMembers(response.data.members || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-dark-card rounded-2xl p-8 text-center">
          <p className="text-text-secondary">Loading team details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-2xl max-w-2xl w-full border border-dark-border">
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="text-2xl font-bold text-text-primary">{team.name} - Team Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-card-hover rounded-lg transition-smooth"
          >
            <FiX size={24} className="text-text-secondary" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {team.description && (
            <div>
              <h3 className="text-sm font-semibold text-text-secondary mb-2">Description</h3>
              <p className="text-text-primary">{team.description}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-text-secondary mb-4">Team Members ({members.length})</h3>
            <div className="space-y-3">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-dark-card-hover rounded-lg">
                  <div>
                    <p className="font-medium text-text-primary">{member.name}</p>
                    <p className="text-xs text-text-secondary">{member.email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    member.id === team.team_leader_id
                      ? 'bg-accent-teal/20 text-accent-teal'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {member.id === team.team_leader_id ? 'Team Leader' : 'Member'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateTeamModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  users,
  onSubmit,
  editingTeam,
  onMemberToggle
}) => {
  const { can } = useRBAC();

  if (!isOpen) return null;

  // Filter employees for team member selection
  const employees = users.filter(u => u.role === 'employee');
  const leadCandidates = users.filter(u => u.role === 'employee');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-2xl max-w-2xl w-full border border-dark-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-dark-border sticky top-0 bg-dark-card">
          <h2 className="text-2xl font-bold text-text-primary">
            {editingTeam ? 'Edit Team' : 'Create New Team'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-card-hover rounded-lg transition-smooth"
          >
            <FiX size={24} className="text-text-secondary" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Team Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-dark-card-hover border border-dark-border rounded-lg px-4 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-teal"
              placeholder="Enter team name"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-dark-card-hover border border-dark-border rounded-lg px-4 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-teal resize-none"
              placeholder="Enter team description"
              rows="3"
            />
          </div>

          {/* Team Leader */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Team Leader *
            </label>
            <select
              name="teamLeaderId"
              value={formData.teamLeaderId}
              onChange={(e) => setFormData({ ...formData, teamLeaderId: e.target.value })}
              className="w-full bg-dark-card-hover border border-dark-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-teal"
              required
            >
              <option value="">Select team leader</option>
              {leadCandidates.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Team Members */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Team Members (excluding leader)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {employees.map(employee => (
                <label key={employee.id} className="flex items-center gap-3 p-2 hover:bg-dark-card-hover rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.teamMembers.includes(employee.id)}
                    onChange={() => onMemberToggle(employee.id)}
                    className="w-4 h-4 rounded accent-accent-teal"
                  />
                  <span className="text-text-primary">{employee.name}</span>
                  <span className="text-xs text-text-secondary">({employee.email})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              {editingTeam ? 'Update Team' : 'Create Team'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-dark-card-hover hover:bg-dark-border rounded-lg text-text-secondary transition-smooth"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Teams;
