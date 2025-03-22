import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { databases } from '../../appwrite/config';
import { Query, ID } from 'appwrite';
import { account } from '../../appwrite/config';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID;
const CHEF_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_CHEF;
const CHEF_MENU_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_CHEF_MENU;
const SUBSCRIPTION_COLLECTION_ID = process.env.EXPO_PUBLIC_COLLECTION_ID_SUBSCRIPTION;

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AddSubscriptionScreen({ navigation }) {
  const [chefMenus, setChefMenus] = useState([]);
  const [selectedMenus, setSelectedMenus] = useState([]);
  const [subscriptionData, setSubscriptionData] = useState({
    subscription_name: '',
    total_days: '',
    total_quantity: '',
    home_delivery: false,
    days_per_week: '',
    available_days: [],
    price: '',
    discount: '',
    is_active: true
  });

  useEffect(() => {
    fetchChefMenus();
  }, []);

  const fetchChefMenus = async () => {
    try {
      const user = await account.get();
      const personId = user.$id;

      const chefQuery = await databases.listDocuments(
        DATABASE_ID,
        CHEF_COLLECTION_ID,
        [Query.equal('person_id', personId)]
      );

      if (chefQuery.documents.length > 0) {
        const chefId = chefQuery.documents[0].$id;
        
        const chefMenusResponse = await databases.listDocuments(
          DATABASE_ID,
          CHEF_MENU_COLLECTION_ID,
          [Query.equal('chef', chefId)]
        );
        setChefMenus(chefMenusResponse.documents);
      }
    } catch (error) {
      console.error('Error fetching chef menus:', error);
      Alert.alert('Error', 'Failed to fetch chef menus');
    }
  };

  const toggleMenuSelection = (menuId) => {
    setSelectedMenus(prev => {
      if (prev.includes(menuId)) {
        return prev.filter(id => id !== menuId);
      } else {
        return [...prev, menuId];
      }
    });
  };

  const toggleDaySelection = (day) => {
    setSubscriptionData(prev => {
      const newAvailableDays = prev.available_days.includes(day)
        ? prev.available_days.filter(d => d !== day)
        : [...prev.available_days, day];
      return { ...prev, available_days: newAvailableDays };
    });
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!subscriptionData.subscription_name || !subscriptionData.total_days || 
          !subscriptionData.total_quantity || !subscriptionData.days_per_week || 
          !subscriptionData.price || selectedMenus.length === 0) {
        Alert.alert('Error', 'Please fill in all required fields and select at least one menu');
        return;
      }

      // Create subscription
      await databases.createDocument(
        DATABASE_ID,
        SUBSCRIPTION_COLLECTION_ID,
        ID.unique(),
        {
          ...subscriptionData,
          chefMenu: selectedMenus,
          total_days: parseInt(subscriptionData.total_days),
          total_quantity: parseInt(subscriptionData.total_quantity),
          days_per_week: parseInt(subscriptionData.days_per_week),
          price: parseFloat(subscriptionData.price),
          discount: subscriptionData.discount ? parseFloat(subscriptionData.discount) : 0,
        }
      );

      Alert.alert('Success', 'Subscription created successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating subscription:', error);
      Alert.alert('Error', 'Failed to create subscription');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Subscription</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Subscription Name"
            value={subscriptionData.subscription_name}
            onChangeText={(text) => setSubscriptionData(prev => ({ ...prev, subscription_name: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Total Days"
            keyboardType="numeric"
            value={subscriptionData.total_days}
            onChangeText={(text) => setSubscriptionData(prev => ({ ...prev, total_days: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Total Quantity"
            keyboardType="numeric"
            value={subscriptionData.total_quantity}
            onChangeText={(text) => setSubscriptionData(prev => ({ ...prev, total_quantity: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Days per Week"
            keyboardType="numeric"
            value={subscriptionData.days_per_week}
            onChangeText={(text) => setSubscriptionData(prev => ({ ...prev, days_per_week: text }))}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <TextInput
            style={styles.input}
            placeholder="Price"
            keyboardType="numeric"
            value={subscriptionData.price}
            onChangeText={(text) => setSubscriptionData(prev => ({ ...prev, price: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Discount (optional)"
            keyboardType="numeric"
            value={subscriptionData.discount}
            onChangeText={(text) => setSubscriptionData(prev => ({ ...prev, discount: text }))}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Options</Text>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Home Delivery</Text>
            <Switch
              value={subscriptionData.home_delivery}
              onValueChange={(value) => setSubscriptionData(prev => ({ ...prev, home_delivery: value }))}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Days</Text>
          <View style={styles.daysContainer}>
            {DAYS_OF_WEEK.map(day => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  subscriptionData.available_days.includes(day) && styles.selectedDay
                ]}
                onPress={() => toggleDaySelection(day)}
              >
                <Text style={[
                  styles.dayButtonText,
                  subscriptionData.available_days.includes(day) && styles.selectedDayText
                ]}>
                  {day.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Menus</Text>
          {chefMenus.map(menu => (
            <TouchableOpacity
              key={menu.$id}
              style={[
                styles.menuCard,
                selectedMenus.includes(menu.$id) && styles.selectedMenuCard
              ]}
              onPress={() => toggleMenuSelection(menu.$id)}
            >
              <View style={styles.menuInfo}>
                <Text style={styles.menuName}>{menu.menu_name}</Text>
                <Text style={styles.menuDescription}>{menu.description}</Text>
                <Text style={styles.menuPrice}>${menu.price}</Text>
              </View>
              <Ionicons
                name={selectedMenus.includes(menu.$id) ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={selectedMenus.includes(menu.$id) ? "#4CAF50" : "#666"}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Create Subscription</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dayButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 60,
    alignItems: 'center',
  },
  selectedDay: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  dayButtonText: {
    color: '#666',
  },
  selectedDayText: {
    color: '#fff',
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedMenuCard: {
    backgroundColor: '#fff5f5',
    borderColor: '#FF6B6B',
    borderWidth: 1,
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
  submitButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 