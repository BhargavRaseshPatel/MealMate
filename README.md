# MealMate

MealMate is a mobile application that connects customers with chefs to order and prepare meals. It allows customers to browse available meals, place orders, and view order statuses, while chefs can receive orders, prepare meals, and update the app on meal progress.

## Features

### Customer Side:
- Browse Menu: View meal options with descriptions, images, and pricing.
- Order Meal: Select meals, customize options (if available), and add to cart.
- Order Status: View the current status of orders (e.g., "Preparing", "Ready for Pickup").
- Order History: View past orders and reorder favorite meals.
- Rating & Feedback: Leave ratings and feedback on meals and chefs.

### Chef Side:
- View Orders: See incoming orders with details (meal, customization, customer info).
- Update Status: Mark meals as being prepared, cooked, or ready for pickup.
- Manage Menu: Update available meals, prices, and customization options.
- Receive Feedback: See ratings and feedback for meals prepared.

## Technology Stack

- **Frontend**: React Native Expo (cross-platform app development)
- **Backend**: Appwrite (for user management, data storage, and authentication)
- **Database**: Appwrite Database
- **Version Control**: Git
- **APIs**: Google Maps API (for route calculations)

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- Expo CLI
- Appwrite account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mealmate.git
   cd mealmate
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Appwrite:
   - Create an Appwrite project
   - Create a database and collections as per the schema
   - Update the Appwrite configuration in `services/appwrite.js`

4. Start the development server:
   ```bash
   npm start
   ```
   or
   ```bash
   npx expo start
   ```

5. Run on a device or emulator:
   - Scan the QR code with the Expo Go app on your device
   - Press 'a' to run on an Android emulator
   - Press 'i' to run on an iOS simulator

## Database Schema

The application uses the following database collections in Appwrite:

- Customer
- Chef
- Menu
- Category
- Items
- Chef_Menu
- Chef_Item
- Weekly_Menu
- Subscription
- Customer_Subscription
- Order
- Subscription_Order
- Feedback
- Wallet
- Transaction_History
- Delivery_Address

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
