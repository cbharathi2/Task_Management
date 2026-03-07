import React, { useState, useEffect, useContext } from 'react';
import { FiPlus } from 'react-icons/fi';
import ProjectCard from '../components/ProjectCard';
import CreateProjectModal from '../components/Modals/CreateProjectModal';
import api from '../services/api';
import { useRBAC } from '../hooks/useRBAC';

const Projects = () => {
  const { can } = useRBAC();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectDelete = (projectId) => {
    setProjects(projects.filter(p => p.id !== projectId));
  };

  if (loading) {
    return <div className="page-shell text-center py-12 text-text-secondary">Loading...</div>;
  }

  const activeProjects = projects.filter(p => p.status !== 'Completed');
  const completedProjects = projects.filter(p => p.status === 'Completed');

  return (
    <div className="page-shell space-y-8">
      <div className="page-header mb-8">
        <h1 className="page-title">Projects</h1>
        {can('create', 'project') && (
          <button onClick={() => setCreateProjectOpen(true)} className="btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center">
            <FiPlus size={18} />
            Create Project
          </button>
        )}
      </div>

      {/* Active Projects */}
      <div>
        <h2 className="section-title mb-6">Active Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeProjects.length > 0 ? (
            activeProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onDelete={handleProjectDelete}
                onStatusChange={fetchProjects}
              />
            ))
          ) : (
            <p className="text-text-muted col-span-full text-center py-8">No active projects</p>
          )}
        </div>
      </div>

      {/* Completed Projects */}
      {completedProjects.length > 0 && (
        <div>
          <h2 className="section-title mb-6">Completed Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onDelete={handleProjectDelete}
                onStatusChange={fetchProjects}
              />
            ))}
          </div>
        </div>
      )}
      <CreateProjectModal
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onProjectCreated={fetchProjects}
      />
    </div>
  );
};

export default Projects;
