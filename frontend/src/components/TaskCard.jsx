import React, { useState, useContext, useEffect } from 'react';
import StatusBadge from './StatusBadge';
import { FiTrash2, FiEdit2, FiCheck, FiDownload, FiEye, FiPlayCircle } from 'react-icons/fi';
import { taskService } from '../services/taskService';
import { fileService } from '../services/fileService';
import { AuthContext } from '../context/AuthContext';

const TaskCard = ({ task, onEdit, onDelete, onRefresh, showAssignee = false }) => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showAttachments, setShowAttachments] = useState(false);
  const [pdfModal, setPdfModal] = useState(null);
  const [projectOrderNo, setProjectOrderNo] = useState(null);
  const [assignedName, setAssignedName] = useState(null);
  
  const dueDate = new Date(task.due_date).toLocaleDateString();
  const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'Completed';

  useEffect(() => {
    if (showAttachments) {
      fetchAttachments();
    }
  }, [showAttachments]);

  useEffect(() => {
    // Use project order number from task data directly
    if (task.project_order_number) {
      setProjectOrderNo(task.project_order_number);
    } else {
      setProjectOrderNo('N/A');
    }
    // Set assigned name
    if (task.team_id) {
      setAssignedName(task.team_name || `Team ${task.team_id}`);
    } else if (task.assigned_to) {
      setAssignedName(task.assigned_to_name || `User ${task.assigned_to}`);
    }
  }, [task]);

  const fetchAttachments = async () => {
    try {
      const attachments = await fileService.getAttachments('task', task.id);
      setAttachments(attachments);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const isOwner = user?.role === 'admin' || user?.id === task.assigned_to;

  const handleMarkComplete = async () => {
    if (task.status === 'Completed') return;
    
    try {
      setLoading(true);
      await taskService.updateTask(task.id, { status: 'Completed' });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error marking task as complete:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkInProgress = async () => {
    if (task.status !== 'To-Do') return;
    try {
      setLoading(true);
      await taskService.updateTask(task.id, { status: 'In Progress' });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error marking task in progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  const handleOpenPdf = (attachment) => {
    setPdfModal(attachment);
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
    <>
      <div className="card-base group">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-text-primary group-hover:text-accent-teal transition-smooth">
                {task.task_number ? `#${task.task_number} ` : ''}{task.title}
              </h3>
              {task.team_id && user?.role === 'employee' && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-medium whitespace-nowrap">
                  👥 Team Task
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-smooth">
            {isAdmin && onEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 hover:bg-dark-card-hover rounded transition-smooth"
                title="Edit task"
              >
                <FiEdit2 size={16} className="text-yellow-400" />
              </button>
            )}
            {isAdmin && onDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 hover:bg-dark-card-hover rounded transition-smooth"
                title="Delete task"
              >
                <FiTrash2 size={16} className="text-red-400" />
              </button>
            )}
          </div>
        </div>

        <p className="text-text-secondary text-sm mb-4 line-clamp-2">
          {task.description || 'No description'}
        </p>

        <div className="space-y-3">
          {task.project_id && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Project Order No</span>
              <span className="px-2 py-1 bg-accent-teal/10 text-accent-teal rounded text-xs font-medium">
                {projectOrderNo || 'Loading...'}
              </span>
            </div>
          )}

          {!showAssignee && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Assigned To</span>
              <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs font-medium">
                {assignedName || 'Not assigned'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Status</span>
            <div className="flex items-center gap-2">
              <StatusBadge status={isOverdue ? 'Overdue' : task.status} />
              {isOwner && task.status === 'To-Do' && (
                <button
                  onClick={handleMarkInProgress}
                  disabled={loading}
                  className="p-1.5 hover:bg-yellow-500/10 rounded transition-smooth disabled:opacity-50"
                  title="Mark in progress"
                >
                  <FiPlayCircle size={16} className="text-yellow-400" />
                </button>
              )}
              {isOwner && task.status !== 'Completed' && (
                <button
                  onClick={handleMarkComplete}
                  disabled={loading}
                  className="p-1.5 hover:bg-green-500/10 rounded transition-smooth disabled:opacity-50"
                  title="Mark as complete"
                >
                  <FiCheck size={16} className="text-green-400" />
                </button>
              )}
            </div>
          </div>

          {showAssignee && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Assigned To</span>
              <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs font-medium">
                {assignedName || 'Not assigned'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Due Date</span>
            <span className={`text-xs font-medium ${isOverdue ? 'text-red-400' : 'text-text-secondary'}`}>
              {dueDate}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-dark-border">
            <span className="text-xs text-text-muted">Priority</span>
            <span className={`text-xs font-bold ${
              task.priority === 'High' ? 'text-red-400' :
              task.priority === 'Medium' ? 'text-yellow-400' :
              'text-green-400'
            }`}>
              {task.priority}
            </span>
          </div>

          {/* Attachments Section */}
          <div className="pt-2 border-t border-dark-border">
            <button
              onClick={() => setShowAttachments(!showAttachments)}
              className="text-xs font-medium text-accent-teal hover:text-accent-teal/80 transition-smooth"
            >
              {showAttachments ? '▼ Hide Attachments' : '▶ Show Attachments'}
            </button>

            {showAttachments && (
              <div className="mt-3 space-y-2">
                {attachments.length > 0 ? (
                  attachments.map(attachment => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 bg-dark-card-hover rounded text-xs">
                      <span className="text-text-secondary truncate flex-1">{attachment.file_name}</span>
                      <div className="flex gap-1">
                        {attachment.file_type === 'application/pdf' && (
                          <button
                            onClick={() => handleOpenPdf(attachment)}
                            className="p-1 hover:text-accent-teal transition-smooth"
                            title="View PDF"
                          >
                            <FiEye size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadFile(attachment)}
                          className="p-1 hover:text-accent-teal transition-smooth"
                          title="Download file"
                        >
                          <FiDownload size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-text-muted text-xs">No attachments</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {pdfModal && (
        <PdfViewerModal
          attachment={pdfModal}
          onClose={() => setPdfModal(null)}
        />
      )}
    </>
  );
};

const PdfViewerModal = ({ attachment, onClose }) => {
  const [pdfBlob, setPdfBlob] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const token = localStorage.getItem('token');

  React.useEffect(() => {
    const fetchPdf = async () => {
      try {
        console.log('📄 Fetching PDF:', attachment.id);
        const response = await fetch(`/api/files/viewer/${attachment.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('📄 PDF response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errText = await response.text();
          console.error('📄 Error response:', errText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log('📄 PDF blob received:', blob.size, 'bytes, type:', blob.type);
        
        const url = window.URL.createObjectURL(blob);
        setPdfBlob(url);
        setError(null);
      } catch (err) {
        console.error('❌ Error loading PDF:', err);
        setError(err.message || 'Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();

    return () => {
      if (pdfBlob) {
        window.URL.revokeObjectURL(pdfBlob);
      }
    };
  }, [attachment.id, token]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-dark-border flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="text-xl font-bold text-text-primary truncate">{attachment.file_name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-card-hover rounded-lg transition-smooth"
          >
            <span className="text-2xl text-text-secondary">×</span>
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-black/20">
          {loading ? (
            <div className="flex items-center justify-center h-full text-text-secondary">
              Loading PDF...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-400 p-4 text-center">
              <p className="font-semibold mb-2">❌ Error Loading PDF</p>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-4 text-text-muted">Make sure you have permission to view this file.</p>
            </div>
          ) : pdfBlob ? (
            <iframe
              src={pdfBlob}
              title={attachment.file_name}
              className="w-full h-full"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
