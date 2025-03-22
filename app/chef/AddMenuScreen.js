import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    FlatList,
} from 'react-native';
import { databases } from '../../appwrite/config';
import { ID, Query } from 'appwrite';
import * as ImagePicker from 'expo-image-picker';

const AddMenuScreen = ({ navigation }) => {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [menuName, setMenuName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState(null);
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({
        item_name: '',
        quantity: '',
        measurement_unit: ''
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await databases.listDocuments(
                "67dc819e00325b3b1829",
                "Category"
            );
            setCategories(response.documents);
        } catch (error) {
            console.error('Error fetching categories:', error);
            Alert.alert('Error', 'Failed to fetch categories');
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const addItem = () => {
        if (newItem.item_name && newItem.quantity && newItem.measurement_unit) {
            setItems([...items, { ...newItem, id: Date.now().toString() }]);
            setNewItem({ item_name: '', quantity: '', measurement_unit: '' });
        } else {
            Alert.alert('Error', 'Please fill all item fields');
        }
    };

    const removeItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    const saveMenu = async () => {
        if (!selectedCategory || !menuName || !description || !price || !image || items.length === 0) {
            Alert.alert('Error', 'Please fill all fields and add at least one item');
            return;
        }

        try {
            // First, create all items
            const itemIds = [];
            for (const item of items) {
                const itemDoc = await databases.createDocument(
                    "67dc819e00325b3b1829",
                    "Items",
                    ID.unique(),
                    {
                        item_name: item.item_name,
                        quantity: parseInt(item.quantity),
                        measurement_unit: item.measurement_unit
                    }
                );
                itemIds.push(itemDoc.$id);
            }

            // Then create the menu
            await databases.createDocument(
                "67dc819e00325b3b1829",
                "Menu",
                ID.unique(),
                {
                    menu_name: menuName,
                    description,
                    price: parseFloat(price),
                    image_url: image,
                    category: selectedCategory.$id,
                    items: itemIds
                }
            );

            Alert.alert('Success', 'Menu added successfully');
            navigation.goBack();
        } catch (error) {
            console.error('Error saving menu:', error);
            Alert.alert('Error', 'Failed to save menu');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Add New Menu Item</Text>
                </View>

                {/* Category Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Category</Text>
                    <FlatList
                        horizontal
                        data={categories}
                        keyExtractor={(item) => item.$id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.categoryButton,
                                    selectedCategory?.$id === item.$id && styles.selectedCategory
                                ]}
                                onPress={() => setSelectedCategory(item)}
                            >
                                <Text style={[
                                    styles.categoryButtonText,
                                    selectedCategory?.$id === item.$id && styles.selectedCategoryText
                                ]}>
                                    {item.category_name}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* Menu Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Menu Details</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Menu Name"
                        value={menuName}
                        onChangeText={setMenuName}
                    />
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Description"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Price"
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric"
                    />
                    <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                        <Text style={styles.imageButtonText}>
                            {image ? 'Change Image' : 'Select Image'}
                        </Text>
                    </TouchableOpacity>
                    {image && (
                        <Image source={{ uri: image }} style={styles.previewImage} />
                    )}
                </View>

                {/* Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Items</Text>
                    <View style={styles.itemInput}>
                        <TextInput
                            style={[styles.input, styles.itemInputField]}
                            placeholder="Item Name"
                            value={newItem.item_name}
                            onChangeText={(text) => setNewItem({ ...newItem, item_name: text })}
                        />
                        <TextInput
                            style={[styles.input, styles.itemInputField]}
                            placeholder="Quantity"
                            value={newItem.quantity}
                            onChangeText={(text) => setNewItem({ ...newItem, quantity: text })}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={[styles.input, styles.itemInputField]}
                            placeholder="Unit (g, ml, etc.)"
                            value={newItem.measurement_unit}
                            onChangeText={(text) => setNewItem({ ...newItem, measurement_unit: text })}
                        />
                        <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
                            <Text style={styles.addItemButtonText}>Add</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={items}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.itemCard}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.item_name}</Text>
                                    <Text style={styles.itemDetails}>
                                        {item.quantity} {item.measurement_unit}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.removeItemButton}
                                    onPress={() => removeItem(item.id)}
                                >
                                    <Text style={styles.removeItemButtonText}>Remove</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={saveMenu}>
                    <Text style={styles.saveButtonText}>Save Menu</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    section: {
        padding: 20,
        backgroundColor: '#fff',
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    categoryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 10,
    },
    selectedCategory: {
        backgroundColor: '#007AFF',
    },
    categoryButtonText: {
        color: '#333',
    },
    selectedCategoryText: {
        color: '#fff',
    },
    input: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    imageButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 15,
    },
    imageButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 15,
    },
    itemInput: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 15,
    },
    itemInputField: {
        flex: 1,
        minWidth: 100,
    },
    addItemButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addItemButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    itemCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    itemDetails: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    removeItemButton: {
        backgroundColor: '#FF3B30',
        padding: 8,
        borderRadius: 5,
    },
    removeItemButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        margin: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default AddMenuScreen; 