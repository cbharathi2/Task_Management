import React, { useContext } from 'react';
import { FiSearch, FiBell, FiHelpCircle, FiUser } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';

const TopBar = () => {
  const { user } = useContext(AuthContext);
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed top-0 left-64 right-0 h-20 bg-dark-bg border-b border-dark-border px-8 flex items-center justify-between z-40">
      {/* Date and Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="text-text-secondary text-sm">{currentDate}</div>
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search tasks, projects..."
            className="w-full bg-dark-card border border-dark-border rounded-lg py-2 pl-10 pr-4 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-teal transition-smooth"
          />
          <FiSearch className="absolute left-3 top-2.5 text-text-muted" size={18} />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        <button className="text-text-secondary hover:text-accent-teal transition-smooth">
          <FiBell size={20} />
        </button>
        <button className="text-text-secondary hover:text-accent-teal transition-smooth">
          <FiHelpCircle size={20} />
        </button>
        <div className="flex items-center gap-3 pl-6 border-l border-dark-border">
          <div className="text-right">
            <p className="text-sm font-medium text-text-primary">{user?.name}</p>
            <p className="text-xs text-text-muted capitalize">{user?.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-accent-teal flex items-center justify-center text-dark-sidebar font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
