import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import axios from 'axios';

const UserProfile = () => {
  const { user, logout, token } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchWalletBalance();
    }
  }, [token]);

  const fetchWalletBalance = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/wallet/balance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWalletBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      setWalletBalance(0);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'customer':
        return 'Customer';
      case 'restaurant_owner':
        return 'Restaurant Owner';
      case 'driver':
        return 'Driver';
      default:
        return role;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'customer':
        return '👤';
      case 'restaurant_owner':
        return '🍽️';
      case 'driver':
        return '🚗';
      default:
        return '👤';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'customer':
        return 'from-blue-500 to-blue-600';
      case 'restaurant_owner':
        return 'from-orange-500 to-orange-600';
      case 'driver':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="profile-container">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="profile-card"
      >
        {/* Profile Header */}
        <div className="profile-header">
          <motion.div 
            className={`profile-avatar ${getRoleColor(user.role)}`}
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              repeatDelay: 2 
            }}
          >
            <span className="avatar-icon">{getRoleIcon(user.role)}</span>
          </motion.div>
          
          <motion.div 
            className="profile-info"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <h2 className="profile-name">
              {user.first_name} {user.last_name}
            </h2>
            <div className="profile-role">
              <span className="role-badge">{getRoleDisplayName(user.role)}</span>
            </div>
          </motion.div>
        </div>

        {/* Profile Stats */}
        <motion.div 
          className="profile-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="stat-item">
            <div className="stat-icon">📧</div>
            <div className="stat-content">
              <span className="stat-label">Email</span>
              <span className="stat-value">{user.email}</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">📱</div>
            <div className="stat-content">
              <span className="stat-label">Phone</span>
              <span className="stat-value">{user.phone}</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <span className="stat-label">Wallet Balance</span>
              <span className="stat-value">
                {loading ? 'Loading...' : `$${walletBalance.toFixed(2)}`}
              </span>
            </div>
          </div>

          {user.created_at && (
            <div className="stat-item">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <span className="stat-label">Member Since</span>
                <span className="stat-value">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="profile-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <motion.button
            onClick={logout}
            className="logout-button"
            whileHover={{ scale: 1.02, boxShadow: "0 8px 25px rgba(239, 68, 68, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <span className="button-icon">🚪</span>
            <span>Logout</span>
          </motion.button>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default UserProfile;
