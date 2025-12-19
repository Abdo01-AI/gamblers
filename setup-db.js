const fs = require('fs');
const { exec } = require('child_process');

console.log('🍕 Setting up Food Delivery Database...');

// Check if SQLite3 is available
exec('sqlite3 --version', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ SQLite3 not found. Please install SQLite3 first.');
    console.log('📥 Download from: https://sqlite.org/download.html');
    console.log('💡 Or use package manager:');
    console.log('   - Windows: choco install sqlite');
    console.log('   - macOS: brew install sqlite3');
    console.log('   - Linux: sudo apt-get install sqlite3');
    return;
  }

  console.log('✅ SQLite3 found:', stdout.trim());

  // Remove existing database if it exists
  if (fs.existsSync('fooddelivery.db')) {
    console.log('🗑️  Removing existing database...');
    fs.unlinkSync('fooddelivery.db');
  }

  // Create database and run schema
  console.log('📊 Creating database schema...');
  exec('sqlite3 fooddelivery.db < DATABASE.sql', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error creating database:', error.message);
      return;
    }

    console.log('✅ Database schema created successfully!');
    
    // Insert sample data
    console.log('🌱 Inserting sample data...');
    const sampleData = `
-- Insert Users
INSERT INTO USERS (first_name, last_name, email, password, phone, role) VALUES
('John', 'Customer', 'john.customer@email.com', 'hashed_password_123', '+1-555-0101', 'customer'),
('Maria', 'Chef', 'maria.chef@email.com', 'hashed_password_456', '+1-555-0102', 'restaurant_owner'),
('Mike', 'Driver', 'mike.driver@email.com', 'hashed_password_789', '+1-555-0103', 'driver'),
('Sarah', 'Foodie', 'sarah.foodie@email.com', 'hashed_password_321', '+1-555-0104', 'customer'),
('Tony', 'Pizzaiolo', 'tony.pizza@email.com', 'hashed_password_654', '+1-555-0105', 'restaurant_owner'),
('Lisa', 'Delivery', 'lisa.delivery@email.com', 'hashed_password_987', '+1-555-0106', 'driver'),
('David', 'Hungry', 'david.hungry@email.com', 'hashed_password_147', '+1-555-0107', 'customer'),
('Anna', 'Baker', 'anna.baker@email.com', 'hashed_password_258', '+1-555-0108', 'restaurant_owner');

-- Insert Restaurants
INSERT INTO RESTAURANTS (owner_id, name, cuisine_type, phone, address, city, rating, delivery_fee, delivery_time_estimate, is_open) VALUES
(2, 'Maria''s Authentic Mexican', 'Mexican', '+1-555-1001', '123 Taco Street', 'Los Angeles', 4.5, 2.99, 25, 1),
(5, 'Tony''s Pizza Palace', 'Italian', '+1-555-1002', '456 Pizza Ave', 'New York', 4.2, 3.49, 30, 1),
(8, 'Anna''s Artisan Bakery', 'Bakery', '+1-555-1003', '789 Bread Lane', 'San Francisco', 4.8, 1.99, 20, 1),
(2, 'Spice Garden Indian', 'Indian', '+1-555-1004', '321 Curry Road', 'Chicago', 4.3, 2.49, 35, 0),
(5, 'Mediterranean Delights', 'Mediterranean', '+1-555-1005', '654 Olive Street', 'Miami', 4.6, 3.99, 28, 1);

-- Insert Menu Items
INSERT INTO MENU_ITEMS (restaurant_id, name, description, price, category, is_vegetarian, is_available) VALUES
-- Maria's Authentic Mexican
(1, 'Chicken Tacos', 'Grilled chicken with fresh salsa and cilantro', 12.99, 'main', 0, 1),
(1, 'Beef Burrito', 'Seasoned beef with rice, beans, and cheese', 14.99, 'main', 0, 1),
(1, 'Vegetarian Quesadilla', 'Cheese and veggie quesadilla with guacamole', 11.99, 'main', 1, 1),
(1, 'Churros', 'Crispy cinnamon sugar churros with chocolate sauce', 6.99, 'dessert', 1, 1),
(1, 'Horchata', 'Traditional rice and cinnamon drink', 3.99, 'drink', 1, 1),

-- Tony's Pizza Palace
(2, 'Margherita Pizza', 'Fresh mozzarella, tomato sauce, and basil', 16.99, 'main', 1, 1),
(2, 'Pepperoni Pizza', 'Classic pepperoni with mozzarella cheese', 18.99, 'main', 0, 1),
(2, 'Caesar Salad', 'Romaine lettuce with parmesan and croutons', 9.99, 'appetizer', 1, 1),
(2, 'Garlic Bread', 'Fresh baked bread with garlic butter', 5.99, 'appetizer', 1, 1),
(2, 'Tiramisu', 'Classic Italian dessert', 7.99, 'dessert', 1, 1),

-- Anna's Artisan Bakery
(3, 'Croissant Sandwich', 'Ham and cheese croissant with fresh herbs', 8.99, 'main', 0, 1),
(3, 'Avocado Toast', 'Sourdough with avocado, tomato, and microgreens', 9.99, 'main', 1, 1),
(3, 'Chocolate Croissant', 'Buttery pastry with dark chocolate', 4.99, 'dessert', 1, 1),
(3, 'Fresh Coffee', 'Locally roasted single-origin coffee', 3.49, 'drink', 1, 1),
(3, 'Fresh Orange Juice', 'Squeezed daily from Valencia oranges', 4.99, 'drink', 1, 1),

-- Mediterranean Delights
(5, 'Chicken Shawarma', 'Marinated chicken with tahini sauce', 13.99, 'main', 0, 1),
(5, 'Falafel Plate', 'Crispy falafel with hummus and pita', 11.99, 'main', 1, 1),
(5, 'Greek Salad', 'Fresh vegetables with feta and olives', 10.99, 'appetizer', 1, 1),
(5, 'Baklava', 'Honey and nut phyllo pastry', 5.99, 'dessert', 1, 1);
`;

    // Write sample data to temporary file
    fs.writeFileSync('temp_data.sql', sampleData);
    
    exec('sqlite3 fooddelivery.db < temp_data.sql', (error, stdout, stderr) => {
      // Clean up temp file
      if (fs.existsSync('temp_data.sql')) {
        fs.unlinkSync('temp_data.sql');
      }
      
      if (error) {
        console.error('❌ Error inserting sample data:', error.message);
        return;
      }

      console.log('✅ Sample data inserted successfully!');
      
      // Show database statistics
      console.log('📊 Database Statistics:');
      exec('sqlite3 fooddelivery.db "SELECT \'Users: \' || COUNT(*) FROM USERS; SELECT \'Restaurants: \' || COUNT(*) FROM RESTAURANTS; SELECT \'Menu Items: \' || COUNT(*) FROM MENU_ITEMS;"', (error, stdout, stderr) => {
        if (!error) {
          console.log(stdout);
        }
        
        console.log('');
        console.log('🎯 Next steps:');
        console.log('1. Run: npm run server (to start the backend)');
        console.log('2. Run: npm start (to start the frontend)');
        console.log('3. Open: http://localhost:3000');
        console.log('');
        console.log('🍕 Food delivery database is ready for your use!');
      });
    });
  });
});
