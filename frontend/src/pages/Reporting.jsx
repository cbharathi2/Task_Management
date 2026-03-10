import React, { useState, useEffect } from 'react';
import { reportingService } from '../services/reportingService';
import TaskCategoryChart from '../components/Charts/TaskCategoryChart';
import CompletionStatusChart from '../components/Charts/CompletionStatusChart';
import TaskCompletionTrendChart from '../components/Charts/TaskCompletionTrendChart';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Reporting = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const dashboardStats = await reportingService.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    const element = document.getElementById('report-content');
    const canvas = await html2canvas(element);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 10, 10, 190, 277);
    pdf.save('task-report.pdf');
  };

  if (loading || !stats) {
    return (
      <div className="page-shell">
        <div className="text-center py-12 text-text-secondary">
          {loading ? 'Loading analytics...' : 'No statistics available'}
        </div>
      </div>
    );
  }

  const buildCompletionStatusData = (reportStats) => {
    const sourceData = Array.isArray(reportStats?.completionStatusAll) && reportStats.completionStatusAll.length > 0
      ? reportStats.completionStatusAll
      : Array.isArray(reportStats?.completionStatusUpcomingMonth)
        ? reportStats.completionStatusUpcomingMonth
        : [];

    // Keep status keys stable for chart colors and labels.
    const normalizedMap = new Map();
    sourceData.forEach((item) => {
      const rawStatus = String(item?.status || item?.name || '').trim();
      const normalizedKey = rawStatus.toLowerCase();
      const count = Number(item?.count ?? item?.value ?? item?.total ?? 0);

      if (!rawStatus || Number.isNaN(count)) {
        return;
      }

      let statusLabel = rawStatus;
      if (normalizedKey === 'todo' || normalizedKey === 'to-do' || normalizedKey === 'to do' || normalizedKey === 'pending') {
        statusLabel = 'To-Do';
      } else if (normalizedKey === 'in progress' || normalizedKey === 'in-progress' || normalizedKey === 'inprogress') {
        statusLabel = 'In Progress';
      } else if (normalizedKey === 'completed' || normalizedKey === 'done') {
        statusLabel = 'Completed';
      }

      normalizedMap.set(statusLabel, (normalizedMap.get(statusLabel) || 0) + count);
    });

    if (normalizedMap.size > 0) {
      if (normalizedMap.has('Overdue')) {
        normalizedMap.set('Overdue', Number(reportStats?.totalOverdue ?? normalizedMap.get('Overdue') ?? 0));
      } else if (Number(reportStats?.totalOverdue || 0) > 0) {
        normalizedMap.set('Overdue', Number(reportStats.totalOverdue));
      }

      return Array.from(normalizedMap.entries()).map(([status, count]) => ({ status, count }));
    }

    return [
      { status: 'To-Do', count: 0 },
      { status: 'In Progress', count: Math.max(0, (reportStats.totalIncomplete || 0) - (reportStats.totalOverdue || 0)) },
      { status: 'Completed', count: reportStats.totalCompleted || 0 },
      { status: 'Overdue', count: reportStats.totalOverdue || 0 },
    ];
  };

  const completionStatusData = buildCompletionStatusData(stats);

  return (
    <div className="page-shell">
      <div className="page-header mb-8">
        <h1 className="page-title">Analytics Dashboard</h1>
        <button
          onClick={exportPDF}
          className="btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Download size={18} />
          Export PDF
        </button>
      </div>

      <div id="report-content">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-base">
            <p className="text-text-muted text-sm mb-3">📊 Total Tasks</p>
            <p className="text-4xl font-bold text-accent-teal">{stats.totalTasks || 0}</p>
            <p className="text-xs text-text-muted mt-2">All assigned tasks</p>
          </div>
          
          <div className="card-base">
            <p className="text-text-muted text-sm mb-3">✅ Completed</p>
            <p className="text-4xl font-bold text-green-400">{stats.totalCompleted || 0}</p>
            <p className="text-xs text-text-muted mt-2">{stats.totalTasks ? Math.round((stats.totalCompleted / stats.totalTasks) * 100) : 0}% rate</p>
          </div>
          
          <div className="card-base">
            <p className="text-text-muted text-sm mb-3">📝 Incomplete</p>
            <p className="text-4xl font-bold text-yellow-400">{stats.totalIncomplete || 0}</p>
            <p className="text-xs text-text-muted mt-2">In progress & pending</p>
          </div>
          
          <div className="card-base">
            <p className="text-text-muted text-sm mb-3">🔴 Overdue</p>
            <p className="text-4xl font-bold text-red-400">{stats.totalOverdue || 0}</p>
            <p className="text-xs text-text-muted mt-2">Past due date</p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-base">
            <p className="text-text-muted text-sm mb-3">📌 Assigned Today</p>
            <p className="text-3xl font-bold text-accent-teal">{stats.doTodayCount || 0}</p>
          </div>
          
          <div className="card-base">
            <p className="text-text-muted text-sm mb-3">⚡ Due Today</p>
            <p className="text-3xl font-bold text-orange-400">{stats.doTodayCount || 0}</p>
          </div>
          
          <div className="card-base">
            <p className="text-text-muted text-sm mb-3">📅 Next Week</p>
            <p className="text-3xl font-bold text-blue-400">{stats.doNextWeekCount || 0}</p>
          </div>
          
          <div className="card-base">
            <p className="text-text-muted text-sm mb-3">🎯 Do Later</p>
            <p className="text-3xl font-bold text-cyan-400">{stats.doLaterCount || 0}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <TaskCategoryChart data={stats} />
          <CompletionStatusChart data={completionStatusData} />
        </div>

        <TaskCompletionTrendChart data={stats.taskCompletionOverTime} />
      </div>
    </div>
  );
};

export default Reporting;
