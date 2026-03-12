import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiTrash2, FiEye, FiEdit } from 'react-icons/fi';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './EmployeeManagement.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const EmployeeManagement = () => {
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteVerification, setDeleteVerification] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    
    // Verify employee ID matches
    if (deleteVerification !== employeeToDelete.employeeId) {
      alert('Employee ID does not match. Please type the correct Employee ID to confirm deletion.');
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/admin/employees/${employeeToDelete._id}`);
      setEmployees(employees.filter(emp => emp._id !== employeeToDelete._id));
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      setDeleteVerification('');
      alert('Employee deleted successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting employee');
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${emp.personalDetails?.firstName} ${emp.personalDetails?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || emp.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="employee-management-container">
        <div className="container">
          <div className="page-header">
            <h1>Employee Management</h1>
            <Link to="/admin/create-employee" className="btn btn-primary">
              Create New Employee
            </Link>
          </div>

          <div className="filters-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by Employee ID, Name, or Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-box">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Roles</option>
                <option value="employee">Employees</option>
                <option value="admin">Admins</option>
                <option value="hr">HR Officers</option>
              </select>
            </div>
          </div>

          <div className="employees-grid">
            {filteredEmployees.length === 0 ? (
              <div className="no-results">
                <p>No employees found</p>
              </div>
            ) : (
              filteredEmployees.map((employee) => (
                <div key={employee._id} className="employee-card">
                  <div className="employee-card-header">
                    <div className="employee-avatar">
                      {employee.personalDetails?.profilePicture ? (
                        <img 
                          src={employee.personalDetails.profilePicture.startsWith('http') 
                            ? employee.personalDetails.profilePicture 
                            : `${API_URL.replace('/api', '')}${employee.personalDetails.profilePicture}`} 
                          alt={employee.personalDetails?.firstName}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="avatar-fallback" 
                        style={{ display: employee.personalDetails?.profilePicture ? 'none' : 'flex' }}
                      >
                        {employee.personalDetails?.firstName?.[0]?.toUpperCase() || employee.email?.[0]?.toUpperCase()}
                      </div>
                    </div>
                    <div className="employee-info">
                      <h3>{employee.personalDetails?.firstName} {employee.personalDetails?.lastName}</h3>
                      <p className="employee-id">{employee.employeeId}</p>
                      <p className="employee-email">{employee.email}</p>
                    </div>
                  </div>
                  <div className="employee-details">
                    <div className="detail-item">
                      <span className="detail-label">Role:</span>
                      <span className={`badge badge-${employee.role}`}>{employee.role}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Department:</span>
                      <span>{employee.jobDetails?.department || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Position:</span>
                      <span>{employee.jobDetails?.position || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="employee-actions">
                    <Link 
                      to={`/profile/${employee._id}`} 
                      className="btn btn-secondary btn-sm"
                      title="View Profile"
                    >
                      <FiEye /> View
                    </Link>
                    <Link 
                      to={`/profile/${employee._id}?edit=true`} 
                      className="btn btn-primary btn-sm"
                      title="Edit Profile"
                    >
                      <FiEdit /> Edit
                    </Link>
                    <button
                      onClick={() => {
                        setEmployeeToDelete(employee);
                        setShowDeleteModal(true);
                      }}
                      className="btn btn-danger btn-sm"
                      title="Delete Employee"
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => {
          setShowDeleteModal(false);
          setEmployeeToDelete(null);
          setDeleteVerification('');
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Employee</h2>
            <p>Are you sure you want to delete <strong>{employeeToDelete?.personalDetails?.firstName} {employeeToDelete?.personalDetails?.lastName}</strong>?</p>
            <p className="warning-text">This action cannot be undone.</p>
            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                Type the Employee ID to confirm deletion:
              </label>
              <input
                type="text"
                value={deleteVerification}
                onChange={(e) => setDeleteVerification(e.target.value)}
                placeholder={`Type: ${employeeToDelete?.employeeId}`}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px',
                  marginBottom: '10px'
                }}
                autoFocus
              />
              <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                Employee ID: <strong>{employeeToDelete?.employeeId}</strong>
              </p>
            </div>
            <div className="modal-actions">
              <button 
                onClick={handleDelete} 
                className="btn btn-danger"
                disabled={deleteVerification !== employeeToDelete?.employeeId}
                style={{
                  opacity: deleteVerification !== employeeToDelete?.employeeId ? 0.5 : 1,
                  cursor: deleteVerification !== employeeToDelete?.employeeId ? 'not-allowed' : 'pointer'
                }}
              >
                Delete
              </button>
              <button onClick={() => {
                setShowDeleteModal(false);
                setEmployeeToDelete(null);
                setDeleteVerification('');
              }} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeManagement;

