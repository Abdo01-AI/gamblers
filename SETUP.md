# 🎰 Gamblers Food App - Setup Guide

A food delivery app with gambling mechanics where users can spin wheels or play memory games to win meals!

## 🚀 Features

- **Restaurant Selection**: Choose from available restaurants
- **Menu Display**: View all menu items with prices
- **Wheel Spin Game**: Spin a wheel with weighted probabilities based on price proximity
- **Memory Matching Game**: Match cards to win meals
- **Wallet System**: Store money differences when you get cheaper meals
- **3-Chance System**: 3 random attempts + 1 guaranteed attempt

## 📋 Prerequisites

Before running the app, make sure you have:

1. **Node.js** (version 14 or higher)
2. **SQLite3** installed on your system
3. **Git** (optional, for cloning)

### Installing SQLite3

#### Windows:
```bash
# Using Chocolatey
choco install sqlite

# Or download from https://sqlite.org/download.html
```

#### macOS:
```bash
# Using Homebrew
brew install sqlite3
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get install sqlite3
```

## 🛠️ Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database
```bash
# Create the database and tables
sqlite3 fooddelivery.db < DATABASE.sql

# Or run the setup script (if you have bash)
bash SCRIPT.sh
```

### 3. Start the Backend Server
```bash
npm run server
```
The server will start on `http://localhost:3001`

### 4. Start the Frontend (in a new terminal)
```bash
npm start
```
The app will open in your browser at `http://localhost:3000`

## 🎮 How to Play

### Wheel Spin Game:
1. Choose a restaurant
2. View the menu and note the prices
3. Enter an amount you want to spend (between min and max menu prices)
4. Click "Spin the Wheel"
5. You get 3 random attempts + 1 guaranteed attempt
6. Paying closer to a meal price increases your chances of getting it
7. If you get a cheaper meal, the difference goes to your wallet!

### Memory Matching Game:
1. Choose a restaurant and enter your spending amount
2. Click "Memory Matching"
3. You have 3 seconds to memorize card positions
4. Find matching pairs of the same meal
5. Choose which matched meal you want to keep
6. Play multiple times to find different meals

## 🗄️ Database Schema

The app uses SQLite with the following main tables:
- **USERS**: Customer, restaurant owner, and driver accounts
- **RESTAURANTS**: Restaurant information and settings
- **MENU_ITEMS**: Food items with prices and categories
- **ORDERS**: Order tracking and payment status
- **ORDER_ITEMS**: Individual items in each order
- **REVIEWS**: Customer ratings and feedback

## 🎯 Game Mechanics

### Probability System:
- Base probability: 1 for all items
- Proximity bonus: Items closer to your paid price get higher probability
- 4th attempt: Guaranteed to get the meal closest to your price

### Wallet System:
- If you pay $10 and get a $7 meal, $3 goes to your wallet
- Wallet balance is displayed in the app header
- Money can be used for future orders

## 🛠️ Development

### Project Structure:
```
gamblers/
├── src/
│   ├── components/
│   │   ├── RestaurantList.js
│   │   ├── MenuPage.js
│   │   ├── WheelGame.js
│   │   ├── MatchingGame.js
│   │   └── Wallet.js
│   ├── App.js
│   ├── App.css
│   └── index.js
├── public/
│   └── index.html
├── server.js
├── DATABASE.sql
├── SCRIPT.sh
└── package.json
```

### API Endpoints:
- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurants/:id` - Get restaurant details
- `GET /api/restaurants/:id/menu` - Get restaurant menu
- `POST /api/users` - Create user account
- `GET /api/users/:id/wallet` - Get wallet balance
- `PUT /api/users/:id/wallet` - Update wallet balance

## 🐛 Troubleshooting

### Common Issues:

1. **SQLite3 not found**: Install SQLite3 using the instructions above
2. **Port already in use**: Change the port in `server.js` or kill the process using the port
3. **Database not found**: Make sure you've run the database setup commands
4. **CORS errors**: The server includes CORS middleware, but make sure both frontend and backend are running

### Reset Database:
```bash
rm fooddelivery.db
sqlite3 fooddelivery.db < DATABASE.sql
```

## 🎨 Customization

### Adding New Restaurants:
1. Insert into `RESTAURANTS` table
2. Add menu items to `MENU_ITEMS` table
3. Restart the server

### Modifying Game Rules:
- Edit probability calculations in `WheelGame.js`
- Adjust memory game timing in `MatchingGame.js`
- Change wallet logic in both game components

## 📱 Mobile Support

The app is responsive and works on mobile devices. The UI adapts to different screen sizes using CSS Grid and Flexbox.

## 🔒 Security Notes

This is a demo app. For production use, consider:
- Adding proper authentication
- Implementing secure payment processing
- Adding input validation and sanitization
- Using environment variables for sensitive data
- Adding rate limiting and security headers

## 📄 License

This project is for educational/demo purposes.

## 🤝 Contributing

Feel free to fork this project and submit pull requests for improvements!

---

**Happy Gambling! 🎰🍕**
