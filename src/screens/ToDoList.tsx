import React, { useState, useEffect } from 'react';
import { View, FlatList, Platform, StyleSheet, Alert, TouchableOpacity, Linking, Switch } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator, FAB, Portal, Modal } from 'react-native-paper';
import { createMMKV } from 'react-native-mmkv';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import apiService from '../services/apiService';

const storage = createMMKV();
interface Todo {
    _id?: string;
    id?: string;
    title?: string;
    name?: string;
    completed?: boolean;
    description?: string;
    image?: string;
    pdf?: string;
    mode?: boolean;
}

const ToDoList = ({ navigation }: any) => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newImage, setNewImage] = useState<any>(null);
    const [newPdf, setNewPdf] = useState<any>(null);
    const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [newMode, setNewMode] = useState<boolean>(true);

    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const fetchPaymentSheetParams = async () => {
        try {
            const response = await apiService.createPaymentIntent({ amount: 10 });
            console.log('res', response)
            return response.data.clientSecret;
        } catch (error) {
            console.error("Payment Intent Error:", error);
            throw error;
        }
    };

    const initializePaymentSheet = async () => {
        try {
            setLoading(true);
            const clientSecret = await fetchPaymentSheetParams();

            const { error } = await initPaymentSheet({
                paymentIntentClientSecret: clientSecret,
                merchantDisplayName: "My App"
            });

            if (!error) {
                await openPaymentSheet();
            } else {
                Alert.alert("Error", error.message);
            }
        } catch (error: any) {
            Alert.alert("Error", "Failed to initialize payment");
        } finally {
            setLoading(false);
        }
    };

    const openPaymentSheet = async () => {
        const { error } = await presentPaymentSheet();

        if (error) {
            Alert.alert(`Payment failed: ${error.message}`);
        } else {
            Alert.alert("Payment successful");
        }
    };

    useEffect(() => {
        fetchTodos(1);
    }, []);

    const handleLogout = async () => {
        try {
            const token = storage.getString("accessToken");
            if (token) {
                await apiService.logout();
            }
        } catch (error) {
            console.log("LOGOUT ERROR:", error);
        } finally {
            storage.remove("accessToken");
            navigation.replace('LoginScreen');
        }
    };

    const fetchTodos = async (pageNumber: number = 1) => {
        if (pageNumber === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        try {
            // Adding cache buster timestamp to prevent aggressive caching on Android
            const res = await apiService.getTodos(pageNumber);
            const data = res.data;

            let todosArray = [];
            if (Array.isArray(data)) {
                todosArray = data;
            } else if (data && Array.isArray(data.todos)) {
                todosArray = data.todos;
            } else if (data && Array.isArray(data.data)) {
                todosArray = data.data;
            }

            console.log("Setting todos state to:", todosArray);
            if (pageNumber === 1) {
                setTodos(todosArray);
            } else {
                setTodos(prev => [...prev, ...todosArray]);
            }
            setPage(pageNumber);

            // If the array is empty, we reached the end
            if (todosArray.length === 0) {
                setHasMore(false);
            } else {
                if (pageNumber === 1) setHasMore(true);
            }
        } catch (error: any) {
            console.log("API ERROR:", error?.response?.data || error.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMoreTodos = () => {
        if (!loadingMore && !loading && hasMore) {
            fetchTodos(page + 1);
        }
    };

    const showModal = () => {
        setEditingTodoId(null);
        setNewTitle('');
        setNewDescription('');
        setNewImage(null);
        setNewPdf(null);
        setNewMode(true);
        setIsAddModalVisible(true);
    };

    const hideModal = () => {
        setIsAddModalVisible(false);
        setEditingTodoId(null);
        setNewTitle('');
        setNewDescription('');
        setNewImage(null);
        setNewPdf(null);
        setNewMode(true);
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

    const handlePdfUpload = async () => {
        try {
            const res = await DocumentPicker.pickSingle({
                type: [DocumentPicker.types.pdf],
            });
            setNewPdf(res);
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                console.log('User cancelled document picker');
            } else {
                console.log('DocumentPicker Error: ', err);
                Alert.alert('Error', 'Failed to pick PDF');
            }
        }
    };

    const saveTodo = async () => {
        if (!newTitle.trim()) {
            Alert.alert("Validation", "Title is required");
            return;
        }
        try {
            const formData = new FormData();
            formData.append("title", newTitle);
            formData.append("mode", String(newMode));
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

            if (newPdf && newPdf.uri) {
                formData.append("pdf", {
                    uri: newPdf.uri,
                    type: newPdf.type || "application/pdf",
                    name: newPdf.name || "upload.pdf"
                } as any);
            } else if (typeof newPdf === 'string') {
                formData.append("pdf", newPdf);
            }

            const res = await apiService.saveTodo(formData, editingTodoId);
            const data = res.data;
            hideModal();
            fetchTodos(1);
            console.log('dataa', data);
        } catch (error: any) {
            const data = error.response?.data;
            Alert.alert("Error", data?.message || "Failed to save todo");
            console.log("SAVE ERROR:", error?.message || error);
        }
    };

    const deleteTodo = async (id: string | undefined) => {
        if (!id) return;
        try {
            await apiService.deleteTodo(id);
            // Remove from ui immediately or fetch again
            fetchTodos(1);
        } catch (error: any) {
            const data = error.response?.data;
            console.log("DELETE ERROR:", error?.message || error);
            Alert.alert("Error", data?.message || "Failed to delete todo");
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
                        style={{ marginBottom: 12 }}
                        icon={({ size, color }) => <Text style={{ fontSize: 20, color }}>📷</Text>}
                    >
                        {newImage ? "Image Selected" : "Upload Image"}
                    </Button>

                    <Button
                        mode="outlined"
                        onPress={handlePdfUpload}
                        style={{ marginBottom: 16 }}
                        icon={({ size, color }) => <Text style={{ fontSize: 20, color }}>📄</Text>}
                    >
                        {newPdf ? "PDF Selected" : "Upload PDF"}
                    </Button>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Switch
                                value={newMode}
                                onValueChange={setNewMode}
                                trackColor={{ false: "#767577", true: "#81b0ff" }}
                                thumbColor={newMode ? "#6200ee" : "#f4f3f4"}
                            />
                            <Text style={{ marginLeft: 8 }} onPress={() => setNewMode(!newMode)}>
                                {newMode ? 'Online' : 'Offline'}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                            <Button onPress={hideModal} style={{ marginRight: 8 }}>Cancel</Button>
                            <Button mode="contained" onPress={saveTodo}>{editingTodoId ? "Save" : "Add"}</Button>
                        </View>
                    </View>
                </Modal>
            </Portal>

            {loading && page === 1 ? (
                <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={todos}
                    keyExtractor={(item, index) => item._id?.toString() || item.id?.toString() || index.toString()}
                    onEndReached={loadMoreTodos}
                    onEndReachedThreshold={0.5}
                    contentContainerStyle={{ paddingBottom: 80 }}
                    ListFooterComponent={
                        loadingMore ? <ActivityIndicator style={{ margin: 10 }} /> :
                            (!hasMore && todos.length > 0) ? <Text style={{ textAlign: 'center', margin: 10, color: 'gray' }}>No more tasks</Text> : null
                    }
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
                                                setNewPdf(item.pdf || "");
                                                setNewMode(item.mode !== undefined ? item.mode : true);
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
                            <Card.Actions>
                                {!!item.pdf && (
                                    <Button
                                        icon={({ size, color }) => <Text style={{ fontSize: 20, color }}>📄</Text>}
                                        onPress={() => Linking.openURL(Platform.OS === 'android' ? item.pdf!.replace('localhost', '10.0.2.2') : item.pdf!)}
                                    >
                                        View PDF
                                    </Button>
                                )}
                                <Button
                                    mode="contained-tonal"
                                    onPress={initializePaymentSheet}
                                    style={{ marginLeft: 8 }}
                                >
                                    Buy Now
                                </Button>
                            </Card.Actions>
                        </Card>
                    )}
                />
            )}
            <FAB
                icon={({ size, color }) => <Text style={{ fontSize: 20, color }}>🚪</Text>}
                label="Logout"
                style={styles.fab}
                onPress={handleLogout}
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
