import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const { token } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!token) { setBalance(0); return; }
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3001/api/wallet/balance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBalance(res.data.balance);
    } catch (e) {
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial load and when token changes
  useEffect(() => { refreshBalance(); }, [refreshBalance]);

  // Optional optimistic adjust
  const adjust = useCallback((delta) => setBalance((b) => Math.max(0, b + delta)), []);

  const value = { balance, loading, refreshBalance, adjust };
  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
};
