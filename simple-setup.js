const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

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
        setupTables();
    }
});

function setupTables() {
    console.log('Creating database tables...');
    
    // Create USERS table
    db.run(`
        CREATE TABLE IF NOT EXISTS USERS (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            phone TEXT NOT NULL,
            location TEXT,
            role TEXT CHECK(role IN ('customer', 'restaurant_owner', 'driver')) NOT NULL DEFAULT 'customer',
            is_active BOOLEAN DEFAULT 1,
            reset_token TEXT,
            reset_token_expiry TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating USERS table:', err.message);
        } else {
            console.log('✅ USERS table created');
        }
    });

    // Create RESTAURANTS table
    db.run(`
        CREATE TABLE IF NOT EXISTS RESTAURANTS (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            cuisine_type TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT NOT NULL,
            city TEXT NOT NULL,
            rating DECIMAL(3, 2) DEFAULT 0,
            delivery_fee DECIMAL(8, 2) DEFAULT 0,
            delivery_time_estimate INTEGER DEFAULT 30,
            is_open BOOLEAN DEFAULT 1,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES USERS(id)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating RESTAURANTS table:', err.message);
        } else {
            console.log('✅ RESTAURANTS table created');
        }
    });

    // Create MENU_ITEMS table
    db.run(`
        CREATE TABLE IF NOT EXISTS MENU_ITEMS (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            restaurant_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            price DECIMAL(8, 2) NOT NULL,
            category TEXT NOT NULL,
            is_vegetarian BOOLEAN DEFAULT 0,
            is_available BOOLEAN DEFAULT 1,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(id)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating MENU_ITEMS table:', err.message);
        } else {
            console.log('✅ MENU_ITEMS table created');
        }
    });

    // Create ORDERS table
    db.run(`
        CREATE TABLE IF NOT EXISTS ORDERS (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            restaurant_id INTEGER NOT NULL,
            driver_id INTEGER,
            delivery_address TEXT NOT NULL,
            order_number TEXT UNIQUE NOT NULL,
            status TEXT CHECK(status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')) DEFAULT 'pending',
            subtotal DECIMAL(10, 2) NOT NULL,
            delivery_fee DECIMAL(8, 2) NOT NULL,
            total_amount DECIMAL(10, 2) NOT NULL,
            is_credit_card BOOLEAN NOT NULL DEFAULT 1,
            payment_status TEXT CHECK(payment_status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
            special_instructions TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES USERS(id),
            FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(id),
            FOREIGN KEY (driver_id) REFERENCES USERS(id)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating ORDERS table:', err.message);
        } else {
            console.log('✅ ORDERS table created');
        }
    });

    // Create ORDER_ITEMS table
    db.run(`
        CREATE TABLE IF NOT EXISTS ORDER_ITEMS (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            menu_item_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price DECIMAL(8, 2) NOT NULL,
            total_price DECIMAL(8, 2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES ORDERS(id) ON DELETE CASCADE,
            FOREIGN KEY (menu_item_id) REFERENCES MENU_ITEMS(id)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating ORDER_ITEMS table:', err.message);
        } else {
            console.log('✅ ORDER_ITEMS table created');
        }
    });

    // Create REVIEWS table
    db.run(`
        CREATE TABLE IF NOT EXISTS REVIEWS (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            customer_id INTEGER NOT NULL,
            restaurant_id INTEGER NOT NULL,
            rating INTEGER CHECK(rating BETWEEN 1 AND 5) NOT NULL,
            review_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES ORDERS(id),
            FOREIGN KEY (customer_id) REFERENCES USERS(id),
            FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(id)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating REVIEWS table:', err.message);
        } else {
            console.log('✅ REVIEWS table created');
            createGamblingTables();
        }
    });

    function createGamblingTables() {
        // Create WALLET_BALANCES table
        db.run(`
            CREATE TABLE IF NOT EXISTS WALLET_BALANCES (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL UNIQUE,
                balance DECIMAL(10, 2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES USERS(id)
            )
        `, (err) => {
            if (err) {
                console.error('❌ Error creating WALLET_BALANCES table:', err.message);
            } else {
                console.log('✅ WALLET_BALANCES table created');
            }
        });

        // Create GAMBLING_TRANSACTIONS table
        db.run(`
            CREATE TABLE IF NOT EXISTS GAMBLING_TRANSACTIONS (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                restaurant_id INTEGER NOT NULL,
                game_type TEXT NOT NULL,
                bet_amount DECIMAL(10, 2) NOT NULL,
                won_item_id INTEGER,
                won_item_name TEXT,
                won_item_price DECIMAL(10, 2),
                wallet_credit DECIMAL(10, 2) DEFAULT 0.00,
                transaction_type TEXT DEFAULT 'bet',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES USERS(id),
                FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(id),
                FOREIGN KEY (won_item_id) REFERENCES MENU_ITEMS(id)
            )
        `, (err) => {
            if (err) {
                console.error('❌ Error creating GAMBLING_TRANSACTIONS table:', err.message);
            } else {
                console.log('✅ GAMBLING_TRANSACTIONS table created');
            }
        });

        // Create WALLET_TRANSACTIONS table
        db.run(`
            CREATE TABLE IF NOT EXISTS WALLET_TRANSACTIONS (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                gambling_transaction_id INTEGER,
                amount DECIMAL(10, 2) NOT NULL,
                transaction_type TEXT NOT NULL,
                description TEXT,
                balance_after DECIMAL(10, 2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES USERS(id),
                FOREIGN KEY (gambling_transaction_id) REFERENCES GAMBLING_TRANSACTIONS(id)
            )
        `, (err) => {
            if (err) {
                console.error('❌ Error creating WALLET_TRANSACTIONS table:', err.message);
            } else {
                console.log('✅ WALLET_TRANSACTIONS table created');
                console.log('✅ All tables created successfully!');
                seedDatabase();
            }
        });
    }
}

function seedDatabase() {
    console.log('Seeding database with sample data...');
    
    // Insert sample users
    const users = [
        ['John', 'Customer', 'john.customer@email.com', 'hashed_password_123', '+1-555-0101', 'New York, NY', 'customer'],
        ['Maria', 'Chef', 'maria.chef@email.com', 'hashed_password_456', '+1-555-0102', 'Los Angeles, CA', 'restaurant_owner'],
        ['Mike', 'Driver', 'mike.driver@email.com', 'hashed_password_789', '+1-555-0103', 'Chicago, IL', 'driver'],
        ['Sarah', 'Foodie', 'sarah.foodie@email.com', 'hashed_password_321', '+1-555-0104', 'Houston, TX', 'customer'],
        ['Tony', 'Pizzaiolo', 'tony.pizza@email.com', 'hashed_password_654', '+1-555-0105', 'Phoenix, AZ', 'restaurant_owner'],
        ['Lisa', 'Delivery', 'lisa.delivery@email.com', 'hashed_password_987', '+1-555-0106', 'Philadelphia, PA', 'driver'],
        ['David', 'Hungry', 'david.hungry@email.com', 'hashed_password_147', '+1-555-0107', 'San Antonio, TX', 'customer'],
        ['Anna', 'Baker', 'anna.baker@email.com', 'hashed_password_258', '+1-555-0108', 'San Diego, CA', 'restaurant_owner']
    ];

    let userCount = 0;
    users.forEach((user, index) => {
        db.run(`
            INSERT INTO USERS (first_name, last_name, email, password, phone, location, role)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, user, (err) => {
            if (err) {
                console.error(`❌ Error inserting user ${index + 1}:`, err.message);
            } else {
                userCount++;
                console.log(`✅ Inserted user: ${user[0]} ${user[1]}`);
                if (userCount === users.length) {
                    insertRestaurants();
                }
            }
        });
    });
}

function insertRestaurants() {
    console.log('Inserting sample restaurants...');
    
    const restaurants = [
        [2, "Maria's Authentic Mexican", 'Mexican', '+1-555-1001', '123 Taco Street', 'Los Angeles', 4.5, 2.99, 25, 1],
        [5, "Tony's Pizza Palace", 'Italian', '+1-555-1002', '456 Pizza Ave', 'New York', 4.2, 3.49, 30, 1],
        [8, "Anna's Artisan Bakery", 'Bakery', '+1-555-1003', '789 Bread Lane', 'San Francisco', 4.8, 1.99, 20, 1],
        [2, 'Spice Garden Indian', 'Indian', '+1-555-1004', '321 Curry Road', 'Chicago', 4.3, 2.49, 35, 0],
        [5, 'Mediterranean Delights', 'Mediterranean', '+1-555-1005', '654 Olive Street', 'Miami', 4.6, 3.99, 28, 1]
    ];

    let restaurantCount = 0;
    restaurants.forEach((restaurant, index) => {
        db.run(`
            INSERT INTO RESTAURANTS (owner_id, name, cuisine_type, phone, address, city, rating, delivery_fee, delivery_time_estimate, is_open)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, restaurant, (err) => {
            if (err) {
                console.error(`❌ Error inserting restaurant ${index + 1}:`, err.message);
            } else {
                restaurantCount++;
                console.log(`✅ Inserted restaurant: ${restaurant[1]}`);
                if (restaurantCount === restaurants.length) {
                    insertMenuItems();
                }
            }
        });
    });
}

function insertMenuItems() {
    console.log('Inserting menu items...');
    
    const menuItems = [
        // Maria's Authentic Mexican (restaurant_id: 1)
        [1, "Chicken Tacos", "Grilled chicken with fresh salsa and cilantro", 12.99, "main", 0, 1],
        [1, "Beef Burrito", "Seasoned beef with rice, beans, and cheese", 14.99, "main", 0, 1],
        [1, "Vegetarian Quesadilla", "Cheese and veggie quesadilla with guacamole", 11.99, "main", 1, 1],
        [1, "Churros", "Crispy cinnamon sugar churros with chocolate sauce", 6.99, "dessert", 1, 1],
        [1, "Horchata", "Traditional rice and cinnamon drink", 3.99, "drink", 1, 1],
        
        // Tony's Pizza Palace (restaurant_id: 2)
        [2, "Margherita Pizza", "Fresh mozzarella, tomato sauce, and basil", 16.99, "main", 1, 1],
        [2, "Pepperoni Pizza", "Classic pepperoni with mozzarella cheese", 18.99, "main", 0, 1],
        [2, "Caesar Salad", "Romaine lettuce with parmesan and croutons", 9.99, "appetizer", 1, 1],
        [2, "Garlic Bread", "Fresh baked bread with garlic butter", 5.99, "appetizer", 1, 1],
        [2, "Tiramisu", "Classic Italian dessert", 7.99, "dessert", 1, 1],
        
        // Anna's Artisan Bakery (restaurant_id: 3)
        [3, "Croissant Sandwich", "Ham and cheese croissant with fresh herbs", 8.99, "main", 0, 1],
        [3, "Avocado Toast", "Sourdough with avocado, tomato, and microgreens", 9.99, "main", 1, 1],
        [3, "Chocolate Croissant", "Buttery pastry with dark chocolate", 4.99, "dessert", 1, 1],
        [3, "Fresh Coffee", "Locally roasted single-origin coffee", 3.49, "drink", 1, 1],
        [3, "Fresh Orange Juice", "Squeezed daily from Valencia oranges", 4.99, "drink", 1, 1],
        
        // Mediterranean Delights (restaurant_id: 5)
        [5, "Chicken Shawarma", "Marinated chicken with tahini sauce", 13.99, "main", 0, 1],
        [5, "Falafel Plate", "Crispy falafel with hummus and pita", 11.99, "main", 1, 1],
        [5, "Greek Salad", "Fresh vegetables with feta and olives", 10.99, "appetizer", 1, 1],
        [5, "Baklava", "Honey and nut phyllo pastry", 5.99, "dessert", 1, 1]
    ];

    let menuItemCount = 0;
    menuItems.forEach((item, index) => {
        db.run(`
            INSERT INTO MENU_ITEMS (restaurant_id, name, description, price, category, is_vegetarian, is_available)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, item, (err) => {
            if (err) {
                console.error(`❌ Error inserting menu item ${index + 1}:`, err.message);
            } else {
                menuItemCount++;
                console.log(`✅ Inserted menu item: ${item[1]} ($${item[3]})`);
                if (menuItemCount === menuItems.length) {
                    finishSetup();
                }
            }
        });
    });
}

function finishSetup() {
    console.log('');
    console.log('🎉 Database setup complete!');
    console.log('');
    console.log('📊 Database Statistics:');
    console.log('✅ Users: 8');
    console.log('✅ Restaurants: 5');
    console.log('✅ Menu Items: 19');
    console.log('');
    console.log('🎯 You can now start the server and test the full app!');
    console.log('Run: npm run server');
    
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('🔒 Database connection closed');
        }
    });
}
