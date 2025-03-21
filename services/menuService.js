import { collections, databases } from './appwrite';
import { appwriteConfig } from './appwrite';

export const getMenus = async () => {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      collections.MENU
    );

    return response.documents;
  } catch (error) {
    console.error('menuService :: getMenus :: error', error);
    throw error;
  }
};

export const getMenuById = async (menuId) => {
  try {
    const menu = await databases.getDocument(
      appwriteConfig.databaseId,
      collections.MENU,
      menuId
    );

    return menu;
  } catch (error) {
    console.error('menuService :: getMenuById :: error', error);
    throw error;
  }
};

export const getMenusByCategory = async (categoryId) => {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      collections.MENU,
      [
        `category_id=${categoryId}`
      ]
    );

    return response.documents;
  } catch (error) {
    console.error('menuService :: getMenusByCategory :: error', error);
    throw error;
  }
};

export const createMenu = async (menuName, description, price, imageUrl, categoryId, itemIds = []) => {
  try {
    const menu = await databases.createDocument(
      appwriteConfig.databaseId,
      collections.MENU,
      'unique()',
      {
        menu_name: menuName,
        description: description,
        price: price,
        image_url: imageUrl,
        category_id: categoryId,
        item_ids: itemIds,
      }
    );

    return menu;
  } catch (error) {
    console.error('menuService :: createMenu :: error', error);
    throw error;
  }
};

export const updateMenu = async (menuId, updates) => {
  try {
    const menu = await databases.updateDocument(
      appwriteConfig.databaseId,
      collections.MENU,
      menuId,
      updates
    );

    return menu;
  } catch (error) {
    console.error('menuService :: updateMenu :: error', error);
    throw error;
  }
};

export const deleteMenu = async (menuId) => {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      collections.MENU,
      menuId
    );

    return true;
  } catch (error) {
    console.error('menuService :: deleteMenu :: error', error);
    throw error;
  }
};

export const getCategories = async () => {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      collections.CATEGORY
    );

    return response.documents;
  } catch (error) {
    console.error('menuService :: getCategories :: error', error);
    throw error;
  }
};

export const getWeeklyMenu = async () => {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      collections.WEEKLY_MENU
    );

    return response.documents;
  } catch (error) {
    console.error('menuService :: getWeeklyMenu :: error', error);
    throw error;
  }
}; 