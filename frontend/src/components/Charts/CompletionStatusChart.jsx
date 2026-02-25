import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const CompletionStatusChart = ({ data }) => {
  const safeData = Array.isArray(data) ? data : [];

  const chartData = safeData.map((item) => ({
    name: item.status,
    value: item.count,
  }));

  const COLORS = {
    'To-Do': '#3B82F6',
    'In Progress': '#F59E0B',
    'Completed': '#10B981',
    'Overdue': '#EF4444',
  };

  return (
    <div className="card-base">
      <h2 className="text-lg font-semibold text-text-primary mb-6">Completion Status</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={100}
            fill="#2DD4BF"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#2DD4BF'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #2DD4BF',
              borderRadius: '8px',
              color: '#F9FAFB',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CompletionStatusChart;
