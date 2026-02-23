import api from './api';

export const fileService = {
  /**
   * Upload file to server
   * @param {File} file - File object to upload
   * @param {string} entityType - Type of entity (task, project, goal)
   * @param {number} entityId - ID of the entity
   * @returns {Promise}
   */
  uploadFile: async (file, entityType, entityId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    console.log('📤 Uploading file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      entityType,
      entityId,
    });

    try {
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('✅ File uploaded successfully');
      return response.data;
    } catch (error) {
      console.error('❌ File upload error:', error);
      throw error;
    }
  },

  /**
   * Get attachments for an entity
   * @param {string} entityType - Type of entity
   * @param {number} entityId - ID of entity
   * @returns {Promise}
   */
  getAttachments: async (entityType, entityId) => {
    try {
      const response = await api.get(`/files/attachments/${entityType}/${entityId}`);
      return response.data.attachments || [];
    } catch (error) {
      console.error('❌ Error fetching attachments:', error);
      return [];
    }
  },

  /**
   * Delete attachment
   * @param {number} attachmentId - ID of attachment to delete
   * @returns {Promise}
   */
  deleteAttachment: async (attachmentId) => {
    try {
      const response = await api.delete(`/files/attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting attachment:', error);
      throw error;
    }
  },
};

export default fileService;
