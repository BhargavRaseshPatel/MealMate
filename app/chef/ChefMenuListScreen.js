import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Modal, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { databases, account } from '../../services/appwrite';
import { Query, ID } from 'appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID;
const CHEF_MENU_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_CHEF_MENU;
const CHEF_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_CHEF;
const MENU_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_MENU;
const CHEF_ITEM_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_CHEF_ITEM || 'Chef_Item';

// Log the Appwrite services initialization
console.log('Appwrite services status:');
console.log('databases service initialized:', !!databases);
console.log('account service initialized:', !!account);

export default function ChefMenuListScreen({ navigation, route }) {
  const [chefMenus, setChefMenus] = useState([]);
  const [availableMenus, setAvailableMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAvailableMenus, setShowAvailableMenus] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [menuPrice, setMenuPrice] = useState('');
  const [chefId, setChefId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Log environment variables to verify they are loaded correctly
    console.log('Environment variables check:');
    console.log('DATABASE_ID:', DATABASE_ID);
    console.log('CHEF_MENU_COLLECTION_ID:', CHEF_MENU_COLLECTION_ID);
    console.log('CHEF_COLLECTION_ID:', CHEF_COLLECTION_ID);
    console.log('MENU_COLLECTION_ID:', MENU_COLLECTION_ID);
    console.log('CHEF_ITEM_COLLECTION_ID:', CHEF_ITEM_COLLECTION_ID);
    
    fetchChefMenus();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchChefMenus().finally(() => {
      setRefreshing(false);
    });
  }, []);

  const fetchChefMenus = async () => {
    try {
      setLoading(true);
      
      // Get the current user
      const currentUser = await account.get();
      
      // Find the chef document for this user
      const chefQuery = await databases.listDocuments(
        DATABASE_ID,
        'Chef',
        [Query.equal('person_id', currentUser.$id)]
      );
      
      if (chefQuery.documents.length === 0) {
        setError('No chef profile found');
        setLoading(false);
        return;
      }
      
      const chef = chefQuery.documents[0];
      setChefId(chef.$id);
      
      // Get all chef menus for this chef
      const chefMenusResponse = await databases.listDocuments(
        DATABASE_ID,
        CHEF_MENU_COLLECTION_ID,
        [Query.equal('chef', chef.$id)]
      );
      
      // Process and set the data
      setChefMenus(chefMenusResponse.documents);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chef menus:', error);
      setError('Failed to load menus');
      setLoading(false);
    }
  };

  const handleAddMenu = () => {
    setShowAvailableMenus(!showAvailableMenus);
  };

  const selectMenu = async (menu) => {
    try {
      setSelectedMenu(menu);
      
      // Try to fetch complete menu data including items
      let completeMenu = menu;
      
      // If the menu already has items, use those
      if (menu.items && Array.isArray(menu.items) && menu.items.length > 0) {
        return;
      }
      
      // Otherwise, fetch the menu again to get full details
      try {
        const menuDoc = await databases.getDocument(
          DATABASE_ID,
          MENU_COLLECTION_ID, 
          menu.$id || menu.id
        );
        
        completeMenu = menuDoc;
        
        // Check if menu document has items
        if (menuDoc.items && Array.isArray(menuDoc.items) && menuDoc.items.length > 0) {
          return;
        }
      } catch (error) {
        console.error('Error fetching complete menu:', error);
      }
      
      // If we still don't have items, try to fetch them from Menu_Item collection
      try {
        const menuItemsResponse = await databases.listDocuments(
          DATABASE_ID,
          'Menu_Item',
          [Query.equal('menu', menu.$id || menu.id)]
        );
        
        if (menuItemsResponse.documents.length > 0) {
          return;
        }
      } catch (error) {
        console.error('Error fetching menu items from Menu_Item:', error);
      }
      
      // Try another collection name as fallback
      try {
        const menuItemsResponse2 = await databases.listDocuments(
          DATABASE_ID,
          'MenuItem',
          [Query.equal('menu', menu.$id || menu.id)]
        );
        
        if (menuItemsResponse2.documents.length > 0) {
          return;
        }
      } catch (error) {
        console.error('Error fetching menu items from MenuItem:', error);
      }
      
      // Check if menu has itemsData or menuItems property
      if (completeMenu.itemsData && Array.isArray(completeMenu.itemsData) && completeMenu.itemsData.length > 0) {
        return;
      }
      
      if (completeMenu.menuItems && Array.isArray(completeMenu.menuItems) && completeMenu.menuItems.length > 0) {
        return;
      }
      
      // If all attempts fail, set empty array for items
      return;
      
    } catch (error) {
      console.error('Error selecting menu:', error);
    }
  };

  const addMenuToChef = async () => {
    if (!selectedMenu || !chefId) {
      Alert.alert('Error', 'Please select a menu first');
      return;
    }
    
    try {
      setIsAdding(true);
      
      // Create a new Chef_Menu document
      const chefMenuData = {
        chef: chefId,
        menu: selectedMenu.$id || selectedMenu.id,
        menu_name: selectedMenu.menu_name || selectedMenu.name || 'Unnamed Menu',
        description: selectedMenu.description || '',
        price: selectedMenu.price || 0,
        image: selectedMenu.image || '',
        active: true
      };
      
      // Create the Chef_Menu document
      const chefMenuResponse = await databases.createDocument(
        DATABASE_ID,
        CHEF_MENU_COLLECTION_ID,
        ID.unique(),
        chefMenuData
      );
      
      // Process items from the menu
      let items = [];
      
      // Try to get items from selectedMenu.items
      if (selectedMenu.items && Array.isArray(selectedMenu.items) && selectedMenu.items.length > 0) {
        items = selectedMenu.items;
      } 
      // If no items, use menuItems from state
      else if (menuItems.length > 0) {
        items = menuItems;
      } 
      // If still no items, use fallback test items
      else {
        items = [
          { 
            name: 'Test Item 1', 
            price: 10, 
            description: 'A test item for the menu' 
          },
          { 
            name: 'Test Item 2', 
            price: 15, 
            description: 'Another test item' 
          }
        ];
      }
      
      // Add each item to Chef_Item collection
      for (const item of items) {
        // Extract item name from various possible sources
        const itemName = item.chef_item_name || item.item_name || item.name || 'Unnamed Item';
        
        // Create Chef_Item document
        await databases.createDocument(
          DATABASE_ID,
          'Chef_Item',
          ID.unique(),
          {
            chef_menu: chefMenuResponse.$id,
            chef: chefId,
            chef_item_name: itemName,
            description: item.description || '',
            price: item.price || 0,
            image: item.image || '',
            active: true
          }
        );
      }
      
      // Refresh the chef menus list
      await fetchChefMenus();
      
      // Reset selection
      setSelectedMenu(null);
      setMenuItems([]);
      
      Alert.alert('Success', 'Menu added to your profile');
      
    } catch (error) {
      console.error('Error adding menu to chef:', error);
      Alert.alert('Error', 'Failed to add menu: ' + error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const updateMenuPrice = async (menuId, newPrice) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        CHEF_MENU_COLLECTION_ID,
        menuId,
        {
          price: parseFloat(newPrice)
        }
      );
      
      Alert.alert('Success', 'Menu price updated successfully!');
      fetchChefMenus(); // Refresh the menu list
      
      // Call the callback from the route params if it exists
      if (route.params?.onMenuSelected) {
        route.params.onMenuSelected();
      }
    } catch (error) {
      console.error('Error updating menu price:', error);
      Alert.alert('Error', 'Failed to update menu price');
    }
  };

  const handleEditPrice = (menu) => {
    setSelectedMenu(menu);
    setMenuPrice(menu.price ? menu.price.toString() : '');
    setShowModal(true);
  };

  const renderMenuCard = (menu) => {
    return (
      <TouchableOpacity 
        style={styles.menuCard}
        onPress={() => handleEditPrice(menu)}
      >
        <View style={styles.menuHeader}>
          <Text style={styles.menuName}>{menu.menu_name || 'Unnamed Menu'}</Text>
        </View>
        
        <View style={styles.menuDetails}>
          <Text style={styles.menuCategory}>
            Category: {menu.category?.category_name || 'Uncategorized'}
          </Text>
          <Text style={styles.menuDescription}>{menu.description || 'No description available'}</Text>
          <Text style={styles.menuPrice}>${menu.price || 'N/A'}</Text>
          
          {menu.chefItem && menu.chefItem.length > 0 && (
            <View style={styles.ingredientsContainer}>
              <Text style={styles.ingredientsTitle}>Ingredients:</Text>
              {menu.chefItem.map((item, itemIndex) => {
                // Handle item whether it's a string ID, full object, or expanded object with $id
                let itemName = 'Unnamed Item';
                let itemQuantity = '';
                let itemUnit = '';
                
                if (typeof item === 'string') {
                  // It's just an ID reference
                  itemName = `Item ${itemIndex + 1}`;
                } else if (item) {
                  // It's a full object or expanded relation
                  itemName = item.chef_item_name || `Item ${itemIndex + 1}`;
                  itemQuantity = item.quantity !== undefined ? item.quantity : '';
                  itemUnit = item.measurement_unit || '';
                }
                
                return (
                  <View key={itemIndex} style={styles.ingredientItem}>
                    <Text style={styles.ingredientName}>{itemName}</Text>
                    <Text style={styles.ingredientQuantity}>
                      {itemQuantity} {itemUnit}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderAvailableMenuCard = (menu) => {
    return (
      <TouchableOpacity 
        style={styles.availableMenuCard}
        onPress={() => selectMenu(menu)}
      >
        <View style={styles.menuHeader}>
          <Text style={styles.menuName}>{menu.menu_name || 'Unnamed Menu'}</Text>
        </View>
        
        {menu.image_url && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: menu.image_url }} 
              style={styles.menuImage} 
              resizeMode="cover"
            />
          </View>
        )}
        
        <View style={styles.menuDetails}>
          <Text style={styles.menuCategory}>
            Category: {menu.category?.category_name || 'Uncategorized'}
          </Text>
          <Text style={styles.menuDescription}>{menu.description || 'No description available'}</Text>
          <Text style={styles.menuPrice}>${menu.price || 'N/A'}</Text>
          
          {/* Display menu items if they exist */}
          {menu.items && menu.items.length > 0 && (
            <View style={styles.ingredientsContainer}>
              <Text style={styles.ingredientsTitle}>Menu Items:</Text>
              {menu.items.map((item, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Text style={styles.ingredientName}>{item.item_name || `Item ${index + 1}`}</Text>
                  <Text style={styles.ingredientQuantity}>
                    {item.quantity || ''} {item.measurement_unit || ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Chef Menus</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading menus...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Chef Menus</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B6B']}
            tintColor="#FF6B6B"
            progressBackgroundColor="#ffffff"
          />
        }
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {showAvailableMenus ? 'Available Menu Templates' : 'Your Menus'}
            </Text>
            <TouchableOpacity 
              style={styles.toggleButton}
              onPress={handleAddMenu}
            >
              <View style={styles.toggleButtonContent}>
                <Ionicons 
                  name={showAvailableMenus ? "arrow-back" : "add-circle"} 
                  size={24} 
                  color="#FF6B6B" 
                />
                <Text style={styles.toggleButtonText}>
                  {showAvailableMenus ? "Back to Menus" : "Add New Menu"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {showAvailableMenus ? (
            <View>
              {availableMenus.length > 0 ? (
                availableMenus.map(menu => renderAvailableMenuCard(menu))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No menu templates available</Text>
                </View>
              )}
            </View>
          ) : (
            <View>
              {chefMenus.length > 0 ? (
                chefMenus.map(menu => renderMenuCard(menu))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No chef menus added yet</Text>
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
              <Text style={styles.modalTitle}>{selectedMenu?.menu_name || 'Edit Menu'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedMenu?.image_url && !selectedMenu.chef && (
              <Image 
                source={{ uri: selectedMenu.image_url }} 
                style={styles.modalImage} 
                resizeMode="cover"
              />
            )}

            <Text style={styles.modalCategory}>
              Category: {selectedMenu?.category?.category_name || 'Uncategorized'}
            </Text>

            <Text style={styles.modalDescription}>
              {selectedMenu?.description || 'No description available'}
            </Text>
            
            {/* Display menu items */}
            {selectedMenu && (
              <View style={styles.ingredientsContainer}>
                <Text style={styles.ingredientsTitle}>
                  {selectedMenu.chef ? 'Chef Items:' : 'Menu Items:'}
                </Text>
                
                {/* Display chef items */}
                {selectedMenu.chefItem && selectedMenu.chefItem.length > 0 && (
                  selectedMenu.chefItem.map((item, index) => {
                    // Handle item whether it's a string ID, full object, or expanded object with $id
                    let itemName = 'Unnamed Item';
                    let itemQuantity = '';
                    let itemUnit = '';
                    
                    if (typeof item === 'string') {
                      // It's just an ID reference
                      itemName = `Item ${index + 1}`;
                    } else if (item) {
                      // It's a full object or expanded relation
                      itemName = item.chef_item_name || `Item ${index + 1}`;
                      itemQuantity = item.quantity !== undefined ? item.quantity : '';
                      itemUnit = item.measurement_unit || '';
                    }
                    
                    return (
                      <View key={index} style={styles.ingredientItem}>
                        <Text style={styles.ingredientName}>{itemName}</Text>
                        <Text style={styles.ingredientQuantity}>
                          {itemQuantity} {itemUnit}
                        </Text>
                      </View>
                    );
                  })
                )}
                
                {/* Display menu items for available menus */}
                {!selectedMenu.chef && selectedMenu.items && selectedMenu.items.length > 0 && (
                  selectedMenu.items.map((item, index) => (
                    <View key={index} style={styles.ingredientItem}>
                      <Text style={styles.ingredientName}>{item.item_name || `Item ${index + 1}`}</Text>
                      <Text style={styles.ingredientQuantity}>
                        {item.quantity || ''} {item.measurement_unit || ''}
                      </Text>
                    </View>
                  ))
                )}
                
                {/* Show message if no items */}
                {(!selectedMenu.chefItem || selectedMenu.chefItem.length === 0) && 
                 (!selectedMenu.items || selectedMenu.items.length === 0) && (
                  <Text style={styles.noItemsText}>No items available</Text>
                )}
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Price ($)</Text>
              <TextInput
                style={styles.input}
                value={menuPrice}
                onChangeText={setMenuPrice}
                placeholder="Enter price"
                keyboardType="numeric"
              />
            </View>

            {selectedMenu && selectedMenu.chef ? (
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={() => {
                  updateMenuPrice(selectedMenu.$id, menuPrice);
                  setShowModal(false);
                }}
              >
                <Text style={styles.saveButtonText}>Update Price</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={addMenuToChef}
              >
                <Text style={styles.saveButtonText}>Add to Chef Menu</Text>
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
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
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
  section: {
    padding: 20,
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
  toggleButton: {
    padding: 5,
  },
  toggleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  toggleButtonText: {
    color: '#FF6B6B',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 5,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eee',
  },
  availableMenuCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedMenuCard: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
  },
  menuHeader: {
    marginBottom: 10,
  },
  menuName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  menuCategory: {
    fontSize: 14,
    color: '#666',
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  menuPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 10,
  },
  ingredientsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  ingredientsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  ingredientName: {
    fontSize: 14,
    color: '#666',
  },
  ingredientQuantity: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
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
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    height: 150,
    width: '100%',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  menuImage: {
    width: '100%',
    height: '100%',
  },
  menuDetails: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  modalCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 10,
  },
  noItemsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 5,
  },
}); 