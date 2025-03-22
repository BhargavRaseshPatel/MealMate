import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { databases } from '../../services/appwrite';
import { Query } from 'appwrite';
import { getCurrentUser } from '../../services/appwrite';

export default function TransactionScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const response = await databases.listDocuments(
        'MealMate',
        'Transactions',
        [
          Query.equal('user_id', user.$id),
          Query.orderDesc('$createdAt')
        ]
      );

      setTransactions(response.documents);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'credit':
        return 'arrow-down-circle';
      case 'debit':
        return 'arrow-up-circle';
      default:
        return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type) => {
    switch (type.toLowerCase()) {
      case 'credit':
        return '#4CAF50';
      case 'debit':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const renderTransactionItem = ({ item }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionIconContainer}>
          <Ionicons 
            name={getTransactionIcon(item.type)} 
            size={24} 
            color={getTransactionColor(item.type)} 
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{item.description}</Text>
          <Text style={styles.transactionDate}>
            {new Date(item.$createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[
          styles.transactionAmount,
          { color: getTransactionColor(item.type) }
        ]}>
          {item.type.toLowerCase() === 'credit' ? '+' : '-'}₹{item.amount}
        </Text>
      </View>
      <View style={styles.transactionFooter}>
        <Text style={styles.transactionStatus}>{item.status}</Text>
        <Text style={styles.transactionTime}>
          {new Date(item.$createdAt).toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
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
        <Text style={styles.title}>Transaction History</Text>
      </View>
      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={item => item.$id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="swap-horizontal-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        }
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    padding: 16,
  },
  transactionCard: {
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
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  transactionStatus: {
    fontSize: 14,
    color: '#666',
  },
  transactionTime: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
}); 