import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const ForgetPassword = ({ onClose, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: email verification, 2: password reset
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (step === 1) {
        // Step 1: Verify email and get reset token
        const response = await axios.post('http://localhost:3001/api/auth/forgot-password', {
          email: email
        });

        if (response.data.resetToken) {
          setResetToken(response.data.resetToken);
          setStep(2);
          setMessage('Email verified! Now enter your new password.');
        } else {
          setError('Failed to generate reset token. Please try again.');
        }
      } else if (step === 2) {
        // Step 2: Reset password
        if (newPassword !== confirmPassword) {
          setError('Passwords do not match.');
          return;
        }

        if (newPassword.length < 6) {
          setError('Password must be at least 6 characters long.');
          return;
        }

        const response = await axios.post('http://localhost:3001/api/auth/reset-password', {
          token: resetToken,
          newPassword: newPassword
        });

        setMessage('Password reset successfully! You can now login with your new password.');
        setTimeout(() => {
          onSwitchToLogin();
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="forget-password-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="forget-password-form"
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
            {step === 1 ? '🔑' : '🔒'}
          </div>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>
            {step === 1 ? 'Reset Password' : 'Enter New Password'}
          </h2>
          <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem' }}>
            {step === 1 
              ? 'Enter your email address to verify your account.' 
              : 'Enter your new password below.'
            }
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: '#fed7d7',
              color: '#c53030',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid #feb2b2',
              fontSize: '0.875rem'
            }}
          >
            ⚠️ {error}
          </motion.div>
        )}

        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: '#c6f6d5',
              color: '#2f855a',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid #9ae6b4',
              fontSize: '0.875rem'
            }}
          >
            ✅ {message}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2d3748' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email address"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2d3748' }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter your new password"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2d3748' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your new password"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <motion.button
              type="button"
              onClick={step === 1 ? onClose : () => setStep(1)}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                background: 'white',
                color: '#4a5568',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {step === 1 ? 'Cancel' : '← Back'}
            </motion.button>
            
            <motion.button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: 'none',
                borderRadius: '8px',
                background: loading ? '#a0aec0' : '#4299e1',
                color: 'white',
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading 
                ? (step === 1 ? '⏳ Verifying...' : '⏳ Resetting...') 
                : (step === 1 ? '✅ Verify Email' : '🔒 Reset Password')
              }
            </motion.button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            onClick={onSwitchToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: '#4299e1',
              cursor: 'pointer',
              fontSize: '0.875rem',
              textDecoration: 'underline'
            }}
          >
            ← Back to Login
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ForgetPassword;

