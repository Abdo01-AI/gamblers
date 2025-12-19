const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('🍕 Setting up Food Delivery Database...');

// Remove existing database if it exists
if (fs.existsSync('./fooddelivery.db')) {
    console.log('Removing existing database...');
    fs.unlinkSync('./fooddelivery.db');
}

// Create new database
const db = new sqlite3.Database('./fooddelivery.db', (err) => {
    if (err) {
        console.error('Error creating database:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Database created successfully');
    }
});

// Read and execute the SQL schema
const sqlSchema = fs.readFileSync('./DATABASE.sql', 'utf8');

// Split the SQL into individual statements and filter out comments
const statements = sqlSchema
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

// Separate table creation from index creation
const tableStatements = statements.filter(stmt => stmt.startsWith('CREATE TABLE'));
const indexStatements = statements.filter(stmt => stmt.startsWith('CREATE INDEX'));

console.log('Creating database schema...');

// Execute table creation statements first
let completedTables = 0;
tableStatements.forEach((statement, index) => {
    db.run(statement, (err) => {
        if (err) {
            console.error(`❌ Error creating table ${index + 1}:`, err.message);
            console.error('Statement:', statement);
        } else {
            completedTables++;
            if (completedTables === tableStatements.length) {
                console.log('✅ Database tables created successfully');
                createIndexes();
            }
        }
    });
});

function createIndexes() {
    console.log('Creating database indexes...');
    let completedIndexes = 0;
    
    indexStatements.forEach((statement, index) => {
        db.run(statement, (err) => {
            if (err) {
                console.error(`❌ Error creating index ${index + 1}:`, err.message);
                console.error('Statement:', statement);
            } else {
                completedIndexes++;
                if (completedIndexes === indexStatements.length) {
                    console.log('✅ Database indexes created successfully');
                    seedDatabase();
                }
            }
        });
    });
}

function seedDatabase() {
    console.log('Seeding database with sample data...');
    
    // Insert sample users
    const users = [
        ['John', 'Customer', 'john.customer@email.com', 'hashed_password_123', '+1-555-0101', 'customer'],
        ['Maria', 'Chef', 'maria.chef@email.com', 'hashed_password_456', '+1-555-0102', 'restaurant_owner'],
        ['Mike', 'Driver', 'mike.driver@email.com', 'hashed_password_789', '+1-555-0103', 'driver'],
        ['Sarah', 'Foodie', 'sarah.foodie@email.com', 'hashed_password_321', '+1-555-0104', 'customer'],
        ['Tony', 'Pizzaiolo', 'tony.pizza@email.com', 'hashed_password_654', '+1-555-0105', 'restaurant_owner'],
        ['Lisa', 'Delivery', 'lisa.delivery@email.com', 'hashed_password_987', '+1-555-0106', 'driver'],
        ['David', 'Hungry', 'david.hungry@email.com', 'hashed_password_147', '+1-555-0107', 'customer'],
        ['Anna', 'Baker', 'anna.baker@email.com', 'hashed_password_258', '+1-555-0108', 'restaurant_owner']
    ];

    const insertUser = db.prepare(`
        INSERT INTO USERS (first_name, last_name, email, password, phone, role)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    users.forEach((user, index) => {
        insertUser.run(user, (err) => {
            if (err) {
                console.error(`❌ Error inserting user ${index + 1}:`, err.message);
            } else {
                console.log(`✅ Inserted user: ${user[0]} ${user[1]}`);
            }
        });
    });

    insertUser.finalize();

    // Insert sample restaurants
    const restaurants = [
        [2, "Maria's Authentic Mexican", 'Mexican', '+1-555-1001', '123 Taco Street', 'Los Angeles', 4.5, 2.99, 25, 1],
        [5, "Tony's Pizza Palace", 'Italian', '+1-555-1002', '456 Pizza Ave', 'New York', 4.2, 3.49, 30, 1],
        [8, "Anna's Artisan Bakery", 'Bakery', '+1-555-1003', '789 Bread Lane', 'San Francisco', 4.8, 1.99, 20, 1],
        [2, 'Spice Garden Indian', 'Indian', '+1-555-1004', '321 Curry Road', 'Chicago', 4.3, 2.49, 35, 0],
        [5, 'Mediterranean Delights', 'Mediterranean', '+1-555-1005', '654 Olive Street', 'Miami', 4.6, 3.99, 28, 1]
    ];

    const insertRestaurant = db.prepare(`
        INSERT INTO RESTAURANTS (owner_id, name, cuisine_type, phone, address, city, rating, delivery_fee, delivery_time_estimate, is_open)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    restaurants.forEach((restaurant, index) => {
        insertRestaurant.run(restaurant, (err) => {
            if (err) {
                console.error(`❌ Error inserting restaurant ${index + 1}:`, err.message);
            } else {
                console.log(`✅ Inserted restaurant: ${restaurant[1]}`);
            }
        });
    });

    insertRestaurant.finalize();

    // Close database connection
    setTimeout(() => {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('✅ Database setup complete!');
                console.log('');
                console.log('📊 Database Statistics:');
                console.log('✅ Users: 8');
                console.log('✅ Restaurants: 5');
                console.log('');
                console.log('🎯 You can now start the server and test registration!');
                console.log('Run: npm run server');
            }
        });
    }, 2000);
}
