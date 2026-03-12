import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './AttendanceChart.css';

const AttendanceChart = ({ data, type = 'line' }) => {
  if (!data || data.length === 0) {
    return <div className="no-data">No attendance data available</div>;
  }

  // Process data for chart
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    present: item.status === 'present' ? 1 : 0,
    absent: item.status === 'absent' ? 1 : 0,
    halfDay: item.status === 'half-day' ? 0.5 : 0,
    workingHours: parseFloat(item.workingHours) || 0
  }));

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="present" fill="#28a745" name="Present" />
          <Bar dataKey="absent" fill="#dc3545" name="Absent" />
          <Bar dataKey="halfDay" fill="#ffc107" name="Half Day" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="workingHours" stroke="#4a90e2" name="Working Hours" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default AttendanceChart;

