import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function OrderHistoryScreen() {
  const [activeFilter, setActiveFilter] = useState('all');

  // Mock data for order history
  const orderHistory = [
    {
      id: '1',
      date: '2024-03-15',
      time: '12:30 PM',
      items: ['Butter Chicken', 'Naan', 'Rice'],
      status: 'Delivered',
      chef: 'Chef Raj',
      amount: '₹450',
      rating: 4.5,
    },
    {
      id: '2',
      date: '2024-03-14',
      time: '7:00 PM',
      items: ['Paneer Tikka', 'Roti', 'Dal'],
      status: 'Delivered',
      chef: 'Chef Priya',
      amount: '₹350',
      rating: 5,
    },
    {
      id: '3',
      date: '2024-03-13',
      time: '1:00 PM',
      items: ['Biryani', 'Raita', 'Salad'],
      status: 'Cancelled',
      chef: 'Chef Amit',
      amount: '₹400',
      rating: null,
    },
  ];

  const renderOrderCard = (order) => (
    <TouchableOpacity key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderDate}>
            {new Date(order.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.orderTime}>{order.time}</Text>
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
        <View style={styles.orderFooter}>
          <View style={styles.amountContainer}>
            <Ionicons name="cash-outline" size={16} color="#666" />
            <Text style={styles.amountText}>{order.amount}</Text>
          </View>
          {order.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{order.rating}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order History</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'all' && styles.activeFilter]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>
            All Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'delivered' && styles.activeFilter]}
          onPress={() => setActiveFilter('delivered')}
        >
          <Text style={[styles.filterText, activeFilter === 'delivered' && styles.activeFilterText]}>
            Delivered
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'cancelled' && styles.activeFilter]}
          onPress={() => setActiveFilter('cancelled')}
        >
          <Text style={[styles.filterText, activeFilter === 'cancelled' && styles.activeFilterText]}>
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {orderHistory
          .filter(order => activeFilter === 'all' || order.status.toLowerCase() === activeFilter)
          .map(renderOrderCard)}
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  activeFilter: {
    backgroundColor: '#FF6B6B',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
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
  orderDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderTime: {
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
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
}); 