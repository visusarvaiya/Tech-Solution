import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { COMPANY_NAME } from '../utils/constants';
import './Letters.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Letters = () => {
  const { user } = useContext(AuthContext);
  const [letterType, setLetterType] = useState('leave');
  const [formData, setFormData] = useState({
    leaveId: '',
    reason: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await axios.get(`${API_URL}/leave`);
      setLeaves(response.data.filter(l => l.status === 'approved'));
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  const displayLetter = () => {
    if (letterType === 'leave' && !formData.leaveId) {
      setMessage('Please select a leave first');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setShowLetter(true);
    setMessage('');
  };

  const downloadLetter = () => {
    const element = document.getElementById('letter-content');
    if (!element) return;
    
    html2canvas(element, {
      scale: 2,
      useCORS: true
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = letterType === 'leave' 
        ? `Leave_Letter_${formData.leaveId}_${new Date().getTime()}.pdf`
        : `Experience_Letter_${new Date().getTime()}.pdf`;
      
      pdf.save(fileName);
    });
  };

  const selectedLeave = leaves.find(l => l._id === formData.leaveId);

  return (
    <>
      <Navbar />
      <div className="letters-container">
        <div className="container">
          <h1>Generate Letters</h1>
          {message && (
            <div className="alert alert-info" style={{ marginBottom: '20px', padding: '10px', background: '#d1ecf1', color: '#0c5460', borderRadius: '5px' }}>
              {message}
            </div>
          )}
          <div className="card">
            <div className="letter-type-selector">
              <button
                onClick={() => setLetterType('leave')}
                className={letterType === 'leave' ? 'btn btn-primary' : 'btn btn-secondary'}
              >
                Leave Letter
              </button>
              <button
                onClick={() => setLetterType('experience')}
                className={letterType === 'experience' ? 'btn btn-primary' : 'btn btn-secondary'}
              >
                Experience Letter
              </button>
            </div>

            {letterType === 'leave' ? (
              <div className="letter-form">
                <div className="form-group">
                  <label>Select Approved Leave</label>
                  <select
                    value={formData.leaveId}
                    onChange={(e) => setFormData({ ...formData, leaveId: e.target.value })}
                    required
                  >
                    <option value="">Select Leave</option>
                    {leaves.map(leave => (
                      <option key={leave._id} value={leave._id}>
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()} ({leave.leaveType})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedLeave && (
                  <div className="leave-details">
                    <p><strong>Leave Type:</strong> {selectedLeave.leaveType}</p>
                    <p><strong>From:</strong> {new Date(selectedLeave.startDate).toLocaleDateString()}</p>
                    <p><strong>To:</strong> {new Date(selectedLeave.endDate).toLocaleDateString()}</p>
                    <p><strong>Total Days:</strong> {selectedLeave.totalDays}</p>
                  </div>
                )}
                <button onClick={displayLetter} className="btn btn-primary" disabled={!formData.leaveId}>
                  Display Leave Letter
                </button>
              </div>
            ) : (
              <div className="letter-form">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <button onClick={displayLetter} className="btn btn-primary">
                  Display Experience Letter
                </button>
              </div>
            )}
          </div>

          {/* Letter content - displayed first, then can download */}
          {showLetter && (
            <div className="card" style={{ marginTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Letter Preview</h2>
                <button onClick={downloadLetter} className="btn btn-success">
                  Download PDF
                </button>
              </div>
              <div id="letter-content">
            {letterType === 'leave' && selectedLeave ? (
              <div className="letter-template">
                <div className="letter-header">
                  <h2>{COMPANY_NAME}</h2>
                  <p>Leave Letter</p>
                </div>
                <div className="letter-body">
                  <p><strong>Date:</strong> {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p><strong>To,</strong></p>
                  <p>The HR Manager</p>
                  <p>{COMPANY_NAME}</p>
                  <br />
                  <p><strong>Subject:</strong> Leave Letter</p>
                  <br />
                  <p>Respected Sir/Madam,</p>
                  <br />
                  <p>
                    I, <strong>{user?.personalDetails?.firstName} {user?.personalDetails?.lastName}</strong> (Employee ID: {user?.employeeId}), 
                    would like to inform you that I was on {selectedLeave.leaveType} leave from{' '}
                    <strong>{new Date(selectedLeave.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> to{' '}
                    <strong>{new Date(selectedLeave.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> 
                    ({selectedLeave.totalDays} days).
                  </p>
                  {selectedLeave.remarks && (
                    <p><strong>Reason:</strong> {selectedLeave.remarks}</p>
                  )}
                  <br />
                  <p>This letter is for your records and confirmation.</p>
                  <br />
                  <p>Thank you.</p>
                  <br />
                  <p>Yours sincerely,</p>
                  <p><strong>{user?.personalDetails?.firstName} {user?.personalDetails?.lastName}</strong></p>
                  <p>Employee ID: {user?.employeeId}</p>
                </div>
              </div>
            ) : letterType === 'experience' ? (
              <div className="letter-template">
                <div className="letter-header">
                  <h2>{COMPANY_NAME}</h2>
                  <p>Experience Letter</p>
                </div>
                <div className="letter-body">
                  <p><strong>Date:</strong> {new Date(formData.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <br />
                  <p>To Whom It May Concern,</p>
                  <br />
                  <p>
                    This is to certify that <strong>{user?.personalDetails?.firstName} {user?.personalDetails?.lastName}</strong> 
                    (Employee ID: {user?.employeeId}) was employed with {COMPANY_NAME} as{' '}
                    <strong>{user?.jobDetails?.position || 'Employee'}</strong> in the{' '}
                    <strong>{user?.jobDetails?.department || 'Department'}</strong> department.
                  </p>
                  {user?.jobDetails?.joiningDate && (
                    <p>
                      The employee joined on{' '}
                      <strong>{new Date(user.jobDetails.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
                    </p>
                  )}
                  <p>
                    During the tenure of employment, {user?.personalDetails?.firstName} demonstrated professionalism, 
                    dedication, and commitment to their work responsibilities.
                  </p>
                  <br />
                  <p>We wish them all the best in their future endeavors.</p>
                  <br />
                  <p>Sincerely,</p>
                  <p><strong>HR Department</strong></p>
                  <p>{COMPANY_NAME}</p>
                </div>
              </div>
            ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Letters;

