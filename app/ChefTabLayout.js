import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import ChefHomeScreen from './chef/ChefHomeScreen';
import FutureOrdersScreen from './chef/FutureOrdersScreen';
import MenuSubscriptionScreen from './chef/MenuSubscriptionScreen';
import WeeklyMenuScreen from './chef/WeeklyMenuScreen';
import ChefProfileScreen from './chef/ChefProfileScreen';
import OrderHistoryScreen from './chef/OrderHistoryScreen';

const Tab = createBottomTabNavigator();

export default function ChefTabLayout() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'ChefHome') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'FutureOrders') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'MenuSubscription') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'WeeklyMenu') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'ChefProfile') {
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
        name="ChefHome" 
        component={ChefHomeScreen}
        options={{ title: 'Today\'s Orders' }}
      />
      <Tab.Screen 
        name="FutureOrders" 
        component={FutureOrdersScreen}
        options={{ title: 'Future Orders' }}
      />
      <Tab.Screen 
        name="MenuSubscription" 
        component={MenuSubscriptionScreen}
        options={{ title: 'Menu & Subscriptions' }}
      />
      <Tab.Screen 
        name="WeeklyMenu" 
        component={WeeklyMenuScreen}
        options={{ title: 'Weekly Menu' }}
      />
      <Tab.Screen 
        name="ChefProfile" 
        component={ChefProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Tab.Screen 
        name="OrderHistory" 
        component={OrderHistoryScreen}
        options={{
          tabBarButton: () => null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
} 