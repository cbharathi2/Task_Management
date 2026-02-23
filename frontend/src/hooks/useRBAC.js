import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook for role-based access control
 * Usage: const { isAdmin, isEmployee, can } = useRBAC();
 */
export const useRBAC = () => {
  const { user } = useContext(AuthContext);

  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';

  /**
   * Check if user has specific permission
   * @param {string} action - Action to check (create, edit, delete, view)
   * @param {string} resource - Resource type (task, project, goal, team)
   * @param {object} resourceData - The actual resource object for ownership checks
   * @returns {boolean}
   */
  const can = (action, resource, resourceData = null) => {
    // Admins can do everything
    if (isAdmin) return true;

    // Employees have limited permissions
    if (isEmployee) {
      switch (resource) {
        case 'task':
          // Employees can only view and update their assigned tasks
          if (action === 'create') return false;
          if (action === 'view') return true;
          if (action === 'update' && resourceData?.assigned_to === user?.id) return true;
          if (action === 'delete') return false;
          return false;

        case 'project':
          // Employees can only view projects and mark as complete
          if (action === 'view') return true;
          if (action === 'create') return false;
          if (action === 'delete') return false;
          if (action === 'complete') return true;
          return false;

        case 'goal':
          // Employees can create and manage their own goals
          if (action === 'create') return true;
          if (action === 'view') return true;
          if (action === 'update' && resourceData?.owner_id === user?.id) return true;
          if (action === 'delete' && resourceData?.owner_id === user?.id) return true;
          return false;

        case 'team':
          // Employees can only view their teams
          if (action === 'view') return true;
          if (action === 'create') return false;
          if (action === 'edit') return false;
          if (action === 'delete') return false;
          return false;

        case 'user':
          // Employees cannot manage users
          return false;

        default:
          return false;
      }
    }

    return false;
  };

  return {
    isAdmin,
    isEmployee,
    can,
    user,
  };
};

export default useRBAC;
