import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Modal, Alert, TextInput } from 'react-native';
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

export default function MenuSubscriptionScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [menus, setMenus] = useState([]);
  const [items, setItems] = useState([]);
  const [chefMenus, setChefMenus] = useState([]);
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
        console.log('Chef Menus:', chefMenusResponse.documents);
        setChefMenus(chefMenusResponse.documents);
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

  const handleAddMenuItems = () => {
    if (!showMenuItems) {
      fetchData();
    }
    setShowMenuItems(!showMenuItems);
  };

  const handleMenuPress = (menu) => {
    setSelectedMenu(menu);
    setNewPrice(menu.price.toString());
    setShowModal(true);
  };

  const handleUpdatePrice = async () => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        MENU_COLLECTION_ID,
        selectedMenu.$id,
        {
          price: parseFloat(newPrice)
        }
      );
      
      // Update local state
      setMenus(menus.map(menu => 
        menu.$id === selectedMenu.$id 
          ? { ...menu, price: parseFloat(newPrice) }
          : menu
      ));
      
      Alert.alert('Success', 'Price updated successfully!');
      setShowEditPrice(false);
    } catch (error) {
      console.error('Error updating price:', error);
      Alert.alert('Error', 'Failed to update price');
    }
  };

  const handleAddToChefItems = async () => {
    try {
      console.log('Starting to add menu to chef items...');
      
      // Get the current user's ID
      const user = await account.get();
      const personId = user.$id;
      console.log('Current user ID:', personId);

      // Get the chef document for the current user
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
      console.log('Found chef ID:', chefId);

      // Create chef items first
      const chefItemIds = [];
      console.log('Selected menu items:', selectedMenu.items);
      
      for (const item of selectedMenu.items) {
        console.log('Creating chef item for:', item);
        const chefItemDoc = await databases.createDocument(
          DATABASE_ID,
          CHEF_ITEMS_COLLECTION_ID,
          ID.unique(),
          {
            chef_item_name: item.item_name,
            quantity: item.quantity,
            measurement_unit: item.measurement_unit
          }
        );
        chefItemIds.push(chefItemDoc.$id);
        console.log('Created chef item with ID:', chefItemDoc.$id);
      }

      console.log('All chef item IDs:', chefItemIds);

      // Create chef menu with all relationships
      console.log('Creating chef menu with data:', {
        menu_name: selectedMenu.menu_name,
        chef: chefId,
        price: selectedMenu.price,
        description: selectedMenu.description,
        category: selectedMenu.category.$id,
        chefItem: chefItemIds
      });

      await databases.createDocument(
        DATABASE_ID,
        CHEF_MENU_COLLECTION_ID,
        ID.unique(),
        {
          menu_name: selectedMenu.menu_name,
          chef: chefId,
          price: selectedMenu.price,
          description: selectedMenu.description,
          category: selectedMenu.category.$id,
          chefItem: chefItemIds
        }
      );
      
      Alert.alert('Success', 'Menu added to chef menu successfully!');
      setShowModal(false);
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

  const getMenusForCategory = (categoryId) => {
    return menus.filter(menu => menu.category.$id === categoryId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu & Subscriptions</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Subscriptions</Text>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add-circle" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No active subscriptions</Text>
          </View>
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
                      <View style={styles.itemsList}>
                        {menu.chefItem.map((itemId, index) => {
                          const item = items.find(i => i.$id === itemId);
                          return item ? (
                            <Text key={index} style={styles.itemText}>
                              • {item.item_name} ({item.quantity} {item.measurement_unit})
                            </Text>
                          ) : null;
                        })}
                      </View>
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
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedMenu?.menu_name}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Image 
              source={{ uri: selectedMenu?.image_url }} 
              style={styles.modalImage}
            />
            
            <Text style={styles.modalDescription}>{selectedMenu?.description}</Text>
            
            <View style={styles.priceSection}>
              <Text style={styles.modalPrice}>${selectedMenu?.price}</Text>
              <TouchableOpacity 
                style={styles.editPriceButton}
                onPress={() => setShowEditPrice(!showEditPrice)}
              >
                <Ionicons name="pencil" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </View>

            {showEditPrice && (
              <View style={styles.editPriceContainer}>
                <TextInput
                  style={styles.priceInput}
                  value={newPrice}
                  onChangeText={setNewPrice}
                  keyboardType="numeric"
                  placeholder="Enter new price"
                />
                <TouchableOpacity 
                  style={styles.updatePriceButton}
                  onPress={handleUpdatePrice}
                >
                  <Text style={styles.updatePriceButtonText}>Update Price</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <Text style={styles.modalSubtitle}>Items:</Text>
            <View style={styles.modalItemsList}>
              {selectedMenu && selectedMenu.items.map((item, index) => (
                <Text key={index} style={styles.modalItemText}>
                  • {item.item_name} ({item.quantity} {item.measurement_unit})
                </Text>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.addToChefButton}
              onPress={handleAddToChefItems}
            >
              <Text style={styles.addToChefButtonText}>Add to the menu list</Text>
            </TouchableOpacity>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
  emptyState: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  menuCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  menuImage: {
    width: 120,
    height: 120,
  },
  menuInfo: {
    flex: 1,
    padding: 15,
  },
  menuName: {
    fontSize: 18,
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
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  modalPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 15,
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  modalItemsList: {
    marginBottom: 20,
  },
  modalItemText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  editPriceButton: {
    marginLeft: 10,
    padding: 5,
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
  updatePriceButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  updatePriceButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  addToChefButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  addToChefButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  itemsList: {
    marginTop: 10,
  },
  itemText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
}); 