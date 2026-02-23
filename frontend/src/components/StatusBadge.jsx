import React from 'react';

const StatusBadge = ({ status }) => {
  const statusStyles = {
    'To-Do': 'status-todo',
    'In Progress': 'status-in-progress',
    'Completed': 'status-completed',
    'Overdue': 'status-overdue',
  };

  return (
    <span className={`status-badge ${statusStyles[status] || 'status-todo'}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
