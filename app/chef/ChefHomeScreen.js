import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, startOfDay, endOfDay } from 'date-fns';
import { databases, account } from '../../services/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID;
const ORDER_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_ORDER;
const CHEF_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_CHEF;

export default function ChefHomeScreen() {
  const [activeTab, setActiveTab] = useState('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayOrders, setTodayOrders] = useState([]);
  const [subscriptionOrders, setSubscriptionOrders] = useState([]);
  const [chefId, setChefId] = useState(null);

  useEffect(() => {
    fetchChefId();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (chefId) {
      fetchOrders().finally(() => {
        setRefreshing(false);
      });
    } else {
      fetchChefId().finally(() => {
        setRefreshing(false);
      });
    }
  }, [chefId]);

  const fetchChefId = async () => {
    try {
      setLoading(true);
      const currentUser = await account.get();
      
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        setLoading(false);
        return;
      }

      console.log('Current user ID:', currentUser.$id);
      
      // Get chef document for current user using person_id
      const chefQuery = await databases.listDocuments(
        DATABASE_ID,
        CHEF_COLLECTION_ID,
        [Query.equal('person_id', currentUser.$id)]
      );

      if (chefQuery.documents.length === 0) {
        console.log('No chef profile found for user:', currentUser.$id);
        Alert.alert('Error', 'Chef profile not found');
        setLoading(false);
        return;
      }

      const chef = chefQuery.documents[0];
      console.log('Chef found:', chef.$id);
      setChefId(chef.$id);
      
      // Now fetch orders for this chef
      await fetchOrders(chef.$id);
    } catch (error) {
      console.error('Error fetching chef profile:', error);
      Alert.alert('Error', 'Failed to load chef profile');
      setLoading(false);
    }
  };

  const fetchOrders = async (chef_id = chefId) => {
    try {
      setLoading(true);
      
      if (!chef_id) {
        console.log('No chef ID available to fetch orders');
        setLoading(false);
        return;
      }

      console.log('Fetching orders for chef ID:', chef_id);
      
      // Get today's date range
      const currentDate = new Date();
      const startOfToday = startOfDay(currentDate).toISOString();
      const endOfToday = endOfDay(currentDate).toISOString();
      
      console.log('Fetching orders between', startOfToday, 'and', endOfToday);

      // Fetch all orders for today, then filter by chef
      // Cannot query directly on relationship fields
      const ordersQuery = await databases.listDocuments(
        DATABASE_ID,
        ORDER_COLLECTION_ID,
        [
          Query.greaterThanEqual('last_modified_at', startOfToday),
          Query.lessThanEqual('last_modified_at', endOfToday)
        ]
      );

      console.log('Found total orders for today:', ordersQuery.documents.length);
      
      // Filter orders for this chef using client-side filtering
      const chefOrders = ordersQuery.documents.filter(order => {
        // Check if the chef field exists and contains the chef's ID
        return order.chef && 
               (order.chef === chef_id || 
                (Array.isArray(order.chef) && order.chef.includes(chef_id)) ||
                (Array.isArray(order.chef) && order.chef.some(c => c && c.$id === chef_id)));
      });
      
      console.log('Filtered orders for this chef:', chefOrders.length);
      
      // Process orders based on their type
      const todayOrdersList = [];
      const subscriptionOrdersList = [];
      
      for (const order of chefOrders) {
        if (order.subscription_id) {
          subscriptionOrdersList.push(order);
        } else {
          todayOrdersList.push(order);
        }
      }
      
      setTodayOrders(todayOrdersList);
      setSubscriptionOrders(subscriptionOrdersList);
      console.log('Today orders:', todayOrdersList.length);
      console.log('Subscription orders:', subscriptionOrdersList.length);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const renderOrderCard = (order) => {
    return (
      <View key={order.$id} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>Order #{order.$id.substring(0, 8)}</Text>
          <View style={[styles.statusBadge, getStatusStyle(order.order_status)]}>
            <Text style={styles.statusText}>{order.order_status || 'Pending'}</Text>
          </View>
        </View>
        
        <View style={styles.orderDetails}>
          {order.weeklyMenu && order.weeklyMenu.length > 0 && (
            <View style={styles.menuDetails}>
              <Text style={styles.detailLabel}>Menu:</Text>
              <Text style={styles.detailText}>
                {order.weeklyMenu[0]?.chefMenu?.[0]?.menu_name || 'Unknown Menu'}
              </Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Quantity:</Text>
              <Text style={styles.detailText}>{order.quantity || 1}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Price:</Text>
              <Text style={styles.detailText}>${order.price || 0}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Payment:</Text>
              <Text style={[
                styles.detailText, 
                order.payment_status === 'Paid' 
                  ? styles.paidText 
                  : styles.unpaidText
              ]}>
                {order.payment_status || 'Pending'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailText}>
                {order.last_modified_at 
                  ? format(new Date(order.last_modified_at), 'MMM d, yyyy h:mm a')
                  : 'Unknown date'}
              </Text>
            </View>
          </View>
          
          {order.customer && order.customer.length > 0 && (
            <View style={styles.customerDetails}>
              <Text style={styles.detailLabel}>Customer:</Text>
              <Text style={styles.detailText}>{order.customer[0]?.name || 'Unknown Customer'}</Text>
            </View>
          )}
          
          {order.cancellation_reason && (
            <View style={styles.cancellationContainer}>
              <Text style={styles.detailLabel}>Cancellation Reason:</Text>
              <Text style={styles.cancellationText}>{order.cancellation_reason}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
            <Text style={[styles.actionButtonText, { color: '#4CAF50' }]}>Accept</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="close-circle-outline" size={20} color="#F44336" />
            <Text style={[styles.actionButtonText, { color: '#F44336' }]}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed':
        return styles.completedStatus;
      case 'Cancelled':
        return styles.cancelledStatus;
      case 'In Progress':
        return styles.inProgressStatus;
      case 'Delivered':
        return styles.deliveredStatus;
      default:
        return styles.pendingStatus;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      );
    }

    if (activeTab === 'subscription') {
      if (subscriptionOrders.length === 0) {
        return (
          <View style={styles.tabContent}>
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No subscription orders for today</Text>
            </View>
          </View>
        );
      }
      
      return (
        <View style={styles.tabContent}>
          {subscriptionOrders.map(order => renderOrderCard(order))}
        </View>
      );
    } else {
      if (todayOrders.length === 0) {
        return (
          <View style={styles.tabContent}>
            <View style={styles.emptyState}>
              <Ionicons name="fast-food-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No orders for today</Text>
            </View>
          </View>
        );
      }
      
      return (
        <View style={styles.tabContent}>
          {todayOrders.map(order => renderOrderCard(order))}
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Orders</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'subscription' && styles.activeTab]}
          onPress={() => setActiveTab('subscription')}
        >
          <Text style={[styles.tabText, activeTab === 'subscription' && styles.activeTabText]}>
            Subscription Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'today' && styles.activeTab]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
            Today's Orders
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B6B']}
            tintColor="#FF6B6B"
          />
        }
      >
        {renderContent()}
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  activeTab: {
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  pendingStatus: {
    backgroundColor: '#FFC107',
  },
  completedStatus: {
    backgroundColor: '#4CAF50',
  },
  cancelledStatus: {
    backgroundColor: '#F44336',
  },
  inProgressStatus: {
    backgroundColor: '#2196F3',
  },
  deliveredStatus: {
    backgroundColor: '#8BC34A',
  },
  orderDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  paidText: {
    color: '#4CAF50',
  },
  unpaidText: {
    color: '#F44336',
  },
  menuDetails: {
    marginBottom: 8,
  },
  customerDetails: {
    marginTop: 4,
    marginBottom: 8,
  },
  cancellationContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 4,
  },
  cancellationText: {
    fontSize: 14,
    color: '#D32F2F',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
}); 