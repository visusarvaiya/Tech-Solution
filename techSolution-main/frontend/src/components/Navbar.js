import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { COMPANY_NAME } from '../utils/constants';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/signin');
    setMobileMenuOpen(false);
  };

  if (!user) return null;

  const menuItems = isAdmin() ? (
    <>
      <Link to="/admin/dashboard" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
      <Link to="/admin/employees" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>Employees</Link>
      <Link to="/admin/create-employee" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>Create Employee</Link>
      <Link to="/profile" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
      <Link to="/attendance" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>Attendance</Link>
      <Link to="/leave" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>Leaves</Link>
      <Link to="/payroll" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>Payroll</Link>
    </>
  ) : (
    <>
      <Link to="/dashboard" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
      <Link to="/profile" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
      <Link to="/attendance" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>Attendance</Link>
      <Link to="/leave" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>Leaves</Link>
      <Link to="/payroll" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>Payroll</Link>
      <Link to="/letters" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>Letters</Link>
    </>
  );

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to={isAdmin() ? "/admin/dashboard" : "/dashboard"} className="navbar-brand">
          {COMPANY_NAME}
        </Link>
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={mobileMenuOpen ? 'hamburger open' : 'hamburger'}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        <div className={`navbar-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {menuItems}
          <div className="navbar-user">
            <div className="user-avatar-container" onClick={() => setShowDropdown(!showDropdown)}>
              {user.personalDetails?.profilePicture ? (
                <img 
                  src={user.personalDetails.profilePicture.startsWith('http') 
                    ? user.personalDetails.profilePicture 
                    : `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${user.personalDetails.profilePicture}`} 
                  alt="Profile" 
                  className="user-avatar-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="user-avatar" 
                style={{ display: user.personalDetails?.profilePicture ? 'none' : 'flex' }}
              >
                {user.personalDetails?.firstName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
              </div>
              <span className="user-name">{user.personalDetails?.firstName || user.email}</span>
            </div>
            {showDropdown && (
              <div className="user-dropdown">
                <Link to="/profile" onClick={() => { setShowDropdown(false); setMobileMenuOpen(false); }}>My Profile</Link>
                <button onClick={handleLogout}>Log Out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

