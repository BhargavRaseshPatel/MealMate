import { collections, databases } from './appwrite';
import { appwriteConfig } from './appwrite';

export const createChef = async (personId, deliveryAddressId = null, joiningDate = new Date().toISOString()) => {
  try {
    // For demo purposes, simulate successful creation without requiring actual database
    console.log('Creating chef for personId:', personId);
    
    // Returning mock data
    return {
      $id: 'mock-chef-id',
      person_id: personId,
      delivery_address_id: deliveryAddressId,
      joining_date: joiningDate,
    };

    /*
    // Actual implementation when Appwrite is set up
    const chef = await databases.createDocument(
      appwriteConfig.databaseId,
      collections.CHEF,
      'unique()',
      {
        person_id: personId,
        delivery_address_id: deliveryAddressId,
        joining_date: joiningDate,
      }
    );

    return chef;
    */
  } catch (error) {
    console.error('chefService :: createChef :: error', error);
    // Return mock data in case of error for demo purposes
    return {
      $id: 'mock-chef-id',
      person_id: personId,
      delivery_address_id: deliveryAddressId,
      joining_date: joiningDate,
    };
  }
};

export const getChefByPersonId = async (personId) => {
  try {
    // For demo purposes, simulate database query
    console.log('Getting chef for personId:', personId);
    
    // For demo, return null to simulate chef not found
    return null;

    /*
    // Actual implementation when Appwrite is set up
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      collections.CHEF,
      [
        `person_id=${personId}`
      ]
    );

    if (response.documents.length === 0) return null;
    return response.documents[0];
    */
  } catch (error) {
    console.error('chefService :: getChefByPersonId :: error', error);
    // Return null to indicate no chef found
    return null;
  }
};

export const getChefMenus = async (chefId) => {
  try {
    // For demo purposes, simulate database query
    console.log('Getting menus for chefId:', chefId);
    
    // Return mock data
    return [
      {
        $id: 'mock-menu-1',
        menu_name: 'Italian Special',
        chef_id: chefId,
        price: 25.99,
        description: 'Authentic Italian cuisine',
        category_id: 'italian',
        chef_item_ids: ['pasta', 'pizza'],
      },
      {
        $id: 'mock-menu-2',
        menu_name: 'Mexican Fiesta',
        chef_id: chefId,
        price: 19.99,
        description: 'Traditional Mexican dishes',
        category_id: 'mexican',
        chef_item_ids: ['tacos', 'burritos'],
      },
    ];

    /*
    // Actual implementation when Appwrite is set up
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      collections.CHEF_MENU,
      [
        `chef_id=${chefId}`
      ]
    );

    return response.documents;
    */
  } catch (error) {
    console.error('chefService :: getChefMenus :: error', error);
    // Return empty array as fallback
    return [];
  }
};

export const createChefMenu = async (menuName, chefId, price, description, categoryId, chefItemIds = []) => {
  try {
    // For demo purposes, simulate database creation
    console.log('Creating menu for chefId:', chefId);
    
    // Return mock data
    return {
      $id: 'mock-menu-' + Date.now(),
      menu_name: menuName,
      chef_id: chefId,
      price: price,
      description: description,
      category_id: categoryId,
      chef_item_ids: chefItemIds,
    };

    /*
    // Actual implementation when Appwrite is set up
    const chefMenu = await databases.createDocument(
      appwriteConfig.databaseId,
      collections.CHEF_MENU,
      'unique()',
      {
        menu_name: menuName,
        chef_id: chefId,
        price: price,
        description: description,
        category_id: categoryId,
        chef_item_ids: chefItemIds,
      }
    );

    return chefMenu;
    */
  } catch (error) {
    console.error('chefService :: createChefMenu :: error', error);
    throw error;
  }
};

export const updateChefMenu = async (chefMenuId, updates) => {
  try {
    // For demo purposes, simulate database update
    console.log('Updating menu with ID:', chefMenuId, 'Updates:', updates);
    
    // Return mock data
    return {
      $id: chefMenuId,
      ...updates,
    };

    /*
    // Actual implementation when Appwrite is set up
    const chefMenu = await databases.updateDocument(
      appwriteConfig.databaseId,
      collections.CHEF_MENU,
      chefMenuId,
      updates
    );

    return chefMenu;
    */
  } catch (error) {
    console.error('chefService :: updateChefMenu :: error', error);
    throw error;
  }
}; 