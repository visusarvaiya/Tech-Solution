import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import AttendanceChart from '../components/AttendanceChart';
import './Attendance.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Attendance = () => {
  const { user, isAdmin } = useContext(AuthContext);
  const [todayStatus, setTodayStatus] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [view, setView] = useState('today');
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (isAdmin()) {
      fetchEmployees();
    }
    fetchTodayStatus();
    fetchAttendance();
  }, [view, selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchTodayStatus = async () => {
    if (!isAdmin()) {
      try {
        const response = await axios.get(`${API_URL}/attendance/today/status`);
        setTodayStatus(response.data);
      } catch (error) {
        console.error('Error fetching today status:', error);
      }
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = {};
      
      if (view === 'week') {
        params.view = 'week';
      } else if (view === 'month') {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = endDate.toISOString().split('T')[0];
      }

      let url = `${API_URL}/attendance`;
      
      // If admin and "All Employees" is selected, pass allEmployees parameter
      if (isAdmin() && !selectedEmployee) {
        params.allEmployees = 'true';
      } else if (isAdmin() && selectedEmployee) {
        // If specific employee selected, get that employee's attendance
        url = `${API_URL}/attendance/${selectedEmployee}`;
      }
      
      const response = await axios.get(url, { params });
      setAttendance(response.data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      console.error('Error details:', error.response?.data);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await axios.post(`${API_URL}/attendance/checkin`);
      fetchTodayStatus();
      fetchAttendance();
    } catch (error) {
      alert(error.response?.data?.message || 'Error checking in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await axios.post(`${API_URL}/attendance/checkout`);
      fetchTodayStatus();
      fetchAttendance();
    } catch (error) {
      alert(error.response?.data?.message || 'Error checking out');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Navbar />
      <div className="attendance-container">
        <div className="container">
          <h1>Attendance</h1>

          {!isAdmin() && todayStatus && (
            <div className="attendance-status-card">
              <h2>Today's Status</h2>
              <div className="attendance-status-grid">
                <div className="status-item">
                  <span className="status-label">Check In:</span>
                  <span className="status-value">
                    {todayStatus.checkInTime ? formatTime(todayStatus.checkInTime) : 'Not checked in'}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Check Out:</span>
                  <span className="status-value">
                    {todayStatus.checkOutTime ? formatTime(todayStatus.checkOutTime) : 'Not checked out'}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Working Hours:</span>
                  <span className="status-value">
                    {todayStatus.workingHours || '0'} hours
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Status:</span>
                  <span className={`badge badge-${todayStatus.status || 'absent'}`}>
                    {todayStatus.status || 'Absent'}
                  </span>
                </div>
                {todayStatus.lateArrivalMinutes > 0 && (
                  <div className="status-item">
                    <span className="status-label">Late Arrival:</span>
                    <span className="status-value" style={{ color: '#dc3545' }}>
                      {Math.floor(todayStatus.lateArrivalMinutes / 60)}h {todayStatus.lateArrivalMinutes % 60}m late
                    </span>
                  </div>
                )}
              </div>
              <div className="attendance-actions">
                <button
                  onClick={handleCheckIn}
                  disabled={todayStatus.checkedIn}
                  className="btn btn-success"
                >
                  Check In
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={!todayStatus.checkedIn || todayStatus.checkedOut}
                  className="btn btn-danger"
                >
                  Check Out
                </button>
              </div>
            </div>
          )}

          {isAdmin() && (
            <div className="filter-section">
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="form-group"
                style={{ maxWidth: '300px' }}
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.employeeId} - {emp.personalDetails?.firstName} {emp.personalDetails?.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="view-toggle">
            <button
              onClick={() => setView('today')}
              className={view === 'today' ? 'btn btn-primary' : 'btn btn-secondary'}
            >
              Today
            </button>
            <button
              onClick={() => setView('week')}
              className={view === 'week' ? 'btn btn-primary' : 'btn btn-secondary'}
            >
              This Week
            </button>
            <button
              onClick={() => setView('month')}
              className={view === 'month' ? 'btn btn-primary' : 'btn btn-secondary'}
            >
              This Month
            </button>
          </div>

          {!loading && attendance.length > 0 && (
            <>
              {/* Statistics Cards */}
              <div className="attendance-stats-grid">
                <div className="stat-card stat-present">
                  <div className="stat-icon">✓</div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {attendance.filter(a => a.status === 'present').length}
                    </div>
                    <div className="stat-label">Present Days</div>
                  </div>
                </div>
                <div className="stat-card stat-absent">
                  <div className="stat-icon">✗</div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {attendance.filter(a => a.status === 'absent').length}
                    </div>
                    <div className="stat-label">Absent Days</div>
                  </div>
                </div>
                <div className="stat-card stat-hours">
                  <div className="stat-icon">⏰</div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {attendance.reduce((sum, a) => sum + (parseFloat(a.workingHours) || 0), 0).toFixed(1)}
                    </div>
                    <div className="stat-label">Total Hours</div>
                  </div>
                </div>
                <div className="stat-card stat-average">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {attendance.length > 0 
                        ? (attendance.reduce((sum, a) => sum + (parseFloat(a.workingHours) || 0), 0) / attendance.length).toFixed(1)
                        : '0.0'}
                    </div>
                    <div className="stat-label">Avg Hours/Day</div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="card" style={{ marginBottom: '30px' }}>
                <h2>Attendance Chart</h2>
                <AttendanceChart data={attendance} type="bar" />
              </div>
            </>
          )}

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {isAdmin() && <th>Employee</th>}
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Working Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin() ? 6 : 5} style={{ textAlign: 'center' }}>
                        No attendance records found
                      </td>
                    </tr>
                  ) : (
                    attendance.map((record) => (
                      <tr key={record._id}>
                        {isAdmin() && (
                          <td>
                            {record.employeeId?.personalDetails?.firstName}{' '}
                            {record.employeeId?.personalDetails?.lastName}
                            <br />
                            <small>{record.employeeId?.employeeId}</small>
                          </td>
                        )}
                        <td>{formatDate(record.date)}</td>
                        <td>
                          {record.checkIn?.time ? formatTime(record.checkIn.time) : '-'}
                          {record.lateArrivalMinutes > 0 && (
                            <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                              ({Math.floor(record.lateArrivalMinutes / 60)}h {record.lateArrivalMinutes % 60}m late)
                            </span>
                          )}
                        </td>
                        <td>{record.checkOut?.time ? formatTime(record.checkOut.time) : '-'}</td>
                        <td>{record.workingHours || '0'} hrs</td>
                        <td>
                          <span className={`badge badge-${record.status}`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Attendance;

