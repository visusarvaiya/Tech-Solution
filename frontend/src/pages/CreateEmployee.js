import React, { useState } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './CreateEmployee.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CreateEmployee = () => {
  const [formData, setFormData] = useState({
    employeeId: '',
    email: '',
    firstName: '',
    lastName: '',
    department: '',
    position: '',
    role: 'employee'
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/create-employee`, formData);
      setMessage(`Employee created successfully! Credentials sent to ${formData.email}. Temporary password: ${response.data.temporaryPassword}`);
      setFormData({
        employeeId: '',
        email: '',
        firstName: '',
        lastName: '',
        department: '',
        position: '',
        role: 'employee'
      });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error creating employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="create-employee-container">
        <div className="container">
          <h1>Create New Employee</h1>
          <div className="card">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Employee ID *</label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Role</label>
                <select name="role" value={formData.role} onChange={handleChange}>
                  <option value="employee">Employee</option>
                  <option value="hr">HR Officer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {message && (
                <div className={message.includes('successfully') ? 'success' : 'error'}>
                  {message}
                </div>
              )}
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
            <div className="info-box">
              <strong>Note:</strong> A temporary password will be generated and sent to the employee's email. 
              The employee must change their password on first login.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateEmployee;

