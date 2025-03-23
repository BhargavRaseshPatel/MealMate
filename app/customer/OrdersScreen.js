import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function OrdersScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('today');

  // Mock data for orders
  const todayOrders = [
    {
      id: '1',
      type: 'Today\'s Order',
      time: '12:30 PM',
      items: ['Butter Chicken', 'Naan', 'Rice'],
      status: 'Preparing',
      chef: 'Chef Raj',
    },
    {
      id: '2',
      type: 'Today\'s Order',
      time: '7:00 PM',
      items: ['Paneer Tikka', 'Roti', 'Dal'],
      status: 'Confirmed',
      chef: 'Chef Priya',
    },
  ];

  const upcomingOrders = [
    {
      id: '3',
      date: 'Tomorrow',
      time: '1:00 PM',
      items: ['Biryani', 'Raita', 'Salad'],
      status: 'Scheduled',
      chef: 'Chef Amit',
    },
    {
      id: '4',
      date: 'Next Day',
      time: '8:00 PM',
      items: ['Kebab Platter', 'Naan', 'Chutney'],
      status: 'Scheduled',
      chef: 'Chef Neha',
    },
  ];

  const renderOrderCard = (order) => (
    <TouchableOpacity key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderType}>{order.type || 'Upcoming Order'}</Text>
          <Text style={styles.orderDate}>
            {order.date || 'Today'} • {order.time}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.chefInfo}>
          <Ionicons name="restaurant-outline" size={16} color="#666" />
          <Text style={styles.chefName}>{order.chef}</Text>
        </View>
        <View style={styles.itemsList}>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" />
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'preparing':
        return '#FFA500';
      case 'confirmed':
        return '#4CAF50';
      case 'scheduled':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>My Orders</Text>
          <TouchableOpacity 
            style={styles.createOrderButton}
            onPress={() => navigation.navigate('BrowseMeals')}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.createOrderButtonText}>Create New Order</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'today' && styles.activeTab]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
            Today's Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'today' && todayOrders.map(renderOrderCard)}
        {activeTab === 'upcoming' && upcomingOrders.map(renderOrderCard)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  chefInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chefName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  itemsList: {
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  createOrderButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  createOrderButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  ordersContainer: {
    flex: 1,
  },
}); 