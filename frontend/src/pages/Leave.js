import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './Leave.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Leave = () => {
  const { user, isAdmin } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'paid',
    startDate: '',
    endDate: '',
    remarks: ''
  });
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [adminComment, setAdminComment] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, [selectedStatus]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const url = isAdmin() 
        ? `${API_URL}/leave/admin/all`
        : `${API_URL}/leave`;
      
      const params = selectedStatus !== 'all' ? { status: selectedStatus } : {};
      const response = await axios.get(url, { params });
      setLeaves(response.data || []);
    } catch (error) {
      console.error('Error fetching leaves:', error);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/leave/apply`, formData);
      setShowForm(false);
      setFormData({
        leaveType: 'paid',
        startDate: '',
        endDate: '',
        remarks: ''
      });
      fetchLeaves();
      alert('Leave application submitted successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting leave request');
    }
  };

  const handleApprove = async (leaveId, status) => {
    try {
      await axios.put(`${API_URL}/leave/${leaveId}/approve`, {
        status,
        adminComments: adminComment
      });
      setSelectedLeave(null);
      setAdminComment('');
      fetchLeaves();
      alert(`Leave request ${status} successfully`);
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing leave request');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <Navbar />
      <div className="leave-container">
        <div className="container">
          <div className="leave-header">
            <h1>Leave Management</h1>
            {!isAdmin() && (
              <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                {showForm ? 'Cancel' : 'Apply for Leave'}
              </button>
            )}
          </div>

          {!isAdmin() && showForm && (
            <div className="card">
              <h2>Apply for Leave</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Leave Type</label>
                  <select
                    name="leaveType"
                    value={formData.leaveType}
                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                    required
                  >
                    <option value="paid">Paid Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="emergency">Emergency Leave</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows="4"
                  />
                </div>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </form>
            </div>
          )}

          {isAdmin() && (
            <div className="filter-section">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-group"
                style={{ maxWidth: '200px' }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {isAdmin() && <th>Employee</th>}
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Total Days</th>
                    <th>Status</th>
                    <th>Remarks</th>
                    {isAdmin() && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin() ? 8 : 7} style={{ textAlign: 'center' }}>
                        No leave requests found
                      </td>
                    </tr>
                  ) : (
                    leaves.map((leave) => (
                      <tr key={leave._id}>
                        {isAdmin() && (
                          <td>
                            {leave.employeeId?.personalDetails?.firstName}{' '}
                            {leave.employeeId?.personalDetails?.lastName}
                            <br />
                            <small>{leave.employeeId?.employeeId}</small>
                          </td>
                        )}
                        <td>{leave.leaveType}</td>
                        <td>{formatDate(leave.startDate)}</td>
                        <td>{formatDate(leave.endDate)}</td>
                        <td>{leave.totalDays} days</td>
                        <td>
                          <span className={`badge badge-${leave.status}`}>
                            {leave.status}
                          </span>
                        </td>
                        <td>{leave.remarks || '-'}</td>
                        {isAdmin() && leave.status === 'pending' && (
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => {
                                  setSelectedLeave(leave);
                                  setAdminComment('');
                                }}
                                className="btn btn-success"
                                style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}
                              >
                                Review
                              </button>
                            </div>
                          </td>
                        )}
                        {isAdmin() && leave.status !== 'pending' && (
                          <td>
                            {leave.adminComments && (
                              <small>Comment: {leave.adminComments}</small>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {selectedLeave && (
            <div className="modal-overlay" onClick={() => setSelectedLeave(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Review Leave Request</h2>
                <div className="leave-details">
                  <p><strong>Employee:</strong> {selectedLeave.employeeId?.personalDetails?.firstName} {selectedLeave.employeeId?.personalDetails?.lastName}</p>
                  <p><strong>Leave Type:</strong> {selectedLeave.leaveType}</p>
                  <p><strong>Period:</strong> {formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)}</p>
                  <p><strong>Total Days:</strong> {selectedLeave.totalDays}</p>
                  <p><strong>Remarks:</strong> {selectedLeave.remarks || 'N/A'}</p>
                </div>
                <div className="form-group">
                  <label>Admin Comments</label>
                  <textarea
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    rows="3"
                  />
                </div>
                <div className="form-actions">
                  <button
                    onClick={() => handleApprove(selectedLeave._id, 'approved')}
                    className="btn btn-success"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleApprove(selectedLeave._id, 'rejected')}
                    className="btn btn-danger"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setSelectedLeave(null)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Leave;

