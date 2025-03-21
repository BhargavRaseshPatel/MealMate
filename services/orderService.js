import { collections, databases } from './appwrite';
import { appwriteConfig } from './appwrite';

export const createOrder = async (customerId, chefId, weeklyMenuId, quantity, price) => {
  try {
    const order = await databases.createDocument(
      appwriteConfig.databaseId,
      collections.ORDER,
      'unique()',
      {
        customer_id: customerId,
        chef_id: chefId,
        weekly_menu_id: weeklyMenuId,
        quantity: quantity,
        price: price,
        order_status: 'Pending',
        payment_status: 'Pending',
        last_modified_at: new Date().toISOString(),
      }
    );

    return order;
  } catch (error) {
    console.error('orderService :: createOrder :: error', error);
    throw error;
  }
};

export const getOrdersByCustomerId = async (customerId) => {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      collections.ORDER,
      [
        `customer_id=${customerId}`
      ]
    );

    return response.documents;
  } catch (error) {
    console.error('orderService :: getOrdersByCustomerId :: error', error);
    throw error;
  }
};

export const getOrdersByChefId = async (chefId) => {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      collections.ORDER,
      [
        `chef_id=${chefId}`
      ]
    );

    return response.documents;
  } catch (error) {
    console.error('orderService :: getOrdersByChefId :: error', error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const order = await databases.updateDocument(
      appwriteConfig.databaseId,
      collections.ORDER,
      orderId,
      {
        order_status: status,
        last_modified_at: new Date().toISOString(),
      }
    );

    return order;
  } catch (error) {
    console.error('orderService :: updateOrderStatus :: error', error);
    throw error;
  }
};

export const cancelOrder = async (orderId, reason) => {
  try {
    const order = await databases.updateDocument(
      appwriteConfig.databaseId,
      collections.ORDER,
      orderId,
      {
        order_status: 'Cancelled',
        cancellation_reason: reason,
        last_modified_at: new Date().toISOString(),
      }
    );

    return order;
  } catch (error) {
    console.error('orderService :: cancelOrder :: error', error);
    throw error;
  }
}; 