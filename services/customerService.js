import { collections, databases } from './appwrite';
import { appwriteConfig } from './appwrite';

export const createCustomer = async (personId, deliveryAddressId = null, walletBalance = 0, customerSubscriptionId = null) => {
  try {
    // For demo purposes, simulate successful creation without requiring actual database
    console.log('Creating customer for personId:', personId);
    
    // Returning mock data
    return {
      $id: 'mock-customer-id',
      person_id: personId,
      delivery_address_id: deliveryAddressId,
      wallet_balance: walletBalance,
      customer_subscription_id: customerSubscriptionId,
    };

    /*
    // Actual implementation when Appwrite is set up
    const customer = await databases.createDocument(
      appwriteConfig.databaseId,
      collections.CUSTOMER,
      'unique()',
      {
        person_id: personId,
        delivery_address_id: deliveryAddressId,
        wallet_balance: walletBalance,
        customer_subscription_id: customerSubscriptionId,
      }
    );
    return customer;
    */
  } catch (error) {
    console.error('customerService :: createCustomer :: error', error);
    // Return mock data in case of error for demo purposes
    return {
      $id: 'mock-customer-id',
      person_id: personId,
      delivery_address_id: deliveryAddressId,
      wallet_balance: walletBalance,
      customer_subscription_id: customerSubscriptionId,
    };
  }
};

export const getCustomerByPersonId = async (personId) => {
  try {
    // For demo purposes, simulate database query without requiring actual database
    console.log('Getting customer for personId:', personId);
    
    // Return mock data
    return {
      $id: 'mock-customer-id',
      person_id: personId,
      delivery_address_id: null,
      wallet_balance: 100,
      customer_subscription_id: null,
    };

    /*
    // Actual implementation when Appwrite is set up
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      collections.CUSTOMER,
      [
        `person_id=${personId}`
      ]
    );

    if (response.documents.length === 0) return null;
    return response.documents[0];
    */
  } catch (error) {
    console.error('customerService :: getCustomerByPersonId :: error', error);
    // Return null to indicate no customer found
    return null;
  }
};

export const updateCustomerWalletBalance = async (customerId, newBalance) => {
  try {
    // For demo purposes, simulate database update
    console.log('Updating wallet balance for customerId:', customerId, 'to', newBalance);
    
    // Return mock data
    return {
      $id: customerId,
      wallet_balance: newBalance
    };

    /*
    // Actual implementation when Appwrite is set up
    const customer = await databases.updateDocument(
      appwriteConfig.databaseId,
      collections.CUSTOMER,
      customerId,
      {
        wallet_balance: newBalance
      }
    );

    return customer;
    */
  } catch (error) {
    console.error('customerService :: updateCustomerWalletBalance :: error', error);
    throw error;
  }
};

export const updateCustomerSubscription = async (customerId, subscriptionId) => {
  try {
    // For demo purposes, simulate database update
    console.log('Updating subscription for customerId:', customerId, 'to', subscriptionId);
    
    // Return mock data
    return {
      $id: customerId,
      customer_subscription_id: subscriptionId
    };

    /*
    // Actual implementation when Appwrite is set up
    const customer = await databases.updateDocument(
      appwriteConfig.databaseId,
      collections.CUSTOMER,
      customerId,
      {
        customer_subscription_id: subscriptionId
      }
    );

    return customer;
    */
  } catch (error) {
    console.error('customerService :: updateCustomerSubscription :: error', error);
    throw error;
  }
}; 