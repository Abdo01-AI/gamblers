import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import { motion, AnimatePresence } from 'framer-motion';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Keyboard shortcuts for desktop
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'l':
            e.preventDefault();
            setIsLogin(true);
            break;
          case 'r':
            e.preventDefault();
            setIsLogin(false);
            break;
          default:
            break;
        }
      }
    };

    if (isDesktop) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [isDesktop]);

  return (
    <div className={`auth-page ${isDesktop ? 'desktop' : 'mobile'}`}>
      {/* Enhanced animated background */}
      <div className="auth-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
          {isDesktop && (
            <>
              <div className="shape shape-6"></div>
              <div className="shape shape-7"></div>
            </>
          )}
        </div>
        
        {/* Desktop-specific background elements */}
        {isDesktop && (
          <div className="desktop-bg-elements">
            <div className="bg-circle bg-circle-1"></div>
            <div className="bg-circle bg-circle-2"></div>
            <div className="bg-gradient bg-gradient-1"></div>
            <div className="bg-gradient bg-gradient-2"></div>
          </div>
        )}
      </div>

      <div className={`auth-container ${isDesktop ? 'desktop-layout' : 'mobile-layout'}`}>
        <motion.div 
          className="auth-header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="logo-container">
            <motion.div 
              className="logo"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              🍕
            </motion.div>
            <div className="title-section">
              <h1 className="app-title">Gamblers Food</h1>
              {isDesktop && (
                <div className="app-tagline">
                  <span className="tagline-text">Where Food Meets Fortune</span>
                  <div className="tagline-decoration"></div>
                </div>
              )}
            </div>
          </div>
          <motion.p 
            className="app-subtitle"
            key={isLogin ? 'login' : 'register'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {isLogin ? 'Welcome back, foodie!' : 'Join our delicious adventure'}
          </motion.p>
          
          {/* Desktop keyboard shortcuts hint */}
          {isDesktop && (
            <motion.div 
              className="keyboard-hints"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <div className="hint-item">
                <kbd>Ctrl</kbd> + <kbd>L</kbd> Login
              </div>
              <div className="hint-item">
                <kbd>Ctrl</kbd> + <kbd>R</kbd> Register
              </div>
            </motion.div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {isLogin ? (
            <Login key="login" onSwitchToRegister={() => setIsLogin(false)} isDesktop={isDesktop} />
          ) : (
            <Register key="register" onSwitchToLogin={() => setIsLogin(true)} isDesktop={isDesktop} />
          )}
        </AnimatePresence>

        <motion.div 
          className="auth-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
          {isDesktop && (
            <div className="footer-links">
              <a href="#" className="footer-link">Terms of Service</a>
              <span className="separator">•</span>
              <a href="#" className="footer-link">Privacy Policy</a>
              <span className="separator">•</span>
              <a href="#" className="footer-link">Support</a>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
