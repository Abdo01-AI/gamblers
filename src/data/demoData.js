// Demo data for testing without database
export const demoRestaurants = [
  {
    id: 1,
    name: "Maria's Authentic Mexican",
    cuisine_type: "Mexican",
    rating: 4.5,
    delivery_fee: 2.99,
    delivery_time_estimate: 25,
    is_open: true
  },
  {
    id: 2,
    name: "Tony's Pizza Palace",
    cuisine_type: "Italian",
    rating: 4.2,
    delivery_fee: 3.49,
    delivery_time_estimate: 30,
    is_open: true
  },
  {
    id: 3,
    name: "Anna's Artisan Bakery",
    cuisine_type: "Bakery",
    rating: 4.8,
    delivery_fee: 1.99,
    delivery_time_estimate: 20,
    is_open: true
  },
  {
    id: 4,
    name: "Spice Garden Indian",
    cuisine_type: "Indian",
    rating: 4.3,
    delivery_fee: 2.49,
    delivery_time_estimate: 35,
    is_open: false
  },
  {
    id: 5,
    name: "Mediterranean Delights",
    cuisine_type: "Mediterranean",
    rating: 4.6,
    delivery_fee: 3.99,
    delivery_time_estimate: 28,
    is_open: true
  }
];

export const demoMenuItems = {
  1: [ // Maria's Authentic Mexican
    { id: 1, name: "Chicken Tacos", description: "Grilled chicken with fresh salsa and cilantro", price: 12.99, category: "main", is_vegetarian: false },
    { id: 2, name: "Beef Burrito", description: "Seasoned beef with rice, beans, and cheese", price: 14.99, category: "main", is_vegetarian: false },
    { id: 3, name: "Vegetarian Quesadilla", description: "Cheese and veggie quesadilla with guacamole", price: 11.99, category: "main", is_vegetarian: true },
    { id: 4, name: "Churros", description: "Crispy cinnamon sugar churros with chocolate sauce", price: 6.99, category: "dessert", is_vegetarian: true },
    { id: 5, name: "Horchata", description: "Traditional rice and cinnamon drink", price: 3.99, category: "drink", is_vegetarian: true }
  ],
  2: [ // Tony's Pizza Palace
    { id: 6, name: "Margherita Pizza", description: "Fresh mozzarella, tomato sauce, and basil", price: 16.99, category: "main", is_vegetarian: true },
    { id: 7, name: "Pepperoni Pizza", description: "Classic pepperoni with mozzarella cheese", price: 18.99, category: "main", is_vegetarian: false },
    { id: 8, name: "Caesar Salad", description: "Romaine lettuce with parmesan and croutons", price: 9.99, category: "appetizer", is_vegetarian: true },
    { id: 9, name: "Garlic Bread", description: "Fresh baked bread with garlic butter", price: 5.99, category: "appetizer", is_vegetarian: true },
    { id: 10, name: "Tiramisu", description: "Classic Italian dessert", price: 7.99, category: "dessert", is_vegetarian: true }
  ],
  3: [ // Anna's Artisan Bakery
    { id: 11, name: "Croissant Sandwich", description: "Ham and cheese croissant with fresh herbs", price: 8.99, category: "main", is_vegetarian: false },
    { id: 12, name: "Avocado Toast", description: "Sourdough with avocado, tomato, and microgreens", price: 9.99, category: "main", is_vegetarian: true },
    { id: 13, name: "Chocolate Croissant", description: "Buttery pastry with dark chocolate", price: 4.99, category: "dessert", is_vegetarian: true },
    { id: 14, name: "Fresh Coffee", description: "Locally roasted single-origin coffee", price: 3.49, category: "drink", is_vegetarian: true },
    { id: 15, name: "Fresh Orange Juice", description: "Squeezed daily from Valencia oranges", price: 4.99, category: "drink", is_vegetarian: true }
  ],
  5: [ // Mediterranean Delights
    { id: 16, name: "Chicken Shawarma", description: "Marinated chicken with tahini sauce", price: 13.99, category: "main", is_vegetarian: false },
    { id: 17, name: "Falafel Plate", description: "Crispy falafel with hummus and pita", price: 11.99, category: "main", is_vegetarian: true },
    { id: 18, name: "Greek Salad", description: "Fresh vegetables with feta and olives", price: 10.99, category: "appetizer", is_vegetarian: true },
    { id: 19, name: "Baklava", description: "Honey and nut phyllo pastry", price: 5.99, category: "dessert", is_vegetarian: true }
  ]
};

export const demoReviews = {
  1: [ // Maria's Authentic Mexican - 2 reviews from SCRIPT.sh
    {
      id: 1,
      rating: 5,
      review_text: "Amazing tacos! Fresh ingredients and perfect spice level.",
      created_at: "2024-12-01T10:30:00Z",
      first_name: "John",
      last_name: "Customer"
    },
    {
      id: 2,
      rating: 5,
      review_text: "Best Mexican food in the city. Will definitely order again.",
      created_at: "2024-12-01T11:15:00Z",
      first_name: "John",
      last_name: "Customer"
    }
  ],
  2: [ // Tony's Pizza Palace - 2 reviews from SCRIPT.sh
    {
      id: 3,
      rating: 4,
      review_text: "Great pizza and fast delivery. Tiramisu was delicious!",
      created_at: "2024-12-01T12:00:00Z",
      first_name: "Sarah",
      last_name: "Foodie"
    },
    {
      id: 4,
      rating: 4,
      review_text: "Good food, driver was very polite and professional.",
      created_at: "2024-12-01T13:30:00Z",
      first_name: "Sarah",
      last_name: "Foodie"
    }
  ],
  3: [], // Anna's Artisan Bakery - no reviews in SCRIPT.sh
  4: [], // Spice Garden Indian - no reviews in SCRIPT.sh
  5: []  // Mediterranean Delights - no reviews in SCRIPT.sh
};