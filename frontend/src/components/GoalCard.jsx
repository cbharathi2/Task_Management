import React, { useState, useEffect } from 'react';
import { FiTrash2, FiEdit2, FiDownload, FiEye, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { goalService } from '../services/goalService';
import { fileService } from '../services/fileService';

const GoalCard = ({ goal, onEdit, onDelete, onRefresh, showCreator = false }) => {
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showAttachments, setShowAttachments] = useState(false);
  const [pdfModal, setPdfModal] = useState(null);

  useEffect(() => {
    if (showAttachments) {
      fetchAttachments();
    }
  }, [showAttachments]);

  const fetchAttachments = async () => {
    try {
      const attachments = await fileService.getAttachments('goal', goal.id);
      setAttachments(attachments);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  const handleDownloadFile = (attachment) => {
    // Use the download endpoint
    const token = localStorage.getItem('token');
    const link = document.createElement('a');
    link.href = `/api/files/download/${attachment.id}`;
    link.download = attachment.file_name;
    link.style.display = 'none';

    // Add auth header via fetch
    fetch(link.href, {
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

  return (
    <div className="card-base group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-text-primary group-hover:text-accent-teal transition-smooth">
            {goal.title}
          </h3>
          {showCreator && goal.owner_name && (
            <p className="text-xs text-text-muted mt-1">By: {goal.owner_name}</p>
          )}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onEdit && onEdit();
              }}
              className="p-1.5 hover:bg-dark-card-hover rounded transition-smooth"
            >
              <FiEdit2 size={16} className="text-accent-teal" />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-dark-card-hover rounded transition-smooth"
          >
            <FiTrash2 size={16} className="text-red-400" />
          </button>
        </div>
      </div>

      <p className="text-text-secondary text-sm mb-4">
        Target: {new Date(goal.target_date).toLocaleDateString()}
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-xs text-text-muted">Progress</span>
          <span className="text-sm font-semibold text-accent-teal">{goal.progress}%</span>
        </div>
        <div className="w-full bg-dark-card rounded-full h-3">
          <div
            className="bg-accent-teal h-3 rounded-full transition-all"
            style={{ width: `${goal.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Attachments Section */}
      <div className="border-t border-dark-border pt-3">
        <button
          onClick={() => setShowAttachments(!showAttachments)}
          className="flex items-center gap-2 text-sm text-accent-teal hover:text-accent-teal/80 transition-smooth w-full"
        >
          {showAttachments ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          Attachments {attachments.length > 0 && `(${attachments.length})`}
        </button>

        {showAttachments && (
          <div className="mt-3 space-y-2">
            {attachments.length > 0 ? (
              attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-2 bg-dark-card-hover rounded text-sm hover:bg-dark-border transition-smooth"
                >
                  <div className="flex-1 truncate">
                    <p className="text-text-primary truncate">{attachment.file_name}</p>
                    <p className="text-xs text-text-muted">
                      {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => handleDownloadFile(attachment)}
                      className="p-1 hover:text-accent-teal transition-smooth"
                      title="Download"
                    >
                      <FiDownload size={14} />
                    </button>
                  </div>
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

export default GoalCard;
