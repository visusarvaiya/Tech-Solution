# Dayflow HRMS - Quick Start Guide

## Prerequisites
- Node.js (v14+) installed
- MongoDB running (local or MongoDB Atlas)

## Quick Setup (5 minutes)

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example and update values)
# Windows PowerShell:
Copy-Item .env.example .env

# Create uploads directory
mkdir uploads

# Start backend server
npm start
```

Backend will run on `http://localhost:5000`

### 2. Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start frontend (optional: create .env file if API URL differs)
npm start
```

Frontend will run on `http://localhost:3000`

### 3. First Use

1. Open browser: `http://localhost:3000`
2. Sign in with the default admin account:
   - **Email:** `kavadparth54@gmail.com`
   - **Password:** `Parth#2005`
   - Or use **Employee ID:** `ADMIN001`
3. The default admin account is automatically created when the server starts for the first time
4. You can also create additional admin accounts via "Sign Up" if needed

## Default Configuration

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`
- MongoDB: `mongodb://localhost:27017/dayflow`

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` (or start MongoDB service)
- Or use MongoDB Atlas and update `MONGODB_URI` in backend `.env`

### Port Already in Use
- Change `PORT` in backend `.env` file
- Update `REACT_APP_API_URL` in frontend `.env` accordingly

### CORS Errors
- Ensure backend is running before frontend
- Check API URL in frontend `.env` matches backend URL

## Next Steps

- Create employee accounts
- Set up employee profiles
- Configure salary structures
- Start tracking attendance!

