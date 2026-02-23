import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const TaskCompletionTrendChart = ({ data }) => {
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Total: item.total || 0,
    Completed: item.completed || 0,
  })) || [];

  return (
    <div className="card-base">
      <h2 className="text-lg font-semibold text-text-primary mb-6">Task Completion Trend</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #2DD4BF',
              borderRadius: '8px',
              color: '#F9FAFB',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Total"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={{ fill: '#F59E0B' }}
          />
          <Line
            type="monotone"
            dataKey="Completed"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: '#10B981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TaskCompletionTrendChart;
