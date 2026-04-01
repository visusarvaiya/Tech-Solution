import React, { useState } from 'react';
import axios from 'axios';
import './ChangePasswordModal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ChangePasswordModal = ({ onSuccess, temporaryPassword, email, employeeId, loginType }) => {
  const [formData, setFormData] = useState({
    currentPassword: temporaryPassword || '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const changePasswordData = {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      };
      
      // Add email or employeeId for first-time password change
      if (email) {
        changePasswordData.email = email;
      } else if (employeeId) {
        changePasswordData.employeeId = employeeId;
      }

      const response = await axios.post(`${API_URL}/auth/change-password-first-time`, changePasswordData);
      
      // Pass the token and user data to onSuccess
      onSuccess(response.data.token, response.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Error changing password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-overlay">
      <div className="change-password-modal">
        <h2>Change Your Password</h2>
        <p className="change-password-info">
          For security reasons, you must change your password before continuing.
        </p>
        <form onSubmit={handleSubmit}>
          {temporaryPassword && (
            <div className="form-group">
              <label>Temporary Password</label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                required
                placeholder="Enter temporary password"
              />
            </div>
          )}
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              placeholder="Enter new password (min 6 characters)"
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm new password"
              minLength={6}
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;

