import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { formatCurrency } from '../utils/currency';
import { AVATARS, getAvatarUrl, isAvatarUrl } from '../utils/avatars';
import './Profile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Profile = () => {
  const { user: currentUser, isAdmin } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Get employee ID from URL if viewing another user's profile
  const getProfileId = () => {
    const pathParts = window.location.pathname.split('/');
    if (pathParts[2] && pathParts[2] !== 'profile') {
      return pathParts[2];
    }
    return null;
  };

  const fetchProfile = async () => {
    try {
      const profileId = getProfileId();
      const url = profileId ? `${API_URL}/profile/${profileId}` : `${API_URL}/profile`;
      const response = await axios.get(url);
      setUser(response.data);
      setFormData({
        personalDetails: response.data.personalDetails || {},
        jobDetails: response.data.jobDetails || {},
        salary: response.data.salary || {}
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage('Error loading profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const [section, field] = name.split('.');
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [field]: value
      }
    });
  };

  const handleAvatarSelect = async (avatarUrl) => {
    try {
      const profileId = getProfileId();
      const url = profileId ? `${API_URL}/profile/${profileId}` : `${API_URL}/profile`;
      
      // Update profile picture URL in database
      const updateData = {
        personalDetails: {
          ...formData.personalDetails,
          profilePicture: avatarUrl // Store avatar URL in database
        },
        jobDetails: formData.jobDetails || {}
      };
      
      if (canEditAll) {
        updateData.salary = formData.salary || {};
      }
      
      const response = await axios.put(url, updateData);
      
      // Update user state immediately without refresh
      const updatedUser = response.data.user;
      setUser(updatedUser);
      setFormData({
        ...formData,
        personalDetails: {
          ...formData.personalDetails,
          profilePicture: avatarUrl
        }
      });
      setShowAvatarSelector(false);
      setSelectedAvatarIndex(null);
      setMessage('Avatar selected successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating avatar');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const profileId = getProfileId();
      const url = profileId ? `${API_URL}/profile/${profileId}` : `${API_URL}/profile`;
      
      const formDataToSend = new FormData();
      
      // Add profile picture if selected
      if (profilePictureFile) {
        formDataToSend.append('profilePicture', profilePictureFile);
      }
      
      // Add resume/CV if selected
      if (resumeFile) {
        formDataToSend.append('document', resumeFile);
        formDataToSend.append('name', 'Resume/CV');
        formDataToSend.append('type', 'resume');
      }
      
      // Add other form data
      formDataToSend.append('personalDetails', JSON.stringify(formData.personalDetails || {}));
      formDataToSend.append('jobDetails', JSON.stringify(formData.jobDetails || {}));
      if (canEditAll) {
        formDataToSend.append('salary', JSON.stringify(formData.salary || {}));
      }

      const response = await axios.put(url, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update user state immediately without refresh
      const updatedUser = response.data.user;
      setUser(updatedUser);
      setFormData({
        personalDetails: updatedUser.personalDetails || {},
        jobDetails: updatedUser.jobDetails || {},
        salary: updatedUser.salary || {}
      });
      setEditing(false);
      setProfilePictureFile(null);
      setResumeFile(null);
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating profile');
    } finally {
      setUploading(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const profileId = getProfileId();
      const formDataToSend = new FormData();
      formDataToSend.append('document', file);
      formDataToSend.append('name', 'Resume/CV');
      formDataToSend.append('type', 'resume');

      const url = profileId 
        ? `${API_URL}/profile/${profileId}/documents`
        : `${API_URL}/profile/documents`;
      
      await axios.post(url, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessage('Resume uploaded successfully');
      setTimeout(() => setMessage(''), 3000);
      fetchProfile();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error uploading resume');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading">Loading...</div>
      </>
    );
  }

  const canEditAll = isAdmin();
  
  // Get profile picture URL - show image if exists, otherwise null for first letter
  const getProfilePictureUrl = () => {
    if (user?.personalDetails?.profilePicture) {
      // If it's already a full URL (Cloudinary or avatar), use it directly
      if (user.personalDetails.profilePicture.startsWith('http')) {
        return user.personalDetails.profilePicture;
      }
      // Otherwise, it's a local upload path
      return `${API_URL.replace('/api', '')}${user.personalDetails.profilePicture}`;
    }
    return null; // Return null to show first letter
  };

  // Handle remove profile picture
  const handleRemoveProfilePicture = async () => {
    try {
      const profileId = getProfileId();
      const url = profileId ? `${API_URL}/profile/${profileId}` : `${API_URL}/profile`;
      
      const updateData = {
        personalDetails: {
          ...formData.personalDetails,
          profilePicture: '' // Clear profile picture
        },
        jobDetails: formData.jobDetails || {}
      };
      
      if (canEditAll) {
        updateData.salary = formData.salary || {};
      }
      
      const response = await axios.put(url, updateData);
      
      // Update user state immediately
      const updatedUser = response.data.user;
      setUser(updatedUser);
      setFormData({
        ...formData,
        personalDetails: {
          ...formData.personalDetails,
          profilePicture: ''
        }
      });
      setMessage('Profile picture removed successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error removing profile picture');
    }
  };

  return (
    <>
      <Navbar />
      <div className="profile-container">
        <div className="container">
          <div className="profile-header">
            <h1>Profile</h1>
            {!editing && (
              <button onClick={() => setEditing(true)} className="btn btn-primary">
                Edit Profile
              </button>
            )}
          </div>

          {message && (
            <div className={message.includes('success') ? 'success' : 'error'}>
              {message}
            </div>
          )}

          {editing ? (
            <form onSubmit={handleSubmit} className="profile-form" encType="multipart/form-data">
              <div className="card">
                <h2>Profile Picture & Documents</h2>
                <div className="form-group">
                  <label>Upload Profile Picture</label>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                    Upload your own photo. You can also choose an avatar or show first letter of your name.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfilePictureFile(e.target.files[0])}
                  />
                  {profilePictureFile && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '12px', color: '#666' }}>Selected: {profilePictureFile.name}</p>
                    </div>
                  )}
                  {user?.personalDetails?.profilePicture && !user.personalDetails.profilePicture.includes('dicebear.com') && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Current uploaded picture:</p>
                      <img 
                        src={user.personalDetails.profilePicture.startsWith('http') 
                          ? user.personalDetails.profilePicture 
                          : `${API_URL.replace('/api', '')}${user.personalDetails.profilePicture}`} 
                        alt="Profile" 
                        style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Resume/CV</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    disabled={uploading}
                  />
                  {user?.documents?.filter(doc => doc.type === 'resume').length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      {user.documents.filter(doc => doc.type === 'resume').map((doc, idx) => (
                        <div key={idx} style={{ marginBottom: '5px' }}>
                          <a 
                            href={`${API_URL.replace('/api', '')}${doc.url}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#4a90e2' }}
                          >
                            {doc.name} (View)
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="card">
                <h2>Personal Details</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      name="personalDetails.firstName"
                      value={formData.personalDetails?.firstName || ''}
                      onChange={handleChange}
                      disabled={!canEditAll}
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="personalDetails.lastName"
                      value={formData.personalDetails?.lastName || ''}
                      onChange={handleChange}
                      disabled={!canEditAll}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="personalDetails.phone"
                    value={formData.personalDetails?.phone || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    name="personalDetails.address"
                    value={formData.personalDetails?.address || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {canEditAll && (
                <>
                  <div className="card">
                    <h2>Job Details</h2>
                    <div className="form-group">
                      <label>Department</label>
                      <input
                        type="text"
                        name="jobDetails.department"
                        value={formData.jobDetails?.department || ''}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Position</label>
                      <input
                        type="text"
                        name="jobDetails.position"
                        value={formData.jobDetails?.position || ''}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="card">
                    <h2>Salary</h2>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Base Salary</label>
                        <input
                          type="number"
                          name="salary.baseSalary"
                          value={formData.salary?.baseSalary || 0}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>Allowances</label>
                        <input
                          type="number"
                          name="salary.allowances"
                          value={formData.salary?.allowances || 0}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>Deductions</label>
                        <input
                          type="number"
                          name="salary.deductions"
                          value={formData.salary?.deductions || 0}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => {
                  setEditing(false);
                  setProfilePictureFile(null);
                  setResumeFile(null);
                }} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-view">
              <div className="card">
                <h2>Profile Picture</h2>
                <div className="profile-picture-section">
                  {getProfilePictureUrl() ? (
                    <img 
                      key={user?.personalDetails?.profilePicture || 'default-avatar'} 
                      src={getProfilePictureUrl()} 
                      alt="Profile" 
                      className="profile-picture-large"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="profile-picture-placeholder"
                    style={{ display: getProfilePictureUrl() ? 'none' : 'flex' }}
                  >
                    {user?.personalDetails?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                  </div>
                </div>
                <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => setShowAvatarSelector(!showAvatarSelector)} 
                    className="btn btn-secondary"
                  >
                    {showAvatarSelector ? 'Cancel' : 'Choose Avatar'}
                  </button>
                  {user?.personalDetails?.profilePicture && (
                    <button 
                      onClick={handleRemoveProfilePicture} 
                      className="btn btn-danger"
                    >
                      Remove Picture
                    </button>
                  )}
                  {showAvatarSelector && (
                    <div className="avatar-selector">
                      <h3>Select an Avatar</h3>
                      <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                        Choose a pre-built avatar. You can upload your own picture separately.
                      </p>
                      <div className="avatar-grid">
                        {/* Show "None" option for first letter */}
                        <div 
                          className={`avatar-option ${!user?.personalDetails?.profilePicture ? 'selected' : ''}`}
                          onClick={() => {
                            handleRemoveProfilePicture();
                          }}
                          title="Show First Letter"
                        >
                          <div className="avatar-placeholder-small">
                            {user?.personalDetails?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                          </div>
                          <span className="avatar-label">None</span>
                        </div>
                        {/* Show pre-built avatars only */}
                        {AVATARS.map((avatar, index) => {
                          const isSelected = user?.personalDetails?.profilePicture === avatar;
                          return (
                            <div 
                              key={index}
                              className={`avatar-option ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                handleAvatarSelect(avatar);
                              }}
                              title={`Avatar ${index + 1}`}
                            >
                              <img src={avatar} alt={`Avatar ${index + 1}`} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <h2 style={{ marginTop: '30px' }}>Documents</h2>
                <div className="documents-section">
                  {user?.documents && user.documents.length > 0 ? (
                    <div className="documents-list">
                      {user.documents.map((doc, idx) => (
                        <div key={idx} className="document-item">
                          <span>{doc.name}</span>
                          <a 
                            href={`${API_URL.replace('/api', '')}${doc.url}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No documents uploaded</p>
                  )}
                </div>
              </div>
              <div className="card">
                <h2>Personal Details</h2>
                <div className="profile-info">
                  <div className="info-item">
                    <span className="info-label">Employee ID:</span>
                    <span className="info-value">{user?.employeeId}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{user?.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Name:</span>
                    <span className="info-value">
                      {user?.personalDetails?.firstName} {user?.personalDetails?.lastName}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Phone:</span>
                    <span className="info-value">{user?.personalDetails?.phone || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Address:</span>
                    <span className="info-value">{user?.personalDetails?.address || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2>Job Details</h2>
                <div className="profile-info">
                  <div className="info-item">
                    <span className="info-label">Department:</span>
                    <span className="info-value">{user?.jobDetails?.department || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Position:</span>
                    <span className="info-value">{user?.jobDetails?.position || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Employment Type:</span>
                    <span className="info-value">{user?.jobDetails?.employmentType || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2>Salary Information</h2>
                <div className="profile-info">
                  <div className="info-item">
                    <span className="info-label">Base Salary:</span>
                    <span className="info-value">{formatCurrency(user?.salary?.baseSalary || 0)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Allowances:</span>
                    <span className="info-value">{formatCurrency(user?.salary?.allowances || 0)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Deductions:</span>
                    <span className="info-value">{formatCurrency(user?.salary?.deductions || 0)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Net Salary:</span>
                    <span className="info-value">{formatCurrency(user?.salary?.netSalary || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;

