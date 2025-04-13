import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { databases } from '../../appwrite/config';
import { Query, ID } from 'appwrite';
import { account } from '../../appwrite/config';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID;
const CATEGORY_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_CATEGORY;
const MENU_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_MENU;
const ITEMS_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_ITEMS;
const CHEF_ITEMS_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_CHEF_ITEMS;
const CHEF_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_CHEF;
const CHEF_MENU_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_CHEF_MENU;
const SUBSCRIPTION_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_SUBSCRIPTION;

export default function MenuSubscriptionScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [menus, setMenus] = useState([]);
  const [items, setItems] = useState([]);
  const [chefMenus, setChefMenus] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [showMenuItems, setShowMenuItems] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [showEditPrice, setShowEditPrice] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get current user's ID
      const user = await account.get();
      const personId = user.$id;

      // Get chef document for current user
      const chefQuery = await databases.listDocuments(
        DATABASE_ID,
        CHEF_COLLECTION_ID,
        [Query.equal('person_id', personId)]
      );

      if (chefQuery.documents.length > 0) {
        const chefId = chefQuery.documents[0].$id;
        
        // Fetch chef's menus
        const chefMenusResponse = await databases.listDocuments(
          DATABASE_ID,
          CHEF_MENU_COLLECTION_ID,
          [Query.equal('chef', chefId)]
        );
        setChefMenus(chefMenusResponse.documents);

        // Get all chef menu IDs
        const chefMenuIds = chefMenusResponse.documents.map(menu => menu.$id);

        // Fetch all subscriptions
        const subscriptionsResponse = await databases.listDocuments(
          DATABASE_ID,
          SUBSCRIPTION_COLLECTION_ID
        );
        
        // Filter subscriptions that contain any of the chef's menu IDs
        const chefSubscriptions = subscriptionsResponse.documents.filter(subscription => {
          if (!subscription.chefMenu || !Array.isArray(subscription.chefMenu)) {
            return false;
          }
          
          // Check if any of the chefMenu objects contain the chef's menu IDs
          return subscription.chefMenu.some(menu => {
            // If menu is an object, check its $id
            if (menu && typeof menu === 'object' && menu.$id) {
              return chefMenuIds.includes(menu.$id);
            }
            // If menu is a string (ID), check directly
            return chefMenuIds.includes(menu);
          });
        });
        
        console.log('Chef Menu IDs:', chefMenuIds);
        console.log('All Subscriptions:', JSON.stringify(subscriptionsResponse.documents, null, 2));
        console.log('Filtered Subscriptions:', chefSubscriptions);
        
        setSubscriptions(chefSubscriptions);
      }

      // Fetch categories
      const categoriesResponse = await databases.listDocuments(
        DATABASE_ID,
        CATEGORY_COLLECTION_ID
      );
      setCategories(categoriesResponse.documents);

      // Fetch menus
      const menusResponse = await databases.listDocuments(
        DATABASE_ID,
        MENU_COLLECTION_ID
      );
      setMenus(menusResponse.documents);

      // Fetch items
      const itemsResponse = await databases.listDocuments(
        DATABASE_ID,
        ITEMS_COLLECTION_ID
      );
      setItems(itemsResponse.documents);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getMenusForCategory = (categoryId) => {
    return menus.filter(menu => menu.category.$id === categoryId);
  };

  const handleMenuPress = (menu) => {
    setSelectedMenu(menu);
    setShowModal(true);
  };

  const handleAddMenuItems = () => {
    setShowMenuItems(!showMenuItems);
  };

  const handleAddToChefItems = async () => {
    try {
      // Get current user's ID
      const user = await account.get();
      const personId = user.$id;

      // Get chef document for current user
      const chefQuery = await databases.listDocuments(
        DATABASE_ID,
        CHEF_COLLECTION_ID,
        [Query.equal('person_id', personId)]
      );

      if (!chefQuery.documents.length) {
        Alert.alert('Error', 'Chef profile not found');
        return;
      }

      const chefId = chefQuery.documents[0].$id;
      const menuItems = getItemsForMenu(selectedMenu.items);
      
      // Create chef items first
      const chefItemIds = [];
      for (const item of menuItems) {
        const chefItemDoc = await databases.createDocument(
          DATABASE_ID,
          CHEF_ITEMS_COLLECTION_ID,
          ID.unique(),
          {
            item_id: item.$id,
            quantity: item.quantity,
            measurement_unit: item.measurement_unit,
            status: 'pending'
          }
        );
        chefItemIds.push(chefItemDoc.$id);
      }

      // Create chef menu with all relationships
      await databases.createDocument(
        DATABASE_ID,
        CHEF_MENU_COLLECTION_ID,
        ID.unique(),
        {
          menu_name: selectedMenu.menu_name,
          chef: chefId,
          price: selectedMenu.price,
          description: selectedMenu.description,
          category_id: selectedMenu.category.$id,
          chef_item_ids: chefItemIds
        }
      );
      
      Alert.alert('Success', 'Menu added to chef menu successfully!');
      setShowModal(false);
      fetchData(); // Refresh the data
    } catch (error) {
      console.error('Error adding menu:', error);
      Alert.alert('Error', 'Failed to add menu to chef menu');
    }
  };

  const getItemsForMenu = (menuItems) => {
    if (!menuItems || !Array.isArray(menuItems)) {
      return [];
    }
    return menuItems;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Menu & Subscriptions</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Subscriptions</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('AddSubscription')}
            >
              <Ionicons name="add-circle" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
          {subscriptions.length > 0 ? (
            subscriptions.map(subscription => (
              <TouchableOpacity 
                key={subscription.$id} 
                style={styles.subscriptionCard}
                onPress={() => handleMenuPress(subscription)}
              >
                <View style={styles.subscriptionInfo}>
                  <Text style={styles.subscriptionName}>{subscription.subscription_name}</Text>
                  <Text style={styles.subscriptionDetails}>
                    {subscription.days_per_week} days/week • {subscription.total_days} days total
                  </Text>
                  <Text style={styles.subscriptionPrice}>${subscription.price}</Text>
                  <View style={styles.subscriptionDays}>
                    {subscription.available_days.map((day, index) => (
                      <Text key={index} style={styles.dayTag}>
                        {day.slice(0, 3)}
                      </Text>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No active subscriptions</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Menu Items</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddMenuItems}
            >
              <Ionicons 
                name={showMenuItems ? "close-circle" : "add-circle"} 
                size={24} 
                color="#FF6B6B" 
              />
            </TouchableOpacity>
          </View>
          {showMenuItems ? (
            categories.map(category => {
              const categoryMenus = getMenusForCategory(category.$id);
              return (
                <View key={category.$id} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>{category.category_name}</Text>
                  {categoryMenus.length > 0 ? (
                    categoryMenus.map(menu => (
                      <TouchableOpacity 
                        key={menu.$id} 
                        style={styles.menuCard}
                        onPress={() => handleMenuPress(menu)}
                      >
                        <Image 
                          source={{ uri: menu.image_url }} 
                          style={styles.menuImage}
                        />
                        <View style={styles.menuInfo}>
                          <Text style={styles.menuName}>{menu.menu_name}</Text>
                          <Text style={styles.menuDescription}>{menu.description}</Text>
                          <Text style={styles.menuPrice}>${menu.price}</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No menus in this category</Text>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View>
              {chefMenus.length > 0 ? (
                chefMenus.map(menu => (
                  <TouchableOpacity 
                    key={menu.$id} 
                    style={styles.menuCard}
                    onPress={() => handleMenuPress(menu)}
                  >
                    <View style={styles.menuInfo}>
                      <Text style={styles.menuName}>{menu.menu_name}</Text>
                      <Text style={styles.menuDescription}>{menu.description}</Text>
                      <Text style={styles.menuPrice}>${menu.price}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No menu items added yet</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedMenu?.subscription_name || selectedMenu?.menu_name}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedMenu?.image_url && (
              <Image 
                source={{ uri: selectedMenu.image_url }} 
                style={styles.modalImage}
              />
            )}

            <Text style={styles.modalDescription}>
              {selectedMenu?.description}
            </Text>

            <View style={styles.modalPriceContainer}>
              <Text style={styles.modalPrice}>
                ${selectedMenu?.price}
              </Text>
              {!selectedMenu?.subscription_name && (
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => setShowEditPrice(!showEditPrice)}
                >
                  <Ionicons name="pencil" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              )}
            </View>

            {showEditPrice && (
              <View style={styles.editPriceContainer}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Enter new price"
                  keyboardType="numeric"
                  value={newPrice}
                  onChangeText={setNewPrice}
                />
                <TouchableOpacity style={styles.updateButton}>
                  <Text style={styles.updateButtonText}>Update Price</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.modalSubtitle}>Items:</Text>
            <View style={styles.modalItemsList}>
              {selectedMenu && getItemsForMenu(selectedMenu.items).map(item => (
                <Text key={item.$id} style={styles.modalItemText}>
                  • {item.item_name} ({item.quantity} {item.measurement_unit})
                </Text>
              ))}
            </View>

            {!selectedMenu?.subscription_name && (
              <TouchableOpacity 
                style={styles.addToChefButton}
                onPress={handleAddToChefItems}
              >
                <Text style={styles.addToChefButtonText}>Add to the menu list</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    padding: 5,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  menuCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  menuInfo: {
    flex: 1,
  },
  menuName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  menuPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  modalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  editButton: {
    marginLeft: 10,
  },
  editPriceContainer: {
    marginBottom: 15,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  updateButton: {
    backgroundColor: '#FF6B6B',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  modalItemsList: {
    marginBottom: 20,
  },
  modalItemText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  addToChefButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToChefButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  subscriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    padding: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subscriptionDetails: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
    backgroundColor: '#FFF5F5',
    padding: 8,
    borderRadius: 8,
  },
  subscriptionPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 12,
    backgroundColor: '#FFE5E5',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  subscriptionDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayTag: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
}); 