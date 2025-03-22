const { Client, Databases, ID, Query, Account } = require('node-appwrite');

const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject("67dc2e4b00055c69fc12");

const databases = new Databases(client);
const account = new Account(client);
const databaseId = "67dc819e00325b3b1829";

// Authentication credentials
const email = "your-email@example.com"; // Replace with your email
const password = "your-password"; // Replace with your password

// Sample items data organized by menu
const itemsData = {
    "Paneer Tikka": [
        { item_name: "Paneer", quantity: 200, measurement_unit: "grams" },
        { item_name: "Yogurt", quantity: 100, measurement_unit: "grams" },
        { item_name: "Spices", quantity: 50, measurement_unit: "grams" },
        { item_name: "Oil", quantity: 30, measurement_unit: "ml" }
    ],
    "Vegetable Biryani": [
        { item_name: "Basmati Rice", quantity: 300, measurement_unit: "grams" },
        { item_name: "Mixed Vegetables", quantity: 200, measurement_unit: "grams" },
        { item_name: "Biryani Masala", quantity: 30, measurement_unit: "grams" },
        { item_name: "Oil", quantity: 50, measurement_unit: "ml" }
    ],
    "Malai Kofta": [
        { item_name: "Paneer", quantity: 150, measurement_unit: "grams" },
        { item_name: "Potato", quantity: 100, measurement_unit: "grams" },
        { item_name: "Cream", quantity: 100, measurement_unit: "ml" },
        { item_name: "Spices", quantity: 30, measurement_unit: "grams" }
    ],
    "Thali Platter": [
        { item_name: "Rice", quantity: 200, measurement_unit: "grams" },
        { item_name: "Dal", quantity: 150, measurement_unit: "ml" },
        { item_name: "Mixed Vegetables", quantity: 150, measurement_unit: "grams" },
        { item_name: "Chapati", quantity: 4, measurement_unit: "pieces" }
    ],
    "Dal Makhani": [
        { item_name: "Black Lentils", quantity: 200, measurement_unit: "grams" },
        { item_name: "Kidney Beans", quantity: 100, measurement_unit: "grams" },
        { item_name: "Butter", quantity: 50, measurement_unit: "grams" },
        { item_name: "Cream", quantity: 100, measurement_unit: "ml" }
    ],
    "Mixed Vegetable Curry": [
        { item_name: "Mixed Vegetables", quantity: 300, measurement_unit: "grams" },
        { item_name: "Onion", quantity: 100, measurement_unit: "grams" },
        { item_name: "Tomato", quantity: 100, measurement_unit: "grams" },
        { item_name: "Spices", quantity: 30, measurement_unit: "grams" }
    ],
    "Jain Thali": [
        { item_name: "Rice", quantity: 200, measurement_unit: "grams" },
        { item_name: "Dal", quantity: 150, measurement_unit: "ml" },
        { item_name: "Mixed Vegetables", quantity: 150, measurement_unit: "grams" },
        { item_name: "Chapati", quantity: 4, measurement_unit: "pieces" }
    ],
    "Jain Khichdi": [
        { item_name: "Rice", quantity: 200, measurement_unit: "grams" },
        { item_name: "Yellow Lentils", quantity: 100, measurement_unit: "grams" },
        { item_name: "Ghee", quantity: 30, measurement_unit: "ml" },
        { item_name: "Spices", quantity: 20, measurement_unit: "grams" }
    ],
    "Jain Dal Fry": [
        { item_name: "Yellow Lentils", quantity: 200, measurement_unit: "grams" },
        { item_name: "Ghee", quantity: 30, measurement_unit: "ml" },
        { item_name: "Spices", quantity: 20, measurement_unit: "grams" }
    ],
    "Swaminarayan Thali": [
        { item_name: "Rice", quantity: 200, measurement_unit: "grams" },
        { item_name: "Dal", quantity: 150, measurement_unit: "ml" },
        { item_name: "Mixed Vegetables", quantity: 150, measurement_unit: "grams" },
        { item_name: "Chapati", quantity: 4, measurement_unit: "pieces" }
    ],
    "Kadhi Khichdi": [
        { item_name: "Rice", quantity: 200, measurement_unit: "grams" },
        { item_name: "Yogurt", quantity: 200, measurement_unit: "ml" },
        { item_name: "Gram Flour", quantity: 50, measurement_unit: "grams" },
        { item_name: "Spices", quantity: 20, measurement_unit: "grams" }
    ],
    "Mixed Dal": [
        { item_name: "Yellow Lentils", quantity: 100, measurement_unit: "grams" },
        { item_name: "Red Lentils", quantity: 100, measurement_unit: "grams" },
        { item_name: "Ghee", quantity: 30, measurement_unit: "ml" },
        { item_name: "Spices", quantity: 20, measurement_unit: "grams" }
    ],
    "Vegan Buddha Bowl": [
        { item_name: "Quinoa", quantity: 150, measurement_unit: "grams" },
        { item_name: "Mixed Vegetables", quantity: 200, measurement_unit: "grams" },
        { item_name: "Chickpeas", quantity: 100, measurement_unit: "grams" },
        { item_name: "Tahini Sauce", quantity: 50, measurement_unit: "ml" }
    ],
    "Vegan Curry": [
        { item_name: "Mixed Vegetables", quantity: 300, measurement_unit: "grams" },
        { item_name: "Coconut Milk", quantity: 200, measurement_unit: "ml" },
        { item_name: "Curry Powder", quantity: 20, measurement_unit: "grams" },
        { item_name: "Oil", quantity: 30, measurement_unit: "ml" }
    ],
    "Vegan Stir Fry": [
        { item_name: "Mixed Vegetables", quantity: 300, measurement_unit: "grams" },
        { item_name: "Sesame Oil", quantity: 30, measurement_unit: "ml" },
        { item_name: "Soy Sauce", quantity: 30, measurement_unit: "ml" },
        { item_name: "Ginger", quantity: 20, measurement_unit: "grams" }
    ]
};

async function login() {
    try {
        const session = await account.createEmailSession(email, password);
        console.log("Successfully logged in!");
        return session;
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
}

async function getMenuId(menuName) {
    try {
        const response = await databases.listDocuments(databaseId, "Menu", [
            Query.equal("menu_name", menuName)
        ]);
        if (response.documents.length > 0) {
            return response.documents[0].$id;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching menu ID for ${menuName}:`, error);
        return null;
    }
}

async function addItems() {
    try {
        // First, login to get authentication
        await login();

        for (const [menuName, items] of Object.entries(itemsData)) {
            const menuId = await getMenuId(menuName);
            if (!menuId) {
                console.error(`Menu not found: ${menuName}`);
                continue;
            }

            const itemIds = [];
            for (const item of items) {
                const itemDoc = await databases.createDocument(
                    databaseId,
                    "Items",
                    ID.unique(),
                    item
                );
                itemIds.push(itemDoc.$id);
                console.log(`Item added: ${item.item_name}`);
            }

            // Update menu with item IDs
            await databases.updateDocument(
                databaseId,
                "Menu",
                menuId,
                {
                    items: itemIds
                }
            );
            console.log(`Updated menu ${menuName} with items`);
        }
        console.log("All items added and menus updated successfully!");
    } catch (error) {
        console.error("Error adding items:", error);
    }
}

// Execute the function
addItems(); 