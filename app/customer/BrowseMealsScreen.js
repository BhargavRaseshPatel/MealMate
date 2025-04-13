import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { databases, account } from '../../services/appwrite';
import { Query, ID } from 'appwrite';
import { format, parseISO } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID;
const WEEKLY_MENU_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_WEEKLY_MENU;
const CHEF_MENU_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_CHEF_MENU;
const ORDER_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_ORDER;

export default function BrowseMealsScreen({ navigation }) {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [orderLoading, setOrderLoading] = useState(false);

  // Use useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchTodaysMeals();
    }, [])
  );

  // Initial data fetch
  useEffect(() => {
    fetchTodaysMeals();
  }, []);

  const fetchTodaysMeals = async () => {
    try {
      setLoading(true);
      
      // Get today's date in YYYY-MM-DD format
      const today = format(new Date(), 'yyyy-MM-dd');

      // Fetch all weekly menus
      const allWeeklyMenus = await databases.listDocuments(
        DATABASE_ID,
        WEEKLY_MENU_COLLECTION_ID
      );

      // Check if there are any weekly menus
      if (allWeeklyMenus.documents.length === 0) {
        setMeals([]);
        setLoading(false);
        return;
      }

      // Query weekly menu for today's date
      const weeklyMenuQuery = await databases.listDocuments(
        DATABASE_ID,
        WEEKLY_MENU_COLLECTION_ID,
        [Query.equal('menu_date', today)]
      );

      if (weeklyMenuQuery.documents.length === 0) {
        // If no meals found for today, just show all available meals
        const allChefMenuData = allWeeklyMenus.documents.map(doc => {
          if (doc.chefMenu && Array.isArray(doc.chefMenu)) {
            const chefMenuDoc = doc.chefMenu[0];
            return {
              id: chefMenuDoc.$id,
              menuDate: doc.menu_date,
              weeklyMenuId: doc.$id
            };
          }
          return null;
        }).filter(data => data !== null);
        
        if (allChefMenuData.length === 0) {
          setMeals([]);
          setLoading(false);
          return;
        }
        
        // Fetch all chef menu documents
        const allChefMenus = await Promise.all(
          allChefMenuData.map(async (data) => {
            try {
              const chefMenuDoc = await databases.getDocument(
                DATABASE_ID,
                CHEF_MENU_COLLECTION_ID,
                data.id
              );
              return {
                ...chefMenuDoc,
                menuDate: data.menuDate,
                weeklyMenuId: data.weeklyMenuId
              };
            } catch (error) {
              console.error('Error fetching chef menu:', error);
              return null;
            }
          })
        );
        
        const validAllChefMenus = allChefMenus.filter(menu => menu !== null);
        const uniqueAllChefMenus = Array.from(new Map(validAllChefMenus.map(menu => 
          [`${menu.$id}-${menu.weeklyMenuId}`, menu]
        )).values());
        
        setMeals(uniqueAllChefMenus);
        setLoading(false);
        return;
      }

      // Get all chef menu IDs from weekly menus with their dates
      const chefMenuData = weeklyMenuQuery.documents.map(doc => {
        // Check if chefMenu exists and is an array
        if (doc.chefMenu && Array.isArray(doc.chefMenu)) {
          // Extract just the ID from the chef menu document
          const chefMenuDoc = doc.chefMenu[0];
          return {
            id: chefMenuDoc.$id,
            menuDate: doc.menu_date,
            weeklyMenuId: doc.$id // Add weekly menu ID for uniqueness
          };
        }
        return null;
      }).filter(data => data !== null);

      if (chefMenuData.length === 0) {
        setMeals([]);
        setLoading(false);
        return;
      }

      // Fetch all chef menu documents
      const chefMenus = await Promise.all(
        chefMenuData.map(async (data) => {
          try {
            const chefMenuDoc = await databases.getDocument(
              DATABASE_ID,
              CHEF_MENU_COLLECTION_ID,
              data.id
            );
            return {
              ...chefMenuDoc,
              menuDate: data.menuDate,
              weeklyMenuId: data.weeklyMenuId // Include weekly menu ID in final object
            };
          } catch (error) {
            console.error('Error fetching chef menu:', error);
            return null;
          }
        })
      );

      // Filter out any null values from failed fetches and ensure uniqueness
      const validChefMenus = chefMenus.filter(menu => menu !== null);
      const uniqueChefMenus = Array.from(new Map(validChefMenus.map(menu => 
        [`${menu.$id}-${menu.weeklyMenuId}`, menu]
      )).values());
      
      setMeals(uniqueChefMenus);
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchTodaysMeals:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleMealPress = (meal) => {
    setSelectedMeal(meal);
    setModalVisible(true);
  };

  const createOrder = async () => {
    try {
      setOrderLoading(true);
      
      // Get current user
      const currentUser = await account.get();
      
      if (!currentUser) {
        Alert.alert("Error", "You need to be logged in to place an order");
        return;
      }
      
      console.log("Current user:", currentUser);
      
      // Fetch customer document based on person_id (which is the user's ID)
      const customerQuery = await databases.listDocuments(
        DATABASE_ID,
        process.env.EXPO_PUBLIC_COLLECTION_ID_CUSTOMER,
        [Query.equal("person_id", currentUser.$id)]
      );
      
      console.log("Customer query result:", customerQuery);
      
      if (customerQuery.documents.length === 0) {
        Alert.alert("Error", "Customer profile not found. Please complete your profile setup.");
        return;
      }
      
      const customerDoc = customerQuery.documents[0];
      console.log("Customer document:", customerDoc);
      
      const totalPrice = selectedMeal.price * parseInt(quantity);
      
      // Create order document
      const orderData = {
        quantity: parseInt(quantity),
        price: totalPrice,
        order_status: "pending",
        payment_status: "unpaid",
        last_modified_at: new Date().toISOString(),
        weeklyMenu: [selectedMeal.weeklyMenuId],
        customer: [customerDoc.$id], // Using customer document ID
        chef: [selectedMeal.chef.$id] // Using chef document ID
      };
      
      console.log("Order data to be created:", orderData);
      
      const newOrder = await databases.createDocument(
        DATABASE_ID,
        ORDER_COLLECTION_ID,
        ID.unique(),
        orderData
      );
      
      console.log("Order created:", newOrder);
      
      // Close modal and show success message
      setModalVisible(false);
      setSelectedMeal(null);
      setQuantity('1');
      
      Alert.alert(
        "Order Placed",
        "Your order has been successfully placed.",
        [
          { 
            text: "OK", 
            onPress: () => navigation.navigate("Orders") 
          }
        ]
      );
      
    } catch (error) {
      console.error("Error creating order:", error);
      Alert.alert("Error", "Failed to create order: " + error.message);
    } finally {
      setOrderLoading(false);
    }
  };

  const renderMealItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.mealCard}
        onPress={() => handleMealPress(item)}
      >
        <View style={styles.mealInfo}>
          <Text style={styles.mealName}>{item.menu_name}</Text>
          <Text style={styles.description}>{item.description}</Text>
          
          <View style={styles.detailsContainer}>
            <View style={styles.menuItemsContainer}>
              <Text style={styles.sectionTitle}>Menu Items:</Text>
              {item.chefItem?.map((menuItem, index) => (
                <View key={index} style={styles.menuItemRow}>
                  <Text style={styles.itemName}>{menuItem.chef_item_name}</Text>
                  <Text style={styles.itemValue}>{menuItem.quantity} {menuItem.measurement_unit}</Text>
                </View>
              ))}
              {(!item.chefItem || item.chefItem.length === 0) && (
                <Text style={styles.menuItems}>No items available</Text>
              )}
            </View>
            
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color="#666" style={styles.icon} />
                <Text style={styles.infoText}>Chef: {item.chef?.person_id}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="pricetag-outline" size={16} color="#666" style={styles.icon} />
                <Text style={styles.infoText}>Category: {item.category?.category_name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#666" style={styles.icon} />
                <Text style={styles.infoText}>Available on: {format(new Date(item.menuDate), "dd MMM yyyy")}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${item.price}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const OrderModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Place Order</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {selectedMeal && (
            <>
              <Text style={styles.modalMealName}>{selectedMeal.menu_name}</Text>
              <Text style={styles.modalPrice}>${selectedMeal.price} per serving</Text>
              
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>Quantity:</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalPrice}>
                  ${(selectedMeal.price * parseInt(quantity || 0)).toFixed(2)}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.orderButton}
                onPress={createOrder}
                disabled={orderLoading}
              >
                <Text style={styles.orderButtonText}>
                  {orderLoading ? "Processing..." : "Place Order"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Today's Meals</Text>
      </View>
      
      {loading ? (
        <View style={styles.content}>
          <Text style={styles.text}>Loading meals...</Text>
        </View>
      ) : error ? (
        <View style={styles.content}>
          <Text style={styles.text}>Error: {error}</Text>
        </View>
      ) : meals.length === 0 ? (
        <View style={styles.content}>
          <Text style={styles.text}>No meals available for today</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <FlatList
            data={meals}
            renderItem={renderMealItem}
            keyExtractor={item => `${item.$id}-${item.weeklyMenuId}`}
            contentContainerStyle={styles.listContainer}
          />
        </View>
      )}
      
      <OrderModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  detailsContainer: {
    marginTop: 10,
  },
  menuItemsContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
  },
  menuItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
  },
  itemValue: {
    fontSize: 15,
    color: '#666',
    textAlign: 'right',
  },
  menuItems: {
    fontSize: 15,
    color: '#666',
    lineHeight: 20,
  },
  infoContainer: {
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#666',
  },
  priceContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  text: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalMealName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  modalPrice: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: 16,
    color: '#444',
    width: 80,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    width: 70,
    textAlign: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  orderButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  orderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 