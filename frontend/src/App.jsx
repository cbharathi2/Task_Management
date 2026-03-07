import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Home from './pages/Home';
import MyTasks from './pages/MyTasks';
import Reporting from './pages/Reporting';
import Goals from './pages/Goals';
import Projects from './pages/Projects';
import Teams from './pages/Teams';
import Login from './pages/Login';

const AppContent = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-text-secondary">Loading...</div>;
  }

  return (
    <Router>
      {isAuthenticated ? (
        <div className="min-h-screen bg-gradient-to-br from-dark-sidebar via-dark-bg to-dark-bg">
          <Sidebar />
          <TopBar />
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/my-tasks" element={<MyTasks />} />
            <Route path="/reporting" element={<Reporting />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
