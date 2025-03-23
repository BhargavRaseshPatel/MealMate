import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { databases } from '../../appwrite/config';
import { Query, ID } from 'appwrite';
import { getCurrentUser } from '../../services/appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID;
const SUBSCRIPTION_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_SUBSCRIPTION;
const CUSTOMER_SUBSCRIPTION_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_CUSTOMER_SUBSCRIPTION;
const CUSTOMER_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_CUSTOMER;

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

      // Fetch all active subscriptions (available plans)
      const availableResponse = await databases.listDocuments(
        DATABASE_ID,
        SUBSCRIPTION_COLLECTION_ID,
        [Query.equal('is_active', true)]
      );

      console.log('Fetched available plans:', availableResponse.documents);
      setAvailableSubscriptions(availableResponse.documents);

      // Fetch customer document using person_id
      const customerQuery = await databases.listDocuments(
        DATABASE_ID,
        CUSTOMER_COLLECTION_ID,
        [Query.equal('person_id', user.$id)]
      );

      if (customerQuery.documents.length > 0) {
        const customerId = customerQuery.documents[0].$id;
        console.log('Found customer ID:', customerId);
        
        // Fetch customer's subscriptions
        const customerSubscriptionsResponse = await databases.listDocuments(
          DATABASE_ID,
          CUSTOMER_SUBSCRIPTION_COLLECTION_ID
        );

        console.log('All customer subscriptions:', customerSubscriptionsResponse.documents);

        // Filter subscriptions for the current customer
        const customerSubscriptions = customerSubscriptionsResponse.documents.filter(sub => {
          console.log('Checking subscription customer:', sub.customer[0]?.$id);
          return sub.customer[0]?.$id === customerId;
        });

        console.log('Found customer subscriptions:', customerSubscriptions);

        // For each customer subscription, fetch the subscription details
        const activeSubscriptionsWithDetails = await Promise.all(
          customerSubscriptions.map(async (customerSub) => {
            try {
              console.log('Fetching details for subscription:', customerSub.subscription[0]?.$id);
              const subscriptionDetails = await databases.getDocument(
                DATABASE_ID,
                SUBSCRIPTION_COLLECTION_ID,
                customerSub.subscription[0]?.$id
              );
              console.log('Got subscription details:', subscriptionDetails);

              return {
                ...customerSub,
                subscription_name: subscriptionDetails.subscription_name,
                days_per_week: subscriptionDetails.days_per_week,
                total_days: subscriptionDetails.total_days,
                available_days: subscriptionDetails.available_days,
                discount: subscriptionDetails.discount,
                is_active: customerSub.subscription_status === 'active'
              };
            } catch (error) {
              console.error('Error fetching subscription details:', error);
              return null;
            }
          })
        );

        // Filter out any null values from failed fetches
        const validSubscriptions = activeSubscriptionsWithDetails.filter(sub => sub !== null);
        console.log('Final subscriptions with details:', validSubscriptions);

        setActiveSubscriptions(validSubscriptions);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (subscription) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Get customer document using person_id
      const customerQuery = await databases.listDocuments(
        DATABASE_ID,
        CUSTOMER_COLLECTION_ID,
        [Query.equal('person_id', user.$id)]
      );

      if (customerQuery.documents.length === 0) {
        Alert.alert('Error', 'Customer profile not found');
        return;
      }

      const customerId = customerQuery.documents[0].$id;
      console.log('Found customer ID for subscription:', customerId);

      // Check if customer has any active subscriptions
      const activeSubscriptionsQuery = await databases.listDocuments(
        DATABASE_ID,
        CUSTOMER_SUBSCRIPTION_COLLECTION_ID,
        [
          Query.equal('customer', customerId),
          Query.equal('subscription_status', 'active')
        ]
      );

      // Create new subscription
      await createNewSubscription(customerId, subscription);
    } catch (error) {
      console.error('Error handling subscription:', error);
      Alert.alert('Error', 'Failed to process subscription. Please try again.');
    }
  };

  const createNewSubscription = async (customerId, subscription) => {
    try {
      // Calculate start and end dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + subscription.total_days);
      console.log("Creating subscription with customer:", customerId, "subscription:", subscription.$id);

      // Create customer subscription
      const customerSubscriptionId = ID.unique();
      await databases.createDocument(
        DATABASE_ID,
        CUSTOMER_SUBSCRIPTION_COLLECTION_ID,
        customerSubscriptionId,
        {
          customer: customerId,
          subscription: subscription.$id,
          total_quantity: subscription.total_quantity,
          remaining_quantity: subscription.total_quantity,
          price: subscription.price,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          subscription_status: 'active',
          auto_next_meal: true
        }
      );

      Alert.alert('Success', 'Subscription activated successfully!');
      fetchSubscriptions(); // Refresh the subscriptions list
    } catch (error) {
      console.error('Error creating subscription:', error);
      Alert.alert('Error', 'Failed to create subscription. Please try again.');
    }
  };

  const renderSubscriptionCard = (subscription) => (
    <TouchableOpacity key={subscription.$id} style={styles.subscriptionCard}>
      <View style={styles.subscriptionHeader}>
        <View>
          <Text style={styles.subscriptionType}>{subscription.subscription_name}</Text>
          <Text style={styles.subscriptionDays}>
            {subscription.days_per_week} days/week • {subscription.total_days} days total
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: subscription.is_active ? '#4CAF50' : '#2196F3' }]}>
          <Text style={styles.statusText}>{subscription.is_active ? 'Active' : 'Available'}</Text>
        </View>
      </View>
      
      <View style={styles.subscriptionDetails}>
        <View style={styles.itemsList}>
          <View style={styles.itemRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.itemText}>Days: {subscription.available_days.join(', ')}</Text>
          </View>
          <View style={styles.itemRow}>
            <Ionicons name="cash-outline" size={16} color="#666" />
            <Text style={styles.itemText}>Price: ₹{subscription.price}</Text>
          </View>
          {subscription.discount > 0 && (
            <View style={styles.itemRow}>
              <Ionicons name="pricetag-outline" size={16} color="#666" />
              <Text style={styles.itemText}>Discount: {subscription.discount}%</Text>
            </View>
          )}
          {activeTab === 'available' && (
            <TouchableOpacity 
              style={styles.subscribeButton}
              onPress={() => handleSubscribe(subscription)}
            >
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
          activeSubscriptions.length > 0 ? (
            activeSubscriptions.map(subscription => renderSubscriptionCard(subscription))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No active subscriptions</Text>
            </View>
          )
        ) : (
          availableSubscriptions.length > 0 ? (
            availableSubscriptions.map(subscription => renderSubscriptionCard(subscription))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No available plans</Text>
            </View>
          )
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
    fontSize: 18,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
}); 