import React, { useState, useEffect } from 'react';
import { View, FlatList, Platform, StyleSheet, Alert, TouchableOpacity, Linking, Switch } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator, FAB, Portal, Modal, Menu, Divider } from 'react-native-paper';
import { createMMKV } from 'react-native-mmkv';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import apiService from '../services/apiService';
import offlineService from '../services/offlineService';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';
import { useStripe } from '@stripe/stripe-react-native';
import Purchases from 'react-native-purchases';

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
    const [isOffline, setIsOffline] = useState(false);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [offerings, setOfferings] = useState<any>(null);
    const [isPaywallVisible, setIsPaywallVisible] = useState(false);
    const { t, i18n } = useTranslation();

    useEffect(() => {
        Purchases.configure({
            apiKey: "test_tbPImWadehhRVGNhtYSlZiQxztj",
        });
    }, []);

    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const fetchPaymentSheetParams = async () => {
        try {
            const response = await apiService.createPaymentIntent({ amount: 10 });
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

    const handleRevenueClick = async () => {
        try {
            setLoading(true);
            const offeringsData = await Purchases.getOfferings();
            if (offeringsData.current !== null && offeringsData.current.availablePackages.length !== 0) {
                setOfferings(offeringsData.current);
                setIsPaywallVisible(true);
            } else {
                Alert.alert("Offerings", "No offerings available at the moment.");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to fetch offerings");
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (pkg: any) => {
        try {
            setLoading(true);
            const { customerInfo } = await Purchases.purchasePackage(pkg);
            if (typeof customerInfo.entitlements.active['pro'] !== "undefined") {
                Alert.alert("Success", "You are now a PRO user!");
                setIsPaywallVisible(false);
            }
        } catch (e: any) {
            if (!e.userCancelled) {
                Alert.alert("Error", e.message);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch from cache for faster startup
        const cachedTodos = offlineService.getTodosCache();
        if (cachedTodos.length > 0) {
            setTodos(cachedTodos);
        }

        // Network status listener
        const unsubscribe = NetInfo.addEventListener(state => {
            const wasOffline = isOffline;
            const nowOffline = !state.isConnected;
            setIsOffline(nowOffline);

            if (wasOffline && !nowOffline) {
                // Back online! Sync pending changes
                offlineService.syncPendingMutations().then(() => fetchTodos(1));
            }
        });

        fetchTodos(1);

        return () => unsubscribe();
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
            const state = await NetInfo.fetch();
            if (!state.isConnected) {
                // Offline mode: Use cache
                if (pageNumber === 1) {
                    const cachedTodos = offlineService.getTodosCache();
                    setTodos(cachedTodos);
                    setHasMore(false);
                }
                return;
            }

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

            if (pageNumber === 1) {
                setTodos(todosArray);
                offlineService.setTodosCache(todosArray); // Update cache
            } else {
                setTodos(prev => [...prev, ...todosArray]);
            }
            setPage(pageNumber);
            if (todosArray.length === 0) setHasMore(false);
        } catch (error: any) {
            console.log("API ERROR:", error?.response?.data || error.message);
            // On error, try to fallback to cache if page 1
            if (pageNumber === 1) {
                setTodos(offlineService.getTodosCache());
            }
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

        // Optimistic UI update
        const id = editingTodoId || "temp_" + Date.now();
        const optimisticTodo: Todo = {
            _id: id,
            title: newTitle,
            description: newDescription,
            mode: newMode,
            completed: false,
            image: typeof newImage === 'string' ? newImage : newImage?.uri,
            pdf: typeof newPdf === 'string' ? newPdf : newPdf?.uri,
        };

        if (editingTodoId) {
            setTodos(prev => prev.map(t => (t._id === editingTodoId || t.id === editingTodoId) ? optimisticTodo : t));
        } else {
            setTodos(prev => [optimisticTodo, ...prev]);
        }
        hideModal();

        try {
            const state = await NetInfo.fetch();
            if (!state.isConnected) {
                // Queue mutation for later
                offlineService.addMutationToQueue({
                    type: editingTodoId ? 'UPDATE' : 'ADD',
                    data: { title: newTitle, description: newDescription, mode: newMode }, // Simple data for now
                    targetId: editingTodoId || undefined
                });
                return;
            }

            const formData = new FormData();
            formData.append("title", newTitle);
            formData.append("mode", String(newMode));
            if (newDescription) formData.append("description", newDescription);

            if (newImage && newImage.uri) {
                formData.append("image", {
                    uri: newImage.uri,
                    type: newImage.type || "image/jpeg",
                    name: newImage.fileName || "upload.jpg"
                } as any);
            }
            if (newPdf && newPdf.uri) {
                formData.append("pdf", {
                    uri: newPdf.uri,
                    type: newPdf.type || "application/pdf",
                    name: newPdf.name || "upload.pdf"
                } as any);
            }

            await apiService.saveTodo(formData, editingTodoId);
            fetchTodos(1); // Refresh to get real IDs and data
        } catch (error: any) {
            console.log("SAVE ERROR:", error?.message || error);
            // On failure, if we're not actually offline, we should probably rollback or notify
            Alert.alert("Notice", "Task saved locally. It will sync when connection is stable.");
            offlineService.addMutationToQueue({
                type: editingTodoId ? 'UPDATE' : 'ADD',
                data: { title: newTitle, description: newDescription, mode: newMode },
                targetId: editingTodoId || undefined
            });
        }
    };

    const deleteTodo = async (id: string | undefined) => {
        if (!id) return;

        // Optimistic UI update
        setTodos(prev => prev.filter(t => t._id !== id && t.id !== id));

        try {
            const state = await NetInfo.fetch();
            if (!state.isConnected) {
                offlineService.addMutationToQueue({
                    type: 'DELETE',
                    targetId: id
                });
                return;
            }
            await apiService.deleteTodo(id);
        } catch (error: any) {
            console.log("DELETE ERROR:", error?.message || error);
            // Fallback to queue if it failed due to connectivity
            offlineService.addMutationToQueue({
                type: 'DELETE',
                targetId: id
            });
        }
    };

    return (
        <View style={styles.container}>
            {isOffline && (
                <View style={styles.offlineBanner}>
                    <Text style={styles.offlineText}>You are currently offline. Changes will sync later.</Text>
                </View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text variant="headlineMedium" style={[styles.header, { marginBottom: 0 }]}>{t('todo_list')}</Text>

                <Menu
                    visible={isMenuVisible}
                    onDismiss={() => setIsMenuVisible(false)}
                    anchor={
                        <Button
                            mode="outlined"
                            onPress={() => setIsMenuVisible(true)}
                            icon={({ size, color }) => <Text style={{ fontSize: 16 }}>🌐</Text>}
                        >
                            {i18n.language.toUpperCase()}
                        </Button>
                    }
                >
                    <Menu.Item
                        onPress={() => { changeLanguage('en'); setIsMenuVisible(false); }}
                        title={t('English')}
                        leadingIcon={i18n.language === 'en' ? 'check' : undefined}
                    />
                    <Divider />
                    <Menu.Item
                        onPress={() => { changeLanguage('fr'); setIsMenuVisible(false); }}
                        title={t('French')}
                        leadingIcon={i18n.language === 'fr' ? 'check' : undefined}
                    />
                    <Divider />
                </Menu>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <Button mode="contained" onPress={showModal} style={{ flex: 1, marginRight: 8 }}>
                    {t('add_todo')}
                </Button>
                <Button mode="contained" onPress={handleRevenueClick} style={{ flex: 1, marginLeft: 8 }} icon="currency-usd">
                    Revenue
                </Button>
            </View>

            <Portal>
                <Modal visible={isAddModalVisible} onDismiss={hideModal} contentContainerStyle={styles.modalContent}>
                    <Text variant="titleLarge" style={{ marginBottom: 16 }}>
                        {editingTodoId ? t('edit_task') : t('add_new_task')}
                    </Text>

                    <TextInput
                        label={t('title')}
                        value={newTitle}
                        onChangeText={setNewTitle}
                        mode="outlined"
                        style={{ marginBottom: 12 }}
                    />

                    <TextInput
                        label={t('description')}
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

                <Modal visible={isPaywallVisible} onDismiss={() => setIsPaywallVisible(false)} contentContainerStyle={styles.modalContent}>
                    <Text variant="headlineSmall" style={{ textAlign: 'center', marginBottom: 20, fontWeight: 'bold' }}>
                        💎 Upgrade to Pro
                    </Text>
                    <Text style={{ textAlign: 'center', marginBottom: 20, color: 'gray' }}>
                        Get access to all premium features and remove ads.
                    </Text>

                    {offerings?.availablePackages.map((pkg: any) => (
                        <Card key={pkg.identifier} style={{ marginBottom: 16, backgroundColor: '#f0f0f0' }}>
                            <Card.Content style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flex: 1 }}>
                                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{pkg.product.title.split(' (')[0]}</Text>
                                    <Text variant="bodySmall">{pkg.product.description}</Text>
                                    <Text variant="titleLarge" style={{ marginTop: 8, color: '#6200ee' }}>{pkg.product.priceString}</Text>
                                </View>
                                <Button mode="contained" onPress={() => handlePurchase(pkg)}>
                                    Buy
                                </Button>
                            </Card.Content>
                        </Card>
                    ))}

                    <Button onPress={() => setIsPaywallVisible(false)} style={{ marginTop: 10 }}>
                        Maybe Later
                    </Button>
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
                label={t('Logout')}
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
    offlineBanner: {
        backgroundColor: '#ff9800',
        padding: 8,
        borderRadius: 4,
        marginBottom: 10,
        alignItems: 'center',
    },
    offlineText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
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
