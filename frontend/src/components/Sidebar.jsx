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
    <>
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-dark-sidebar/95 backdrop-blur-md border-r border-white/10 p-6 flex-col z-40">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-accent-teal flex items-center gap-2">
            <span className="text-3xl">✓</span> SSA
          </h1>
          <p className="text-xs text-text-muted mt-2">Task management workspace</p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-smooth ${
                  active
                    ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal/30 shadow-[inset_0_0_0_1px_rgba(45,212,191,0.12)]'
                    : 'text-text-secondary hover:bg-dark-card-hover'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-smooth border border-red-500/30"
        >
          <FiLogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </aside>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-dark-sidebar/95 backdrop-blur-lg px-2 py-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`min-w-[74px] flex-1 flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium transition-smooth ${
                  active ? 'bg-accent-teal/20 text-accent-teal' : 'text-text-secondary hover:bg-dark-card-hover'
                }`}
              >
                <Icon size={16} />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="min-w-[74px] flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium text-red-400 bg-red-500/10 border border-red-500/30"
          >
            <FiLogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
