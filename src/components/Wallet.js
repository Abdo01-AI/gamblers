import React from 'react';

const Wallet = ({ balance }) => {
  return (
    <div style={{
      background: '#f7fafc',
      padding: '0.5rem 1rem',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#2d3748'
    }}>
      <span style={{ fontSize: '1rem' }}>💰</span>
      <span>
        ${balance.toFixed(2)}
      </span>
    </div>
  );
};

export default Wallet;
