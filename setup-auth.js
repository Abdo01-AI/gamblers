#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

console.log('🔐 Setting up authentication system...');

// Create database connection
const db = new sqlite3.Database('./fooddelivery.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Hash existing passwords in the database
async function hashExistingPasswords() {
  console.log('🔄 Hashing existing passwords...');
  
  return new Promise((resolve, reject) => {
    db.all('SELECT id, password FROM USERS WHERE password NOT LIKE "$2b$%"', async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      if (rows.length === 0) {
        console.log('✅ All passwords are already hashed');
        resolve();
        return;
      }

      console.log(`📝 Found ${rows.length} passwords to hash`);

      for (const row of rows) {
        try {
          const hashedPassword = await bcrypt.hash(row.password, 10);
          
          db.run(
            'UPDATE USERS SET password = ? WHERE id = ?',
            [hashedPassword, row.id],
            (err) => {
              if (err) {
                console.error(`❌ Error updating password for user ${row.id}:`, err.message);
              } else {
                console.log(`✅ Updated password for user ${row.id}`);
              }
            }
          );
        } catch (error) {
          console.error(`❌ Error hashing password for user ${row.id}:`, error.message);
        }
      }

      setTimeout(() => {
        console.log('✅ Password hashing completed');
        resolve();
      }, 1000);
    });
  });
}

// Main setup function
async function setupAuth() {
  try {
    await hashExistingPasswords();
    
    console.log('🎉 Authentication system setup complete!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Start the server: npm run server');
    console.log('2. Start the React app: npm start');
    console.log('3. Open your browser and register a new account');
    console.log('4. Or login with existing demo accounts:');
    console.log('   - john.customer@email.com (password: hashed_password_123)');
    console.log('   - maria.chef@email.com (password: hashed_password_456)');
    console.log('');
    console.log('⚠️  Note: Demo passwords need to be updated to actual passwords');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('🔒 Database connection closed');
      }
    });
  }
}

// Run setup
setupAuth();
