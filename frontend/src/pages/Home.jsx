import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskService } from '../services/taskService';
import { goalService } from '../services/goalService';
import { projectService } from '../services/projectService';
import TaskCard from '../components/TaskCard';
import ProjectCard from '../components/ProjectCard';
import GoalCard from '../components/GoalCard';
import StatusBadge from '../components/StatusBadge';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import CreateTaskModal from '../components/Modals/CreateTaskModal';
import CreateProjectModal from '../components/Modals/CreateProjectModal';
import CreateGoalModal from '../components/Modals/CreateGoalModal';
import { useRBAC } from '../hooks/useRBAC';
import { fileService } from '../services/fileService';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const { can, user } = useRBAC();
  const { user: authUser } = useContext(AuthContext);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [createTeamGoalOpen, setCreateTeamGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, createdTasksRes, goalsRes, projectsRes] = await Promise.all([
        taskService.getMyTasks(),
        authUser?.role === 'admin' ? taskService.getTasksAssignedByMe() : Promise.resolve({ data: { tasks: [] } }),
        goalService.getMyGoals(),
        projectService.getAllProjects(),
      ]);
      
      // Combine both assigned tasks and created tasks for admins
      let allTasks = tasksRes.data.tasks || [];
      if (authUser?.role === 'admin') {
        const createdTasks = createdTasksRes.data.tasks || [];
        allTasks = [...allTasks, ...createdTasks].reduce((unique, task) => {
          return unique.find(t => t.id === task.id) ? unique : [...unique, task];
        }, []);
      }
      
      setTasks(allTasks);
      setGoals(goalsRes.data.goals || []);
      setProjects(projectsRes.data.projects || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTabTasks = () => {
    const now = new Date();
    switch (activeTab) {
      case 'upcoming':
        return tasks.filter((t) => t.status !== 'Completed' && new Date(t.due_date) >= now);
      case 'overdue':
        return tasks.filter((t) => t.status !== 'Completed' && new Date(t.due_date) < now);
      case 'completed':
        return tasks.filter((t) => t.status === 'Completed');
      default:
        return [];
    }
  };

  const getTaskStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeekStart = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000);
    const nextWeekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      incomplete: tasks.filter(t => t.status !== 'Completed').length,
      overdue: tasks.filter(t => t.status !== 'Completed' && new Date(t.due_date) < today).length,
      assignedToday: tasks.filter(t => {
        const createdDate = new Date(t.created_at);
        const createdDateOnly = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
        return createdDateOnly.getTime() === today.getTime();
      }).length,
      doToday: tasks.filter(t => {
        const dueDate = new Date(t.due_date);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        return t.status !== 'Completed' && dueDateOnly.getTime() === today.getTime();
      }).length,
      doNextWeek: tasks.filter(t => {
        const dueDate = new Date(t.due_date);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        return t.status !== 'Completed' && dueDateOnly >= nextWeekStart && dueDateOnly <= nextWeekEnd;
      }).length,
      doLater: tasks.filter(t => {
        const dueDate = new Date(t.due_date);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        return t.status !== 'Completed' && dueDateOnly > nextWeekEnd;
      }).length,
    };
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
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          Good morning, <span className="text-accent-teal">{user?.name || 'Admin'}</span> 👋
        </h1>
        <p className="text-text-secondary">Let's make today productive</p>
      </div>

      {/* Create Task Button - Only for Admins */}
      {can('create', 'task') && (
        <button
          onClick={() => setCreateTaskOpen(true)}
          className="btn-primary flex items-center gap-2 mb-4"
        >
          <FiPlus size={18} />
          Create Task
        </button>
      )}

      <CreateTaskModal
        isOpen={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        projects={projects}
        onTaskCreated={fetchData}
      />

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Tasks */}
        <div className="lg:col-span-2 card-base space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-text-primary">Tasks</h2>
            <button
              onClick={() => setCreateTaskOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus size={18} />
              Create Task
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-dark-border mb-4">
            {['upcoming', 'overdue', 'completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-2 font-medium text-sm transition-smooth border-b-2 ${
                  activeTab === tab
                    ? 'text-accent-teal border-accent-teal'
                    : 'text-text-secondary border-transparent hover:text-text-primary'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Task List */}
          <div className="space-y-4">
            {getTabTasks().length > 0 ? (
              getTabTasks().map((task) => <TaskCard key={task.id} task={task} onRefresh={fetchData} />)
            ) : (
              <p className="text-center py-8 text-text-muted">No tasks in this category</p>
            )}
          </div>
        </div>

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

      {/* Tasks Assigned By Me */}
      <div className="card-base mt-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Tasks Assigned By Me</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left py-4 px-4 text-text-muted font-medium text-sm">Task ID</th>
                <th className="text-left py-4 px-4 text-text-muted font-medium text-sm">Project</th>
                <th className="text-left py-4 px-4 text-text-muted font-medium text-sm">Assigned To</th>
                <th className="text-left py-4 px-4 text-text-muted font-medium text-sm">Priority</th>
                <th className="text-left py-4 px-4 text-text-muted font-medium text-sm">Status</th>
                <th className="text-left py-4 px-4 text-text-muted font-medium text-sm">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-dark-border hover:bg-dark-card-hover transition-smooth"
                >
                  <td className="py-4 px-4 text-text-primary font-medium">#{task.id}</td>
                  <td className="py-4 px-4 text-text-secondary">
                    {task.project_order_number ? `[${task.project_order_number}] ${task.project_name}` : task.project_name}
                  </td>
                  <td className="py-4 px-4 text-text-secondary">{task.assigned_to_name}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`text-xs font-bold ${
                        task.priority === 'High'
                          ? 'text-red-400'
                          : task.priority === 'Medium'
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="py-4 px-4 text-text-secondary text-sm">
                    {new Date(task.due_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Home;
