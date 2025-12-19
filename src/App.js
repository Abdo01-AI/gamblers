import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { ToastProvider } from './components/ToastProvider';
import axios from 'axios';
import { useWallet } from './contexts/WalletContext';
import RestaurantList from './components/RestaurantList';
import MenuPage from './components/MenuPage';
import WheelGame from './components/WheelGame';
import MatchingGame from './components/MatchingGame';
import Slots777 from './components/Slots777';
import UserProfile from './components/UserProfile';
import OrderHistory from './components/OrderHistory';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Header component that uses authentication
const AppHeader = ({ bgMode, onToggleBg }) => {
  const { user, logout, token } = useAuth();
  const { balance } = useWallet();

  // No local wallet fetch; WalletProvider handles it

  if (!user) {
    return null;
  }

  return (
    <header className="app-header">
      <h1>🍽️ Dish of Fate</h1>
      {user && (
        <div className="user-info">
          <span>Welcome, {user.first_name}!</span>
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '0.9rem'
          }}>
            💰 ${balance.toFixed(2)}
          </div>
          {/* Dark mode toggle removed */}
          <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link to="/" style={{ color: '#4a5568', textDecoration: 'none', fontWeight: '500' }}>
              🏠 Restaurants
            </Link>
            <Link to="/history" style={{ color: '#4a5568', textDecoration: 'none', fontWeight: '500' }}>
              📊 History
            </Link>
            <Link to="/profile" style={{ color: '#4a5568', textDecoration: 'none', fontWeight: '500' }}>
              👤 Profile
            </Link>
          </nav>
          <button
            className="btn btn-secondary"
            onClick={onToggleBg}
            title="Toggle background style"
          >
            {bgMode === 'casino' ? 'Background: Original' : 'Background: Casino'}
          </button>
          <button 
            onClick={logout}
            className="logout-btn"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

// Main app routes component
const AppRoutes = () => {
  return (
    <main className="app-main">
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <RestaurantList />
          </ProtectedRoute>
        } />
        <Route path="/restaurant/:id" element={
          <ProtectedRoute>
            <MenuPage />
          </ProtectedRoute>
        } />
        <Route path="/restaurant/:id/wheel" element={
          <ProtectedRoute>
            <WheelGame />
          </ProtectedRoute>
        } />
        <Route path="/restaurant/:id/matching" element={
          <ProtectedRoute>
            <MatchingGame />
          </ProtectedRoute>
        } />
        <Route path="/restaurant/:id/slots" element={
          <ProtectedRoute>
            <Slots777 />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <OrderHistory />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
};

function App() {
  const [bgMode, setBgMode] = useState(() => {
    try {
      return localStorage.getItem('bgMode') || 'casino';
    } catch {
      return 'casino';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('bgMode', bgMode);
    } catch {}
  }, [bgMode]);

  const toggleBg = () => setBgMode((m) => (m === 'casino' ? 'cute' : 'casino'));

  return (
    <AuthProvider>
      <WalletProvider>
        <ToastProvider>
          <Router>
            <div className={`App bg-${bgMode}`}>
              <AppHeader bgMode={bgMode} onToggleBg={toggleBg} />
              <AppRoutes />
            </div>
          </Router>
        </ToastProvider>
      </WalletProvider>
    </AuthProvider>
  );
}

export default App;
