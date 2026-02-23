import React, { useState, useEffect, useContext } from 'react';
import { Calendar, List, TrendingUp, Plus } from 'lucide-react';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/Modals/CreateTaskModal';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { AuthContext } from '../context/AuthContext';
import { useRBAC } from '../hooks/useRBAC';

const MyTasks = () => {
  const { user } = useContext(AuthContext);
  const { can } = useRBAC();
  const [viewMode, setViewMode] = useState('list');
  const [tasks, setTasks] = useState([]);
  const [tasksAssignedByMe, setTasksAssignedByMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchTasks();
    if (user?.role === 'admin') {
      fetchTasksAssignedByMe();
    }
    fetchProjects();
  }, [user]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getMyTasks();
      setTasks(response.data.tasks || []);
      console.log('✅ Tasks loaded:', response.data.tasks?.length || 0);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasksAssignedByMe = async () => {
    try {
      const response = await taskService.getTasksAssignedByMe();
      setTasksAssignedByMe(response.data.tasks || []);
      console.log('✅ Tasks assigned by me loaded:', response.data.tasks?.length || 0);
    } catch (error) {
      console.error('Error fetching tasks assigned by me:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectService.getAllProjects();
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const categorizeTasksByDate = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeekStart = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000);
    const nextWeekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const categorized = {
      upcoming: [],
      overdue: [],
      completed: [],
      assignedToday: [],
      doToday: [],
      doNextWeek: [],
      doLater: [],
    };

    tasks.forEach((task) => {
      const dueDate = new Date(task.due_date);
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      const createdDate = new Date(task.created_at);
      const createdDateOnly = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());

      // Completed
      if (task.status === 'Completed') {
        categorized.completed.push(task);
      } else {
        // Check if assigned today
        if (createdDateOnly.getTime() === today.getTime()) {
          categorized.assignedToday.push(task);
        }

        // Overdue
        if (dueDateOnly < today) {
          categorized.overdue.push(task);
        } else if (dueDateOnly.getTime() === today.getTime()) {
          // Do today
          categorized.doToday.push(task);
        } else if (dueDateOnly >= nextWeekStart && dueDateOnly <= nextWeekEnd) {
          // Do next week
          categorized.doNextWeek.push(task);
        } else if (dueDateOnly > nextWeekEnd) {
          // Do later
          categorized.doLater.push(task);
        } else {
          // Upcoming
          categorized.upcoming.push(task);
        }
      }
    });

    // Sort each category
    categorized.upcoming.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    categorized.overdue.sort((a, b) => new Date(b.due_date) - new Date(a.due_date));
    categorized.completed.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

    return categorized;
  };

  const categorizeAssignedByMe = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeekStart = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000);
    const nextWeekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const categorized = {
      pending: [],
      completed: [],
      overdue: [],
    };

    tasksAssignedByMe.forEach((task) => {
      const dueDate = new Date(task.due_date);
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

      if (task.status === 'Completed') {
        categorized.completed.push(task);
      } else if (dueDateOnly < today) {
        categorized.overdue.push(task);
      } else {
        categorized.pending.push(task);
      }
    });

    categorized.pending.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    categorized.completed.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
    categorized.overdue.sort((a, b) => new Date(b.due_date) - new Date(a.due_date));

    return categorized;
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await taskService.deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      console.log('✅ Task deleted successfully');
    } catch (error) {
      alert('Error deleting task: ' + (error.response?.data?.message || error.message));
    }
  };

  const categorized = categorizeTasksByDate();

  const calendarEvents = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    date: task.due_date,
    backgroundColor: task.status === 'Completed' ? '#10B981' : 
                     new Date(task.due_date) < new Date() && task.status !== 'Completed' ? '#EF4444' :
                     '#3B82F6',
  }));

  if (loading) {
    return <div className="text-center py-12 text-text-secondary">Loading...</div>;
  }

  const sections = [
    { key: 'assignedToday', label: '📌 Assigned Today', empty: 'No tasks assigned today' },
    { key: 'doToday', label: '⚡ Do Today', empty: 'No tasks due today' },
    { key: 'doNextWeek', label: '📅 Do Next Week', empty: 'No tasks in the next week' },
    { key: 'doLater', label: '🎯 Do Later', empty: 'No tasks for later' },
    { key: 'overdue', label: '🔴 Overdue', empty: 'No overdue tasks' },
    { key: 'completed', label: '✅ Completed', empty: 'No completed tasks yet' },
  ];

  return (
    <div className="ml-64 pt-24 px-8 pb-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-text-primary">My Tasks</h1>
        {can('create', 'task') && (
          <button onClick={() => setCreateTaskOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Create Task
          </button>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex gap-3 mb-8">
        {[
          { mode: 'list', icon: List, label: 'List View' },
          { mode: 'calendar', icon: Calendar, label: 'Calendar View' },
          { mode: 'progress', icon: TrendingUp, label: 'Progress View' },
        ].map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth ${
              viewMode === mode ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-8">
          {/* My Tasks Section */}
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-6 pb-4 border-b border-dark-border">📋 My Tasks</h2>
            <div className="space-y-8">
              {sections.map(({ key, label, empty }) => (
                <div key={key} className="card-base">
                  <h3 className="text-xl font-semibold text-text-primary mb-6">{label}</h3>
                  {categorized[key].length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categorized[key].map((task) => (
                        <TaskCard 
                          key={task.id}
                          task={task} 
                          onRefresh={fetchTasks}
                          onDelete={can('delete', 'task') ? () => handleDeleteTask(task.id) : null}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-text-muted">{empty}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tasks Assigned by Me (Admin Only) */}
          {user?.role === 'admin' && (
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-6 pb-4 border-b border-dark-border">📤 Tasks Assigned by Me</h2>
              {tasksAssignedByMe.length > 0 ? (
                <div className="space-y-8">
                  {[
                    { key: 'pending', label: '⏳ Pending', empty: 'No pending tasks assigned' },
                    { key: 'overdue', label: '🔴 Overdue', empty: 'No overdue assigned tasks' },
                    { key: 'completed', label: '✅ Completed by Employees', empty: 'No completed tasks yet' },
                  ].map(({ key, label, empty }) => {
                    const assignedCategorized = categorizeAssignedByMe();
                    return (
                      <div key={key} className="card-base">
                        <h3 className="text-xl font-semibold text-text-primary mb-6">{label}</h3>
                        {assignedCategorized[key].length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {assignedCategorized[key].map((task) => (
                              <TaskCard 
                                key={task.id}
                                task={task} 
                                onRefresh={fetchTasksAssignedByMe}
                                onDelete={() => handleDeleteTask(task.id)}
                                showAssignee={true}
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="text-center py-8 text-text-muted">{empty}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="card-base text-center py-12">
                  <p className="text-text-muted">No tasks assigned yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="card-base">
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={calendarEvents}
            height="auto"
          />
        </div>
      )}

      {/* Progress View */}
      {viewMode === 'progress' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks
            .filter(t => t.status !== 'Completed')
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
            .map((task) => (
            <div key={task.id} className="card-base">
              <h3 className="font-semibold text-text-primary mb-4">{task.title}</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-text-muted mb-2">Project</p>
                  <p className="text-sm text-text-secondary">{task.project_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-2">Due Date</p>
                  <p className={`text-sm font-medium ${new Date(task.due_date) < new Date() ? 'text-red-400' : 'text-text-secondary'}`}>
                    {new Date(task.due_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-2">Priority</p>
                  <span className={`text-xs font-bold ${
                    task.priority === 'High' ? 'text-red-400' :
                    task.priority === 'Medium' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                <div className="pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-text-muted">Status Progress</span>
                    <span className="text-xs font-medium text-accent-teal">50%</span>
                  </div>
                  <div className="w-full bg-dark-card rounded-full h-2">
                    <div
                      className="bg-accent-teal h-2 rounded-full transition-all"
                      style={{ width: '50%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateTaskModal
        isOpen={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        projects={projects}
        onTaskCreated={fetchTasks}
      />
    </div>
  );
};

export default MyTasks;
