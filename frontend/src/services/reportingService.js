import api from './api';
import { taskService } from './taskService';

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toDateKey = (date) => date.toISOString().split('T')[0];

const calculateFallbackStats = (tasks = []) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const totalTasks = tasks.length;
  const totalCompleted = tasks.filter((task) => task.status === 'Completed').length;
  const totalIncomplete = totalTasks - totalCompleted;

  const totalOverdue = tasks.filter((task) => {
    const dueDate = normalizeDate(task.due_date);
    return task.status !== 'Completed' && dueDate && dueDate < now;
  }).length;

  const recentlyAssignedCount = Math.min(totalTasks, 10);

  const doTodayCount = tasks.filter((task) => {
    const dueDate = normalizeDate(task.due_date);
    return dueDate && dueDate >= todayStart && dueDate < tomorrowStart;
  }).length;

  const doNextWeekCount = tasks.filter((task) => {
    const dueDate = normalizeDate(task.due_date);
    return dueDate && dueDate >= tomorrowStart && dueDate <= weekEnd;
  }).length;

  const doLaterCount = tasks.filter((task) => {
    const dueDate = normalizeDate(task.due_date);
    return dueDate && dueDate > weekEnd;
  }).length;

  const completionStatusUpcomingMonthMap = new Map();
  tasks.forEach((task) => {
    const dueDate = normalizeDate(task.due_date);
    if (dueDate && dueDate >= now && dueDate <= monthEnd) {
      const current = completionStatusUpcomingMonthMap.get(task.status) || 0;
      completionStatusUpcomingMonthMap.set(task.status, current + 1);
    }
  });

  const completionStatusUpcomingMonth = Array.from(completionStatusUpcomingMonthMap.entries()).map(
    ([status, count]) => ({ status, count })
  );

  const trendMap = new Map();
  tasks.forEach((task) => {
    const createdAt = normalizeDate(task.created_at);
    if (!createdAt || createdAt < thirtyDaysAgo) {
      return;
    }

    const key = toDateKey(createdAt);
    const current = trendMap.get(key) || { date: key, total: 0, completed: 0 };
    current.total += 1;
    if (task.status === 'Completed') {
      current.completed += 1;
    }
    trendMap.set(key, current);
  });

  const taskCompletionOverTime = Array.from(trendMap.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  return {
    totalTasks,
    totalCompleted,
    totalIncomplete,
    totalOverdue,
    recentlyAssignedCount,
    doTodayCount,
    doNextWeekCount,
    doLaterCount,
    completionStatusUpcomingMonth,
    taskCompletionOverTime,
  };
};

export const reportingService = {
  getDashboardStats: async () => {
    try {
      const response = await api.get('/tasks/dashboard-stats');
      return response.data?.stats || {};
    } catch (error) {
      const status = error?.response?.status;
      if (status && status !== 404) {
        throw error;
      }

      const tasksResponse = await taskService.getMyTasks();
      const tasks = tasksResponse?.data?.tasks || [];
      return calculateFallbackStats(tasks);
    }
  },
};

export default reportingService;