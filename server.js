const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Database connection
const db = new sqlite3.Database('./fooddelivery.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// API Routes

// User Registration
app.post('/api/auth/register', async (req, res) => {
  const { first_name, last_name, email, password, phone, location } = req.body;
  const role = 'customer'; // All users are customers

  // Validate required fields
  if (!first_name || !last_name || !email || !password || !phone || !location) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // All users are customers - no role validation needed

  try {
    // Check if user already exists
    const checkUserSql = 'SELECT id FROM USERS WHERE email = ?';
    db.get(checkUserSql, [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (row) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert new user
      const insertUserSql = `
        INSERT INTO USERS (first_name, last_name, email, password, phone, location, role)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(insertUserSql, [first_name, last_name, email, hashedPassword, phone, location, role], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Generate JWT token
        const token = jwt.sign(
          { 
            id: this.lastID, 
            email: email, 
            role: role,
            first_name: first_name,
            last_name: last_name
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(201).json({
          message: 'User registered successfully',
          token: token,
          user: {
            id: this.lastID,
            first_name: first_name,
            last_name: last_name,
            email: email,
            phone: phone,
            location: location,
            role: role
          }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// User Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const sql = 'SELECT * FROM USERS WHERE email = ? AND is_active = 1';
  
  db.get(sql, [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    try {
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token: token,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error during login' });
    }
  });
});

// Forgot password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Check if user exists
  const sql = 'SELECT id, first_name, last_name, email FROM USERS WHERE email = ? AND is_active = 1';
  
  db.get(sql, [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      // For security, don't reveal if email exists or not
      return res.json({ 
        message: 'If an account with that email exists, we have sent a password reset link.' 
      });
    }

    try {
      // Generate a simple reset token (in production, use crypto.randomBytes)
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Store reset token in database (you might want to create a separate table for this)
      const updateSql = `
        UPDATE USERS 
        SET reset_token = ?, reset_token_expiry = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      db.run(updateSql, [resetToken, resetTokenExpiry.toISOString(), user.id], (err) => {
        if (err) {
          console.error('Error storing reset token:', err.message);
          return res.status(500).json({ error: 'Failed to process password reset request' });
        }

        // For immediate password reset, return the token directly
        console.log(`Password reset token for ${user.email}: ${resetToken}`);
        
        res.json({ 
          message: 'Email verified successfully. You can now reset your password.',
          resetToken: resetToken // Return token for immediate use
        });
      });
    } catch (error) {
      console.error('Error generating reset token:', error);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  });
});

// Reset password endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  // Check if token is valid and not expired
  const sql = `
    SELECT id, email, reset_token_expiry 
    FROM USERS 
    WHERE reset_token = ? AND is_active = 1
  `;
  
  db.get(sql, [token], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check if token is expired
    const now = new Date();
    const tokenExpiry = new Date(user.reset_token_expiry);
    
    if (now > tokenExpiry) {
      return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
    }

    try {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      const updateSql = `
        UPDATE USERS 
        SET password = ?, reset_token = NULL, reset_token_expiry = NULL, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      db.run(updateSql, [hashedPassword, user.id], (err) => {
        if (err) {
          console.error('Error updating password:', err.message);
          return res.status(500).json({ error: 'Failed to reset password' });
        }

        res.json({ 
          message: 'Password has been reset successfully. You can now login with your new password.' 
        });
      });
    } catch (error) {
      console.error('Error hashing password:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });
});

// Get current user profile (protected route)
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  const sql = 'SELECT id, first_name, last_name, email, phone, role, created_at FROM USERS WHERE id = ?';
  
  db.get(sql, [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  });
});

// Get all restaurants
app.get('/api/restaurants', (req, res) => {
  const sql = `
    SELECT id, name, cuisine_type, rating, delivery_fee, delivery_time_estimate, is_open
    FROM RESTAURANTS 
    WHERE is_active = 1 AND is_open = 1
    ORDER BY rating DESC
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get menu items for a restaurant
app.get('/api/restaurants/:id/menu', (req, res) => {
  const restaurantId = req.params.id;
  const sql = `
    SELECT id, name, description, price, category, is_vegetarian
    FROM MENU_ITEMS 
    WHERE restaurant_id = ? AND is_active = 1 AND is_available = 1
    ORDER BY category, price
  `;
  
  db.all(sql, [restaurantId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get restaurant details
app.get('/api/restaurants/:id', (req, res) => {
  const restaurantId = req.params.id;
  const sql = `
    SELECT id, name, cuisine_type, rating, delivery_fee, delivery_time_estimate, is_open
    FROM RESTAURANTS 
    WHERE id = ? AND is_active = 1
  `;
  
  db.get(sql, [restaurantId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }
    res.json(row);
  });
});

// Get restaurant reviews
app.get('/api/restaurants/:id/reviews', (req, res) => {
  const restaurantId = req.params.id;
  const sql = `
    SELECT 
      r.id,
      r.rating,
      r.review_text,
      r.created_at,
      u.first_name,
      u.last_name
    FROM REVIEWS r
    JOIN USERS u ON r.customer_id = u.id
    WHERE r.restaurant_id = ?
    ORDER BY r.created_at DESC
  `;
  
  db.all(sql, [restaurantId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get available drivers for a restaurant
app.get('/api/restaurants/:id/drivers', (req, res) => {
  const restaurantId = req.params.id;
  const sql = `
    SELECT 
      u.id,
      u.first_name,
      u.last_name,
      u.phone,
      u.email
    FROM USERS u
    WHERE u.role = 'driver' AND u.is_active = 1
    ORDER BY RANDOM()
    LIMIT 5
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create a review
app.post('/api/reviews', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { order_id, restaurant_id, rating, review_text } = req.body;

  // Validate input
  if (!order_id || !restaurant_id || !rating || !review_text) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  // Check if user has already reviewed this order
  const checkSql = 'SELECT id FROM REVIEWS WHERE order_id = ? AND customer_id = ?';
  
  db.get(checkSql, [order_id, userId], (err, existingReview) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this order' });
    }

    // Verify the order belongs to the user
    const verifySql = 'SELECT id FROM ORDERS WHERE id = ? AND customer_id = ?';
    
    db.get(verifySql, [order_id, userId], (err, order) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!order) {
        return res.status(404).json({ error: 'Order not found or does not belong to you' });
      }

      // Insert the review
      const insertSql = `
        INSERT INTO REVIEWS (order_id, customer_id, restaurant_id, rating, review_text, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      db.run(insertSql, [order_id, userId, restaurant_id, rating, review_text], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({
          message: 'Review submitted successfully',
          review_id: this.lastID
        });
      });
    });
  });
});

// Create a new user (deprecated - use /api/auth/register instead)
app.post('/api/users', (req, res) => {
  res.status(400).json({ error: 'This endpoint is deprecated. Please use /api/auth/register for user registration.' });
});

// Get user wallet balance (simplified - in real app, this would be a separate table)
app.get('/api/users/:id/wallet', (req, res) => {
  // For demo purposes, we'll simulate a wallet balance
  // In a real app, you'd have a separate WALLET or USER_BALANCE table
  res.json({ balance: 0, message: 'Wallet system placeholder' });
});

// Update user wallet balance
app.put('/api/users/:id/wallet', (req, res) => {
  const { amount } = req.body;
  // In a real app, you'd update the wallet table here
  res.json({ balance: amount, message: 'Wallet updated' });
});

// Update wallet balance (proper implementation)
app.put('/api/wallet/balance', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { balance } = req.body;
  
  const now = new Date();
  if (now.getFullYear() === 2025) {
    now.setFullYear(2024);
  }
  const correctedTimestamp = now.toLocaleString('sv-SE').replace('T', ' ').substring(0, 19);
  
  // Ensure user has a wallet balance record
  const ensureWalletSql = `
    INSERT OR IGNORE INTO WALLET_BALANCES (user_id, balance, created_at, updated_at)
    VALUES (?, 0.00, ?, ?)
  `;
  
  db.run(ensureWalletSql, [userId, correctedTimestamp, correctedTimestamp], (err) => {
    if (err) {
      console.error('Error ensuring wallet exists:', err.message);
      res.status(500).json({ error: 'Failed to ensure wallet exists' });
      return;
    }
    
    // Update wallet balance
    const updateWalletSql = `
      UPDATE WALLET_BALANCES 
      SET balance = ?, updated_at = ? 
      WHERE user_id = ?
    `;
    
    db.run(updateWalletSql, [balance, correctedTimestamp, userId], (err) => {
      if (err) {
        console.error('Error updating wallet balance:', err.message);
        res.status(500).json({ error: 'Failed to update wallet balance' });
        return;
      }
      
      res.json({ balance: balance, message: 'Wallet balance updated' });
    });
  });
});

// Get user's gambling history
// Get unified history (orders + gambling transactions)
app.get('/api/history/unified', authenticateToken, (req, res) => {
  const userId = req.user.id;
  console.log('Fetching unified history for user:', userId);
  
  // Get orders with items
  const ordersSql = `
    SELECT 
      o.*,
      r.name as restaurant_name,
      r.cuisine_type,
      GROUP_CONCAT(mi.name || ' (x' || oi.quantity || ')') as items,
      'order' as type
    FROM ORDERS o
    LEFT JOIN RESTAURANTS r ON o.restaurant_id = r.id
    LEFT JOIN ORDER_ITEMS oi ON o.id = oi.order_id
    LEFT JOIN MENU_ITEMS mi ON oi.menu_item_id = mi.id
    WHERE o.customer_id = ?
    GROUP BY o.id
  `;
  
  // Get gambling transactions with order numbers
  const gamblingSql = `
    SELECT 
      gt.*,
      r.name as restaurant_name,
      mi.name as won_item_name,
      mi.price as won_item_price,
      o.order_number,
      'gambling' as type
    FROM GAMBLING_TRANSACTIONS gt
    LEFT JOIN RESTAURANTS r ON gt.restaurant_id = r.id
    LEFT JOIN MENU_ITEMS mi ON gt.won_item_id = mi.id
    LEFT JOIN ORDERS o ON gt.user_id = o.customer_id 
      AND gt.restaurant_id = o.restaurant_id 
      AND DATE(gt.created_at) = DATE(o.created_at)
      AND ABS(strftime('%s', gt.created_at) - strftime('%s', o.created_at)) < 300
    WHERE gt.user_id = ?
  `;
  
  // Execute both queries
  db.all(ordersSql, [userId], (err, orders) => {
    if (err) {
      console.error('Error fetching orders:', err.message);
      res.status(500).json({ error: 'Failed to fetch orders' });
      return;
    }
    
    console.log('Found orders:', orders.length);
    
    db.all(gamblingSql, [userId], (err, gambling) => {
      if (err) {
        console.error('Error fetching gambling transactions:', err.message);
        res.status(500).json({ error: 'Failed to fetch gambling transactions' });
        return;
      }
      
      console.log('Found gambling transactions:', gambling.length);
      
      // Combine and sort by created_at
      const combined = [...orders, ...gambling].sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      console.log('Combined history items:', combined.length);
      res.json(combined);
    });
  });
});

// Keep individual endpoints for backward compatibility
app.get('/api/history/orders', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT 
      o.*,
      r.name as restaurant_name,
      r.cuisine_type,
      GROUP_CONCAT(mi.name || ' (x' || oi.quantity || ')') as items
    FROM ORDERS o
    LEFT JOIN RESTAURANTS r ON o.restaurant_id = r.id
    LEFT JOIN ORDER_ITEMS oi ON o.id = oi.order_id
    LEFT JOIN MENU_ITEMS mi ON oi.menu_item_id = mi.id
    WHERE o.customer_id = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `;
  
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching order history:', err.message);
      res.status(500).json({ error: 'Failed to fetch order history' });
      return;
    }
    
    res.json(rows);
  });
});

app.get('/api/history/gambling', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT 
      gt.*,
      r.name as restaurant_name,
      mi.name as won_item_name,
      mi.price as won_item_price
    FROM GAMBLING_TRANSACTIONS gt
    LEFT JOIN RESTAURANTS r ON gt.restaurant_id = r.id
    LEFT JOIN MENU_ITEMS mi ON gt.won_item_id = mi.id
    WHERE gt.user_id = ?
    ORDER BY gt.created_at DESC
  `;
  
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get user's gambling attempt count
app.get('/api/gambling/attempts', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT COUNT(*) as total_attempts
    FROM GAMBLING_TRANSACTIONS 
    WHERE user_id = ? AND game_type = 'wheel'
  `;
  
  db.get(sql, [userId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const totalAttempts = row ? row.total_attempts : 0;
    // Calculate current cycle attempt (0-3, then resets)
    const currentCycleAttempt = totalAttempts % 4;
    const isGuaranteed = currentCycleAttempt === 3; // 4th attempt (0-indexed)
    
    res.json({ 
      attempt_count: currentCycleAttempt,
      is_guaranteed: isGuaranteed,
      total_attempts: totalAttempts
    });
  });
});

// Get user's wallet balance
app.get('/api/wallet/balance', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const sql = 'SELECT balance FROM WALLET_BALANCES WHERE user_id = ?';
  
  db.get(sql, [userId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ balance: row ? row.balance : 0.00 });
  });
});

// Get user's wallet transaction history
app.get('/api/wallet/transactions', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT 
      wt.*,
      gt.game_type,
      gt.bet_amount,
      r.name as restaurant_name
    FROM WALLET_TRANSACTIONS wt
    LEFT JOIN GAMBLING_TRANSACTIONS gt ON wt.gambling_transaction_id = gt.id
    LEFT JOIN RESTAURANTS r ON gt.restaurant_id = r.id
    WHERE wt.user_id = ?
    ORDER BY wt.created_at DESC
  `;
  
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create order
app.post('/api/orders', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { 
    restaurant_id, 
    items, 
    total_amount, 
    payment_method,
    discount_amount = 0,
    delivery_address = '123 Default Street, City, State 12345', // Default address for gambling orders
    special_instructions = 'Order from gambling game'
  } = req.body;

  // Generate unique order number with corrected timestamp
  const now = new Date();
  // Fix year if it's 2025 (system clock issue)
  if (now.getFullYear() === 2025) {
    now.setFullYear(2024);
  }
  const orderNumber = `ORD-${now.getTime()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  // Calculate subtotal and delivery fee
  const subtotal = total_amount;
  const deliveryFee = 0; // No delivery fee for gambling orders
  
  // Create corrected timestamp for database (use local time, not UTC)
  const correctedTimestamp = now.toLocaleString('sv-SE').replace('T', ' ').substring(0, 19);
  
  const orderSql = `
    INSERT INTO ORDERS 
    (customer_id, restaurant_id, delivery_address, order_number, status, subtotal, delivery_fee, total_amount, is_credit_card, payment_status, special_instructions, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, 'paid', ?, ?, ?)
  `;

  db.run(orderSql, [
    userId, restaurant_id, delivery_address, orderNumber, 
    subtotal, deliveryFee, total_amount, (payment_method === 'credit_card' || payment_method === 'wallet_discount') ? 1 : 0, special_instructions, correctedTimestamp, correctedTimestamp
  ], function(err) {
    if (err) {
      console.error('Error creating order:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }

    const orderId = this.lastID;

    // Handle different payment methods
    if (payment_method === 'wallet') {
      // Check if this is a gambling order (has special instructions)
      const isGamblingOrder = special_instructions && special_instructions.includes('gambling');
      
      if (isGamblingOrder) {
        // For gambling orders, don't check wallet balance - user paid with bet amount
        console.log('Processing gambling order - skipping wallet balance check');
        createOrderItems();
        return; // createOrderItems will send the response
      }
      
      // Full wallet payment for regular orders
      const checkBalanceSql = 'SELECT balance FROM WALLET_BALANCES WHERE user_id = ?';
      db.get(checkBalanceSql, [userId], (err, row) => {
        if (err) {
          console.error('Error checking wallet balance:', err.message);
          res.status(500).json({ error: 'Failed to check wallet balance' });
          return;
        }

        const currentBalance = row ? row.balance : 0;
        if (currentBalance < total_amount) {
          res.status(400).json({ error: 'Insufficient wallet balance' });
          return;
        }

        // Deduct full amount from wallet
        const updateWalletSql = `
          UPDATE WALLET_BALANCES 
          SET balance = balance - ?, updated_at = ? 
          WHERE user_id = ?
        `;
        
        db.run(updateWalletSql, [total_amount, correctedTimestamp, userId], (err) => {
          if (err) {
            console.error('Error updating wallet balance:', err.message);
            res.status(500).json({ error: 'Failed to update wallet balance' });
            return;
          }

          // Record wallet transaction
          const walletTransactionSql = `
            INSERT INTO WALLET_TRANSACTIONS 
            (user_id, amount, transaction_type, description, balance_after, created_at)
            VALUES (?, ?, 'debit', 'Full payment for order', ?, ?)
          `;
          
          db.run(walletTransactionSql, [userId, total_amount, currentBalance - total_amount, correctedTimestamp], (err) => {
            if (err) {
              console.error('Error recording wallet transaction:', err.message);
            }
          });

          createOrderItems();
        });
      });
    } else if (payment_method === 'wallet_discount') {
      // Wallet discount - deduct discount amount from wallet
      console.log('Processing wallet discount order - deducting discount amount from wallet');
      
      // Check if user has sufficient wallet balance for the discount
      const checkBalanceSql = 'SELECT balance FROM WALLET_BALANCES WHERE user_id = ?';
      db.get(checkBalanceSql, [userId], (err, row) => {
        if (err) {
          console.error('Error checking wallet balance:', err.message);
          res.status(500).json({ error: 'Failed to check wallet balance' });
          return;
        }

        const currentBalance = row ? row.balance : 0;
        if (currentBalance < discount_amount) {
          res.status(400).json({ error: 'Insufficient wallet balance for discount' });
          return;
        }

        // Deduct discount amount from wallet
        const updateWalletSql = `
          UPDATE WALLET_BALANCES 
          SET balance = balance - ?, updated_at = ? 
          WHERE user_id = ?
        `;
        
        db.run(updateWalletSql, [discount_amount, correctedTimestamp, userId], (err) => {
          if (err) {
            console.error('Error updating wallet balance:', err.message);
            res.status(500).json({ error: 'Failed to update wallet balance' });
            return;
          }

          // Record wallet transaction for discount
          const walletTransactionSql = `
            INSERT INTO WALLET_TRANSACTIONS 
            (user_id, amount, transaction_type, description, balance_after, created_at)
            VALUES (?, ?, 'debit', 'Wallet discount for order', ?, ?)
          `;
          
          db.run(walletTransactionSql, [userId, discount_amount, currentBalance - discount_amount, correctedTimestamp], (err) => {
            if (err) {
              console.error('Error recording wallet transaction:', err.message);
            }
          });

          createOrderItems();
        });
      });
    } else {
      // Credit card payment only
      createOrderItems();
    }

    function createOrderItems() {
      // Insert order items
      const itemPromises = items.map(item => {
        return new Promise((resolve, reject) => {
          const itemSql = `
            INSERT INTO ORDER_ITEMS 
            (order_id, menu_item_id, quantity, unit_price, total_price)
            VALUES (?, ?, ?, ?, ?)
          `;
          
          db.run(itemSql, [
            orderId, item.id, item.quantity, item.price, item.price * item.quantity
          ], (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      });

      Promise.all(itemPromises)
        .then(() => {
          res.json({ 
            success: true, 
            order_id: orderId,
            order_number: orderNumber,
            message: 'Order created successfully' 
          });
        })
        .catch((err) => {
          console.error('Error creating order items:', err.message);
          res.status(500).json({ error: 'Failed to create order items' });
        });
    }
  });
});

// Record gambling transaction
app.post('/api/gambling/transaction', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { 
    restaurant_id, 
    game_type, 
    bet_amount, 
    won_item_id, 
    won_item_name, 
    won_item_price, 
    wallet_credit 
  } = req.body;

  // Create corrected timestamp for gambling transaction
  const now = new Date();
  // Fix year if it's 2025 (system clock issue)
  if (now.getFullYear() === 2025) {
    now.setFullYear(2024);
  }
  const correctedTimestamp = now.toLocaleString('sv-SE').replace('T', ' ').substring(0, 19);

  const transactionSql = `
    INSERT INTO GAMBLING_TRANSACTIONS 
    (user_id, restaurant_id, game_type, bet_amount, won_item_id, won_item_name, won_item_price, wallet_credit, transaction_type, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'bet', ?)
  `;

  db.run(transactionSql, [
    userId, restaurant_id, game_type, bet_amount, 
    won_item_id, won_item_name, won_item_price, wallet_credit, correctedTimestamp
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const gamblingTransactionId = this.lastID;

    // Only add wallet credit if there's any (no deduction needed for gambling games)
    if (wallet_credit > 0) {
      // Ensure user has a wallet balance record
      const ensureWalletSql = `
        INSERT OR IGNORE INTO WALLET_BALANCES (user_id, balance, created_at, updated_at)
        VALUES (?, 0.00, ?, ?)
      `;
      
      db.run(ensureWalletSql, [userId, correctedTimestamp, correctedTimestamp], (err) => {
        if (err) {
          console.error('Error ensuring wallet exists:', err.message);
        }
        
        // Add wallet credit
        const addCreditSql = `
          UPDATE WALLET_BALANCES 
          SET balance = balance + ?, updated_at = ? 
          WHERE user_id = ?
        `;
        
        db.run(addCreditSql, [wallet_credit, correctedTimestamp, userId], (err) => {
          if (err) {
            console.error('Error adding wallet credit:', err.message);
          } else {
            // Record wallet transaction for credit
            const getFinalBalanceSql = 'SELECT balance FROM WALLET_BALANCES WHERE user_id = ?';
            db.get(getFinalBalanceSql, [userId], (err, row) => {
              if (!err && row) {
                const creditTransactionSql = `
                  INSERT INTO WALLET_TRANSACTIONS 
                  (user_id, gambling_transaction_id, amount, transaction_type, description, balance_after, created_at)
                  VALUES (?, ?, ?, 'credit', 'Refund from gambling game', ?, ?)
                `;
                
                db.run(creditTransactionSql, [userId, gamblingTransactionId, wallet_credit, row.balance, correctedTimestamp]);
              }
            });
          }
        });
      });
    }

    // Send response immediately after recording the gambling transaction
    res.json({ 
      success: true, 
      gambling_transaction_id: gamblingTransactionId, 
      message: 'Gambling transaction recorded' 
    });
  });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed');
    process.exit(0);
  });
});
