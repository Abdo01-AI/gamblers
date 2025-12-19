const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('🔄 Migrating database to add reset token columns...');

// Check if database exists
if (!fs.existsSync('./fooddelivery.db')) {
    console.log('❌ Database not found. Please run the setup script first.');
    process.exit(1);
}

// Open database
const db = new sqlite3.Database('./fooddelivery.db', (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Database opened successfully');
        migrateDatabase();
    }
});

function migrateDatabase() {
    // Check if columns already exist
    db.all("PRAGMA table_info(USERS)", (err, columns) => {
        if (err) {
            console.error('❌ Error checking table structure:', err.message);
            process.exit(1);
        }

        const hasResetToken = columns.some(col => col.name === 'reset_token');
        const hasResetTokenExpiry = columns.some(col => col.name === 'reset_token_expiry');

        if (hasResetToken && hasResetTokenExpiry) {
            console.log('✅ Reset token columns already exist. No migration needed.');
            db.close();
            return;
        }

        console.log('📝 Adding reset token columns to USERS table...');

        // Add reset_token column if it doesn't exist
        if (!hasResetToken) {
            db.run("ALTER TABLE USERS ADD COLUMN reset_token TEXT", (err) => {
                if (err) {
                    console.error('❌ Error adding reset_token column:', err.message);
                } else {
                    console.log('✅ Added reset_token column');
                }
            });
        }

        // Add reset_token_expiry column if it doesn't exist
        if (!hasResetTokenExpiry) {
            db.run("ALTER TABLE USERS ADD COLUMN reset_token_expiry TIMESTAMP", (err) => {
                if (err) {
                    console.error('❌ Error adding reset_token_expiry column:', err.message);
                } else {
                    console.log('✅ Added reset_token_expiry column');
                }
            });
        }

        // Close database after a short delay to ensure operations complete
        setTimeout(() => {
            console.log('🎉 Database migration completed successfully!');
            console.log('🔑 Forgot password functionality is now ready to use.');
            db.close();
        }, 1000);
    });
}
