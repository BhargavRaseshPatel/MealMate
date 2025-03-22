import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { databases } from '../../services/appwrite';
import { Query } from 'appwrite';
import { getCurrentUser } from '../../services/appwrite';

export default function SubscriptionsScreen() {
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [availableSubscriptions, setAvailableSubscriptions] = useState([]);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Fetch active subscriptions
      const activeResponse = await databases.listDocuments(
        'MealMate',
        'Subscription',
        [
          Query.equal('customer_id', user.$id),
          Query.equal('status', 'active')
        ]
      );

      // Fetch available subscriptions
      const availableResponse = await databases.listDocuments(
        'MealMate',
        'Subscription',
        [
          Query.equal('status', 'available')
        ]
      );

      console.log('Fetched active subscriptions:', activeResponse.documents);
      console.log('Fetched available subscriptions:', availableResponse.documents);
      
      setActiveSubscriptions(activeResponse.documents);
      setAvailableSubscriptions(availableResponse.documents);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSubscriptionCard = (subscription) => (
    <TouchableOpacity key={subscription.$id} style={styles.subscriptionCard}>
      <View style={styles.subscriptionHeader}>
        <View>
          <Text style={styles.subscriptionType}>{subscription.plan_name}</Text>
          <Text style={styles.subscriptionDays}>
            {subscription.available_days.join(', ')}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: subscription.status === 'active' ? '#4CAF50' : '#2196F3' }]}>
          <Text style={styles.statusText}>{subscription.status}</Text>
        </View>
      </View>
      
      <View style={styles.subscriptionDetails}>
        <View style={styles.chefInfo}>
          <Ionicons name="restaurant-outline" size={16} color="#666" />
          <Text style={styles.chefName}>{subscription.chef_name}</Text>
        </View>
        <View style={styles.itemsList}>
          <View style={styles.itemRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.itemText}>Time: {subscription.available_time}</Text>
          </View>
          <View style={styles.itemRow}>
            <Ionicons name="cash-outline" size={16} color="#666" />
            <Text style={styles.itemText}>Price: ₹{subscription.price}</Text>
          </View>
          {subscription.status === 'available' && (
            <TouchableOpacity style={styles.subscribeButton}>
              <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading subscriptions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Subscriptions</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            My Subscriptions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Available Plans
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'active' ? (
          <>
            {activeSubscriptions.map(renderSubscriptionCard)}
            {activeSubscriptions.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No active subscriptions</Text>
              </View>
            )}
          </>
        ) : (
          <>
            {availableSubscriptions.map(renderSubscriptionCard)}
            {availableSubscriptions.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No available subscriptions</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  subscriptionCard: {
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
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subscriptionType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subscriptionDays: {
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
  subscriptionDetails: {
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
  subscribeButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
}); 