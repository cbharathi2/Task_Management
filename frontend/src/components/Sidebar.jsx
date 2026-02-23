import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiCheckCircle, FiBarChart2, FiTarget, FiFolder, FiUsers, FiLogOut } from 'react-icons/fi';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useContext(AuthContext);

const navItems = [
  { path: '/home', label: 'Home', icon: FiHome },
  { path: '/my-tasks', label: 'My Tasks', icon: FiCheckCircle },
  { path: '/reporting', label: 'Reporting', icon: FiBarChart2 },
  { path: '/goals', label: 'Goals', icon: FiTarget },
  { path: '/projects', label: 'Projects', icon: FiFolder },
  { path: '/teams', label: 'Teams', icon: FiUsers },
];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-sidebar border-r border-dark-border p-6 flex flex-col">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-accent-teal flex items-center gap-2">
          <span className="text-3xl">✓</span> TaskFlow
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${
                active
                  ? 'bg-accent-teal bg-opacity-20 text-accent-teal border border-accent-teal/30'
                  : 'text-text-secondary hover:bg-dark-card-hover'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="flex items-center gap-3 px-4 py-3 rounded-lg w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-smooth border border-red-500/30"
      >
        <FiLogOut size={20} />
        <span className="font-medium">Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;
