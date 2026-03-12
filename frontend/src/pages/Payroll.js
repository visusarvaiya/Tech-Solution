import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { formatCurrency } from '../utils/currency';
import { COMPANY_NAME } from '../utils/constants';
import './Payroll.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Payroll = () => {
  const { user, isAdmin } = useContext(AuthContext);
  const [payroll, setPayroll] = useState(null);
  const [allPayrolls, setAllPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState('');

  useEffect(() => {
    if (isAdmin()) {
      fetchAllPayrolls();
    } else {
      fetchPayroll();
    }
  }, [selectedEmployee]);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/payroll`);
      setPayroll(response.data);
      setFormData(response.data?.salary || {});
    } catch (error) {
      console.error('Error fetching payroll:', error);
      console.error('Error details:', error.response?.data);
      setPayroll(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPayrolls = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/payroll/admin/all`);
      setAllPayrolls(response.data);
    } catch (error) {
      console.error('Error fetching all payrolls:', error);
      console.error('Error details:', error.response?.data);
      setAllPayrolls([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const employeeId = selectedEmployee || user._id;
      await axios.put(`${API_URL}/payroll/${employeeId}`, formData);
      setEditing(false);
      if (isAdmin()) {
        fetchAllPayrolls();
      } else {
        fetchPayroll();
      }
      alert('Salary updated successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating salary');
    }
  };

  const generateSalarySlip = () => {
    const element = document.getElementById('salary-slip-content');
    if (!element) return;

    element.style.display = 'block';
    
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

      pdf.save(`Salary_Slip_${payroll?.employeeId}_${new Date().getMonth() + 1}_${new Date().getFullYear()}.pdf`);
      element.style.display = 'none';
    });
  };

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
      <div className="payroll-container">
        <div className="container">
          <h1>Payroll Management</h1>

          {isAdmin() ? (
            <>
              {!editing ? (
                <div className="table-container">
                  <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>All Employee Payrolls</h2>
                    <button onClick={() => setEditing(true)} className="btn btn-primary">
                      Update Salary
                    </button>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Position</th>
                        <th>Base Salary</th>
                        <th>Allowances</th>
                        <th>Deductions</th>
                        <th>Net Salary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allPayrolls.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center' }}>
                            No payroll records found
                          </td>
                        </tr>
                      ) : (
                        allPayrolls.map((emp) => (
                          <tr key={emp.id}>
                            <td>{emp.employeeId}</td>
                            <td>{emp.name}</td>
                            <td>{emp.department || 'N/A'}</td>
                            <td>{emp.position || 'N/A'}</td>
                            <td>{formatCurrency(emp.salary.baseSalary || 0)}</td>
                            <td>{formatCurrency(emp.salary.allowances || 0)}</td>
                            <td>{formatCurrency(emp.salary.deductions || 0)}</td>
                            <td><strong>{formatCurrency(emp.salary.netSalary || 0)}</strong></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="card">
                  <h2>Update Salary</h2>
                  <form onSubmit={handleUpdate}>
                    <div className="form-group">
                      <label>Select Employee</label>
                      <select
                        value={selectedEmployee}
                        onChange={(e) => {
                          setSelectedEmployee(e.target.value);
                          const emp = allPayrolls.find(p => p.id === e.target.value);
                          if (emp) {
                            setFormData(emp.salary);
                          }
                        }}
                        required
                      >
                        <option value="">Select Employee</option>
                        {allPayrolls.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.employeeId} - {emp.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Base Salary</label>
                        <input
                          type="number"
                          value={formData.baseSalary || 0}
                          onChange={(e) => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Allowances</label>
                        <input
                          type="number"
                          value={formData.allowances || 0}
                          onChange={(e) => setFormData({ ...formData, allowances: parseFloat(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Deductions</label>
                        <input
                          type="number"
                          value={formData.deductions || 0}
                          onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) })}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="card">
              <h2>Your Payroll Information</h2>
              <div className="payroll-info">
                <div className="info-item">
                  <span className="info-label">Employee ID:</span>
                  <span className="info-value">{payroll?.employeeId}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  <span className="info-value">{payroll?.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Department:</span>
                  <span className="info-value">{payroll?.department || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Position:</span>
                  <span className="info-value">{payroll?.position || 'N/A'}</span>
                </div>
                <div className="payroll-breakdown">
                  <h3>Salary Breakdown</h3>
                  <div className="info-item">
                    <span className="info-label">Base Salary:</span>
                    <span className="info-value">{formatCurrency(payroll?.salary?.baseSalary || 0)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Allowances:</span>
                    <span className="info-value">{formatCurrency(payroll?.salary?.allowances || 0)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Deductions:</span>
                    <span className="info-value">{formatCurrency(payroll?.salary?.deductions || 0)}</span>
                  </div>
                  <div className="info-item net-salary">
                    <span className="info-label">Net Salary:</span>
                    <span className="info-value">{formatCurrency(payroll?.salary?.netSalary || 0)}</span>
                  </div>
                </div>
                <div style={{ marginTop: '20px' }}>
                  <button onClick={generateSalarySlip} className="btn btn-primary">
                    Generate Salary Slip
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Hidden div for PDF generation */}
      <div id="salary-slip-content" style={{ display: 'none' }}>
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1>{COMPANY_NAME}</h1>
            <p>Salary Slip</p>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <p><strong>Employee ID:</strong> {payroll?.employeeId}</p>
            <p><strong>Name:</strong> {payroll?.name}</p>
            <p><strong>Department:</strong> {payroll?.department || 'N/A'}</p>
            <p><strong>Position:</strong> {payroll?.position || 'N/A'}</p>
            <p><strong>Month:</strong> {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>Base Salary</td>
                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{formatCurrency(payroll?.salary?.baseSalary || 0)}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>Allowances</td>
                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{formatCurrency(payroll?.salary?.allowances || 0)}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>Deductions</td>
                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{formatCurrency(payroll?.salary?.deductions || 0)}</td>
              </tr>
              <tr style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>Net Salary</td>
                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{formatCurrency(payroll?.salary?.netSalary || 0)}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
            <p>This is a computer-generated document and does not require a signature.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Payroll;

