import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import OrderReceipt from './OrderReceipt';

const WheelGame = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const { price, menuItems, restaurant, minPrice, maxPrice, paymentMethod: initialPaymentMethod, discountAmount: initialDiscountAmount } = location.state || {};
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isGuaranteed, setIsGuaranteed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod || 'wallet');
  const [discountAmount, setDiscountAmount] = useState(initialDiscountAmount || 0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (!price || !menuItems) {
      navigate(`/restaurant/${id}`);
    }
  }, [price, menuItems, id, navigate]);

  useEffect(() => {
    const fetchAttemptCount = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/gambling/attempts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAttemptCount(response.data.attempt_count);
        setIsGuaranteed(response.data.is_guaranteed);
      } catch (error) {
        console.error('Error fetching attempt count:', error);
      }
    };

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
      fetchAttemptCount();
      fetchWalletBalance();
    }
  }, [token]);
  const recordGamblingTransaction = async (selectedItem) => {
    try {
      const calculateWalletCredit = (itemPrice, paidPrice) => 
        itemPrice < paidPrice ? paidPrice - itemPrice : 0;

      const walletCredit = calculateWalletCredit(selectedItem.price, price);
      
      await axios.post('http://localhost:3001/api/gambling/transaction', {
        restaurant_id: parseInt(id),
        game_type: 'wheel',
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
    // Refresh attempt count from server
    const response = await axios.get('http://localhost:3001/api/gambling/attempts', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Use server's cycle calculation
    setAttemptCount(response.data.attempt_count);
    setIsGuaranteed(response.data.is_guaranteed);

    // Navigate to order history
    navigate('/history');
  };
  const handleBackToGame = () => {
    setShowReceipt(false);
  };

  const getFoodEmoji = (item) => {
    const name = item.name.toLowerCase();
    const description = item.description.toLowerCase();
    const category = item.category ? item.category.toLowerCase() : '';
    const isVegetarian = item.is_vegetarian;
    
    // Check for vegetarian/vegan first
    if (isVegetarian && (name.includes('vegan') || name.includes('vegetarian'))) {
      return '🌱';
    }
    
    // Pizza
    if (name.includes('pizza')) return '🍕';
    
    // Burger/Sandwich
    if (name.includes('burger') || name.includes('sandwich')) return '🍔';
    
    // Taco/Burrito
    if (name.includes('taco') || name.includes('burrito')) return '🌮';
    
    // Salad
    if (name.includes('salad')) return '🥗';
    
    // Coffee/Tea/Drinks
    if (name.includes('coffee') || name.includes('tea') || 
        name.includes('drink') || name.includes('juice') || 
        name.includes('horchata') || category === 'drink') {
      return Math.random() > 0.5 ? '☕' : '🥤';
    }
    
    // Desserts
    if (name.includes('cake') || name.includes('dessert') || 
        name.includes('churros') || name.includes('tiramisu') || 
        name.includes('baklava') || name.includes('croissant') || 
        category === 'dessert') {
      const dessertEmojis = ['🍰', '🍩', '🍪'];
      return dessertEmojis[Math.floor(Math.random() * dessertEmojis.length)];
    }
    
    // Bread/Garlic bread/Croissant
    if (name.includes('bread') || name.includes('toast') || 
        name.includes('garlic bread') || name.includes('croissant')) {
      return Math.random() > 0.5 ? '🥖' : '🥐';
    }
    
    // Vegetarian/Vegan (fallback)
    if (isVegetarian) return '🌱';
    
    // Other food types
    if (name.includes('pasta') || name.includes('spaghetti')) return '🍝';
    if (name.includes('soup')) return '🍲';
    if (name.includes('chicken')) return '🍗';
    if (name.includes('beef') || name.includes('steak')) return '🥩';
    if (name.includes('fish') || name.includes('salmon')) return '🐟';
    if (name.includes('rice')) return '🍚';
    if (name.includes('mexican')) return '🌶️';
    if (name.includes('italian')) return '🍝';
    if (name.includes('chinese') || name.includes('asian')) return '🥢';
    if (name.includes('indian')) return '🍛';
    if (name.includes('japanese') || name.includes('sushi')) return '🍣';
    
    return '🍽️'; // Default food emoji
  };

  const calculateProbabilities = () => {
    // For now, just return the menu items in their original order
    // This ensures the wheel segments match the result calculation
    return menuItems.map(item => ({
      ...item,
      probability: 1 // Equal probability for all items
    }));
  };

const FULL_ROTATIONS = 1440; // 4 full rotations in degrees
const SPIN_DURATION = 3000; // milliseconds

const spinWheel = () => {
  if (isSpinning || hasSpun) return;

  const weightedItems = calculateProbabilities();

  setIsSpinning(true);
  setShowResult(false);
  setHasSpun(true);

  let selectedItem;
  let targetRotation;

  // On 4th attempt (attemptCount === 3), guarantee the closest item
  if (isGuaranteed) {
    selectedItem = weightedItems.reduce((closest, item) => 
      Math.abs(item.price - price) < Math.abs(closest.price - price) ? item : closest
    );

    // Calculate the exact rotation needed to land on the guaranteed item
    const selectedIndex = weightedItems.findIndex(item => item.id === selectedItem.id);
    const segmentSize = 360 / weightedItems.length;
    const targetAngle = selectedIndex * segmentSize + segmentSize / 2; // Center of the segment

    // Calculate rotation to land on this segment (accounting for pointer position)
    targetRotation = FULL_ROTATIONS + (360 - targetAngle); // 4 full rotations + adjustment
  } else {
    // Calculate random rotation (multiple full rotations + random angle)
    targetRotation = Math.random() * 360 + FULL_ROTATIONS; // 4 full rotations + random

    // Calculate which segment the wheel landed on based on rotation
    const normalizedRotation = targetRotation % 360;
    const segmentSize = 360 / weightedItems.length;
    const adjustedRotation = (360 - normalizedRotation) % 360;
    const selectedIndex = Math.round(adjustedRotation / segmentSize) % weightedItems.length;

    selectedItem = weightedItems[selectedIndex];

    // Debug logging
    console.log('Wheel Debug:', {
      targetRotation,
      normalizedRotation,
      adjustedRotation,
      segmentSize,
      selectedIndex,
      selectedItem: selectedItem.name,
      selectedPrice: selectedItem.price
    });
  }

  setRotation(prev => prev + targetRotation);

  // Simulate spinning delay
  setTimeout(() => {
    setResult(selectedItem);
    setIsSpinning(false);
    setShowResult(true);

    // Update attempt count immediately after spin
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    // Check if next attempt will be guaranteed (4th in cycle)
    if (newAttemptCount >= 3) {
      setIsGuaranteed(true);
    }
  }, SPIN_DURATION);
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

  const weightedItems = calculateProbabilities();

  return (
    <div className="game-container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: '#2c3e50', margin: 0 }}>🎡 Wheel of Fortune</h2>
          <button className="btn btn-secondary" onClick={goBack}>
            ← Back to Menu
          </button>
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p><strong>Restaurant:</strong> {restaurant?.name}</p>
          <p><strong>You paid:</strong> ${price}</p>
          <p><strong>Attempts so far:</strong> {attemptCount}/4</p>
          {isGuaranteed && (
            <p style={{ color: '#e74c3c', fontWeight: 'bold' }}>
              🎯 This is your guaranteed attempt! You'll get the meal closest to ${price}
            </p>
          )}
          {hasSpun && (
            <p style={{ color: '#e74c3c', fontWeight: 'bold' }}>
              🎯 You've already spun! Check your result below.
            </p>
          )}
        </div>
      </div>

      {/* Wheel */}
      <div className="card">
        <div className="wheel-container">
          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: 3, ease: "easeOut" }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: `conic-gradient(${weightedItems.map((item, index) => 
                `${getColor(index)} 0deg ${360 / weightedItems.length * (index + 1)}deg`
              ).join(', ')})`,
              border: '8px solid #2c3e50',
              position: 'relative',
              boxShadow: '0 0 20px rgba(0,0,0,0.3)'
            }}
          >
            {/* Wheel segments with emojis only */}
            {weightedItems.map((item, index) => {
              const angle = (360 / weightedItems.length) * index;
              const segmentAngle = 360 / weightedItems.length;
              const textAngle = angle + segmentAngle / 2;
              
              return (
                <div
                  key={item.id}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${textAngle}deg) translateY(-50%)`,
                    transformOrigin: '0 0',
                    width: '50%',
                    height: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '15px'
                  }}
                >
                  <div style={{ 
                    fontSize: '2.5rem',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.3))'
                  }}>
                    {getFoodEmoji(item)}
                  </div>
                </div>
              );
            })}
          </motion.div>
          
          {/* Wheel pointer */}
          <div style={{
            position: 'absolute',
            top: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '15px solid transparent',
            borderRight: '15px solid transparent',
            borderTop: '30px solid #e74c3c',
            zIndex: 10
          }} />
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button 
            className="btn" 
            onClick={spinWheel}
            disabled={isSpinning || hasSpun}
            style={{
              fontSize: '1.2rem',
              padding: '1rem 2rem',
              opacity: (isSpinning || hasSpun) ? 0.6 : 1,
              cursor: (isSpinning || hasSpun) ? 'not-allowed' : 'pointer'
            }}
          >
            {isSpinning ? '🎡 Spinning...' : 
             hasSpun ? '🎯 Already Spun!' : 
             '🎡 Spin the Wheel!'}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {showResult && result && (
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
            <h4 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>{result.name}</h4>
            <p style={{ color: '#7f8c8d', marginBottom: '0.5rem' }}>{result.description}</p>
            <p style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: result.price < price ? '#27ae60' : '#e74c3c',
              marginBottom: '0.5rem'
            }}>
              ${result.price}
            </p>
            
            {result.price < price && (
              <p style={{ color: '#27ae60', fontWeight: 'bold' }}>
                💰 ${(price - result.price).toFixed(2)} will be added to your wallet!
              </p>
            )}
            
            {result.price > price && (
              <p style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                🎁 You got a meal worth ${(result.price - price).toFixed(2)} more than you paid!
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
                <div>💰 Full Wallet Payment (${result.price.toFixed(2)})</div>
              )}
              {paymentMethod === 'credit_card' && (
                <div>💳 Credit Card Payment (${result.price.toFixed(2)})</div>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button 
              className="btn btn-success" 
              onClick={() => showReceiptModal(result)}
              style={{
                fontSize: '1.1rem',
                padding: '1rem 2rem'
              }}
            >
              📄 View Receipt & Place Order
            </button>
          </div>
        </motion.div>
      )}

      {/* Game Rules */}
      <div className="card">
        <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>🎯 Game Rules</h3>
        <ul style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
          <li>You get ONE spin per session - no retries!</li>
          <li>First 3 attempts: Completely random outcome</li>
          <li>4th attempt: Guaranteed to get the meal closest to what you paid</li>
          <li>Whatever you get, you must accept and place the order</li>
          <li>If you get a cheaper meal, the difference goes to your wallet</li>
          <li>Your order will be added to your order history</li>
          <li>Attempts are tracked across all your gaming sessions</li>
        </ul>
      </div>

      {/* Order Receipt Modal */}
      {showReceipt && result && (
        <OrderReceipt
          restaurant={restaurant}
          selectedItem={result}
          amountPaid={price}
          gameType="wheel"
          paymentMethod={paymentMethod}
          onOrderPlaced={handleOrderPlaced}
          onBackToGame={handleBackToGame}
        />
      )}
    </div>
  );
};

// Helper function to generate colors for wheel segments
const getColor = (index) => {
  const colors = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#f1c40f'
  ];
  return colors[index % colors.length];
};

export default WheelGame;