import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const ReviewModal = ({ 
  isOpen, 
  onClose, 
  restaurant, 
  orderId, 
  onReviewSubmitted 
}) => {
  const { token } = useAuth();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('http://localhost:3001/api/reviews', {
        order_id: orderId,
        restaurant_id: restaurant.id,
        rating: rating,
        review_text: reviewText.trim() || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onReviewSubmitted();
      onClose();
      setRating(0);
      setReviewText('');
    } catch (error) {
      console.error('Error submitting review:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.error || 'Invalid request';
        if (errorMessage.includes('already reviewed')) {
          alert('You have already reviewed this order. Each order can only be reviewed once.');
        } else if (errorMessage.includes('All fields are required')) {
          alert('Please fill in all required fields.');
        } else if (errorMessage.includes('Rating must be between 1 and 5')) {
          alert('Please select a rating between 1 and 5 stars.');
        } else {
          alert(`Error: ${errorMessage}`);
        }
      } else if (error.response?.status === 404) {
        alert('Order not found. Please refresh the page and try again.');
      } else if (error.response?.status === 401) {
        alert('You need to be logged in to submit a review. Please log in and try again.');
      } else {
        alert('Failed to submit review. Please check your connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setReviewText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
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
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
          <h2 style={{ 
            color: '#1a202c', 
            margin: 0, 
            fontSize: '1.5rem', 
            fontWeight: '700' 
          }}>
            Rate Your Experience
          </h2>
          <p style={{ color: '#718096', margin: '0.5rem 0 0 0' }}>
            How was your order from {restaurant?.name}?
          </p>
        </div>

        {/* Rating Section */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ 
            display: 'block', 
            color: '#2d3748', 
            fontWeight: '600', 
            marginBottom: '1rem',
            fontSize: '1.1rem'
          }}>
            Rating *
          </label>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '2.5rem',
                  cursor: 'pointer',
                  color: star <= (hoveredRating || rating) ? '#fbbf24' : '#d1d5db',
                  transition: 'color 0.2s ease',
                  padding: '0.25rem'
                }}
              >
                ⭐
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', color: '#718096', fontSize: '0.9rem' }}>
            {rating === 0 && 'Click a star to rate'}
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </div>
        </div>

        {/* Review Text */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ 
            display: 'block', 
            color: '#2d3748', 
            fontWeight: '600', 
            marginBottom: '0.5rem',
            fontSize: '1.1rem'
          }}>
            Review (Optional)
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Tell others about your experience..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '0.75rem',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
          <div style={{ 
            color: '#718096', 
            fontSize: '0.85rem', 
            marginTop: '0.25rem',
            textAlign: 'right'
          }}>
            {reviewText.length}/500 characters
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="button"
            onClick={handleClose}
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
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: 'none',
              borderRadius: '8px',
              background: isSubmitting || rating === 0 ? '#a0aec0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: '600',
              cursor: isSubmitting || rating === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReviewModal;
