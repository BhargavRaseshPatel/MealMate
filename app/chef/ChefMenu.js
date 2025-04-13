import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { databases, account } from '../../services/appwrite';
import { Query, ID } from 'appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID;
const CHEF_MENU_COLLECTION_ID = 'Chef_Menu';
const CHEF_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_CHEF;
const WEEKLY_MENU_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_WEEKLY_MENU;

export default function ChefMenu({ navigation, route }) {
  const [chefMenus, setChefMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const { date } = route.params || {};
  const formattedDate = date ? format(new Date(date), 'MMM d, yyyy') : '';

  useEffect(() => {
    fetchChefMenus();
  }, []);

  const fetchChefMenus = async () => {
    try {
      setLoading(true);
      const currentUser = await account.get();
      
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        navigation.goBack();
        return;
      }

      console.log('Current User ID:', currentUser.$id);
      console.log('Database ID:', DATABASE_ID);
      console.log('Chef Menu Collection ID:', CHEF_MENU_COLLECTION_ID);

      // First get the chef document for the current user
      const chefQuery = await databases.listDocuments(
        DATABASE_ID,
        CHEF_COLLECTION_ID,
        [Query.equal('person_id', currentUser.$id)]
      );

      if (chefQuery.documents.length === 0) {
        Alert.alert('Error', 'Chef profile not found');
        navigation.goBack();
        return;
      }

      const chefId = chefQuery.documents[0].$id;
      console.log('Chef ID:', chefId);

      // Now query chef menus using the chef's ID
      const menus = await databases.listDocuments(
        DATABASE_ID,
        CHEF_MENU_COLLECTION_ID,
        [Query.equal('chef', chefId)]
      );

      console.log('Fetched Menus:', menus.documents);

      // Process the menus - chefItem is already included in the menu document
      const processedMenus = menus.documents.map(menu => ({
        chefMenu: menu.$id,
        menu_name: menu.menu_name,
        description: menu.description,
        category: menu.category.category_name,
        price: menu.price,
        chefItems: menu.chefItem || [] // chefItem is a relationship field
      }));
      
      console.log('Processed Menus:', processedMenus);
      setChefMenus(processedMenus);
    } catch (error) {
      console.error('Error fetching chef menus:', error);
      Alert.alert('Error', 'Failed to load chef menus');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuSelect = async (menu) => {
    try {
      // Create weekly menu entry with just the required fields
      await databases.createDocument(
        DATABASE_ID,
        WEEKLY_MENU_COLLECTION_ID,
        ID.unique(),
        {
          chefMenu: [menu.chefMenu], // Wrap the ID in an array for relationship field
          menu_date: date || new Date().toISOString()
        }
      );

      Alert.alert('Success', 'Menu added to weekly menu successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding menu to weekly menu:', error);
      Alert.alert('Error', 'Failed to add menu to weekly menu');
    }
  };

  const handleCreateMenu = () => {
    navigation.navigate('CreateChefMenu');
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
          <Text style={styles.title}>
            Select Menu for {formattedDate}
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleCreateMenu}
          >
            <Ionicons name="add-circle" size={24} color="#FF6B6B" />
          </TouchableOpacity>
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
        <Text style={styles.title}>
          Select Menu for {formattedDate}
        </Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleCreateMenu}
        >
          <Ionicons name="add-circle" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {chefMenus.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No menus available</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreateMenu}
            >
              <Text style={styles.createButtonText}>Create New Menu</Text>
            </TouchableOpacity>
          </View>
        ) : (
          chefMenus.map((menu) => (
            <TouchableOpacity
              key={menu.chefMenu}
              style={styles.menuCard}
              onPress={() => handleMenuSelect(menu)}
            >
              <View style={styles.menuHeader}>
                <Text style={styles.menuName}>{menu.menu_name}</Text>
                <Text style={styles.menuCategory}>{menu.category}</Text>
                <Text style={styles.menuPrice}>${menu.price}</Text>
              </View>
              
              <Text style={styles.menuDescription}>{menu.description}</Text>
              
              {menu.chefItems && menu.chefItems.length > 0 && (
                <View style={styles.ingredientsContainer}>
                  <Text style={styles.ingredientsTitle}>Ingredients:</Text>
                  {menu.chefItems.map((item, index) => (
                    <View key={index} style={styles.ingredientItem}>
                      <Text style={styles.ingredientName}>{item.chef_item_name}</Text>
                      <Text style={styles.ingredientQuantity}>{item.quantity}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  addButton: {
    marginLeft: 'auto',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuHeader: {
    marginBottom: 8,
  },
  menuName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  menuCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  menuPrice: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  ingredientsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  ingredientsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ingredientName: {
    fontSize: 14,
    color: '#666',
  },
  ingredientQuantity: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
}); 