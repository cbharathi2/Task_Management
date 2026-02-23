import React from 'react';
import { useRBAC } from '../hooks/useRBAC';

/**
 * Wrapper component for role-based UI visibility
 * @param {string} action - Action to check (create, edit, delete, view)
 * @param {string} resource - Resource type (task, project, goal, user)
 * @param {object} resourceData - Resource data for ownership checks
 * @param {React.ReactNode} children - Content to show if authorized
 * @param {React.ReactNode} fallback - Content to show if not authorized
 */
export const ProtectedUI = ({ action, resource, resourceData, children, fallback = null }) => {
  const { can } = useRBAC();

  if (can(action, resource, resourceData)) {
    return <>{children}</>;
  }

  return fallback;
};

/**
 * Higher-Order Component for protecting entire pages/components
 */
export const withRBACProtection = (Component, requiredAction, requiredResource) => {
  return (props) => {
    const { can, user } = useRBAC();

    if (!can(requiredAction, requiredResource)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-400 mb-4">Access Denied</h1>
            <p className="text-text-secondary mb-8">
              You don't have permission to access this resource.
            </p>
            <a href="/home" className="btn-primary">
              Go Home
            </a>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

export default ProtectedUI;
