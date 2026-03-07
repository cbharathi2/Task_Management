import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { goalService } from '../services/goalService';
import { projectService } from '../services/projectService';
import ProjectCard from '../components/ProjectCard';
import GoalCard from '../components/GoalCard';
import { FiPlus } from 'react-icons/fi';
import NotificationIcon from '../components/NotificationIcon';
import CreateProjectModal from '../components/Modals/CreateProjectModal';
import CreateGoalModal from '../components/Modals/CreateGoalModal';
import { useRBAC } from '../hooks/useRBAC';
import { fileService } from '../services/fileService';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const { can, user } = useRBAC();
  const { user: authUser } = useContext(AuthContext);
  // tasks moved to project cards
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [createTeamGoalOpen, setCreateTeamGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [goalsRes, projectsRes] = await Promise.all([
        goalService.getMyGoals(),
        projectService.getAllProjects(),
      ]);
      setGoals(goalsRes.data.goals || []);
      setProjects(projectsRes.data.projects || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };


  const deleteGoal = async (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await goalService.deleteGoal(goalId);
        setGoals(goals.filter((g) => g.id !== goalId));
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-text-secondary">Loading...</div>;
  }

  return (
    <div className="ml-64 pt-24 px-8 pb-12 space-y-8">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            Good morning, <span className="text-accent-teal">{user?.name || 'Admin'}</span> 👋
          </h1>
          <p className="text-text-secondary">Let's make today productive</p>
        </div>
        <NotificationIcon onRefresh={fetchData} />
      </div>


      <CreateProjectModal
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onSuccess={fetchData}
      />

      <CreateGoalModal
        isOpen={createGoalOpen}
        onClose={() => setCreateGoalOpen(false)}
        isTeamGoal={false}
        onSuccess={fetchData}
      />

      <CreateGoalModal
        isOpen={createTeamGoalOpen}
        onClose={() => setCreateTeamGoalOpen(false)}
        isTeamGoal={true}
        onSuccess={fetchData}
      />

      {/* Main Grid */}
      {/* Projects & Goals */}
      <div className="space-y-8">
          {/* Active Projects */}
          <div className="card-base space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-text-primary">Active Projects</h2>
              {can('create', 'project') && (
                <button
                  onClick={() => setCreateProjectOpen(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <FiPlus size={18} />
                </button>
              )}
            </div>
            {projects.filter(p => p.status !== 'Completed').length > 0 ? (
              projects
                .filter(p => p.status !== 'Completed')
                .map((project) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onStatusChange={fetchData}
                    onDelete={() => setProjects(projects.filter(p => p.id !== project.id))}
                  />
                ))
            ) : (
              <p className="text-center py-8 text-text-muted">No active projects</p>
            )}
          </div>

          {/* Completed Projects */}
          {projects.filter(p => p.status === 'Completed').length > 0 && (
            <div className="card-base space-y-4">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Completed Projects</h2>
              {projects
                .filter(p => p.status === 'Completed')
                .map((project) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onStatusChange={fetchData}
                    onDelete={() => setProjects(projects.filter(p => p.id !== project.id))}
                  />
                ))}
            </div>
          )}

          {/* Goals */}
          <div className="card-base space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-text-primary">My Goals</h2>
              {can('create', 'goal') && (
                <button
                  onClick={() => setCreateGoalOpen(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <FiPlus size={18} />
                </button>
              )}
            </div>
            {goals.length > 0 ? (
              goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={() => setEditingGoal(goal)}
                  onDelete={() => deleteGoal(goal.id)}
                  onRefresh={fetchData}
                />
              ))
            ) : (
              <p className="text-center py-8 text-text-muted">No goals set</p>
            )}
          </div>
        </div>

    </div>
  );
};

export default Home;
