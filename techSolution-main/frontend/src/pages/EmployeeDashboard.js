import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiClock, FiCalendar, FiDollarSign } from 'react-icons/fi';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './Dashboard.css';

const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <>
      <Navbar />
      <div className="dashboard">
        <div className="container">
          <div className="dashboard-header">
            <h1>Welcome, {user?.personalDetails?.firstName || user?.email}!</h1>
            <p>Manage your workday activities</p>
          </div>

          <div className="dashboard-cards">
            <Link to="/profile" className="dashboard-card">
              <div className="dashboard-card-icon">
                <FiUser />
              </div>
              <div className="dashboard-card-title">Profile</div>
              <div className="dashboard-card-description">
                View and edit your personal and job details
              </div>
            </Link>

            <Link to="/attendance" className="dashboard-card">
              <div className="dashboard-card-icon">
                <FiClock />
              </div>
              <div className="dashboard-card-title">Attendance</div>
              <div className="dashboard-card-description">
                Check in/out and view your attendance records
              </div>
            </Link>

            <Link to="/leave" className="dashboard-card">
              <div className="dashboard-card-icon">
                <FiCalendar />
              </div>
              <div className="dashboard-card-title">Leave Requests</div>
              <div className="dashboard-card-description">
                Apply for leave and track your requests
              </div>
            </Link>

            <Link to="/payroll" className="dashboard-card">
              <div className="dashboard-card-icon">
                <FiDollarSign />
              </div>
              <div className="dashboard-card-title">Payroll</div>
              <div className="dashboard-card-description">
                View your salary and payroll details
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeDashboard;

