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
      <div className="ml-64 pt-24 px-8 pb-12">
        <div className="text-center py-12 text-text-secondary">
          {loading ? 'Loading analytics...' : 'No statistics available'}
        </div>
      </div>
    );
  }

  const completionStatusData = Array.isArray(stats.completionStatusAll) && stats.completionStatusAll.length > 0
    ? stats.completionStatusAll
    : [
        { status: 'To-Do', count: 0 },
        { status: 'In Progress', count: Math.max(0, (stats.totalIncomplete || 0) - (stats.totalOverdue || 0)) },
        { status: 'Completed', count: stats.totalCompleted || 0 },
        { status: 'Overdue', count: stats.totalOverdue || 0 },
      ];

  return (
    <div className="ml-64 pt-24 px-8 pb-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-text-primary">Analytics Dashboard</h1>
        <button
          onClick={exportPDF}
          className="btn-primary flex items-center gap-2"
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
            <p className="text-3xl font-bold text-purple-400">{stats.doLaterCount || 0}</p>
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
