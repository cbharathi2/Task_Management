import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiUpload, FiTrash2 } from 'react-icons/fi';
import api from '../../services/api';
import { fileService } from '../../services/fileService';

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated, project }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    orderNumber: '',
  });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    console.log('📝 Form data before validation:', formData);
    if (!formData.name || !formData.name.trim()) {
      setError('Project name is required');
      setLoading(false);
      return;
    }

    if (!formData.orderNumber || !formData.orderNumber.trim()) {
      console.error('❌ Order number validation failed:', { orderNumber: formData.orderNumber, isEmpty: !formData.orderNumber, isTrimmedEmpty: !formData.orderNumber?.trim() });
      setError('Order number is required');
      setLoading(false);
      return;
    }

    try {
      const projectPayload = {
        name: formData.name,
        description: formData.description,
        order_number: formData.orderNumber,
      };

      if (project) {
        console.log('📝 Updating project', project.id, 'data:', projectPayload);
        await api.put(`/projects/${project.id}`, projectPayload);
        alert('Project updated successfully!');
      } else {
        console.log('📝 Creating project with data:', projectPayload);
        const projectResponse = await api.post('/projects', projectPayload);
        console.log('📦 API Response:', projectResponse.data);

        const projectId = projectResponse.data.projectId;
        if (!projectId) {
          throw new Error('Invalid response from server');
        }

        // Upload attachments if any
        if (attachments.length > 0) {
          console.log('📂 Uploading', attachments.length, 'attachments...');
          for (const file of attachments) {
            try {
              await fileService.uploadFile(file, 'project', projectId);
              console.log('✅ File uploaded:', file.name);
            } catch (fileError) {
              console.error('⚠️  Error uploading file:', file.name, fileError);
              // Don't fail the whole process if file upload fails
            }
          }
        }

        console.log('✅ Project created successfully');
        setLoading(false);
        alert('Project created successfully!');
      }

      // Refresh projects list
      try {
        await onProjectCreated();
      } catch (refreshError) {
        console.error('⚠️  Error refreshing projects list:', refreshError);
      }
      handleClose();
      return; // Exit after success
    } catch (err) {
      console.error('❌ Error creating/updating project:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });

      // Handle specific error responses
      if (err.response?.status === 403) {
        setError('You do not have permission to create projects. Only admins can create projects.');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Invalid project data. Please check all fields.');
      } else if (err.response?.status === 409 || err.response?.data?.message?.includes('Duplicate')) {
        setError('This order number already exists. Please use a unique order number.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please check your form data and try again.');
      } else {
        setError(err.response?.data?.message || 'Failed to create project. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', description: '', orderNumber: '' });
    setAttachments([]);
    setError(null);
    setLoading(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      // Clear any previous errors when modal opens
      setError(null);
      if (project) {
        // Editing existing project
        setFormData({
          name: project.name || '',
          description: project.description || '',
          orderNumber: project.order_number || '',
        });
      } else {
        // Creating new project - reset form
        setFormData({
          name: '',
          description: '',
          orderNumber: '',
        });
      }
    }
  }, [project, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-shell">
      <div className="modal-card max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4 sm:p-6 border-b border-dark-border sticky top-0 bg-dark-card">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary">{project ? 'Edit Project' : 'Create New Project'}</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-dark-card-hover rounded-lg transition-smooth"
          >
            <FiX size={24} className="text-text-secondary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {error && (
            <div className="p-4 bg-accent-teal/15 border border-accent-teal/35 rounded-lg text-text-primary text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Project Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter project name"
              required
              className="surface-input"
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
              onChange={handleInputChange}
              placeholder="Enter project description"
              rows="4"
              className="surface-input resize-none"
            />
          </div>

          {/* Order Number */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Order Number *
            </label>
            <input
              type="text"
              name="orderNumber"
              value={formData.orderNumber}
              onChange={handleInputChange}
              placeholder="Enter order number"
              required
              className="surface-input"
            />
          </div>

          {/* File Upload */}
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
                className="flex-1 px-4 py-2 bg-dark-bg border border-dashed border-accent-teal/60 rounded-xl text-accent-teal hover:bg-dark-card-hover transition-smooth flex items-center justify-center gap-2"
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
                      className="p-2 hover:bg-accent-teal/15 rounded-lg transition-smooth"
                    >
                      <FiTrash2 size={16} className="text-text-primary" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-dark-border">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (project ? 'Updating...' : 'Saving...') : project ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
