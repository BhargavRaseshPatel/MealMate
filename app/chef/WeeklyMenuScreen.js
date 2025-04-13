import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, isToday, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { databases, account } from '../../services/appwrite';
import { Query, ID } from 'appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID;
const WEEKLY_MENU_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_WEEKLY_MENU;
const CHEF_MENU_COLLECTION_ID = 'Chef_Menu';

export default function WeeklyMenuScreen({ navigation }) {
  const [weeklyMenus, setWeeklyMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWeeklyMenus();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchWeeklyMenus().finally(() => {
      setRefreshing(false);
    });
  }, []);

  const fetchWeeklyMenus = async () => {
    try {
      setLoading(true);
      const currentUser = await account.get();
      
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Get the start and end of the current week
      const today = new Date();
      const weekStart = startOfWeek(today);
      const weekEnd = endOfWeek(today);

      console.log('Fetching weekly menus from:', weekStart.toISOString(), 'to:', weekEnd.toISOString());

      // Fetch weekly menus for the current week
      const weeklyMenusQuery = await databases.listDocuments(
        DATABASE_ID,
        WEEKLY_MENU_COLLECTION_ID,
        [
          Query.greaterThanEqual('menu_date', weekStart.toISOString()),
          Query.lessThanEqual('menu_date', weekEnd.toISOString())
        ]
      );

      console.log('Fetched weekly menus:', weeklyMenusQuery.documents);

      // Create an array of all days in the week
      const weekDays = Array.from({ length: 7 }, (_, index) => {
        const date = addDays(weekStart, index);
        return {
          id: `day-${index}`,
          date: date,
          chef_menus: [] // Changed to array to handle multiple menus
        };
      });

      // Process the fetched weekly menus
      for (const weeklyMenu of weeklyMenusQuery.documents) {
        console.log('Processing weekly menu:', weeklyMenu);
        const menuDate = new Date(weeklyMenu.menu_date);
        const dayIndex = weekDays.findIndex(day => 
          isSameDay(day.date, menuDate)
        );

        console.log('Found day index:', dayIndex, 'for date:', menuDate);

        if (dayIndex !== -1 && weeklyMenu.chefMenu && weeklyMenu.chefMenu.length > 0) {
          try {
            // Process each chef menu in the relationship
            for (const chefMenuDoc of weeklyMenu.chefMenu) {
              if (chefMenuDoc && chefMenuDoc.$id) {
                const menuData = {
                  chef_menu_id: chefMenuDoc.$id,
                  menu_name: chefMenuDoc.menu_name,
                  description: chefMenuDoc.description,
                  category: chefMenuDoc.category?.category_name || 'Uncategorized',
                  chefItems: chefMenuDoc.chefItem || []
                };
                weekDays[dayIndex].chef_menus.push(menuData);
                console.log('Added chef menu to day:', menuData);
              }
            }
          } catch (error) {
            console.error('Error processing chef menu:', error);
            continue;
          }
        }
      }

      console.log('Final weekDays array:', weekDays);
      setWeeklyMenus(weekDays);
    } catch (error) {
      console.error('Error fetching weekly menus:', error);
      Alert.alert('Error', 'Failed to load weekly menus');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenu = (date) => {
    navigation.navigate('ChefMenu', { 
      date: date.toISOString(),
      onMenuSelected: () => {
        // Refresh the weekly menus after adding a new one
        fetchWeeklyMenus();
      }
    });
  };

  const handleAddWeeklyMenu = () => {
    navigation.navigate('ChefMenuList', { 
      onMenuSelected: () => {
        // Refresh the weekly menus after adding a new one
        fetchWeeklyMenus();
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Weekly Menu</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading menus...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderMenuCard = (menuData) => {
    const isTodayMenu = isToday(menuData.date);
    const hasMenus = menuData.chef_menus && menuData.chef_menus.length > 0;

    return (
      <TouchableOpacity 
        style={[styles.menuCard, isTodayMenu && styles.todayMenuCard]}
        onPress={() => hasMenus ? null : handleAddMenu(menuData.date)}
      >
        <View style={styles.menuHeader}>
          <Text style={[styles.dateText, isTodayMenu && styles.todayDateText]}>
            {format(menuData.date, 'EEE, MMM d')}
          </Text>
          {isTodayMenu && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>Today</Text>
            </View>
          )}
        </View>
        
        {hasMenus ? (
          <View style={styles.menuContent}>
            {menuData.chef_menus.map((menu, index) => (
              <View key={`${menu.chef_menu_id}-${index}`} style={[styles.menuItem, index > 0 && styles.menuItemBorder]}>
                <Text style={styles.menuName}>{menu.menu_name || 'Unnamed Menu'}</Text>
                <Text style={styles.menuCategory}>{menu.category || 'Uncategorized'}</Text>
                <Text style={styles.menuDescription}>{menu.description || 'No description available'}</Text>
                
                {menu.chefItems && menu.chefItems.length > 0 && (
                  <View style={styles.ingredientsContainer}>
                    <Text style={styles.ingredientsTitle}>Ingredients:</Text>
                    {menu.chefItems.map((item, itemIndex) => (
                      <View key={`${menu.chef_menu_id}-item-${itemIndex}`} style={styles.ingredientItem}>
                        <Text style={styles.ingredientName}>{item.chef_item_name || 'Unnamed Item'}</Text>
                        <Text style={styles.ingredientQuantity}>{item.quantity || 'N/A'}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addMenuButton}
            onPress={() => handleAddMenu(menuData.date)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#FF6B6B" />
            <Text style={styles.addMenuText}>Add Menu</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Menu</Text>
        <TouchableOpacity 
          style={styles.addWeeklyButton}
          onPress={handleAddWeeklyMenu}
        >
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.addWeeklyButtonText}>Chef Menu</Text>
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
            progressBackgroundColor="#ffffff"
          />
        }
      >
        {weeklyMenus.map((menu) => (
          <View key={menu.id} style={styles.menuContainer}>
            {renderMenuCard(menu)}
          </View>
        ))}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addWeeklyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addWeeklyButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  menuContainer: {
    padding: 16,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  todayMenuCard: {
    borderColor: '#FF6B6B',
    borderWidth: 2.5,
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  todayDateText: {
    color: '#FF6B6B',
  },
  todayBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  menuContent: {
    marginTop: 8,
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
  addMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  addMenuText: {
    marginLeft: 8,
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menuItem: {
    marginBottom: 16,
  },
  menuItemBorder: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
}); 