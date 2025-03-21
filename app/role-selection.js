import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { getCurrentUser, setUserRole } from '../services/appwrite';

export default function RoleSelectionScreen({ navigation }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      Alert.alert('Selection Required', 'Please select a role to continue.');
      return;
    }

    setLoading(true);
    try {
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated. Please login again.');
        navigation.reset({
          index: 0,
          routes: [{ name: 'login' }]
        });
        return;
      }

      console.log('Current user from getCurrentUser:', currentUser.$id);

      // Use the ACTUAL user ID, not any mock value
      const userId = currentUser.$id;

      // Set user role as a label
      await setUserRole(userId, selectedRole);

      console.log(`Role set to ${selectedRole}, navigating to appropriate screen`);

      if (selectedRole === 'customer') {
        // Navigate to the customer home screen directly
        navigation.reset({
          index: 0,
          routes: [{ name: 'customer-home' }]
        });
      } else if (selectedRole === 'chef') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'chef-home' }]
        });
      }
    } catch (error) {
      console.error('Role selection failed:', error);
      Alert.alert('Error', 'Failed to set up your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Your Role</Text>
          <Text style={styles.subtitle}>Choose how you want to use MealMate</Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'customer' && styles.selectedRoleCard
            ]}
            onPress={() => setSelectedRole('customer')}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.roleIconText}>👤</Text>
            </View>
            <Text style={styles.roleTitle}>Customer</Text>
            <Text style={styles.roleDescription}>
              Browse meals, place orders, and enjoy delicious food made by professional chefs
            </Text>
            {selectedRole === 'customer' && (
              <View style={styles.checkmarkContainer}>
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'chef' && styles.selectedRoleCard
            ]}
            onPress={() => setSelectedRole('chef')}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.roleIconText}>👨‍🍳</Text>
            </View>
            <Text style={styles.roleTitle}>Chef</Text>
            <Text style={styles.roleDescription}>
              Offer your culinary expertise, create menus, and connect with customers
            </Text>
            {selectedRole === 'chef' && (
              <View style={styles.checkmarkContainer}>
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Continue"
            onPress={handleRoleSelection}
            loading={loading}
            disabled={!selectedRole}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  roleCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
  },
  selectedRoleCard: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
    backgroundColor: '#FFF5F5',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  roleIconText: {
    fontSize: 48,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 30,
  },
}); 