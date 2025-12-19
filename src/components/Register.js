import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const Register = ({ onSwitchToLogin, isDesktop = false }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Please enter a valid phone number');
      return false;
    }

    if (!formData.location.trim()) {
      setError('Please enter your delivery location');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);
    
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
      className={`auth-form-container register-form ${isDesktop ? 'desktop-form' : 'mobile-form'}`}
    >
      <div className="auth-form-header">
        <motion.div 
          className="form-icon"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ✨
        </motion.div>
        <h2 className="form-title">Join the Adventure!</h2>
        <p className="form-subtitle">Create your account and start winning delicious rewards</p>
        {isDesktop && (
          <div className="form-features">
            <div className="feature-item">
              <span className="feature-icon">🎁</span>
              <span>Welcome Bonus</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🏆</span>
              <span>Exclusive Rewards</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Instant Access</span>
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
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="first_name" className="form-label">
              <span className="label-icon">👤</span>
              First Name
            </label>
            <div className="input-container">
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="First name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="last_name" className="form-label">
              <span className="label-icon">👤</span>
              Last Name
            </label>
            <div className="input-container">
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Last name"
              />
            </div>
          </div>
        </div>

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
          <label htmlFor="phone" className="form-label">
            <span className="label-icon">📱</span>
            Phone Number
          </label>
          <div className="input-container">
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="+1-555-123-4567"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location" className="form-label">
            <span className="label-icon">📍</span>
            Delivery Location
          </label>
          <div className="input-container">
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="123 Main Street, City, State 12345"
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
              placeholder="Create a password"
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

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            <span className="label-icon">🔐</span>
            Confirm Password
          </label>
          <div className="input-container">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Terms agreement for desktop */}
        {isDesktop && (
          <div className="form-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="checkbox-input"
                required
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-label">
                I agree to the <a href="#" className="terms-link">Terms of Service</a> and <a href="#" className="terms-link">Privacy Policy</a>
              </span>
            </label>
          </div>
        )}

        <motion.button
          type="submit"
          disabled={loading || (isDesktop && !agreeToTerms)}
          className="submit-button register-button"
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
              <span>🎉</span>
              Create Account
            </>
          )}
        </motion.button>
      </form>

      <div className="form-footer">
        <p className="switch-text">
          Already have an account?{' '}
          <motion.button
            onClick={onSwitchToLogin}
            className="switch-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sign in here
          </motion.button>
        </p>
      </div>
    </motion.div>
  );
};

export default Register;
