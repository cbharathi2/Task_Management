import React, { useContext } from 'react';
import { FiSearch, FiBell, FiHelpCircle } from 'react-icons/fi';
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
    <div className="fixed top-0 left-0 md:left-64 right-0 h-16 md:h-20 bg-dark-bg/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 flex items-center justify-between z-40">
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="hidden lg:block text-text-secondary text-sm whitespace-nowrap">{currentDate}</div>
        <div className="relative flex-1 max-w-xl">
          <input
            type="text"
            placeholder="Search tasks, projects..."
            className="surface-input pl-10"
          />
          <FiSearch className="absolute left-3 top-2.5 text-text-muted" size={18} />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5 ml-3">
        <button className="text-text-secondary hover:text-accent-teal transition-smooth p-1.5 rounded-lg hover:bg-dark-card-hover">
          <FiBell size={20} />
        </button>
        <button className="hidden sm:inline-flex text-text-secondary hover:text-accent-teal transition-smooth p-1.5 rounded-lg hover:bg-dark-card-hover">
          <FiHelpCircle size={20} />
        </button>
        <div className="flex items-center gap-2 sm:gap-3 sm:pl-4 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-text-primary">{user?.name}</p>
            <p className="text-xs text-text-muted capitalize">{user?.role}</p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-accent-teal flex items-center justify-center text-dark-sidebar font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
