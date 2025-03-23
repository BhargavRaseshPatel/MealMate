import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './app/login';
import SignupScreen from './app/signup';
import RoleSelectionScreen from './app/role-selection';
import CustomerHomeScreen from './app/customer-home';
import ChefHomeScreen from './app/chef-home';
import CustomerTabLayout from './app/CustomerTabLayout';
import ChefTabLayout from './app/ChefTabLayout';
import AddMenuScreen from './app/chef/AddMenuScreen';
import AddSubscriptionScreen from './app/chef/AddSubscriptionScreen';
import TransactionScreen from './app/customer/TransactionScreen';
import FeedbackScreen from './app/customer/FeedbackScreen';
import OrderHistoryScreen from './app/chef/OrderHistoryScreen';
import ChefMenu from './app/chef/ChefMenu';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="customer-home" component={CustomerHomeScreen} />
        <Stack.Screen name="chef-home" component={ChefHomeScreen} />
        <Stack.Screen name="CustomerTabLayout" component={CustomerTabLayout} />
        <Stack.Screen name="ChefTabLayout" component={ChefTabLayout} />
        <Stack.Screen name="AddMenu" component={AddMenuScreen} />
        <Stack.Screen name="AddSubscription" component={AddSubscriptionScreen} />
        <Stack.Screen name="Transaction" component={TransactionScreen} />
        <Stack.Screen name="Feedback" component={FeedbackScreen} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
        <Stack.Screen name="ChefMenu" component={ChefMenu} />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 