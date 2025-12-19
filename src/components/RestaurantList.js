import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { demoRestaurants } from '../data/demoData';
import { useAuth } from '../contexts/AuthContext';

const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/restaurants');
      setRestaurants(response.data);
      setLoading(false);
    } catch (err) {
      console.log('API not available, using demo data');
      setRestaurants(demoRestaurants);
      setLoading(false);
    }
  };

  const handleRestaurantSelect = (restaurantId) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🍕</div>
          <p>Loading restaurants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem', color: '#e74c3c' }}>
          <p>{error}</p>
          <button className="btn" onClick={fetchRestaurants}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.5rem', color: '#1a202c', fontSize: '1.875rem', fontWeight: '700' }}>
              Choose Your Restaurant
            </h2>
            <p style={{ color: '#718096', fontSize: '1rem' }}>
              Select a restaurant to start your gambling food adventure
            </p>
          </div>
          <Link to="/profile" className="btn btn-secondary">
            👤 Profile
          </Link>
        </div>
      </div>

      <div className="restaurant-grid">
        {restaurants.map((restaurant) => (
          <div key={restaurant.id} className="card restaurant-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h3 style={{ color: '#1a202c', margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>{restaurant.name}</h3>
              <div style={{ 
                background: restaurant.is_open ? '#38a169' : '#e53e3e',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {restaurant.is_open ? 'Open' : 'Closed'}
              </div>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#718096', fontSize: '0.875rem' }}>🍽️</span>
                <span style={{ color: '#4a5568', fontSize: '0.875rem', fontWeight: '500' }}>{restaurant.cuisine_type}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#718096', fontSize: '0.875rem' }}>⭐</span>
                <span style={{ color: '#4a5568', fontSize: '0.875rem', fontWeight: '500' }}>{restaurant.rating}/5.0</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#718096', fontSize: '0.875rem' }}>💰</span>
                <span style={{ color: '#4a5568', fontSize: '0.875rem', fontWeight: '500' }}>${restaurant.delivery_fee} delivery</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#718096', fontSize: '0.875rem' }}>⏱️</span>
                <span style={{ color: '#4a5568', fontSize: '0.875rem', fontWeight: '500' }}>{restaurant.delivery_time_estimate} min</span>
              </div>
            </div>


            <button 
              className="btn" 
              onClick={() => handleRestaurantSelect(restaurant.id)}
              disabled={!restaurant.is_open}
              style={{ 
                width: '100%',
                opacity: restaurant.is_open ? 1 : 0.6,
                cursor: restaurant.is_open ? 'pointer' : 'not-allowed'
              }}
            >
              {restaurant.is_open ? '🎰 View Menu & Play' : 'Currently Closed'}
            </button>
          </div>
        ))}
      </div>

      {restaurants.length === 0 && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
            <p>No restaurants available at the moment.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantList;
