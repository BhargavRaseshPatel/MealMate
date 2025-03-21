import { Account, Client, Databases } from 'appwrite';

export const appwriteConfig = {
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: '67dc2e4b00055c69fc12', // Replace with your Appwrite Project ID
  databaseId: '67dc819e00325b3b1829', // Replace with your Appwrite Database ID
};

// Collections
export const collections = {
  CUSTOMER: 'CUSTOMER_COLLECTION_ID',
  CHEF: 'CHEF_COLLECTION_ID',
  MENU: 'MENU_COLLECTION_ID',
  CATEGORY: 'CATEGORY_COLLECTION_ID',
  ITEMS: 'ITEMS_COLLECTION_ID',
  CHEF_MENU: 'CHEF_MENU_COLLECTION_ID',
  CHEF_ITEM: 'CHEF_ITEM_COLLECTION_ID',
  WEEKLY_MENU: 'WEEKLY_MENU_COLLECTION_ID',
  SUBSCRIPTION: 'SUBSCRIPTION_COLLECTION_ID',
  CUSTOMER_SUBSCRIPTION: 'CUSTOMER_SUBSCRIPTION_COLLECTION_ID',
  ORDER: 'ORDER_COLLECTION_ID',
  SUBSCRIPTION_ORDER: 'SUBSCRIPTION_ORDER_COLLECTION_ID',
  FEEDBACK: 'FEEDBACK_COLLECTION_ID',
  WALLET: 'WALLET_COLLECTION_ID',
  TRANSACTION_HISTORY: 'TRANSACTION_HISTORY_COLLECTION_ID',
  DELIVERY_ADDRESS: 'DELIVERY_ADDRESS_COLLECTION_ID',
};

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);

// Mock user data for demo purposes
const MOCK_USER = {
  $id: 'mock-user-id',
  name: 'Demo User',
  email: 'demo@example.com',
  phone: '1234567890',
};

// Authentication services
export const createAccount = async (email, password, username, phone) => {
  try {
    console.log('Creating account with:', { email, username });
    
    // Create user account
    const newAccount = await account.create(
      'unique()',
      email,
      password,
      username
    );

    console.log('Account created successfully:', newAccount.$id);

    if (!newAccount) throw Error;

    // Create session
    const session = await account.createEmailSession(email, password);
    console.log('Session created successfully');

    return {
      newAccount,  // This contains the actual user ID in newAccount.$id
      session,
    };
  } catch (error) {
    console.error('Appwrite service :: createAccount :: error', error);
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    console.log('Logging in with:', { email });
    
    // Create an Appwrite session
    const session = await account.createEmailSession(email, password);
    console.log('Session created with ID:', session.$id);
    
    // Get account details
    const accountDetails = await account.get();
    console.log('Account retrieved:', accountDetails.$id);

    return {
      session,
      accountDetails,
    };
  } catch (error) {
    console.error('Appwrite service :: login :: error', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    console.log('Getting current user');
    
    // Don't return mock data, get the actual user from Appwrite
    const currentAccount = await account.get();
    
    console.log('Current user retrieved:', currentAccount.$id);
    
    if (!currentAccount) throw Error;

    return currentAccount;
    
    // Remove any mock user code that might be here
  } catch (error) {
    console.error('Appwrite service :: getCurrentUser :: error', error);
    return null;
  }
};

export const logout = async () => {
  try {
    console.log('Logging out');
    
    // Delete the current session
    await account.deleteSession('current');
    console.log('Session deleted successfully');
    
    return { success: true };
  } catch (error) {
    console.error('Appwrite service :: logout :: error', error);
    throw error;
  }
};

export const setUserRole = async (userId, role) => {
  try {
    console.log(`Setting user role for ID ${userId} to ${role}`);
    
    // Get the current user session
    const currentUser = await account.get();
    
    // Make sure we're using the actual user's session to be active
    await account.updateLabels([role]);
    
    console.log(`Successfully set role to ${role}`);
    
    return { success: true, userId: userId, role };
  } catch (error) {
    console.error('Appwrite service :: setUserRole :: error', error);
    throw error;
  }
};

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
      navigation.replace('Login');
      return;
    }

    console.log('Current user from getCurrentUser:', currentUser.$id);
    
    // Use the ACTUAL user ID, not any mock value
    const userId = currentUser.$id;
    
    // Set user role as a label
    await setUserRole(userId, selectedRole);
    
    console.log(`Role set to ${selectedRole}, navigating to appropriate screen`);
    
    if (selectedRole === 'customer') {
      navigation.replace('CustomerHome');
    } else {
      navigation.replace('ChefHome');
    }
  } catch (error) {
    console.error('Role selection failed:', error);
    Alert.alert('Error', 'Failed to set up your account. Please try again.');
  } finally {
    setLoading(false);
  }
};

export const getUserRole = async () => {
  try {
    console.log('Getting user role');
    
    // Get current user account
    const currentAccount = await account.get();
    
    if (!currentAccount) {
      console.log('No current user found');
      return null;
    }
    
    // Get user labels
    const labels = currentAccount.labels || [];
    console.log('User labels:', labels);
    
    // Check if user has chef or customer label
    if (labels.includes('chef')) {
      return 'chef';
    } else if (labels.includes('customer')) {
      return 'customer';
    }
    
    // No role assigned yet
    console.log('No role found for user');
    return null;
  } catch (error) {
    console.error('Appwrite service :: getUserRole :: error', error);
    return null;
  }
}; 