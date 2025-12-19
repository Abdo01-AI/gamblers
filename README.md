# 🍽️ Dish of Fate

A food delivery app with gambling mechanics! Users can spin wheels or play memory games to win meals based on strategic pricing.

## 🚀 Features

- **Restaurant Selection**: Choose from available restaurants
- **Menu Display**: View all menu items with prices
- **Wheel Spin Game**: Spin with weighted probabilities based on price proximity
- **Memory Matching Game**: Match cards to win meals
- **777 Slots Game**: 3-reel slots with jackpot and tiered prizes
- **Wallet System**: Store money differences when you get cheaper meals
- **3-Chance System**: 3 random attempts + 1 guaranteed attempt

## 🛠️ Quick Start

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Set Up Database (Optional)**

   ```bash
   npm run setup-db
   ```

3. **Start Backend**

   ```bash
   npm run server
   ```

4. **Start Frontend**

   ```bash
   npm start
   ```

5. **Open App**: http://localhost:3000

## 🎮 How to Play

1. **Choose Restaurant**: Browse available restaurants
2. **View Menu**: See all meals with prices
3. **Enter Amount**: Pay any amount between min/max prices
4. **Choose Game**: Wheel Spin or Memory Matching
5. **Win Meals**: Get meals based on your strategy!

## 🎯 Game Rules

### Wheel Spin

- Pay closer to a meal price = higher chance of getting it
- 3 random attempts + 1 guaranteed attempt
- 4th attempt always gives you the closest meal to your price

### Memory Matching

### 777 Slots

- Three reels with food and 7️⃣ symbols
- 7-7-7 jackpot grants the most expensive menu item
- Three-of-a-kind rewards a premium pick close to your paid price
- Two-of-a-kind gives a favorable pick; otherwise weighted random by price proximity

- 3 seconds to memorize card positions
- Find matching pairs of the same meal
- Choose which matched meal you want to keep

## 💰 Wallet System

- If you pay $10 and get a $7 meal, $3 goes to your wallet
- Wallet balance displayed in app header
- Money can be used for future orders

## 🗄️ Database

- SQLite database with restaurants, menus, orders, and reviews
- Demo data included for testing without database setup
- Full CRUD operations for all entities

## 🎨 UI Features

- Modern gradient backgrounds
- Glass morphism design
- Smooth animations with Framer Motion
- Fully responsive for mobile/desktop

## 🔧 Tech Stack

- **Frontend**: React 18, React Router, Framer Motion
- **Backend**: Node.js, Express, SQLite3
- **Styling**: CSS3 with modern effects

## 📱 Mobile Support

Fully responsive design that works on all devices.

---

**Ready to gamble on your next meal? 🎰🍕**
