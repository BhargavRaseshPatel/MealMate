const { Client, Databases, ID } = require('node-appwrite');

const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject("67dc2e4b00055c69fc12");

const databases = new Databases(client);
const databaseId = "67dc819e00325b3b1829";

// Sample menu data organized by category
const menuData = {
    "Indian Food": [
        {
            menu_name: "Paneer Tikka",
            description: "Grilled cottage cheese marinated in spiced yogurt",
            price: 14.99,
            image_url: "https://example.com/paneer-tikka.jpg"
        },
        {
            menu_name: "Vegetable Biryani",
            description: "Fragrant rice cooked with mixed vegetables and aromatic spices",
            price: 13.99,
            image_url: "https://example.com/veg-biryani.jpg"
        },
        {
            menu_name: "Malai Kofta",
            description: "Cottage cheese and potato dumplings in rich cream sauce",
            price: 15.99,
            image_url: "https://example.com/malai-kofta.jpg"
        }
    ],
    "Hindu Food": [
        {
            menu_name: "Thali Platter",
            description: "Complete meal with various dishes and breads",
            price: 19.99,
            image_url: "https://example.com/thali.jpg"
        },
        {
            menu_name: "Dal Makhani",
            description: "Creamy black lentils cooked overnight",
            price: 12.99,
            image_url: "https://example.com/dal-makhani.jpg"
        },
        {
            menu_name: "Mixed Vegetable Curry",
            description: "Assorted vegetables in aromatic gravy",
            price: 13.99,
            image_url: "https://example.com/mixed-veg-curry.jpg"
        }
    ],
    "Jain Food": [
        {
            menu_name: "Jain Thali",
            description: "Complete Jain meal without onion and garlic",
            price: 18.99,
            image_url: "https://example.com/jain-thali.jpg"
        },
        {
            menu_name: "Jain Khichdi",
            description: "Rice and lentils cooked without onion and garlic",
            price: 11.99,
            image_url: "https://example.com/jain-khichdi.jpg"
        },
        {
            menu_name: "Jain Dal Fry",
            description: "Tempered lentils without onion and garlic",
            price: 12.99,
            image_url: "https://example.com/jain-dal-fry.jpg"
        }
    ],
    "Swaminarayan Food": [
        {
            menu_name: "Swaminarayan Thali",
            description: "Traditional Swaminarayan meal",
            price: 17.99,
            image_url: "https://example.com/swaminarayan-thali.jpg"
        },
        {
            menu_name: "Kadhi Khichdi",
            description: "Yogurt-based curry with rice and lentils",
            price: 13.99,
            image_url: "https://example.com/kadhi-khichdi.jpg"
        },
        {
            menu_name: "Mixed Dal",
            description: "Combination of different lentils",
            price: 12.99,
            image_url: "https://example.com/mixed-dal.jpg"
        }
    ],
    "Vegan Food": [
        {
            menu_name: "Vegan Buddha Bowl",
            description: "Healthy bowl with quinoa, vegetables, and tahini sauce",
            price: 16.99,
            image_url: "https://example.com/buddha-bowl.jpg"
        },
        {
            menu_name: "Vegan Curry",
            description: "Coconut-based curry with vegetables",
            price: 14.99,
            image_url: "https://example.com/vegan-curry.jpg"
        },
        {
            menu_name: "Vegan Stir Fry",
            description: "Fresh vegetables stir-fried in sesame oil",
            price: 13.99,
            image_url: "https://example.com/vegan-stir-fry.jpg"
        }
    ]
};

async function getCategoryId(categoryName) {
    try {
        const response = await databases.listDocuments(databaseId, "Category", [
            Query.equal("category_name", categoryName)
        ]);
        if (response.documents.length > 0) {
            return response.documents[0].$id;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching category ID for ${categoryName}:`, error);
        return null;
    }
}

async function addMenuItems() {
    try {
        for (const [category, items] of Object.entries(menuData)) {
            const categoryId = await getCategoryId(category);
            if (!categoryId) {
                console.error(`Category not found: ${category}`);
                continue;
            }

            for (const item of items) {
                const menuItem = {
                    ...item,
                    category_name: category,
                    item_ids: [], // Empty array for now, can be updated later
                };

                await databases.createDocument(
                    databaseId,
                    "Menu",
                    ID.unique(),
                    menuItem
                );
                console.log(`Menu item added: ${item.menu_name}`);
            }
        }
        console.log("All menu items added successfully!");
    } catch (error) {
        console.error("Error adding menu items:", error);
    }
}

// Execute the function
addMenuItems(); 