import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import ChangePasswordModal from '../components/ChangePasswordModal';
import './Auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
    employeeId: '',
    password: '',
    loginType: 'email' // 'email' or 'employeeId'
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginData = {
        password: formData.password
      };
      
      if (formData.loginType === 'email') {
        loginData.email = formData.email;
      } else {
        loginData.employeeId = formData.employeeId;
      }

      const response = await axios.post(`${API_URL}/auth/signin`, loginData);
      
      // Check if password change is required
      if (response.data.user.mustChangePassword) {
        setTemporaryPassword(formData.password);
        setShowChangePassword(true);
        return;
      }
      
      login(response.data.token, response.data.user);
      
      if (response.data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChangeSuccess = (token, userData) => {
    // Password changed successfully, login automatically
    if (token && userData) {
      login(token, userData);
      setShowChangePassword(false);
      
      if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      // Fallback: show message to login again
      setShowChangePassword(false);
      setError('');
      setMessage('Password changed successfully! Please login again with your new password.');
      setFormData({ ...formData, password: '' });
    }
  };

  return (
    <>
      {showChangePassword && (
        <ChangePasswordModal
          onSuccess={handlePasswordChangeSuccess}
          temporaryPassword={temporaryPassword}
          email={formData.loginType === 'email' ? formData.email : null}
          employeeId={formData.loginType === 'employeeId' ? formData.employeeId : null}
          loginType={formData.loginType}
        />
      )}
      <div className="auth-container">
        <div className="auth-card">
          <h1>TechFlow Solutions</h1>
          <h2>Sign In</h2>
          <p className="auth-subtitle">Every workday, perfectly aligned.</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Login with</label>
              <select
                name="loginType"
                value={formData.loginType}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', marginBottom: '15px' }}
              >
                <option value="email">Email</option>
                <option value="employeeId">Employee ID</option>
              </select>
            </div>
            {formData.loginType === 'email' ? (
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            ) : (
              <div className="form-group">
                <label>Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            {error && <div className="error">{error}</div>}
            {message && <div className="success">{message}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          <p className="auth-link">
            Don't have an account? <Link to="/signup">Sign Up (Admin/HR only)</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default SignIn;

