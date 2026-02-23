import React, { useState, useRef, useEffect, useContext } from 'react';
import { FiX, FiUpload, FiTrash2 } from 'react-icons/fi';
import { goalService } from '../../services/goalService';
import { fileService } from '../../services/fileService';
import { teamService } from '../../services/teamService';
import { AuthContext } from '../../context/AuthContext';

const CreateGoalModal = ({ isOpen, onClose, goalType = 'personal', isTeamGoal = false, onGoalCreated, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const isTeam = isTeamGoal || goalType === 'team';
  const [formData, setFormData] = useState({
    title: '',
    targetDate: '',
    progress: 0,
    teamId: '',
  });
  const [teams, setTeams] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && isTeam) {
      fetchTeams();
    }
  }, [isOpen, isTeam]);

  const fetchTeams = async () => {
    try {
      const response = await teamService.getTeams();
      const allTeams = response.data.teams || [];
      setTeams(allTeams);
      // Set first team as default if available
      if (allTeams.length > 0) {
        setFormData(prev => ({
          ...prev,
          teamId: String(allTeams[0].id)
        }));
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'progress' ? parseInt(value) : value,
    }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`File too large: ${file.name}`);
        return false;
      }
      return true;
    });
    setAttachments((prev) => [...prev, ...validFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isTeam && !formData.teamId) {
        setError('Please select a team');
        setLoading(false);
        return;
      }

      const goalData = {
        title: formData.title,
        targetDate: formData.targetDate,
        goalType: isTeam ? 'team' : 'personal',
        progress: formData.progress,
      };

      if (isTeam && formData.teamId) {
        goalData.teamId = parseInt(formData.teamId);
      }

      console.log('📤 Sending goalData:', JSON.stringify(goalData, null, 2));
      const goalResponse = await goalService.createGoal(goalData);

      const goalId = goalResponse.data.goalId;
      console.log('✅ Goal created with ID:', goalId, 'Response:', goalResponse.data);

      if (attachments.length > 0) {
        console.log('📂 Uploading', attachments.length, 'attachments...');
        let failedFiles = [];
        for (const file of attachments) {
          try {
            await fileService.uploadFile(file, 'goal', goalId);
            console.log('✅ File uploaded:', file.name);
          } catch (fileError) {
            console.error('❌ Error uploading file:', file.name, fileError);
            failedFiles.push(file.name);
          }
        }
        if (failedFiles.length > 0) {
          console.warn('⚠️ Some files failed to upload:', failedFiles);
          alert(`Goal created but failed to upload ${failedFiles.length} file(s): ${failedFiles.join(', ')}`);
        } else {
          console.log('✅ All attachments uploaded successfully');
        }
      }

      alert('Goal created successfully!');
      if (onGoalCreated) {
        onGoalCreated();
      }
      if (onSuccess) {
        onSuccess();
      }
      handleClose();
    } catch (err) {
      console.error('❌ Goal creation error:', err);
      console.error('Full error response:', err.response?.data);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create goal';
      console.error('Display message:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ title: '', targetDate: '', progress: 0, teamId: '' });
    setAttachments([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-dark-border">
        <div className="flex items-center justify-between p-6 border-b border-dark-border sticky top-0 bg-dark-card">
          <h2 className="text-2xl font-bold text-text-primary">
            Create {isTeam ? 'Team' : 'Personal'} Goal
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-dark-card-hover rounded-lg transition-smooth"
          >
            <FiX size={24} className="text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Goal Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter goal title"
              required
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-text-primary focus:border-accent-teal focus:outline-none transition-smooth"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Target Date
            </label>
            <input
              type="datetime-local"
              name="targetDate"
              value={formData.targetDate}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-text-primary focus:border-accent-teal focus:outline-none transition-smooth"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Initial Progress (%)
            </label>
            <input
              type="number"
              name="progress"
              value={formData.progress}
              onChange={handleInputChange}
              min="0"
              max="100"
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-text-primary focus:border-accent-teal focus:outline-none transition-smooth"
            />
          </div>

          {isTeam && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Select Team *
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-dark-border rounded-lg p-3 bg-dark-bg">
                {teams.length > 0 ? (
                  teams.map((team) => (
                    <label key={team.id} className="flex items-center p-2 hover:bg-dark-card-hover rounded cursor-pointer transition-smooth">
                      <input
                        type="radio"
                        name="teamId"
                        value={String(team.id)}
                        checked={formData.teamId === String(team.id)}
                        onChange={handleInputChange}
                        className="w-4 h-4 mr-3"
                      />
                      <div className="flex-1">
                        <p className="text-text-primary font-medium">{team.name}</p>
                        {team.description && (
                          <p className="text-xs text-text-muted">{team.description}</p>
                        )}
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-text-muted text-center py-4">No teams available</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Attach Files
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-2 bg-dark-bg border border-dashed border-accent-teal rounded-lg text-accent-teal hover:bg-dark-card-hover transition-smooth flex items-center justify-center gap-2"
            >
              <FiUpload size={18} />
              Choose Files
            </button>

            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-dark-bg border border-dark-border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-text-primary">{file.name}</p>
                      <p className="text-xs text-text-muted">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="p-2 hover:bg-red-500/10 rounded-lg"
                    >
                      <FiTrash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-dark-border">
            <button type="button" onClick={handleClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGoalModal;
