# 🔐 Authentication System Setup Guide

This guide will help you set up the user registration and login system for the Gamblers Food App.

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Database**
   ```bash
   npm run setup-db
   ```

3. **Setup Authentication**
   ```bash
   npm run setup-auth
   ```

4. **Start the Server**
   ```bash
   npm run server
   ```

5. **Start the React App** (in a new terminal)
   ```bash
   npm start
   ```

## 📋 Features

### ✅ User Registration
- **Required Fields**: First Name, Last Name, Email, Password, Phone Number
- **Account Types**: Customer, Restaurant Owner, Driver
- **Password Security**: Bcrypt hashing with salt rounds
- **Email Validation**: Proper email format validation
- **Duplicate Prevention**: Email uniqueness check

### ✅ User Login
- **Secure Authentication**: JWT token-based authentication
- **Password Verification**: Bcrypt password comparison
- **Session Management**: 24-hour token expiration
- **Error Handling**: Clear error messages for invalid credentials

### ✅ Protected Routes
- **Route Protection**: All app routes require authentication
- **Role-based Access**: Different access levels for different user types
- **Automatic Redirects**: Unauthenticated users redirected to login

### ✅ User Profile
- **Profile Management**: View and manage user information
- **Account Details**: Display user role, contact info, and account creation date
- **Logout Functionality**: Secure session termination

## 🗄️ Database Schema

The authentication system uses the existing `USERS` table with the following structure:

```sql
CREATE TABLE USERS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,  -- Bcrypt hashed
    phone TEXT NOT NULL,
    role TEXT CHECK(role IN ('customer', 'restaurant_owner', 'driver')) NOT NULL DEFAULT 'customer',
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 API Endpoints

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "phone": "+1-555-123-4567",
  "role": "customer"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1-555-123-4567",
    "role": "customer"
  }
}
```

#### POST `/api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1-555-123-4567",
    "role": "customer"
  }
}
```

#### GET `/api/auth/profile`
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1-555-123-4567",
  "role": "customer",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

## 🎨 React Components

### AuthContext
- **Location**: `src/contexts/AuthContext.js`
- **Purpose**: Global authentication state management
- **Features**: Login, register, logout, token management

### Login Component
- **Location**: `src/components/Login.js`
- **Purpose**: User login form
- **Features**: Email/password validation, error handling

### Register Component
- **Location**: `src/components/Register.js`
- **Purpose**: User registration form
- **Features**: Form validation, role selection, password confirmation

### ProtectedRoute Component
- **Location**: `src/components/ProtectedRoute.js`
- **Purpose**: Route protection wrapper
- **Features**: Authentication check, role-based access, loading states

### UserProfile Component
- **Location**: `src/components/UserProfile.js`
- **Purpose**: User profile display
- **Features**: Profile information, logout functionality

## 🔒 Security Features

1. **Password Hashing**: Bcrypt with 10 salt rounds
2. **JWT Tokens**: Secure token-based authentication
3. **Token Expiration**: 24-hour token lifetime
4. **Input Validation**: Server-side validation for all inputs
5. **SQL Injection Protection**: Parameterized queries
6. **CORS Configuration**: Proper cross-origin resource sharing

## 🧪 Testing the System

### Test User Accounts
The system comes with demo accounts (passwords need to be updated):

1. **Customer Account**
   - Email: `john.customer@email.com`
   - Role: Customer

2. **Restaurant Owner Account**
   - Email: `maria.chef@email.com`
   - Role: Restaurant Owner

3. **Driver Account**
   - Email: `mike.driver@email.com`
   - Role: Driver

### Manual Testing Steps

1. **Registration Test**
   - Navigate to the app
   - Click "Register here"
   - Fill out the registration form
   - Verify successful registration and automatic login

2. **Login Test**
   - Logout from the app
   - Click "Login here"
   - Enter credentials
   - Verify successful login

3. **Protected Route Test**
   - Try accessing `/profile` without authentication
   - Verify redirect to login page
   - Login and verify access to protected routes

## 🐛 Troubleshooting

### Common Issues

1. **"Access token required" Error**
   - Solution: Make sure you're logged in and the token is valid
   - Check browser localStorage for the token

2. **"Invalid email or password" Error**
   - Solution: Verify credentials are correct
   - Check if the user account exists in the database

3. **Database Connection Issues**
   - Solution: Ensure the database file exists
   - Run `npm run setup-db` to recreate the database

4. **CORS Issues**
   - Solution: Make sure the server is running on the correct port
   - Check that the React app is making requests to the right API endpoint

### Debug Mode

To enable debug logging, set the following environment variable:
```bash
NODE_ENV=development npm run server
```

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=3001
NODE_ENV=development
```

## 🚀 Production Deployment

### Security Checklist

- [ ] Change JWT_SECRET to a secure random string
- [ ] Use HTTPS in production
- [ ] Set up proper CORS origins
- [ ] Use environment variables for sensitive data
- [ ] Implement rate limiting for authentication endpoints
- [ ] Set up proper logging and monitoring
- [ ] Use a production database (PostgreSQL, MySQL, etc.)

### Database Migration

For production, consider migrating from SQLite to a more robust database:

1. **PostgreSQL**: Better for concurrent users
2. **MySQL**: Good for web applications
3. **MongoDB**: Document-based alternative

## 📞 Support

If you encounter any issues with the authentication system:

1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure the database is properly set up
4. Check that the server is running on the correct port

## 🎉 Success!

Once everything is set up, you should have a fully functional authentication system that allows users to:

- Register new accounts with different roles
- Login securely with email and password
- Access protected routes based on authentication status
- View and manage their profile information
- Logout securely

The system integrates seamlessly with your existing food delivery app and provides a solid foundation for user management and security.
