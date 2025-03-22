import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens (we'll create these next)
import BrowseMealsScreen from './customer/BrowseMealsScreen';
import OrdersScreen from './customer/OrdersScreen';
import OrderHistoryScreen from './customer/OrderHistoryScreen';
import ProfileScreen from './customer/ProfileScreen';
import FeedbackScreen from './customer/FeedbackScreen';
import TransactionScreen from './customer/TransactionScreen';
import SubscriptionsScreen from './customer/SubscriptionsScreen';

const Tab = createBottomTabNavigator();

export default function CustomerTabLayout() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Orders') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'OrderHistory') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Subscriptions') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Orders" 
        component={OrdersScreen}
        options={{
          title: 'My Orders',
        }}
      />
      <Tab.Screen 
        name="OrderHistory" 
        component={OrderHistoryScreen}
        options={{
          title: 'Order History',
        }}
      />
      <Tab.Screen 
        name="Subscriptions" 
        component={SubscriptionsScreen}
        options={{
          title: 'Subscriptions',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
} 