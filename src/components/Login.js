import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import ForgetPassword from './ForgetPassword';

const Login = ({ onSwitchToRegister, isDesktop = false }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgetPassword, setShowForgetPassword] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`auth-form-container ${isDesktop ? 'desktop-form' : 'mobile-form'}`}
    >
      <div className="auth-form-header">
        <motion.div 
          className="form-icon"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🔐
        </motion.div>
        <h2 className="form-title">Welcome Back!</h2>
        <p className="form-subtitle">Sign in to continue your food adventure</p>
        {isDesktop && (
          <div className="form-features">
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Fast & Secure</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <span>Personalized Experience</span>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <motion.div 
          className="error-message"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <span className="error-icon">⚠️</span>
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            <span className="label-icon">📧</span>
            Email Address
          </label>
          <div className="input-container">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            <span className="label-icon">🔒</span>
            Password
          </label>
          <div className="input-container">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Remember Me checkbox for desktop */}
        {isDesktop && (
          <div className="form-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-label">Remember me</span>
            </label>
            <button 
              type="button"
              onClick={() => setShowForgetPassword(true)}
              className="forgot-password"
              style={{ background: 'none', border: 'none', color: '#4299e1', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Forgot password?
            </button>
          </div>
        )}

        <motion.button
          type="submit"
          disabled={loading}
          className="submit-button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          {loading ? (
            <motion.div 
              className="loading-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              ⏳
            </motion.div>
          ) : (
            <>
              <span>🚀</span>
              Login
            </>
          )}
        </motion.button>
      </form>

      <div className="form-footer">
        <p className="switch-text">
          Don't have an account?{' '}
          <motion.button
            onClick={onSwitchToRegister}
            className="switch-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Create one here
          </motion.button>
        </p>
      </div>

      {/* Forget Password Modal */}
      {showForgetPassword && (
        <ForgetPassword
          onClose={() => setShowForgetPassword(false)}
          onSwitchToLogin={() => setShowForgetPassword(false)}
        />
      )}
    </motion.div>
  );
};

export default Login;
