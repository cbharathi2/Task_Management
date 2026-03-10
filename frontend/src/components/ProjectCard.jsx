import React, { useState, useContext, useEffect } from 'react';
import { FiFolder, FiTrash2, FiCheck, FiDownload, FiChevronDown, FiChevronUp, FiPlus, FiEdit2 } from 'react-icons/fi';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { fileService } from '../services/fileService';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import CreateTaskModal from './Modals/CreateTaskModal';
import CreateProjectModal from './Modals/CreateProjectModal';
import TaskCard from './TaskCard';

const ProjectCard = ({ project, onDelete, onStatusChange, isCompleted }) => {
  const { user } = useContext(AuthContext);
  const [attachments, setAttachments] = useState([]);
  const [showAttachments, setShowAttachments] = useState(false);
  const [projectTasks, setProjectTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editTaskId, setEditTaskId] = useState(null);

  useEffect(() => {
    if (showAttachments) {
      fetchAttachments();
    }
  }, [showAttachments]);

  useEffect(() => {
    fetchProjectTasks();
    fetchComments();
  }, [project.id]);

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

  // project task helpers
  const fetchProjectTasks = async () => {
    try {
      setLoadingTasks(true);
      const res = await projectService.getProjectTasks(project.id);
      setProjectTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks for project', project.id, err);
      setProjectTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleTaskAdded = () => {
    fetchProjectTasks();
    if (onStatusChange) onStatusChange();
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskService.deleteTask(taskId);
      fetchProjectTasks();
      if (onStatusChange) onStatusChange();
    } catch (err) {
      console.error('Error deleting task', err);
    }
  };

  const { refreshNotifications } = useNotifications();

  // comments
  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const res = await api.get(`/projects/${project.id}/comments`);
      setComments(res.data.comments || []);
    } catch (err) {
      console.error('Error fetching comments', err);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    try {
      await api.post(`/projects/${project.id}/comments`, { message: newComment });
      setNewComment('');
      fetchComments();
      if (onStatusChange) onStatusChange();
      refreshNotifications();
    } catch (err) {
      console.error('Error posting comment', err);
    }
  };

  const editComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      await api.put(`/projects/${project.id}/comments/${commentId}`, { message: editCommentText });
      setEditingCommentId(null);
      setEditCommentText('');
      fetchComments();
    } catch (err) {
      console.error('Error editing comment', err);
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/projects/${project.id}/comments/${commentId}`);
      fetchComments();
    } catch (err) {
      console.error('Error deleting comment', err);
    }
  };

  const postReply = async (commentId) => {
    if (!replyText.trim()) return;
    try {
      await api.post(`/projects/${project.id}/comments/${commentId}/replies`, { message: replyText });
      setReplyText('');
      setReplyingToId(null);
      fetchComments();
      refreshNotifications();
    } catch (err) {
      console.error('Error posting reply', err);
    }
  };

  const deleteReply = async (commentId, replyId) => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      await api.delete(`/projects/${project.id}/comments/${commentId}/replies/${replyId}`);
      fetchComments();
    } catch (err) {
      console.error('Error deleting reply', err);
    }
  };

  const handleTaskEdit = (task) => {
    setEditTaskId(task.id);
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

        <div className="flex items-center gap-2 shrink-0">
          {(user?.role === 'employee' || user?.role === 'admin') && !isCompleted && (
            <button
              onClick={handleMarkComplete}
              className="p-1.5 hover:bg-green-500/10 rounded transition-smooth text-green-400 hover:text-green-300"
              title="Mark as complete"
            >
              <FiCheck size={16} />
            </button>
          )}
          {user?.role === 'admin' && (
            <>
              <button
                onClick={() => setEditModalOpen(true)}
                className="p-1.5 hover:bg-dark-card-hover rounded transition-smooth"
                title="Edit project"
              >
                <FiEdit2 size={16} className="text-yellow-400" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 hover:bg-dark-card-hover rounded transition-smooth"
                title="Delete project"
              >
                <FiTrash2 size={16} className="text-red-400" />
              </button>
            </>
          )}
        </div>
      </div>

      <p className="text-text-secondary text-sm mb-4 line-clamp-3">
        {project.description || 'No description'}
      </p>

      {/* tasks section */}
      <div className="border-t border-dark-border pt-3 mt-3">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setShowTasks(!showTasks)}
            className="flex items-center gap-2 text-xs text-accent-teal hover:text-accent-teal/80 transition-smooth"
          >
            {showTasks ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
            Tasks {projectTasks.length > 0 && `(${projectTasks.length})`}
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => setTaskModalOpen(true)}
              title="Add task"
              className="p-1.5 hover:bg-dark-card-hover rounded transition-smooth text-accent-teal"
            >
              <FiPlus size={16} />
            </button>
          )}
        </div>
        {showTasks && (
          <div className="mt-2 space-y-2">
            {loadingTasks ? (
              <p className="text-xs text-text-muted">Loading tasks...</p>
            ) : projectTasks.length > 0 ? (
              projectTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onDelete={() => handleTaskDelete(t.id)}
                  onEdit={() => handleTaskEdit(t)}
                  onRefresh={fetchProjectTasks}
                  showAssignee={true}
                />
              ))
            ) : (
              <p className="text-xs text-text-muted">No tasks in this project</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
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

      {/* comment section */}
      <div className="border-t border-dark-border pt-3 mt-3">
        <h4 className="text-sm font-semibold text-text-primary mb-2">Comments</h4>
        {loadingComments ? (
          <p className="text-xs text-text-muted">Loading comments...</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {comments.length > 0 ? (
              comments.map(c => (
                <div key={c.id} className="p-2 sm:p-3 bg-dark-card-hover rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-text-primary">{c.user_name} <span className="text-text-secondary text-[10px]">({c.user_role})</span></p>
                    {(user?.id === c.user_id || user?.role === 'admin') && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingCommentId(c.id);
                            setEditCommentText(c.message);
                          }}
                          className="text-[10px] text-accent-teal hover:text-accent-teal/80"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteComment(c.id)}
                          className="text-[10px] text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  {editingCommentId === c.id ? (
                    <div className="space-y-1">
                      <textarea
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                        rows="2"
                        className="w-full px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-text-primary focus:border-accent-teal focus:outline-none"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => editComment(c.id)}
                          className="btn-primary text-xs py-1 px-2 flex-1"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditCommentText('');
                          }}
                          className="btn-secondary text-xs py-1 px-2 flex-1"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-text-secondary">{c.message}</p>
                      <button
                        onClick={() => setReplyingToId(replyingToId === c.id ? null : c.id)}
                        className="text-[10px] text-accent-teal hover:text-accent-teal/80"
                      >
                        {replyingToId === c.id ? 'Cancel Reply' : 'Reply'}
                      </button>
                    </>
                  )}
                  
                  {/* Replies */}
                  {c.replies && c.replies.length > 0 && (
                    <div className="ml-3 mt-2 space-y-1 border-l border-dark-border pl-2">
                      {c.replies.map(r => (
                        <div key={r.id} className="text-[11px]">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-text-primary">
                              {r.user_name} {c.user_id === r.user_id && <span className="text-[9px] text-accent-teal ml-1">(author)</span>}
                            </p>
                            {(user?.id === r.user_id || user?.role === 'admin') && (
                              <button
                                onClick={() => deleteReply(c.id, r.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                          <p className="text-text-secondary">{r.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Reply Input */}
                  {replyingToId === c.id && (
                    <div className="space-y-1 mt-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows="2"
                        placeholder="Write a reply..."
                        className="w-full px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-text-primary focus:border-accent-teal focus:outline-none"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => postReply(c.id)}
                          disabled={!replyText.trim()}
                          className="btn-primary text-xs py-1 px-2 flex-1 disabled:opacity-50"
                        >
                          Post Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-text-muted">No comments yet</p>
            )}
          </div>
        )}
        <div className="mt-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows="2"
            placeholder="Write a comment..."
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-text-primary focus:border-accent-teal focus:outline-none transition-smooth resize-none"
          />
          <button
            onClick={postComment}
            className="btn-primary mt-2 w-full"
            disabled={!newComment.trim()}
          >
            Post Comment
          </button>
        </div>
      </div>

      {/* modal for adding/editing task */}
      {taskModalOpen && (
        <CreateTaskModal
          isOpen={taskModalOpen}
          onClose={() => setTaskModalOpen(false)}
          projects={[project]}
          project={project}
          onTaskCreated={handleTaskAdded}
        />
      )}

      {/* modal for editing task */}
      {editTaskId && (
        <CreateTaskModal
          isOpen={true}
          onClose={() => setEditTaskId(null)}
          task={projectTasks.find(t => t.id === editTaskId)}
          projects={[project]}
          project={project}
          onTaskCreated={handleTaskAdded}
        />
      )}

      {/* edit project modal */}
      {editModalOpen && (
        <CreateProjectModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          project={project}
          onProjectCreated={() => {
            if (onStatusChange) onStatusChange();
          }}
        />
      )}
    </div>
  );
};

export default ProjectCard;
