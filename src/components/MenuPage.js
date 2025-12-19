import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { demoRestaurants, demoMenuItems, demoReviews } from '../data/demoData';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';

const MenuPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceInput, setPriceInput] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const { balance: walletBalance, refreshBalance, adjust } = useWallet();
  const [paymentMethod, setPaymentMethod] = useState('wallet'); // 'wallet', 'credit_card', 'wallet_discount'
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    fetchRestaurantData();
    if (token) {
      refreshBalance();
    }
  }, [id, token]);


  const fetchRestaurantData = async () => {
    try {
      const [restaurantRes, menuRes, reviewsRes] = await Promise.all([
        axios.get(`http://localhost:3001/api/restaurants/${id}`),
        axios.get(`http://localhost:3001/api/restaurants/${id}/menu`),
        axios.get(`http://localhost:3001/api/restaurants/${id}/reviews`)
      ]);
      
      setRestaurant(restaurantRes.data);
      setMenuItems(menuRes.data);
      setReviews(reviewsRes.data);
      
      // Calculate min and max prices
      const prices = menuRes.data.map(item => item.price);
      setMinPrice(Math.min(...prices));
      setMaxPrice(Math.max(...prices));
      
      setLoading(false);
    } catch (err) {
      console.log('API not available, using demo data');
      const demoRestaurant = demoRestaurants.find(r => r.id === parseInt(id));
      const demoMenu = demoMenuItems[parseInt(id)] || [];
      const demoReview = demoReviews[parseInt(id)] || [];
      
      if (demoRestaurant && demoMenu.length > 0) {
        setRestaurant(demoRestaurant);
        setMenuItems(demoMenu);
        setReviews(demoReview);
        
        // Calculate min and max prices
        const prices = demoMenu.map(item => item.price);
        setMinPrice(Math.min(...prices));
        setMaxPrice(Math.max(...prices));
        
        setLoading(false);
      } else {
        setError('Restaurant not found');
        setLoading(false);
      }
    }
  };

  // Wallet fetching handled by context

  const handlePriceSubmit = (gameType) => {
    const basePrice = parseFloat(priceInput);
    
    if (isNaN(basePrice) || basePrice < minPrice || basePrice > maxPrice) {
      alert(`Please enter a valid price between $${minPrice} and $${maxPrice}`);
      return;
    }
    
    // Calculate total spending amount
    let totalSpending = basePrice;
    
    // Check payment method specific validations
    if (paymentMethod === 'wallet' && walletBalance < basePrice) {
      alert(`Insufficient wallet balance. You have $${walletBalance.toFixed(2)} but need $${basePrice.toFixed(2)}`);
      return;
    }
    
    
    // Navigate to the selected game with price data
    navigate(`/restaurant/${id}/${gameType}`, { 
      state: { 
        price: totalSpending, // Use total spending amount for the game
        menuItems, 
        restaurant,
        minPrice,
        maxPrice,
        paymentMethod, // Pass payment method
        discountAmount: 0, // Pass discount amount (wallet discount feature removed from UI)
        basePrice: basePrice // Pass original base price for display purposes
      } 
    });
  };

  const groupMenuByCategory = (items) => {
    return items.reduce((groups, item) => {
      const category = item.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {});
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🍽️</div>
          <p>Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem', color: '#e74c3c' }}>
          <p>{error || 'Restaurant not found'}</p>
          <button className="btn" onClick={() => navigate('/')}>
            Back to Restaurants
          </button>
        </div>
      </div>
    );
  }

  const menuByCategory = groupMenuByCategory(menuItems);

  return (
    <div>
      {/* Restaurant Header */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: '#1a202c', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>{restaurant.name}</h2>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            ← Back to Restaurants
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#718096' }}>🍽️</span>
            <span style={{ color: '#4a5568', fontWeight: '500' }}>{restaurant.cuisine_type}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#718096' }}>⭐</span>
            <span style={{ color: '#4a5568', fontWeight: '500' }}>{restaurant.rating}/5.0</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#718096' }}>💰</span>
            <span style={{ color: '#4a5568', fontWeight: '500' }}>${restaurant.delivery_fee}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#718096' }}>⏱️</span>
            <span style={{ color: '#4a5568', fontWeight: '500' }}>{restaurant.delivery_time_estimate} min</span>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="card">
        <h3 style={{ color: '#1a202c', marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.25rem', fontWeight: '600' }}>
          Menu Items
        </h3>
        
        {Object.entries(menuByCategory).map(([category, items]) => (
          <div key={category} style={{ marginBottom: '2rem' }}>
            <h4 style={{ 
              color: '#2d3748', 
              textTransform: 'capitalize', 
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid #e2e8f0',
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              {category}s
            </h4>
            
            <div className="menu-grid">
              {items.map((item) => (
                <div key={item.id} className="menu-item" style={{
                  background: '#f7fafc',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h5 style={{ margin: 0, color: '#1a202c', fontSize: '1rem', fontWeight: '600' }}>{item.name}</h5>
                    <span style={{ 
                      color: '#38a169', 
                      fontWeight: '600',
                      fontSize: '1rem'
                    }}>
                      ${item.price}
                    </span>
                  </div>
                  
                  {item.description && (
                    <p style={{ 
                      color: '#718096', 
                      fontSize: '0.875rem', 
                      marginBottom: '0.75rem',
                      lineHeight: '1.4'
                    }}>
                      {item.description}
                    </p>
                  )}
                  
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {item.is_vegetarian && (
                      <span style={{
                        background: '#f0fff4',
                        color: '#38a169',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        border: '1px solid #c6f6d5'
                      }}>
                        🌱 Vegetarian
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Reviews Section */}
      {reviews && reviews.length > 0 && (
        <div className="card">
          <h3 style={{ color: '#1a202c', marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.25rem', fontWeight: '600' }}>
            💬 Customer Reviews
          </h3>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {reviews.map((review, index) => (
              <div key={index} style={{
                background: '#f7fafc',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: '#2d3748' 
                  }}>
                    {review.first_name} {review.last_name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{ 
                        color: i < review.rating ? '#f6ad55' : '#e2e8f0',
                        fontSize: '0.875rem'
                      }}>
                        ⭐
                      </span>
                    ))}
                  </div>
                </div>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#4a5568', 
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  "{review.review_text}"
                </p>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: '#718096', 
                  marginTop: '0.5rem',
                  textAlign: 'right'
                }}>
                  {(() => {
                    // Parse the date string and ensure it's treated as local time
                    let date;
                    if (review.created_at.includes('T')) {
                      // ISO format - parse as local time
                      date = new Date(review.created_at);
                    } else {
                      // Database format (YYYY-MM-DD HH:mm:ss) - treat as local time
                      date = new Date(review.created_at.replace(' ', 'T'));
                    }
                    
                    // Fix year if it's 2025 (system clock issue)
                    if (date.getFullYear() === 2025) {
                      date.setFullYear(2024);
                    }
                    
                    return date.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour12: true
                    });
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Input and Game Selection */}
      <div className="card">
        <h3 style={{ color: '#1a202c', marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.25rem', fontWeight: '600' }}>
          Enter Your Bet Amount
        </h3>
        
        {/* Wallet Balance Display */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            💰 Your Wallet Balance
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            ${walletBalance.toFixed(2)}
          </div>
        </div>
        
        {/* Payment Method Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: '#2d3748', fontSize: '0.875rem' }}>
            Payment Method
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              cursor: 'pointer',
              padding: '0.75rem',
              borderRadius: '8px',
              border: paymentMethod === 'wallet' ? '2px solid #4299e1' : '2px solid #e2e8f0',
              background: paymentMethod === 'wallet' ? '#ebf8ff' : '#f7fafc',
              transition: 'all 0.2s ease'
            }}>
              <input
                type="radio"
                name="paymentMethod"
                value="wallet"
                checked={paymentMethod === 'wallet'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ margin: 0 }}
              />
              <div>
                <div style={{ fontWeight: '600', color: '#2d3748' }}>💰 Pay with Wallet</div>
                <div style={{ fontSize: '0.75rem', color: '#718096' }}>Use your wallet balance (${walletBalance.toFixed(2)} available)</div>
              </div>
            </label>
            
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              cursor: 'pointer',
              padding: '0.75rem',
              borderRadius: '8px',
              border: paymentMethod === 'credit_card' ? '2px solid #4299e1' : '2px solid #e2e8f0',
              background: paymentMethod === 'credit_card' ? '#ebf8ff' : '#f7fafc',
              transition: 'all 0.2s ease'
            }}>
              <input
                type="radio"
                name="paymentMethod"
                value="credit_card"
                checked={paymentMethod === 'credit_card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ margin: 0 }}
              />
              <div>
                <div style={{ fontWeight: '600', color: '#2d3748' }}>💳 Pay with Credit Card</div>
                <div style={{ fontSize: '0.75rem', color: '#718096' }}>Pay the full amount with your credit card</div>
              </div>
            </label>
            
          </div>
        </div>
        
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2d3748', fontSize: '0.875rem' }}>
            How much do you want to spend?
          </label>
          <input
            type="number"
            className="input"
            placeholder={`Enter amount between $${minPrice} and $${maxPrice}`}
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            min={minPrice}
            max={maxPrice}
            step="0.01"
            style={{ marginBottom: '1rem' }}
          />
          {paymentMethod === 'wallet' && parseFloat(priceInput) > walletBalance && (
            <p style={{ color: '#e53e3e', fontSize: '0.875rem', textAlign: 'center', background: '#fed7d7', padding: '0.75rem', borderRadius: '6px', border: '1px solid #feb2b2', marginBottom: '1rem' }}>
              ⚠️ Insufficient wallet balance! You need ${(parseFloat(priceInput) - walletBalance).toFixed(2)} more.
            </p>
          )}
          <p style={{ color: '#718096', fontSize: '0.875rem', textAlign: 'center', background: '#f7fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            💡 Tip: Paying closer to a specific meal price gives you a higher chance of getting that meal!
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <button 
            className="btn" 
            onClick={() => handlePriceSubmit('wheel')}
            style={{ padding: '1rem', fontSize: '1rem' }}
          >
            🎡 Spin the Wheel
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={() => handlePriceSubmit('matching')}
            style={{ padding: '1rem', fontSize: '1rem' }}
          >
            🧩 Memory Matching
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={() => handlePriceSubmit('slots')}
            style={{ padding: '1rem', fontSize: '1rem' }}
          >
            🎰 777 Slots
          </button>
        </div>

        <div style={{ 
          background: '#fef5e7', 
          border: '1px solid #f6e05e', 
          borderRadius: '8px', 
          padding: '1rem', 
          marginTop: '1.5rem',
          color: '#744210'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600' }}>🎯 How it works:</h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', lineHeight: '1.5' }}>
            <li>You get 3 chances to win a meal</li>
            <li>4th attempt is guaranteed to get the meal closest to your price</li>
            <li>Paying closer to a meal price increases your chances</li>
            <li>If you get a cheaper meal, the difference goes to your wallet!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
