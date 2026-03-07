import React, { useState, useContext, useRef, useEffect } from 'react';
import { FiX, FiUpload, FiTrash2 } from 'react-icons/fi';
import { taskService } from '../../services/taskService';
import { authService } from '../../services/authService';
import { teamService } from '../../services/teamService';
import { fileService } from "../../services/fileService";
import { AuthContext } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const CreateTaskModal = ({ isOpen, onClose, projects, onTaskCreated, project, task }) => {
  const { user } = useContext(AuthContext);
  const isEditMode = !!task;
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    projectId: task?.project_id || (project ? project.id : (projects && projects.length > 0 ? projects[0].id : '')),
    taskNumber: task?.task_number || '',
    assignedTo: task?.assigned_to ? String(task.assigned_to) : '',
    teamId: task?.team_id ? String(task.team_id) : '',
    priority: task?.priority || 'Medium',
    dueDate: task?.due_date ? task.due_date.split('T')[0] : '',
  });
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [userTeams, setUserTeams] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assignmentType, setAssignmentType] = useState('user'); // 'user' or 'team'
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchTeams();
    }
  }, [isOpen]);

  // Auto-select first user/team when they load (for new tasks only)
  useEffect(() => {
    if (!isEditMode && isOpen) {
      if (assignmentType === 'user' && users.length > 0 && !formData.assignedTo) {
        setFormData(prev => ({
          ...prev,
          assignedTo: String(users[0].id)
        }));
      } else if (assignmentType === 'team' && teams.length > 0 && !formData.teamId) {
        setFormData(prev => ({
          ...prev,
          teamId: String(teams[0].id)
        }));
      }
    }
  }, [users, teams, assignmentType, isOpen, isEditMode]);

  // populate form when editing an existing task
  useEffect(() => {
    if (isOpen && isEditMode && task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        projectId: task.project_id || (project ? project.id : (projects && projects.length > 0 ? projects[0].id : '')),
        taskNumber: task.task_number || '',
        assignedTo: task.assigned_to ? String(task.assigned_to) : '',
        teamId: task.team_id ? String(task.team_id) : '',
        priority: task.priority || 'Medium',
        dueDate: task.due_date ? task.due_date.split('T')[0] : '',
      });
      // set assignment type based on existing task
      if (task.assigned_to) setAssignmentType('user');
      else if (task.team_id) setAssignmentType('team');
    }
    if (isOpen && !isEditMode) {
      // ensure defaults for create mode
      setFormData(prev => ({
        ...prev,
        projectId: project ? project.id : projects[0]?.id || prev.projectId,
      }));
    }
  }, [isOpen, isEditMode, task, project, projects]);

  // when project prop changes, update default projectId
  useEffect(() => {
    if (project) {
      setFormData(prev => ({ ...prev, projectId: project.id }));
    }
  }, [project]);

  const fetchUsers = async () => {
    try {
      const response = await authService.getUsers();
      // If current user is employee, filter out admins from the list
      let userList = response.data.users || [];
      if (user?.role === 'employee') {
        userList = userList.filter(u => u.role === 'employee');
      }
      setUsers(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await teamService.getTeams();
      const allTeams = response.data.teams || [];
      setTeams(allTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Only PDF, DOC, DOCX, and TXT are allowed.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Max size is 5MB.`);
        return false;
      }
      return true;
    });

    setAttachments((prev) => [...prev, ...validFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const { refreshNotifications } = useNotifications();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('📝 Creating task with data:', formData);
      console.log('📝 Assignment type:', assignmentType);

      // Validate assignment
      if (assignmentType === 'user') {
        if (!formData.assignedTo) {
          setError('Please assign the task to a user');
          setLoading(false);
          return;
        }
      } else if (assignmentType === 'team') {
        if (!formData.teamId) {
          setError('Please assign the task to a team');
          setLoading(false);
          return;
        }
      }

      const taskData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        dueDate: formData.dueDate,
        taskNumber: formData.taskNumber || null,
        projectId: formData.projectId ? parseInt(formData.projectId) : null,
      };

      // Add assignment based on type - use camelCase for POST/create
      if (assignmentType === 'user') {
        taskData.assignedTo = parseInt(formData.assignedTo);
      } else if (assignmentType === 'team') {
        taskData.teamId = parseInt(formData.teamId);
      }

      console.log('📤 Final taskData being sent:', JSON.stringify(taskData, null, 2));
      let taskResponse;
      let taskId;
      if (isEditMode) {
        taskResponse = await taskService.updateTask(task.id, taskData);
        taskId = task.id;
        console.log('✅ Task updated:', taskResponse.data);
      } else {
        taskResponse = await taskService.createTask(taskData);
        taskId = taskResponse.data.taskId;
        console.log('✅ Task created with ID:', taskId, 'Response:', taskResponse.data);
      }

      if (attachments.length > 0) {
        console.log('📂 Uploading', attachments.length, 'attachments...');
        let failedFiles = [];
        for (const file of attachments) {
          try {
            await fileService.uploadFile(file, 'task', taskId);
            console.log('✅ File uploaded:', file.name);
          } catch (fileError) {
            console.error('❌ Error uploading file:', file.name, fileError);
            failedFiles.push(file.name);
          }
        }
        if (failedFiles.length > 0) {
          console.warn('⚠️ Some files failed to upload:', failedFiles);
          alert(`Task created but failed to upload ${failedFiles.length} file(s): ${failedFiles.join(', ')}`);
        } else {
          console.log('✅ All attachments uploaded successfully');
        }
      }

      console.log('✅ Task and attachments created successfully');
      alert(isEditMode ? 'Task updated successfully!' : 'Task created successfully!');
      onTaskCreated();
      refreshNotifications();
      handleClose();
    } catch (err) {
      console.error('❌ Error creating task:', err);
      console.error('Full error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create task';
      console.error('Display message:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      projectId: project ? project.id : projects[0]?.id || '',
      taskNumber: '',
      priority: 'Medium',
      dueDate: '',
    });
    setAttachments([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-dark-border">
        <div className="flex items-center justify-between p-6 border-b border-dark-border sticky top-0 bg-dark-card">
          <h2 className="text-2xl font-bold text-text-primary">{isEditMode ? 'Edit Task' : 'Create New Task'}</h2>
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
              Task Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter task title"
              required
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-text-primary focus:border-accent-teal focus:outline-none transition-smooth"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter task description"
              rows="4"
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-text-primary focus:border-accent-teal focus:outline-none transition-smooth resize-none"
            />
          </div>

              {!project && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Project *
              </label>
              <select
                name="projectId"
                value={formData.projectId}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-text-primary focus:border-accent-teal focus:outline-none transition-smooth"
              >
                {projects && projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Task Number
            </label>
            <input
              type="text"
              name="taskNumber"
              value={formData.taskNumber}
              onChange={handleInputChange}
              placeholder="e.g. 1, A-101"
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-text-primary focus:border-accent-teal focus:outline-none transition-smooth"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Assign To *
            </label>
            {/* Assignment Type Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setAssignmentType('user')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-smooth ${
                  assignmentType === 'user'
                    ? 'bg-accent-teal text-dark-bg'
                    : 'bg-dark-card-hover text-text-secondary hover:bg-dark-border'
                }`}
              >
                👤 Assign to User
              </button>
              <button
                type="button"
                onClick={() => setAssignmentType('team')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-smooth ${
                  assignmentType === 'team'
                    ? 'bg-accent-teal text-dark-bg'
                    : 'bg-dark-card-hover text-text-secondary hover:bg-dark-border'
                }`}
              >
                👥 Assign to Team
              </button>
            </div>

            {/* User Assignment */}
            {assignmentType === 'user' && (
              <div className="space-y-3 max-h-48 overflow-y-auto border border-dark-border rounded-lg p-3 bg-dark-bg">
                {users.length > 0 ? (
                  users.map((u) => (
                    <label key={u.id} className="flex items-center p-2 hover:bg-dark-card-hover rounded cursor-pointer transition-smooth">
                      <input
                        type="radio"
                        name="assignedTo"
                        value={String(u.id)}
                        checked={formData.assignedTo === String(u.id)}
                        onChange={handleInputChange}
                        className="w-4 h-4 mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-text-primary font-medium">{u.name}</p>
                          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                            {u.role === 'admin' ? 'Admin' : 'Employee'}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted">{u.email}</p>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-text-muted text-center py-4">No users available</p>
                )}
              </div>
            )}

            {/* Team Assignment */}
            {assignmentType === 'team' && (
              <div className="space-y-3 max-h-48 overflow-y-auto border border-dark-border rounded-lg p-3 bg-dark-bg">
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
                        <p className="text-xs text-text-muted">Leader: {team.team_leader_name}</p>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-text-muted text-center py-4">No teams available</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-text-primary focus:border-accent-teal focus:outline-none transition-smooth"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Due Date *
            </label>
            <input
              type="datetime-local"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-text-primary focus:border-accent-teal focus:outline-none transition-smooth"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Attach Files (PDF, DOC, DOCX, TXT - Max 5MB each)
            </label>
            <div className="flex gap-3">
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
                className="flex-1 px-4 py-2 bg-dark-bg border border-dashed border-accent-teal rounded-lg text-accent-teal hover:bg-dark-card-hover transition-smooth flex items-center justify-center gap-2"
              >
                <FiUpload size={18} />
                Choose Files
              </button>
            </div>

            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-text-muted">{attachments.length} file(s) selected:</p>
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-dark-bg border border-dark-border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-text-primary font-medium">{file.name}</p>
                      <p className="text-xs text-text-muted">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-smooth"
                    >
                      <FiTrash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-dark-border">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;