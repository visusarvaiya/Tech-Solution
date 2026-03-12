# Deployment Guide

This guide covers deploying Dayflow HRMS to various platforms.

## Prerequisites for Deployment

1. MongoDB database (MongoDB Atlas recommended for cloud)
2. Node.js hosting platform account
3. Frontend hosting platform account

## Backend Deployment

### Option 1: Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create dayflow-backend`
4. Set environment variables:
```bash
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set JWT_SECRET=your_secret_key
heroku config:set NODE_ENV=production
```
5. Deploy: `git push heroku main`

### Option 2: Railway

1. Connect your GitHub repository
2. Create new project
3. Add MongoDB service
4. Set environment variables in Railway dashboard
5. Deploy automatically on push

### Option 3: Render

1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables
6. Deploy

### Environment Variables for Backend

```
PORT=5000 (or platform default)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dayflow
JWT_SECRET=your_strong_secret_key_here
NODE_ENV=production
```

## Frontend Deployment

### Option 1: Netlify

1. Build frontend: `cd frontend && npm run build`
2. Drag and drop `build` folder to Netlify
3. Or connect GitHub and set:
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/build`
4. Add environment variable:
   - `REACT_APP_API_URL=https://your-backend-url.com/api`

### Option 2: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend: `cd frontend`
3. Run: `vercel`
4. Set environment variable:
   - `REACT_APP_API_URL=https://your-backend-url.com/api`

### Option 3: GitHub Pages

1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to package.json:
```json
"homepage": "https://username.github.io/dayflow",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```
3. Deploy: `npm run deploy`

## MongoDB Atlas Setup

1. Create account at mongodb.com/cloud/atlas
2. Create new cluster (free tier available)
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for all)
5. Get connection string
6. Update MONGODB_URI in backend environment variables

## Post-Deployment Checklist

- [ ] Backend API is accessible
- [ ] Frontend can connect to backend API
- [ ] MongoDB connection is working
- [ ] Authentication is working
- [ ] File uploads directory exists (for profile pictures)
- [ ] CORS is configured correctly
- [ ] Environment variables are set
- [ ] SSL/HTTPS is enabled (recommended)

## Troubleshooting

### CORS Errors
- Ensure backend CORS allows frontend domain
- Check API URL in frontend environment variables

### MongoDB Connection
- Verify connection string format
- Check IP whitelist in MongoDB Atlas
- Verify database user credentials

### Build Errors
- Ensure all dependencies are in package.json
- Check Node.js version compatibility
- Review build logs for specific errors

## Security Recommendations

1. Use strong JWT_SECRET (32+ characters, random)
2. Enable HTTPS/SSL
3. Use MongoDB Atlas with IP whitelisting
4. Regularly update dependencies
5. Implement rate limiting (consider adding to backend)
6. Use environment variables for all secrets
7. Enable MongoDB authentication

