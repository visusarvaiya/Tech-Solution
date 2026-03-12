# Tech Solution - Human Resource Management System

**Every workday, perfectly aligned.**

A comprehensive HRMS solution for managing employee onboarding, profiles, attendance, leave, and payroll.

## Features

- 🔐 **Secure Authentication** - Sign up/Sign in with role-based access
- 👥 **Employee Management** - Complete profile management for employees
- ⏰ **Attendance Tracking** - Daily check-in/check-out with attendance records
- 📅 **Leave Management** - Apply for leave, approve/reject requests
- 💰 **Payroll Management** - View and manage employee salaries
- 📊 **Admin Dashboard** - Comprehensive admin panel with statistics
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads

### Frontend
- React 18
- React Router
- Axios for API calls
- React Icons

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dayflow
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
```

4. Create `uploads` directory:
```bash
mkdir uploads
```

5. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional, defaults to localhost:5000):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Usage

### First Time Setup

1. Start MongoDB (if running locally):
```bash
mongod
```

2. Start the backend server (from `backend` directory):
```bash
npm start
```
   - A default admin account will be automatically created on first run:
     - **Email:** kavadparth54@gmail.com
     - **Password:** Parth#2005
     - **Employee ID:** ADMIN001

3. Start the frontend (from `frontend` directory):
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

5. Sign in with the default admin account:
   - Email: `kavadparth54@gmail.com`
   - Password: `Parth#2005`
   - Or use Employee ID: `ADMIN001`

**Note:** You can also sign up a new admin account if needed, but the default admin is created automatically.

### User Roles

- **Employee**: Can view own profile, attendance, apply for leave, view payroll
- **Admin/HR**: Can manage all employees, approve leaves, update salaries, view reports

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user
- `GET /api/auth/me` - Get current user

### Profile
- `GET /api/profile` - Get own profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/:id/documents` - Upload document

### Attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/today/status` - Get today's status

### Leave
- `POST /api/leave/apply` - Apply for leave
- `GET /api/leave` - Get leave requests
- `GET /api/leave/admin/all` - Get all leave requests (Admin)
- `PUT /api/leave/:id/approve` - Approve/Reject leave

### Payroll
- `GET /api/payroll` - Get own payroll
- `GET /api/payroll/admin/all` - Get all payrolls (Admin)
- `PUT /api/payroll/:employeeId` - Update salary (Admin)

### Admin
- `GET /api/admin/employees` - Get all employees
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/reports/attendance` - Get attendance reports
- `GET /api/admin/reports/salary` - Get salary reports

## Deployment

### Backend Deployment

1. Set environment variables on your hosting platform
2. Ensure MongoDB is accessible (use MongoDB Atlas for cloud)
3. Deploy to platforms like:
   - Heroku
   - Railway
   - Render
   - AWS/DigitalOcean

### Frontend Deployment

1. Build the production version:
```bash
cd frontend
npm run build
```

2. Deploy the `build` folder to:
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - GitHub Pages

3. Update `REACT_APP_API_URL` to point to your deployed backend

## Project Structure

```
dayflow/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── uploads/         # Uploaded files
│   ├── server.js        # Express server
│   └── package.json
├── frontend/
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   └── App.js       # Main app component
│   └── package.json
└── README.md
```

## License

This project is open source and available for educational purposes.

## Support

For issues and questions, please create an issue in the repository.

