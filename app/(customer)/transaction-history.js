import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TransactionHistoryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.walletCard}>
        <Text style={styles.walletLabel}>Wallet Balance</Text>
        <Text style={styles.walletBalance}>$0.00</Text>
      </View>
      
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No transaction history</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  walletCard: {
    backgroundColor: '#FF6B6B',
    padding: 20,
    margin: 16,
    marginBottom: 0,
    borderRadius: 8,
    alignItems: 'center',
  },
  walletLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
  },
}); 