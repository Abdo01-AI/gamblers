import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import OrderReceipt from './OrderReceipt';

const MatchingGame = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const { price, menuItems, restaurant, minPrice, maxPrice, paymentMethod: initialPaymentMethod, discountAmount: initialDiscountAmount } = location.state || {};
  
  const [gameState, setGameState] = useState('preview'); // 'preview', 'playing', 'result'
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [showChoice, setShowChoice] = useState(false);
  const [previewTime, setPreviewTime] = useState(2);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod || 'wallet');
  const [discountAmount, setDiscountAmount] = useState(initialDiscountAmount || 0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (!price || !menuItems) {
      navigate(`/restaurant/${id}`);
    } else {
      initializeGame();
    }
  }, [price, menuItems, id, navigate]);

  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/wallet/balance', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWalletBalance(response.data.balance);
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
      }
    };

    if (token) {
      fetchWalletBalance();
    }
  }, [token]);

  useEffect(() => {
    if (gameState === 'preview' && previewTime > 0) {
      const timer = setTimeout(() => setPreviewTime(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'preview' && previewTime === 0) {
      setGameState('playing');
    }
  }, [gameState, previewTime]);

  const recordGamblingTransaction = async (selectedItem) => {
    try {
      const walletCredit = selectedItem.price < price ? price - selectedItem.price : 0;
      
      await axios.post('http://localhost:3001/api/gambling/transaction', {
        restaurant_id: parseInt(id),
        game_type: 'matching',
        bet_amount: price,
        won_item_id: selectedItem.id,
        won_item_name: selectedItem.name,
        won_item_price: selectedItem.price,
        wallet_credit: walletCredit
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error recording gambling transaction:', error);
    }
  };

  const showReceiptModal = (selectedItem) => {
    setShowReceipt(true);
  };

  const handleOrderPlaced = async () => {
    setOrderPlaced(true);
    setShowChoice(false);
    setShowReceipt(false);
  };

  const handleBackToGame = () => {
    setShowReceipt(false);
  };

  const selectMatch = (item) => {
    setSelectedItem(item);
    setShowChoice(false);
    showReceiptModal(item);
  };

  const initializeGame = () => {
    // Select 4 random menu items for the matching game
    const shuffledItems = [...menuItems].sort(() => Math.random() - 0.5);
    const selectedItems = shuffledItems.slice(0, 4);
    
    // Create pairs of cards (each item appears twice)
    const cardPairs = [...selectedItems, ...selectedItems];
    const shuffledCards = cardPairs.sort(() => Math.random() - 0.5);
    
    setCards(shuffledCards.map((item, index) => ({
      id: index,
      item: item,
      isFlipped: false,
      isMatched: false
    })));
    
    setGameState('preview');
    setPreviewTime(2);
    setFlippedCards([]);
    setMatchedCards([]);
  };

  const handleCardClick = (cardId) => {
    if (gameState !== 'playing' || flippedCards.length >= 2) return;
    
    const card = cards.find(c => c.id === cardId);
    if (card.isFlipped || card.isMatched) return;
    
    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);
    
    // Update card state
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));
    
    // Check for match when 2 cards are flipped
    if (newFlippedCards.length === 2) {
      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);
      
      if (firstCard.item.id === secondCard.item.id) {
        // Match found! End the game immediately
        setTimeout(() => {
          setMatchedCards(prev => [...prev, firstId, secondId]);
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
          ));
          setFlippedCards([]);
          
          // Set the matched item and go to result
          setSelectedItem(firstCard.item);
          setGameState('result');
        }, 1000);
      } else {
        // No match, flip cards back
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
        }, 1500);
      }
    }
  };


  const goBack = () => {
    navigate(`/restaurant/${id}`);
  };

  if (!price || !menuItems) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading game data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: '#2c3e50', margin: 0 }}>🧩 Memory Matching</h2>
          <button className="btn btn-secondary" onClick={goBack}>
            ← Back to Menu
          </button>
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p><strong>Restaurant:</strong> {restaurant?.name}</p>
          <p><strong>You paid:</strong> ${price}</p>
        </div>
      </div>

      {/* Game Board */}
      <div className="card">
        {gameState === 'preview' && (
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h3 style={{ color: '#e74c3c' }}>👀 Memorize the positions!</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c3e50' }}>
              {previewTime}
            </p>
          </div>
        )}
        
        {gameState === 'playing' && (
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h3 style={{ color: '#27ae60' }}>🎯 Find the matching pairs!</h3>
            <p>Click on cards to flip them and find matching meals</p>
          </div>
        )}

        <div className="matching-grid">
          {cards.map((card) => (
            <motion.div
              key={card.id}
              className={`matching-card ${card.isFlipped ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
              onClick={() => handleCardClick(card.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                cursor: gameState === 'playing' ? 'pointer' : 'default',
                background: card.isMatched ? '#d4edda' : 
                           card.isFlipped ? '#fff' : '#f8f9fa',
                borderColor: card.isMatched ? '#28a745' : 
                            card.isFlipped ? '#667eea' : '#e9ecef'
              }}
            >
              {card.isFlipped || gameState === 'preview' ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {getFoodEmoji(card.item.category)}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#2c3e50' }}>
                    {card.item.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#27ae60', fontWeight: 'bold' }}>
                    ${card.item.price}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '2rem', color: '#6c757d' }}>
                  🎴
                </div>
              )}
            </motion.div>
          ))}
        </div>

      </div>

      {/* Choice Selection */}
      {showChoice && currentMatches.length > 0 && (
        <motion.div 
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '1rem' }}>
            🎉 Great job! Choose your meal:
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {currentMatches.map((item, index) => (
              <motion.div
                key={item.id}
                className="card"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectMatch(item)}
                style={{
                  cursor: 'pointer',
                  background: '#f8f9fa',
                  border: '2px solid #e9ecef',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  {getFoodEmoji(item.category)}
                </div>
                <h4 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>{item.name}</h4>
                <p style={{ color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  {item.description}
                </p>
                <p style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 'bold', 
                  color: item.price < price ? '#27ae60' : '#e74c3c',
                  marginBottom: '0.5rem'
                }}>
                  ${item.price}
                </p>
                
                {item.price < price && (
                  <p style={{ color: '#27ae60', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    💰 +${(price - item.price).toFixed(2)} to wallet
                  </p>
                )}
                
                {item.price > price && (
                  <p style={{ color: '#e74c3c', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    🎁 ${(item.price - price).toFixed(2)} bonus value
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Order Confirmation */}
      {selectedItem && !orderPlaced && (
        <motion.div 
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '1rem' }}>
            🎉 You won:
          </h3>
          
          <div style={{
            background: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '10px',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            <h4 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>{selectedItem.name}</h4>
            <p style={{ color: '#7f8c8d', marginBottom: '0.5rem' }}>{selectedItem.description}</p>
            <p style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: selectedItem.price < price ? '#27ae60' : '#e74c3c',
              marginBottom: '0.5rem'
            }}>
              ${selectedItem.price}
            </p>
            
            {selectedItem.price < price && (
              <p style={{ color: '#27ae60', fontWeight: 'bold' }}>
                💰 ${(price - selectedItem.price).toFixed(2)} will be added to your wallet!
              </p>
            )}
            
            {selectedItem.price > price && (
              <p style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                🎁 You got a meal worth ${(selectedItem.price - price).toFixed(2)} more than you paid!
              </p>
            )}
            
            
            {/* Payment Method Display */}
            <div style={{ 
              background: '#e6fffa', 
              color: '#234e52', 
              padding: '0.75rem', 
              borderRadius: '8px', 
              fontSize: '0.875rem',
              border: '1px solid #81e6d9',
              marginTop: '1rem'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Payment Method:</div>
              {paymentMethod === 'wallet' && (
                <div>💰 Full Wallet Payment (${selectedItem.price.toFixed(2)})</div>
              )}
              {paymentMethod === 'credit_card' && (
                <div>💳 Credit Card Payment (${selectedItem.price.toFixed(2)})</div>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button 
              className="btn btn-success" 
              onClick={() => showReceiptModal(selectedItem)}
              disabled={isPlacingOrder}
              style={{ 
                fontSize: '1.1rem', 
                padding: '0.75rem 2rem'
              }}
            >
              📄 View Receipt & Place Order
            </button>
          </div>
        </motion.div>
      )}

      {/* Order Success */}
      {orderPlaced && selectedItem && (
        <motion.div 
          className="card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ 
            background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
            border: '2px solid #28a745',
            textAlign: 'center'
          }}
        >
          <h3 style={{ color: '#155724', marginBottom: '1rem' }}>
            🎉 Order Placed Successfully!
          </h3>
          
          <div style={{ 
            background: '#fff', 
            padding: '1.5rem', 
            borderRadius: '10px', 
            marginBottom: '1rem',
            border: '1px solid #28a745'
          }}>
            <h4 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>{selectedItem.name}</h4>
            <p style={{ color: '#7f8c8d', marginBottom: '0.5rem' }}>{selectedItem.description}</p>
            <p style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#28a745',
              marginBottom: '0.5rem'
            }}>
              ${selectedItem.price}
            </p>
            
            <div style={{ 
              background: '#e6fffa', 
              color: '#234e52', 
              padding: '0.75rem', 
              borderRadius: '8px', 
              fontSize: '0.875rem',
              border: '1px solid #81e6d9'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Payment Method:</div>
              {paymentMethod === 'wallet' && (
                <div>💰 Full Wallet Payment (${selectedItem.price.toFixed(2)})</div>
              )}
              {paymentMethod === 'credit_card' && (
                <div>💳 Credit Card Payment (${selectedItem.price.toFixed(2)})</div>
              )}
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate(`/restaurant/${id}`)}
              style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}
            >
              🏠 Back to Menu
            </button>
          </div>
        </motion.div>
      )}


      {/* Game Rules */}
      <div className="card">
        <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>🎯 Game Rules</h3>
        <ul style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
          <li>You have 2 seconds to memorize card positions</li>
          <li>Find one matching pair of the same meal</li>
          <li>Once you find a match, the game ends</li>
          <li>You win the meal you matched</li>
          <li>If you get a cheaper meal, the difference goes to your wallet</li>
        </ul>
      </div>

      {/* Order Receipt Modal */}
      {showReceipt && selectedItem && (
        <OrderReceipt
          restaurant={restaurant}
          selectedItem={selectedItem}
          amountPaid={price}
          gameType="matching"
          paymentMethod={paymentMethod}
          onOrderPlaced={handleOrderPlaced}
          onBackToGame={handleBackToGame}
        />
      )}
    </div>
  );
};

// Helper function to get food emojis based on category
const getFoodEmoji = (category) => {
  const emojis = {
    'appetizer': '🥗',
    'main': '🍽️',
    'dessert': '🍰',
    'drink': '🥤'
  };
  return emojis[category] || '🍽️';
};

export default MatchingGame;
