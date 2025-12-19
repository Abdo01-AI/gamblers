import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './ToastProvider';
import { useWallet } from '../contexts/WalletContext';

const OrderReceipt = ({ 
  restaurant, 
  selectedItem, 
  amountPaid, 
  gameType, 
  paymentMethod = 'credit_card', // Default to credit card for gambling orders
  onOrderPlaced,
  onBackToGame 
}) => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [isPlacingOrder, setIsPlacingOrder] = React.useState(false);
  const [deliveryComment, setDeliveryComment] = React.useState('');
  const [driverInfo, setDriverInfo] = React.useState(null);
  const [isLoadingDriver, setIsLoadingDriver] = React.useState(true);
  const { show } = useToast();
  const { refreshBalance } = useWallet();

  // Fetch driver information
  React.useEffect(() => {
    const fetchDriverInfo = async () => {
      try {
        // Get a random available driver for this restaurant
        const response = await axios.get(`http://localhost:3001/api/restaurants/${restaurant.id}/drivers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.length > 0) {
          // Select a random driver from available drivers
          const randomDriver = response.data[Math.floor(Math.random() * response.data.length)];
          setDriverInfo(randomDriver);
        }
      } catch (error) {
        console.error('Error fetching driver info:', error);
        // Set a default driver if API fails
        setDriverInfo({
          id: 3,
          first_name: 'Mike',
          last_name: 'Driver',
          phone: '+1-555-0103'
        });
      } finally {
        setIsLoadingDriver(false);
      }
    };

    fetchDriverInfo();
  }, [restaurant.id, token]);

  // Calculate costs
  const itemPrice = selectedItem.price;
  const deliveryFee = restaurant.delivery_fee || 0; // Use restaurant's delivery fee
  const betAmount = amountPaid; // What the user actually paid/bet
  const totalCost = betAmount + deliveryFee; // Bet amount + delivery fee
  const walletCredit = betAmount > itemPrice ? betAmount - itemPrice : 0;
  const actualCost = totalCost; // Bet amount + delivery fee

  const placeOrder = async () => {
    setIsPlacingOrder(true);
    try {
      console.log('Placing order with data:', {
        restaurant_id: restaurant.id,
        items: [{
          id: selectedItem.id,
          name: selectedItem.name,
          price: selectedItem.price,
          quantity: 1
        }],
        total_amount: itemPrice,
        payment_method: 'wallet',
        discount_amount: 0
      });
      console.log('Using token:', token ? token.substring(0, 20) + '...' : 'No token');

      // Place the order
      const orderResponse = await axios.post('http://localhost:3001/api/orders', {
        restaurant_id: restaurant.id,
        items: [{
          id: selectedItem.id,
          name: selectedItem.name,
          price: selectedItem.price,
          quantity: 1
        }],
        total_amount: totalCost,
        payment_method: paymentMethod,
        discount_amount: 0,
        special_instructions: deliveryComment || 'Order from gambling game'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Order placed successfully:', orderResponse.data);

      // Record gambling transaction
      const gamblingResponse = await axios.post('http://localhost:3001/api/gambling/transaction', {
        restaurant_id: restaurant.id,
        game_type: gameType,
        bet_amount: amountPaid,
        won_item_id: selectedItem.id,
        won_item_name: selectedItem.name,
        won_item_price: betAmount, // Use bet amount (what user actually paid)
        wallet_credit: walletCredit
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

  console.log('Gambling transaction recorded:', gamblingResponse.data);
  show('✅ Order placed successfully!', { type: 'success', duration: 2500 });
  // Wallet balance may change: refresh immediately
  refreshBalance();
  onOrderPlaced();
      
    } catch (error) {
      console.error('Error placing order:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to place order. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || 'Invalid order data.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
  show(errorMessage, { type: 'error', duration: 4000 });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const getGameIcon = () => {
    if (gameType === 'wheel') return '🎡';
    if (gameType === 'matching') return '🧩';
    if (gameType === 'slots') return '🎰';
    return '🎮';
  };

  const getOutcomeText = () => {
    if (itemPrice > amountPaid) {
      return `🎉 You won a $${itemPrice.toFixed(2)} item for only $${amountPaid.toFixed(2)}!`;
    } else if (itemPrice < amountPaid) {
      return `💰 You paid $${amountPaid.toFixed(2)} for a $${itemPrice.toFixed(2)} item.`;
    } else {
      return `🎯 Perfect match! You paid exactly $${amountPaid.toFixed(2)}.`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="receipt-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="receipt-card"
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {getGameIcon()}
          </div>
          <h2 style={{ 
            color: '#1a202c', 
            margin: 0, 
            fontSize: '1.5rem', 
            fontWeight: '700' 
          }}>
            Order Receipt
          </h2>
          <p style={{ color: '#718096', margin: '0.5rem 0 0 0' }}>
            {getOutcomeText()}
          </p>
        </div>

        {/* Restaurant Info */}
        <div style={{
          background: '#f7fafc',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ 
            color: '#2d3748', 
            margin: '0 0 0.5rem 0', 
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            🍽️ {restaurant.name}
          </h3>
          <p style={{ color: '#4a5568', margin: 0, fontSize: '0.9rem' }}>
            {restaurant.cuisine_type} • {restaurant.delivery_time_estimate} min delivery
          </p>
        </div>

        {/* Item Details */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ 
            color: '#2d3748', 
            margin: '0 0 1rem 0', 
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            🎁 Your Prize
          </h3>
          <div style={{
            background: '#f0fff4',
            border: '1px solid #9ae6b4',
            padding: '1rem',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ 
                  color: '#22543d', 
                  margin: '0 0 0.25rem 0', 
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  {selectedItem.name}
                </h4>
                <p style={{ 
                  color: '#2f855a', 
                  margin: 0, 
                  fontSize: '0.85rem' 
                }}>
                  {selectedItem.description}
                </p>
              </div>
              <div style={{ 
                color: '#22543d', 
                fontWeight: '700', 
                fontSize: '1.1rem' 
              }}>
                ${selectedItem.price.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            color: '#2d3748', 
            margin: '0 0 1rem 0', 
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            💰 Cost Breakdown
          </h3>
          <div style={{ background: '#f7fafc', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '0.5rem' 
            }}>
              <span style={{ color: '#4a5568' }}>Amount Bet:</span>
              <span style={{ fontWeight: '600' }}>${betAmount.toFixed(2)}</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '0.5rem' 
            }}>
              <span style={{ color: '#4a5568', fontSize: '0.8rem' }}>Item Value (${itemPrice.toFixed(2)}):</span>
              <span style={{ fontWeight: '600', fontSize: '0.8rem', color: '#718096' }}>You saved ${(itemPrice - betAmount).toFixed(2)}!</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '0.5rem' 
            }}>
              <span style={{ color: '#4a5568' }}>Delivery Fee:</span>
              <span style={{ fontWeight: '600' }}>${deliveryFee.toFixed(2)}</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.75rem 0' }} />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '0.5rem' 
            }}>
              <span style={{ color: '#2d3748', fontWeight: '600' }}>Total Cost:</span>
              <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>${actualCost.toFixed(2)}</span>
            </div>
            {walletCredit > 0 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                background: '#f0fff4',
                padding: '0.5rem',
                borderRadius: '6px',
                marginTop: '0.5rem'
              }}>
                <span style={{ color: '#22543d', fontWeight: '600' }}>💰 To Wallet:</span>
                <span style={{ color: '#22543d', fontWeight: '700' }}>+${walletCredit.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Instructions */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ 
            color: '#2d3748', 
            margin: '0 0 1rem 0', 
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            📝 Delivery Instructions
          </h3>
          <textarea
            value={deliveryComment}
            onChange={(e) => setDeliveryComment(e.target.value)}
            placeholder="Add special delivery instructions (e.g., 'Leave at reception', 'Don't ring the bell', 'Call when arrived')"
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '0.75rem',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
            }}
          />
        </div>

        {/* Driver Information */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            color: '#2d3748', 
            margin: '0 0 1rem 0', 
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            🚗 Your Driver
          </h3>
          {isLoadingDriver ? (
            <div style={{
              background: '#f7fafc',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#718096'
            }}>
              Loading driver information...
            </div>
          ) : driverInfo ? (
            <div style={{
              background: '#f0fff4',
              border: '1px solid #9ae6b4',
              padding: '1rem',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '1.1rem'
                }}>
                  {driverInfo.first_name.charAt(0)}{driverInfo.last_name.charAt(0)}
                </div>
                <div>
                  <h4 style={{ 
                    color: '#22543d', 
                    margin: '0 0 0.25rem 0', 
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}>
                    {driverInfo.first_name} {driverInfo.last_name}
                  </h4>
                  <p style={{ 
                    color: '#2f855a', 
                    margin: 0, 
                    fontSize: '0.85rem' 
                  }}>
                    📞 {driverInfo.phone}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: '#fef5e7',
              border: '1px solid #f6e05e',
              padding: '1rem',
              borderRadius: '8px',
              color: '#744210'
            }}>
              Driver will be assigned when your order is confirmed.
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={onBackToGame}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              background: 'white',
              color: '#4a5568',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = '#cbd5e0';
              e.target.style.background = '#f7fafc';
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.background = 'white';
            }}
          >
            ← Back to Game
          </button>
          <button
            onClick={placeOrder}
            disabled={isPlacingOrder}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: 'none',
              borderRadius: '8px',
              background: isPlacingOrder ? '#a0aec0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: '600',
              cursor: isPlacingOrder ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {isPlacingOrder ? 'Placing Order...' : '✅ Place Order'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OrderReceipt;
