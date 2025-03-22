import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { logout, getCurrentUser } from '../../services/appwrite';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserData({
          name: user.name || 'Not set',
          email: user.email,
          phone: user.phone || 'Not set',
          createdAt: new Date(user.$createdAt).toLocaleDateString(),
          wallet: 0, // You'll need to fetch this from your wallet collection
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={80} color="#FF6B6B" />
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{userData?.name}</Text>
            <Text style={styles.role}>Customer</Text>
          </View>
        </View>

        <View style={styles.walletSection}>
          <View style={styles.walletInfo}>
            <Ionicons name="wallet-outline" size={24} color="#FF6B6B" />
            <View style={styles.walletTextContainer}>
              <Text style={styles.walletLabel}>Wallet Balance</Text>
              <Text style={styles.walletAmount}>₹{userData?.wallet}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addMoneyButton}>
            <Text style={styles.addMoneyButtonText}>Add Money</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          <View style={styles.profileItem}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{userData?.email}</Text>
          </View>
          <View style={styles.profileItem}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{userData?.phone}</Text>
          </View>
          <View style={styles.profileItem}>
            <Text style={styles.label}>Member Since</Text>
            <Text style={styles.value}>{userData?.createdAt}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  role: {
    fontSize: 16,
    color: '#666',
  },
  walletSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletTextContainer: {
    marginLeft: 15,
  },
  walletLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  walletAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  addMoneyButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addMoneyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  profileItem: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 