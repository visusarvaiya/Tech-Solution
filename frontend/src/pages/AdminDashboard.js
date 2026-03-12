import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiClock, FiCalendar, FiDollarSign, FiFileText } from 'react-icons/fi';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalLeaves: 0,
    pendingLeaves: 0,
    todayAttendance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="dashboard">
        <div className="container">
          <div className="dashboard-header">
            <h1>Admin Dashboard</h1>
            <p>Manage employees, attendance, leaves, and payroll</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalEmployees}</div>
              <div className="stat-label">Total Employees</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.pendingLeaves}</div>
              <div className="stat-label">Pending Leaves</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.todayAttendance}</div>
              <div className="stat-label">Today's Attendance</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalLeaves}</div>
              <div className="stat-label">Total Leave Requests</div>
            </div>
          </div>

          <div className="dashboard-cards">
            <Link to="/admin/employees" className="dashboard-card">
              <div className="dashboard-card-icon">
                <FiUsers />
              </div>
              <div className="dashboard-card-title">Employee Management</div>
              <div className="dashboard-card-description">
                View, edit, and delete all employees
              </div>
            </Link>

            <Link to="/attendance" className="dashboard-card">
              <div className="dashboard-card-icon">
                <FiClock />
              </div>
              <div className="dashboard-card-title">Attendance Records</div>
              <div className="dashboard-card-description">
                View and manage attendance of all employees
              </div>
            </Link>

            <Link to="/leave" className="dashboard-card">
              <div className="dashboard-card-icon">
                <FiCalendar />
              </div>
              <div className="dashboard-card-title">Leave Approvals</div>
              <div className="dashboard-card-description">
                Approve or reject leave requests
              </div>
            </Link>

            <Link to="/payroll" className="dashboard-card">
              <div className="dashboard-card-icon">
                <FiDollarSign />
              </div>
              <div className="dashboard-card-title">Payroll Management</div>
              <div className="dashboard-card-description">
                View and update employee salaries
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;

