import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import ReviewModal from './ReviewModal';

const OrderHistory = () => {
  const { token } = useAuth();
  const [unifiedHistory, setUnifiedHistory] = useState([]);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [reviewedOrders, setReviewedOrders] = useState(new Set());

  useEffect(() => {
    if (token) {
      fetchHistoryData();
    }
  }, [token]);

  const fetchHistoryData = async () => {
    try {
      console.log('Fetching history data with token:', token ? 'Token exists' : 'No token');
      
      const [unifiedRes, walletRes, balanceRes] = await Promise.all([
        axios.get('http://localhost:3001/api/history/unified', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:3001/api/wallet/transactions', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:3001/api/wallet/balance', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      console.log('Unified history response:', unifiedRes.data);
      console.log('Wallet transactions response:', walletRes.data);
      console.log('Wallet balance response:', balanceRes.data);

      setUnifiedHistory(unifiedRes.data);
      setWalletTransactions(walletRes.data);
      setWalletBalance(balanceRes.data.balance);
      
      // Fetch existing reviews to track which orders have been reviewed
      await fetchExistingReviews(unifiedRes.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching history:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setLoading(false);
    }
  };

  const fetchExistingReviews = async (historyData) => {
    try {
      // Get all orders from history
      const orders = historyData.filter(item => item.type === 'order');
      const reviewedSet = new Set();
      
      // Check each order for existing reviews
      for (const order of orders) {
        try {
          const reviewsRes = await axios.get(`http://localhost:3001/api/restaurants/${order.restaurant_id}/reviews`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Check if current user has reviewed this order
          const userReview = reviewsRes.data.find(review => review.order_id === order.id);
          if (userReview) {
            reviewedSet.add(order.id);
          }
        } catch (error) {
          console.error(`Error checking reviews for order ${order.id}:`, error);
        }
      }
      
      setReviewedOrders(reviewedSet);
    } catch (error) {
      console.error('Error fetching existing reviews:', error);
    }
  };

  const formatDate = (dateString) => {
    // Parse the date string and ensure it's treated as local time
    let date;
    if (dateString.includes('T')) {
      // ISO format - parse as local time
      date = new Date(dateString);
    } else {
      // Database format (YYYY-MM-DD HH:mm:ss) - treat as local time
      date = new Date(dateString.replace(' ', 'T'));
    }
    
    // Fix year if it's 2025 (system clock issue)
    if (date.getFullYear() === 2025) {
      date.setFullYear(2024);
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getGameIcon = (gameType) => {
    if (gameType === 'wheel') return '🎡';
    if (gameType === 'matching') return '🧩';
    if (gameType === 'slots') return '�';
    return '🎮';
  };

  const getTransactionIcon = (type) => {
    return type === 'credit' ? '💰' : '💸';
  };

  const getOutcomeColor = (betAmount, wonItemPrice) => {
    if (!wonItemPrice) return '#e74c3c'; // Lost
    if (wonItemPrice > betAmount) return '#27ae60'; // Won more
    if (wonItemPrice < betAmount) return '#f39c12'; // Won less
    return '#3498db'; // Exact match
  };

  const getOutcomeText = (betAmount, wonItemPrice, walletCredit) => {
    if (!wonItemPrice) return 'Lost - No prize';
    if (wonItemPrice > betAmount) return `Won more! +$${(wonItemPrice - betAmount).toFixed(2)}`;
    if (wonItemPrice < betAmount) return `Won less - $${walletCredit.toFixed(2)} to wallet`;
    return 'Exact match!';
  };

  const openReviewModal = (order, restaurant) => {
    setSelectedOrder(order);
    setSelectedRestaurant(restaurant);
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedOrder(null);
    setSelectedRestaurant(null);
  };

  const handleReviewSubmitted = () => {
    // Add the order to reviewed orders set
    if (selectedOrder) {
      setReviewedOrders(prev => new Set([...prev, selectedOrder.id]));
    }
    // Refresh the history data to show the review was submitted
    fetchHistoryData();
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
          <p>Loading your history...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Wallet Balance */}
      <motion.div 
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: '#1a202c', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
            📊 Order History
          </h2>
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '1.1rem'
          }}>
            💰 Wallet: ${walletBalance.toFixed(2)}
          </div>
        </div>
        
        <p style={{ color: '#718096', margin: 0 }}>
          Track your gambling history, winnings, and wallet transactions
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div 
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'history' ? '#667eea' : '#f7fafc',
              color: activeTab === 'history' ? 'white' : '#4a5568',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            📋 Order & Game History
          </button>
          <button
            className={`tab-button ${activeTab === 'wallet' ? 'active' : ''}`}
            onClick={() => setActiveTab('wallet')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'wallet' ? '#667eea' : '#f7fafc',
              color: activeTab === 'wallet' ? 'white' : '#4a5568',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            💰 Wallet Transactions
          </button>
        </div>

        {/* Unified History Tab */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {unifiedHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎰</div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#4a5568' }}>No gambling history yet</h3>
                <p>Start playing games to see your history here!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {unifiedHistory.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    className="history-item"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    style={{
                      background: '#f7fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        {transaction.type === 'order' ? (
                          <>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1a202c', fontSize: '1.1rem', fontWeight: '600' }}>
                              📦 {transaction.order_number}
                            </h4>
                            <p style={{ margin: '0 0 0.25rem 0', color: '#4a5568', fontSize: '0.9rem' }}>
                              🍽️ {transaction.restaurant_name} • {transaction.cuisine_type}
                            </p>
                            <p style={{ margin: 0, color: '#718096', fontSize: '0.85rem' }}>
                              {transaction.items}
                            </p>
                            {transaction.special_instructions && transaction.special_instructions !== 'Order from gambling game' && (
                              <div style={{ 
                                marginTop: '0.5rem', 
                                padding: '0.5rem', 
                                background: '#f0fff4', 
                                border: '1px solid #9ae6b4', 
                                borderRadius: '6px',
                                fontSize: '0.8rem'
                              }}>
                                <div style={{ color: '#22543d', fontWeight: '600', marginBottom: '0.25rem' }}>
                                  📝 Delivery Instructions:
                                </div>
                                <div style={{ color: '#2f855a', fontStyle: 'italic' }}>
                                  "{transaction.special_instructions}"
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1a202c', fontSize: '1.1rem', fontWeight: '600' }}>
                              {getGameIcon(transaction.game_type)} {transaction.game_type.charAt(0).toUpperCase() + transaction.game_type.slice(1)} Game
                            </h4>
                            <p style={{ margin: '0 0 0.25rem 0', color: '#4a5568', fontSize: '0.9rem' }}>
                              {transaction.restaurant_name}
                            </p>
                            <p style={{ margin: 0, color: '#718096', fontSize: '0.85rem' }}>
                              {transaction.order_number ? `Order: ${transaction.order_number}` : `Transaction ID: #${transaction.id}`}
                            </p>
                          </>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {transaction.type === 'order' ? (
                          <>
                            <div style={{ 
                              color: '#38a169', 
                              fontWeight: '700', 
                              fontSize: '1.1rem',
                              marginBottom: '0.25rem'
                            }}>
                              ${transaction.total_amount.toFixed(2)}
                            </div>
                            <div style={{ 
                              background: transaction.status === 'pending' ? '#fef5e7' : '#f0fff4',
                              color: transaction.status === 'pending' ? '#d69e2e' : '#38a169',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              textTransform: 'capitalize'
                            }}>
                              {transaction.status}
                            </div>
                          </>
                        ) : (
                          <>
                            {transaction.won_item_price == null ? (
                              <div style={{ 
                                color: '#e74c3c',
                                fontWeight: '700',
                                fontSize: '1.1rem',
                                marginBottom: '0.25rem'
                              }}>
                                Lost
                              </div>
                            ) : (
                              <div style={{ 
                                color: transaction.won_item_price > transaction.bet_amount ? '#27ae60' : '#e74c3c',
                                fontWeight: '700',
                                fontSize: '1.1rem',
                                marginBottom: '0.25rem'
                              }}>
                                {transaction.won_item_price > transaction.bet_amount ? 'Won more!' : 'Paid more'}
                                {transaction.wallet_credit > 0 ? ` +$${transaction.wallet_credit.toFixed(2)}` : ''}
                              </div>
                            )}
                          </>
                        )}
                        <div style={{ 
                          color: '#718096', 
                          fontSize: '0.85rem',
                          marginTop: '0.5rem'
                        }}>
                          {formatDate(transaction.created_at)}
                        </div>
                      </div>
                    </div>

                    {transaction.type === 'gambling' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ color: '#718096', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Bet Amount</div>
                          <div style={{ color: '#e74c3c', fontWeight: '600', fontSize: '1.1rem' }}>
                            -${transaction.bet_amount.toFixed(2)}
                          </div>
                        </div>
                        
                        {transaction.won_item_name && (
                          <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ color: '#718096', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Won Item</div>
                            <div style={{ color: '#27ae60', fontWeight: '600', fontSize: '1.1rem' }}>
                              {transaction.won_item_name}
                            </div>
                            <div style={{ color: '#718096', fontSize: '0.85rem' }}>
                              Value: ${transaction.won_item_price.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Review Section for Orders */}
                    {transaction.type === 'order' && (
                      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f7fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h5 style={{ margin: 0, color: '#2d3748', fontSize: '0.9rem', fontWeight: '600' }}>
                            {reviewedOrders.has(transaction.id) ? '✅ Review Submitted' : '💬 Rate Your Experience'}
                          </h5>
                          {reviewedOrders.has(transaction.id) ? (
                            <div style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '6px',
                              background: '#e6fffa',
                              color: '#234e52',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              border: '1px solid #81e6d9'
                            }}>
                              ⭐ Already Reviewed
                            </div>
                          ) : (
                            <button
                              onClick={() => openReviewModal(transaction, { id: transaction.restaurant_id, name: transaction.restaurant_name })}
                              style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                borderRadius: '6px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
                              }}
                              onMouseOver={(e) => {
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.4)';
                              }}
                              onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 4px rgba(102, 126, 234, 0.3)';
                              }}
                            >
                              ⭐ Write Review
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}


        {/* Wallet Transactions Tab */}
        {activeTab === 'wallet' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {walletTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#4a5568' }}>No wallet transactions yet</h3>
                <p>Wallet credits from gambling games will appear here!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {walletTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    className="wallet-transaction"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    style={{
                      background: '#f7fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>{getTransactionIcon(transaction.transaction_type)}</span>
                          <span style={{ fontWeight: '600', color: '#1a202c' }}>
                            {transaction.description}
                          </span>
                        </div>
                        {transaction.restaurant_name && (
                          <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem' }}>
                            From: {transaction.restaurant_name} ({transaction.game_type} game)
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          color: transaction.transaction_type === 'credit' ? '#27ae60' : '#e74c3c',
                          fontWeight: '600',
                          fontSize: '1.1rem'
                        }}>
                          {transaction.transaction_type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </div>
                        <div style={{ color: '#718096', fontSize: '0.85rem' }}>
                          Balance: ${transaction.balance_after.toFixed(2)}
                        </div>
                        <div style={{ color: '#718096', fontSize: '0.85rem' }}>
                          {formatDate(transaction.created_at)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={closeReviewModal}
        restaurant={selectedRestaurant}
        orderId={selectedOrder?.id}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
};

export default OrderHistory;
