import React, { useState, useContext, useEffect } from 'react';
import { FiFolder, FiTrash2, FiCheck, FiDownload, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { projectService } from '../services/projectService';
import { fileService } from '../services/fileService';
import { AuthContext } from '../context/AuthContext';

const ProjectCard = ({ project, onDelete, onStatusChange, isCompleted }) => {
  const { user } = useContext(AuthContext);
  const [attachments, setAttachments] = useState([]);
  const [showAttachments, setShowAttachments] = useState(false);

  useEffect(() => {
    if (showAttachments) {
      fetchAttachments();
    }
  }, [showAttachments]);

  const fetchAttachments = async () => {
    try {
      const attachments = await fileService.getAttachments('project', project.id);
      setAttachments(attachments);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const handleDownloadFile = (attachment) => {
    const token = localStorage.getItem('token');
    fetch(`/api/files/download/${attachment.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    })
    .catch(err => console.error('Download failed:', err));
  };

  const handleMarkComplete = async () => {
    try {
      await projectService.completeProject(project.id);
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error marking project as complete:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      return;
    }

    try {
      await projectService.deleteProject(project.id);
      console.log(`✅ Project ${project.id} deleted successfully`);
      if (onDelete) {
        onDelete(project.id);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="card-base group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-green-500/10' : 'bg-accent-teal/10'}`}>
            <FiFolder className={isCompleted ? 'text-green-500' : 'text-accent-teal'} size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary group-hover:text-accent-teal transition-smooth">
              {project.name}
            </h3>
            <p className="text-xs text-text-muted">Project</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user?.role === 'employee' && !isCompleted && (
            <button
              onClick={handleMarkComplete}
              className="p-1.5 hover:bg-green-500/10 rounded transition-smooth text-green-400 hover:text-green-300"
              title="Mark as complete"
            >
              <FiCheck size={16} />
            </button>
          )}
          {user?.role === 'admin' && (
            <button
              onClick={handleDelete}
              className="p-1.5 hover:bg-dark-card-hover rounded transition-smooth"
              title="Delete project"
            >
              <FiTrash2 size={16} className="text-red-400" />
            </button>
          )}
        </div>
      </div>

      <p className="text-text-secondary text-sm mb-4 line-clamp-2">
        {project.description || 'No description'}
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Order No</span>
          <span className="px-2 py-1 bg-accent-teal/10 text-accent-teal rounded text-xs font-medium">
            {project.order_number || 'N/A'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">
            {project.task_count || 0} tasks
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${isCompleted ? 'bg-green-500/10 text-green-400' : 'bg-accent-teal/10 text-accent-teal'}`}>
            {isCompleted ? 'Completed' : 'Active'}
          </span>
        </div>
      </div>

      {/* Attachments Section */}
      <div className="border-t border-dark-border pt-3 mt-3">
        <button
          onClick={() => setShowAttachments(!showAttachments)}
          className="flex items-center gap-2 text-xs text-accent-teal hover:text-accent-teal/80 transition-smooth w-full"
        >
          {showAttachments ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          Attachments {attachments.length > 0 && `(${attachments.length})`}
        </button>

        {showAttachments && (
          <div className="mt-2 space-y-1">
            {attachments.length > 0 ? (
              attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-2 bg-dark-card-hover rounded text-xs hover:bg-dark-border transition-smooth"
                >
                  <div className="flex-1 truncate">
                    <p className="text-text-primary truncate">{attachment.file_name}</p>
                  </div>
                  <button
                    onClick={() => handleDownloadFile(attachment)}
                    className="p-1 hover:text-accent-teal transition-smooth ml-2"
                    title="Download"
                  >
                    <FiDownload size={12} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-text-muted text-center py-2">No attachments</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
