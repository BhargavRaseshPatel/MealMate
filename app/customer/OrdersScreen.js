import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { databases, account } from '../../services/appwrite';
import { Query } from 'appwrite';
import { format } from 'date-fns';

// Environment variables
const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID;
const ORDER_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_ORDER || 'Order';
const CUSTOMER_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_CUSTOMER || 'Customer';
const WEEKLY_MENU_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_WEEKLY_MENU || 'Weekly_Menu';

export default function OrdersScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayOrders, setTodayOrders] = useState([]);
  const [upcomingOrders, setUpcomingOrders] = useState([]);
  const [customerId, setCustomerId] = useState(null);

  useEffect(() => {
    fetchCustomerId();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (customerId) {
      fetchOrders().finally(() => setRefreshing(false));
    } else {
      fetchCustomerId().finally(() => setRefreshing(false));
    }
  }, [customerId]);

  const fetchCustomerId = async () => {
    try {
      setLoading(true);
      // Get the current logged in user
      const currentUser = await account.get();
      
      if (!currentUser) {
        console.error('No authenticated user found');
        Alert.alert('Error', 'User not authenticated');
        setLoading(false);
        return;
      }

      console.log('Current user ID:', currentUser.$id);
      
      // Find the customer document for this user
      const customersQuery = await databases.listDocuments(
        DATABASE_ID,
        CUSTOMER_COLLECTION_ID,
        [Query.equal('person_id', currentUser.$id)]
      );
      
      if (customersQuery.documents.length === 0) {
        console.error('No customer profile found for user');
        Alert.alert('Error', 'Customer profile not found');
        setLoading(false);
        return;
      }
      
      const customer = customersQuery.documents[0];
      setCustomerId(customer.$id);
      console.log('Customer ID found:', customer.$id);
      
      // Fetch orders for this customer
      await fetchOrders(customer.$id);
    } catch (error) {
      console.error('Error fetching customer ID:', error);
      Alert.alert('Error', 'Failed to load customer data');
      setLoading(false);
    }
  };

  const fetchOrders = async (id = null) => {
    try {
      const custId = id || customerId;
      if (!custId) {
        console.error('No customer ID available');
        return;
      }

      console.log('Fetching orders for customer:', custId);
      
      // Get today's date at the start and end of the day
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');
      
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      
      // Convert to timestamps for easier comparison
      const startTimestamp = startOfToday.getTime();
      const endTimestamp = endOfToday.getTime();
      
      // Fetch all orders
      const ordersQuery = await databases.listDocuments(
        DATABASE_ID,
        ORDER_COLLECTION_ID
      );
      
      console.log(`Found ${ordersQuery.documents.length} total orders in database`);
      
      // Find orders for this customer
      const customerOrders = [];
      
      // Filter for customer orders
      for (const order of ordersQuery.documents) {
        let isMatch = false;
        
        // Check if customer field contains the ID as a string value
        if (order.customer === custId) {
          isMatch = true;
        }
        // Check if customer is an object with $id property
        else if (order.customer && typeof order.customer === 'object' && order.customer.$id === custId) {
          isMatch = true;
        }
        // Check alternative field names
        else if (order.customer_id === custId) {
          isMatch = true;
        }
        else if (order.customerId === custId) {
          isMatch = true;
        }
        // Try a string contains match as last resort
        else {
          const orderStr = JSON.stringify(order);
          if (orderStr.includes(custId)) {
            isMatch = true;
          }
        }
        
        if (isMatch) {
          customerOrders.push(order);
        }
      }
      
      console.log(`Filtered ${customerOrders.length} orders for customer ID: ${custId}`);
      
      // FALLBACK: If no orders found for this customer, show all orders for debugging
      if (customerOrders.length === 0) {
        console.log('No orders found for this customer. Showing sample orders for debugging.');
        
        // Take up to 5 orders for display
        const sampleOrders = ordersQuery.documents.slice(0, 5);
        
        // Process these orders for display
        const processedSampleOrders = await Promise.all(sampleOrders.map(async (order) => {
          // Try to fetch weekly menu for each sample order
          let weeklyMenuDetails = null;
          if (order.weeklyMenu) {
            try {
              weeklyMenuDetails = await databases.getDocument(
                DATABASE_ID,
                WEEKLY_MENU_COLLECTION_ID,
                order.weeklyMenu
              );
            } catch (err) {
              console.error(`Error fetching weeklyMenu for order ${order.$id}`);
            }
          }
          
          return {
            ...order,
            weeklyMenuDetails,
            displayDate: 'Today (Debug)',
            displayTime: 'Debug Mode'
          };
        }));
        
        setTodayOrders(processedSampleOrders);
        setLoading(false);
        return;
      }
      
      // Process the matched orders
      const todayOrdersList = [];
      const upcomingOrdersList = [];
      
      // Process each order to fetch additional details and categorize
      for (const order of customerOrders) {
        try {
          let processedOrder = { ...order };
          
          // Fetch related weeklyMenu details if available
          if (order.weeklyMenu) {
            try {
              let weeklyMenuDoc;
              
              try {
                // Try to fetch the weekly menu directly using its ID
                weeklyMenuDoc = await databases.getDocument(
                  DATABASE_ID,
                  WEEKLY_MENU_COLLECTION_ID,
                  order.weeklyMenu
                );
              } catch (directFetchError) {
                // If direct fetch fails, try to query the collection
                try {
                  const weeklyMenuQuery = await databases.listDocuments(
                    DATABASE_ID,
                    WEEKLY_MENU_COLLECTION_ID,
                    [Query.equal('$id', order.weeklyMenu)]
                  );
                  
                  if (weeklyMenuQuery.documents.length > 0) {
                    weeklyMenuDoc = weeklyMenuQuery.documents[0];
                  }
                } catch (queryError) {
                  console.error(`Error querying for weeklyMenu for order ${order.$id}`);
                }
              }
              
              if (weeklyMenuDoc) {
                processedOrder.weeklyMenuDetails = weeklyMenuDoc;
                
                // Fetch chef details if available
                if (weeklyMenuDoc.chef) {
                  try {
                    const chefDoc = await databases.getDocument(
                      DATABASE_ID,
                      'Chef',
                      weeklyMenuDoc.chef
                    );
                    processedOrder.chefDetails = chefDoc;
                  } catch (chefError) {
                    console.error(`Error fetching chef details for order ${order.$id}`);
                  }
                }
              }
            } catch (menuError) {
              console.error(`Error in weeklyMenu fetch process for order ${order.$id}`);
            }
          }
          
          // Handle order date
          let orderDate;
          
          // Try different date fields
          if (order.delivery_date) {
            orderDate = new Date(order.delivery_date);
          } else if (order.last_modified_at) {
            orderDate = new Date(order.last_modified_at);
          } else if (order.$createdAt) {
            orderDate = new Date(order.$createdAt);
          } else {
            // Default to current date if no date field is available
            orderDate = new Date();
          }
          
          // Format dates for display
          try {
            processedOrder.displayDate = format(orderDate, 'MMM dd, yyyy');
            processedOrder.displayTime = format(orderDate, 'h:mm a');
          } catch (dateError) {
            console.error('Error formatting date:', dateError);
            processedOrder.displayDate = 'Date not available';
            processedOrder.displayTime = 'Time not available';
          }
          
          // Determine if order is for today or upcoming
          // APPROACH 1: Using date strings (ignoring time)
          let isToday = false;
          let isFuture = false;
          
          try {
            // Extract just the date part for string comparison (eliminates timezone issues)
            const orderDateStr = format(orderDate, 'yyyy-MM-dd');
            
            if (orderDateStr === todayStr) {
              isToday = true;
            } else {
              // Compare just the dates to determine if it's in the future
              const orderDateOnly = new Date(orderDateStr);
              const todayDateOnly = new Date(todayStr);
              
              if (orderDateOnly > todayDateOnly) {
                isFuture = true;
              }
            }
          } catch (e) {
            console.error('Error in date string comparison:', e);
          }
          
          // APPROACH 2: Using timestamp comparison
          const orderTimestamp = orderDate.getTime();
          const timestampToday = (orderTimestamp >= startTimestamp && orderTimestamp <= endTimestamp);
          const timestampFuture = orderTimestamp > endTimestamp;
          
          // COMBINED DECISION - Use any approach that indicates it's today's order
          if (isToday || timestampToday) {
            todayOrdersList.push(processedOrder);
          } else if (isFuture || timestampFuture) {
            upcomingOrdersList.push(processedOrder);
          }
        } catch (orderError) {
          console.error('Error processing order:', orderError);
        }
      }
      
      console.log(`Processed ${todayOrdersList.length} today's orders and ${upcomingOrdersList.length} upcoming orders`);
      
      // If we still have no today's orders but have customer orders, add a fallback
      if (todayOrdersList.length === 0 && customerOrders.length > 0) {
        const recentOrder = customerOrders[0]; // Assuming the most recent is first
        
        // Format the order for display
        let processedOrder = { ...recentOrder };
        if (!processedOrder.displayDate) {
          processedOrder.displayDate = 'Today';
        }
        if (!processedOrder.displayTime) {
          processedOrder.displayTime = 'N/A';
        }
        
        todayOrdersList.push(processedOrder);
      }
      
      setTodayOrders(todayOrdersList);
      setUpcomingOrders(upcomingOrdersList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders');
      setLoading(false);
    }
  };

  const renderOrderCard = (order) => {
    // Get appropriate status color
    const statusColor = getStatusColor(order.order_status);
    
    // Get menu and chef details with better fallbacks
    let weeklyMenu = null;
    let menuName = 'Menu not available';
    let chefName = 'Chef info not available';
    
    // First check if we have expanded weeklyMenuDetails
    if (order.weeklyMenuDetails) {
      weeklyMenu = order.weeklyMenuDetails;
      
      // Extract menu name from weeklyMenuDetails
      menuName = weeklyMenu.menu_name || 
               weeklyMenu.name || 
               (weeklyMenu.$id ? `Menu ${weeklyMenu.$id}` : 'Menu ID not available');
               
      // Extract chef from weeklyMenuDetails
      const chef = weeklyMenu.chef || {};
      if (typeof chef === 'object') {
        chefName = chef.name || chef.chef_name || 
                 (chef.$id ? `Chef ${chef.$id}` : 'Chef details not available');
      } else if (typeof chef === 'string') {
        chefName = `Chef ID: ${chef}`;
      }
    } 
    // If no weeklyMenuDetails but there's weeklyMenu ID
    else if (order.weeklyMenu) {
      // Handle the case where weeklyMenu is an array
      if (Array.isArray(order.weeklyMenu)) {
        if (order.weeklyMenu.length > 0) {
          const menuItem = order.weeklyMenu[0];
          
          // Check if the array item has the menu info
          if (menuItem.$id) {
            menuName = `Menu ${menuItem.$id}`;
          } else if (menuItem.id) {
            menuName = `Menu ${menuItem.id}`;
          } else if (menuItem.menu_name) {
            menuName = menuItem.menu_name;
          } else if (menuItem.chefMenu && Array.isArray(menuItem.chefMenu) && menuItem.chefMenu.length > 0) {
            // Try to extract from chefMenu if available
            const firstChefMenu = menuItem.chefMenu[0];
            menuName = firstChefMenu.menu_name || `Menu ${firstChefMenu.$id || 'Unknown'}`;
          } else {
            menuName = 'Menu (in array)';
          }
        } else {
          menuName = 'Menu (empty array)';
        }
      } 
      // Handle object (possibly with $id)
      else if (typeof order.weeklyMenu === 'object') {
        if (order.weeklyMenu.$id) {
          menuName = `Menu ${order.weeklyMenu.$id}`;
        } else if (order.weeklyMenu.id) {
          menuName = `Menu ${order.weeklyMenu.id}`;
        } else {
          menuName = 'Menu (no ID found)';
        }
      } 
      // Handle primitive value
      else {
        menuName = `Menu ${order.weeklyMenu}`;
      }
      
      // If we found a weeklyMenu array with chefMenu data, try to extract chef info
      if (Array.isArray(order.weeklyMenu) && 
          order.weeklyMenu.length > 0 && 
          order.weeklyMenu[0].chefMenu && 
          order.weeklyMenu[0].chefMenu.length > 0) {
        const chef = order.weeklyMenu[0].chef;
        if (chef) {
          if (typeof chef === 'object') {
            chefName = chef.name || chef.chef_name || `Chef ${chef.$id || 'Unknown'}`;
          } else {
            chefName = `Chef ${chef}`;
          }
        }
      }
    }
    
    // Fallback for order display data
    const displayDate = order.displayDate || 'Date not available';
    const displayTime = order.displayTime || 'Time not available';
    
    return (
      <TouchableOpacity key={order.$id} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderType}>{menuName}</Text>
            <Text style={styles.orderId}>Order #{order.$id.substring(0, 8)}</Text>
            <Text style={styles.orderDate}>
              {displayDate} • {displayTime}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{order.order_status || 'Status not set'}</Text>
          </View>
        </View>
        
        <View style={styles.orderDetails}>
          <View style={styles.chefInfo}>
            <Ionicons name="restaurant-outline" size={16} color="#666" />
            <Text style={styles.chefName}>{chefName}</Text>
          </View>
          
          <View style={styles.orderInfo}>
            {/* Show order quantity */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Quantity:</Text>
              <Text style={styles.infoValue}>{order.quantity || 'N/A'}</Text>
            </View>
            
            {/* Show price with currency symbol */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Price:</Text>
              <Text style={styles.infoValue}>${order.price || 'N/A'}</Text>
            </View>
            
            {/* Show payment status with colored indicator */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Payment:</Text>
              <View style={styles.statusContainer}>
                <View 
                  style={[
                    styles.statusIndicator, 
                    { backgroundColor: getPaymentStatusColor(order.payment_status) }
                  ]} 
                />
                <Text style={styles.infoValue}>{order.payment_status || 'N/A'}</Text>
              </View>
            </View>
            
            {/* Show last modified date if available */}
            {order.last_modified_at && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Updated:</Text>
                <Text style={styles.infoValue}>
                  {formatDate(order.last_modified_at)}
                </Text>
              </View>
            )}
            
            {/* Show cancellation reason if available */}
            {order.cancellation_reason && (
              <View style={styles.infoRowColumn}>
                <Text style={styles.infoLabel}>Cancellation Reason:</Text>
                <Text style={styles.infoValueFull}>{order.cancellation_reason}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Helper function to format dates consistently
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get color for payment status
  const getPaymentStatusColor = (status) => {
    if (!status) return '#999';
    
    switch (status.toLowerCase()) {
      case 'paid':
        return '#4CAF50';
      case 'pending':
        return '#FFA500';
      case 'failed':
        return '#F44336';
      case 'refunded':
        return '#2196F3';
      default:
        return '#999';
    }
  };

  const getStatusColor = (status) => {
    if (!status) return '#666';
    
    switch (status.toLowerCase()) {
      case 'preparing':
        return '#FFA500';
      case 'confirmed':
      case 'completed':
        return '#4CAF50';
      case 'scheduled':
        return '#2196F3';
      case 'cancelled':
        return '#F44336';
      case 'pending':
        return '#9E9E9E';
      default:
        return '#666';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>My Orders</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

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

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B6B']}
            tintColor="#FF6B6B"
          />
        }
      >
        {activeTab === 'today' && (
          todayOrders.length > 0 ? (
            todayOrders.map(renderOrderCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={50} color="#ccc" />
              <Text style={styles.emptyStateText}>No orders for today</Text>
              <Text style={styles.emptyStateSubText}>
                Browse available meals to create a new order
              </Text>
            </View>
          )
        )}
        
        {activeTab === 'upcoming' && (
          upcomingOrders.length > 0 ? (
            upcomingOrders.map(renderOrderCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={50} color="#ccc" />
              <Text style={styles.emptyStateText}>No upcoming orders</Text>
              <Text style={styles.emptyStateSubText}>
                Plan ahead by ordering your future meals
              </Text>
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
  orderId: {
    fontSize: 13,
    color: '#888',
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
  orderInfo: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  createOrderButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  createOrderButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
    maxWidth: '80%',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  infoRowColumn: {
    flexDirection: 'column',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  infoValueFull: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
}); 