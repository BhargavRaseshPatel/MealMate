import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { databases, account } from '../config/appwrite';
import { DATABASE_ID, WEEKLY_MENU_COLLECTION_ID, CHEF_MENU_COLLECTION_ID } from '@env';
import { Query } from 'appwrite';
import { format, parseISO } from 'date-fns';

const BrowseMeal = ({ navigation }) => {
  console.log('BrowseMeal component rendering');
  
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    console.log('BrowseMeal Log:', message);
    setLogs(prevLogs => [...prevLogs, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  useEffect(() => {
    console.log('BrowseMeal useEffect triggered');
    addLog('BrowseMeal component mounted');
    fetchTodaysMeals();
  }, []);

  const fetchTodaysMeals = async () => {
    console.log('fetchTodaysMeals function called');
    try {
      setLoading(true);
      addLog('Starting to fetch today\'s meals');
      
      // Get today's date in YYYY-MM-DD format
      const today = format(new Date(), 'yyyy-MM-dd');
      console.log('Today\'s date:', today);
      addLog(`Today's date: ${today}`);

      // Query weekly menu for today's date
      console.log('Querying weekly menu collection:', WEEKLY_MENU_COLLECTION_ID);
      addLog(`Querying weekly menu collection: ${WEEKLY_MENU_COLLECTION_ID}`);
      
      const weeklyMenuQuery = await databases.listDocuments(
        DATABASE_ID,
        WEEKLY_MENU_COLLECTION_ID,
        [Query.equal('menu_date', today)]
      );

      console.log('Weekly menu query result:', weeklyMenuQuery);
      addLog(`Weekly menu query result: ${JSON.stringify(weeklyMenuQuery, null, 2)}`);

      if (weeklyMenuQuery.documents.length === 0) {
        console.log('No meals found for today');
        addLog('No meals found for today');
        setMeals([]);
        return;
      }

      // Get all chef menu IDs from today's weekly menu
      const chefMenuIds = weeklyMenuQuery.documents.map(doc => {
        console.log('Weekly menu document:', doc);
        addLog(`Weekly menu document: ${JSON.stringify(doc, null, 2)}`);
        return doc.chefMenu[0];
      });
      console.log('Chef menu IDs to fetch:', chefMenuIds);
      addLog(`Chef menu IDs to fetch: ${chefMenuIds}`);

      // Fetch all chef menu documents
      const chefMenus = await Promise.all(
        chefMenuIds.map(async (chefMenuId) => {
          try {
            console.log('Fetching chef menu with ID:', chefMenuId);
            addLog(`Fetching chef menu with ID: ${chefMenuId}`);
            const chefMenuDoc = await databases.getDocument(
              DATABASE_ID,
              CHEF_MENU_COLLECTION_ID,
              chefMenuId
            );
            console.log('Fetched chef menu:', chefMenuDoc);
            addLog(`Fetched chef menu: ${JSON.stringify(chefMenuDoc, null, 2)}`);
            return chefMenuDoc;
          } catch (error) {
            console.error('Error fetching chef menu:', error);
            addLog(`Error fetching chef menu: ${error.message}`);
            return null;
          }
        })
      );

      // Filter out any null values from failed fetches
      const validChefMenus = chefMenus.filter(menu => menu !== null);
      console.log('Found chef menus:', validChefMenus);
      addLog(`Found chef menus: ${JSON.stringify(validChefMenus, null, 2)}`);

      setMeals(validChefMenus);
    } catch (error) {
      console.error('Error in fetchTodaysMeals:', error);
      addLog(`Error fetching today's meals: ${error.message}`);
      addLog(`Error details: ${JSON.stringify({
        message: error.message,
        code: error.code,
        type: error.type,
        response: error.response
      }, null, 2)}`);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderMealItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.mealCard}
      onPress={() => navigation.navigate('MealDetail', { meal: item })}
    >
      <Image 
        source={{ uri: item.image_url }} 
        style={styles.mealImage}
      />
      <View style={styles.mealInfo}>
        <Text style={styles.mealName}>{item.name}</Text>
        <Text style={styles.chefName}>Chef: {item.chef_name}</Text>
        <Text style={styles.price}>${item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderLogs = () => (
    <View style={styles.logsSection}>
      <Text style={styles.logsHeader}>Debug Logs:</Text>
      <ScrollView style={styles.logsContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Loading today's meals...</Text>
        {renderLogs()}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Error: {error}</Text>
        {renderLogs()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Today's Available Meals</Text>
      {meals.length === 0 ? (
        <View style={styles.noMealsContainer}>
          <Text style={styles.noMeals}>No meals available for today</Text>
          {renderLogs()}
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <FlatList
            data={meals}
            renderItem={renderMealItem}
            keyExtractor={item => item.$id}
            contentContainerStyle={styles.listContainer}
          />
          {renderLogs()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  listContainer: {
    paddingBottom: 16,
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 12,
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
  mealImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  mealInfo: {
    padding: 16,
  },
  mealName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  chefName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  noMealsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMeals: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  logsSection: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  logsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  logsContainer: {
    maxHeight: 200,
  },
  logText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default BrowseMeal; 