    import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const TaskCategoryChart = ({ data }) => {
  const chartData = [
    { name: 'Recently Assigned', value: data.recentlyAssignedCount || 0 },
    { name: 'Do Today', value: data.doTodayCount || 0 },
    { name: 'Do Next Week', value: data.doNextWeekCount || 0 },
    { name: 'Do Later', value: data.doLaterCount || 0 },
  ];

  return (
    <div className="card-base">
      <h2 className="text-lg font-semibold text-text-primary mb-6">Task Categories</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #2DD4BF',
              borderRadius: '8px',
              color: '#F9FAFB',
            }}
          />
          <Bar dataKey="value" fill="#2DD4BF" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TaskCategoryChart;
