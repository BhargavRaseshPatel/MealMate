import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, isToday, isSameDay } from 'date-fns';

export default function WeeklyMenuScreen({ navigation }) {
  const [weeklyMenus, setWeeklyMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyMenus();
  }, []);

  const fetchWeeklyMenus = async () => {
    try {
      // TODO: Implement API call to fetch weekly menus
      // For now, using dummy data
      const today = new Date();
      const dummyMenus = Array.from({ length: 7 }, (_, index) => {
        const date = addDays(today, index);
        return {
          id: `menu-${index}`,
          date: date,
          chef_menu: index === 0 ? {
            chef_menu_id: '1',
            menu_name: 'Butter Chicken',
            description: 'Tender chicken in rich tomato gravy',
            category: 'Main Course',
            chefItems: [
              { name: 'Chicken', quantity: '500g' },
              { name: 'Tomato Sauce', quantity: '200ml' },
              { name: 'Spices', quantity: 'As per taste' }
            ]
          } : null
        };
      });
      setWeeklyMenus(dummyMenus);
    } catch (error) {
      console.error('Error fetching weekly menus:', error);
      Alert.alert('Error', 'Failed to load weekly menus');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenu = (date) => {
    navigation.navigate('ChefMenu', { 
      date,
      onMenuSelected: (selectedMenu) => {
        // Create a weekly menu entry with the selected chef menu
        const weeklyMenuEntry = {
          weekly_menu_id: `weekly-${Date.now()}`, // Generate a unique ID
          menu_date: date,
          chef_menu_id: selectedMenu.chef_menu_id,
          chef_menu: selectedMenu // Store the full menu data for display
        };

        // Update the weekly menu with the new entry
        setWeeklyMenus(prevMenus => 
          prevMenus.map(menu => 
            isSameDay(menu.date, date) 
              ? { ...menu, chef_menu: selectedMenu }
              : menu
          )
        );
      }
    });
  };

  const handleAddWeeklyMenu = () => {
    navigation.navigate('ChefMenu', { 
      isWeekly: true,
      onMenuSelected: (selectedMenu) => {
        // Create weekly menu entries for all empty days
        const today = new Date();
        const weeklyMenuEntries = Array.from({ length: 7 }, (_, index) => {
          const date = addDays(today, index);
          return {
            weekly_menu_id: `weekly-${Date.now()}-${index}`,
            menu_date: date,
            chef_menu_id: selectedMenu.chef_menu_id,
            chef_menu: selectedMenu
          };
        });

        // Update all empty days with the selected menu
        setWeeklyMenus(prevMenus => 
          prevMenus.map(menu => 
            !menu.chef_menu ? { ...menu, chef_menu: selectedMenu } : menu
          )
        );
      }
    });
  };

  const renderMenuCard = (menuData) => {
    const isTodayMenu = isToday(menuData.date);
    const hasMenu = menuData.chef_menu && Object.keys(menuData.chef_menu).length > 0;

    return (
      <TouchableOpacity 
        style={[styles.menuCard, isTodayMenu && styles.todayMenuCard]}
        onPress={() => hasMenu ? null : handleAddMenu(menuData.date)}
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
        
        {hasMenu && menuData.chef_menu ? (
          <View style={styles.menuContent}>
            <Text style={styles.menuName}>{menuData.chef_menu.menu_name || 'Unnamed Menu'}</Text>
            <Text style={styles.menuCategory}>{menuData.chef_menu.category || 'Uncategorized'}</Text>
            <Text style={styles.menuDescription}>{menuData.chef_menu.description || 'No description available'}</Text>
            
            {menuData.chef_menu.chefItems && menuData.chef_menu.chefItems.length > 0 && (
              <View style={styles.ingredientsContainer}>
                <Text style={styles.ingredientsTitle}>Ingredients:</Text>
                {menuData.chef_menu.chefItems.map((item, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <Text style={styles.ingredientName}>{item.name || 'Unnamed Item'}</Text>
                    <Text style={styles.ingredientQuantity}>{item.quantity || 'N/A'}</Text>
                  </View>
                ))}
              </View>
            )}
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
          <Text style={styles.addWeeklyButtonText}>Add Weekly Menu</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
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
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayMenuCard: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
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
}); 