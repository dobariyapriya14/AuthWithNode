import React, { useState, useEffect } from 'react';
import { View, FlatList, Platform, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator, FAB, Portal, Modal } from 'react-native-paper';
import { createMMKV } from 'react-native-mmkv';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { API_URL, endPoints } from '../constants/apiCilents';

const storage = createMMKV();
interface Todo {
    _id?: string;
    id?: string;
    title?: string;
    name?: string;
    completed?: boolean;
    description?: string;
    image?: string;
}

const ToDoList = ({ navigation }: any) => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newImage, setNewImage] = useState<any>(null);
    const [editingTodoId, setEditingTodoId] = useState<string | null>(null);

    useEffect(() => {
        fetchTodos();
    }, []);

    const logout = async () => {
        try {
            const token = storage.getString("accessToken");
            if (token) {
                await fetch(`${API_URL}${endPoints.logout}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.log("LOGOUT ERROR:", error);
        } finally {
            storage.remove("accessToken");
            navigation.replace('LoginScreen');
        }
    };

    const fetchTodos = async () => {
        setLoading(true);
        try {
            const token = storage.getString("accessToken"); // Changed from AsyncStorage.getItem
            // Adding cache buster timestamp to prevent aggressive caching on Android
            const timestamp = new Date().getTime();
            const res = await fetch(`${API_URL}${endPoints.todos}?t=${timestamp}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-cache",
                    "Authorization": `Bearer ${token}`
                }
            });

            const text = await res.text();
            console.log("fetchTodos raw response:", text);

            let data: any = {};
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.log("fetchTodos Response is not JSON:", text);
            }

            if (res.ok) {
                console.log("fetchTodos parsed data:", data);

                let todosArray = [];
                if (Array.isArray(data)) {
                    todosArray = data;
                } else if (data && Array.isArray(data.todos)) {
                    todosArray = data.todos;
                } else if (data && Array.isArray(data.data)) {
                    todosArray = data.data;
                }

                console.log("Setting todos state to:", todosArray);
                setTodos(todosArray);
            } else {
                console.log("Failed to fetch todos:", data);
            }
        } catch (error) {
            console.log("API ERROR:", error);
        } finally {
            setLoading(false);
        }
    };

    const showModal = () => {
        setEditingTodoId(null);
        setNewTitle('');
        setNewDescription('');
        setNewImage(null);
        setIsAddModalVisible(true);
    };

    const hideModal = () => {
        setIsAddModalVisible(false);
        setEditingTodoId(null);
        setNewTitle('');
        setNewDescription('');
        setNewImage(null);
    };

    const processImageResult = (result: any) => {
        if (result.didCancel) {
            console.log('User cancelled image picker');
        } else if (result.errorCode) {
            console.log('ImagePicker Error: ', result.errorMessage);
            Alert.alert('Error', result.errorMessage || 'Failed to pick image');
        } else if (result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            setNewImage(asset);
        }
    };

    const handleImageUpload = () => {
        Alert.alert(
            "Select Image",
            "Choose an option",
            [
                {
                    text: "Camera",
                    onPress: async () => {
                        const result = await launchCamera({ mediaType: 'photo', saveToPhotos: false });
                        processImageResult(result);
                    }
                },
                {
                    text: "Photo Library",
                    onPress: async () => {
                        const result = await launchImageLibrary({ mediaType: 'photo' });
                        processImageResult(result);
                    }
                },
                {
                    text: "Cancel",
                    style: "cancel"
                }
            ]
        );
    };

    const saveTodo = async () => {
        if (!newTitle.trim()) {
            Alert.alert("Validation", "Title is required");
            return;
        }
        try {
            const token = storage.getString("accessToken");
            const url = editingTodoId
                ? `${API_URL}${endPoints.todos}/${editingTodoId}`
                : `${API_URL}${endPoints.todos}`;
            const method = editingTodoId ? "PUT" : "POST";

            const formData = new FormData();
            formData.append("title", newTitle);
            if (newDescription) {
                formData.append("description", newDescription);
            }
            if (newImage && newImage.uri) {
                formData.append("image", {
                    uri: newImage.uri,
                    type: newImage.type || "image/jpeg",
                    name: newImage.fileName || "upload.jpg"
                } as any);
            } else if (typeof newImage === 'string') {
                formData.append("image", newImage);
            }

            const res = await fetch(url, {
                method,
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });
            const text = await res.text();

            let data: any = {};
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.log("Response is not JSON:", text);
            }

            if (res.ok) {
                hideModal();
                fetchTodos();
            } else {
                Alert.alert("Error", data?.message || "Failed to save todo");
            }

            console.log('dataa', data)
        } catch (error: any) {
            console.log("SAVE ERROR:", error?.message || error);
            Alert.alert("Error", "Network error");
        }
    };

    const deleteTodo = async (id: string | undefined) => {
        if (!id) return;
        try {
            const token = storage.getString("accessToken");
            const res = await fetch(`${API_URL}${endPoints.todos}/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                // Remove from ui immediately or fetch again
                fetchTodos();
            } else {
                const text = await res.text();
                let data: any = {};
                try { data = JSON.parse(text); } catch (e) { }
                Alert.alert("Error", data?.message || "Failed to delete todo");
            }
        } catch (error: any) {
            console.log("DELETE ERROR:", error?.message || error);
            Alert.alert("Error", "Network error");
        }
    };

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.header}>To Do List</Text>

            <Button mode="contained" onPress={showModal} style={{ marginBottom: 20 }}>
                + Add Todo
            </Button>

            <Portal>
                <Modal visible={isAddModalVisible} onDismiss={hideModal} contentContainerStyle={styles.modalContent}>
                    <Text variant="titleLarge" style={{ marginBottom: 16 }}>
                        {editingTodoId ? "Edit Task" : "Add New Task"}
                    </Text>

                    <TextInput
                        label="Title"
                        value={newTitle}
                        onChangeText={setNewTitle}
                        mode="outlined"
                        style={{ marginBottom: 12 }}
                    />

                    <TextInput
                        label="Description"
                        value={newDescription}
                        onChangeText={setNewDescription}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={{ marginBottom: 12 }}
                    />

                    <Button
                        mode="outlined"
                        onPress={handleImageUpload}
                        style={{ marginBottom: 16 }}
                        icon={({ size, color }) => <Text style={{ fontSize: 20, color }}>📷</Text>}
                    >
                        {newImage ? "Image Selected" : "Upload Image"}
                    </Button>

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <Button onPress={hideModal} style={{ marginRight: 8 }}>Cancel</Button>
                        <Button mode="contained" onPress={saveTodo}>{editingTodoId ? "Save" : "Add"}</Button>
                    </View>
                </Modal>
            </Portal>

            {loading ? (
                <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={todos}
                    keyExtractor={(item, index) => item._id?.toString() || item.id?.toString() || index.toString()}
                    renderItem={({ item }) => (
                        <Card style={styles.card}>
                            <Card.Title
                                title={item.title || item.name || "Untitled"}
                                right={(props) => (
                                    <View style={{ flexDirection: 'row' }}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setEditingTodoId(item._id || item.id || null);
                                                setNewTitle(item.title || item.name || "");
                                                setNewDescription(item.description || "");
                                                setNewImage(item.image || "");
                                                setIsAddModalVisible(true);
                                            }}
                                            style={{ padding: 10, justifyContent: 'center' }}
                                        >
                                            <Text style={{ fontSize: 20 }}>✏️</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => deleteTodo(item._id || item.id)}
                                            style={{ padding: 10, justifyContent: 'center' }}
                                        >
                                            <Text style={{ fontSize: 20 }}>🗑️</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                            {!!item.description && (
                                <Card.Content>
                                    <Text variant="bodyMedium">{item.description}</Text>
                                </Card.Content>
                            )}
                            {!!item.image && (
                                <Card.Cover
                                    source={{ uri: Platform.OS === 'android' ? item.image.replace('localhost', '10.0.2.2') : item.image }}
                                    style={{ marginTop: 10, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }}
                                />
                            )}
                        </Card>
                    )}
                />
            )}
            <FAB
                icon={({ size, color }) => <Text style={{ fontSize: 20, color }}>🚪</Text>}
                label="Logout"
                style={styles.fab}
                onPress={logout}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: 'bold',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
    },
    listContainer: {
        paddingBottom: 20,
    },
    card: {
        marginBottom: 10,
        backgroundColor: '#dce3de'
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    }
});

export default ToDoList;
