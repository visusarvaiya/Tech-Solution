const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured. Email functionality will not work.');
    return null;
  }
  
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send employee credentials email
const sendEmployeeCredentials = async (email, employeeId, temporaryPassword, firstName = '') => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.error('Email transporter not available. Please configure EMAIL_USER and EMAIL_PASS in .env file');
      return { success: false, error: 'Email service not configured' };
    }
    
    const mailOptions = {
      from: `"Tech Solution HRMS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Tech Solution - Your Account Credentials',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4a90e2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .credentials { background-color: white; padding: 20px; margin: 20px 0; border-left: 4px solid #4a90e2; }
            .credentials-item { margin: 10px 0; }
            .credentials-label { font-weight: bold; color: #666; }
            .credentials-value { color: #2c3e50; font-size: 18px; }
            .warning { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4a90e2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Tech Solution HRMS</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName || 'Employee'},</p>
              
              <p>Your account has been created in the Tech Solution Human Resource Management System. Please find your login credentials below:</p>
              
              <div class="credentials">
                <div class="credentials-item">
                  <span class="credentials-label">Employee ID:</span>
                  <div class="credentials-value">${employeeId}</div>
                </div>
                <div class="credentials-item">
                  <span class="credentials-label">Email:</span>
                  <div class="credentials-value">${email}</div>
                </div>
                <div class="credentials-item">
                  <span class="credentials-label">Temporary Password:</span>
                  <div class="credentials-value">${temporaryPassword}</div>
                </div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> For security reasons, you must change your password on your first login. 
                You will be prompted to set a new password after signing in.
              </div>
              
              <p>To access your account:</p>
              <ol>
                <li>Visit: <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">${process.env.FRONTEND_URL || 'http://localhost:3000'}</a></li>
                <li>Sign in with your Employee ID or Email and the temporary password above</li>
                <li>You will be prompted to change your password</li>
                <li>Set a strong password (minimum 6 characters)</li>
              </ol>
              
              <p>If you have any questions or need assistance, please contact your HR department.</p>
              
              <p>Best regards,<br>Tech Solution HRMS Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send leave status notification email
const sendLeaveStatusNotification = async (email, firstName, leaveType, startDate, endDate, status, adminComments = '') => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.error('Email transporter not available. Please configure EMAIL_USER and EMAIL_PASS in .env file');
      return { success: false, error: 'Email service not configured' };
    }
    
    const statusText = status === 'approved' ? 'Approved' : 'Rejected';
    const statusColor = status === 'approved' ? '#28a745' : '#dc3545';
    const statusIcon = status === 'approved' ? '✓' : '✗';
    
    const mailOptions = {
      from: `"Tech Solution HRMS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Leave Request ${statusText} - Tech Solution HRMS`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${statusColor}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .status-box { background-color: white; padding: 20px; margin: 20px 0; border-left: 4px solid ${statusColor}; }
            .leave-details { background-color: white; padding: 20px; margin: 20px 0; border-left: 4px solid #4a90e2; }
            .detail-item { margin: 10px 0; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #2c3e50; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${statusIcon} Leave Request ${statusText}</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName || 'Employee'},</p>
              
              <p>Your leave request has been <strong>${statusText.toLowerCase()}</strong> by the administration.</p>
              
              <div class="leave-details">
                <div class="detail-item">
                  <span class="detail-label">Leave Type:</span>
                  <div class="detail-value">${leaveType}</div>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Start Date:</span>
                  <div class="detail-value">${new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div class="detail-item">
                  <span class="detail-label">End Date:</span>
                  <div class="detail-value">${new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                ${adminComments ? `
                <div class="detail-item">
                  <span class="detail-label">Admin Comments:</span>
                  <div class="detail-value">${adminComments}</div>
                </div>
                ` : ''}
              </div>
              
              <p>If you have any questions or concerns, please contact your HR department.</p>
              
              <p>Best regards,<br>Tech Solution HRMS Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Leave status email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending leave status email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmployeeCredentials,
  sendLeaveStatusNotification
};

