import React, { useState, useEffect } from 'react';
import { View, FlatList, Platform, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator, IconButton, FAB } from 'react-native-paper';
import { createMMKV } from 'react-native-mmkv';
import { API_URL, endPoints } from '../constants/apiCilents';

const storage = createMMKV();

interface Todo {
    _id?: string;
    id?: string;
    title?: string;
    name?: string;
    completed?: boolean;
}

const ToDoList = ({ navigation }: any) => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [newTodo, setNewTodo] = useState('');
    const [loading, setLoading] = useState(false);

    // Edit state
    const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
    const [editTodoTitle, setEditTodoTitle] = useState('');

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
            const res = await fetch(`${API_URL}${endPoints.todos}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
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

    const addTodo = async () => {
        if (!newTodo.trim()) return;
        try {
            const token = storage.getString("accessToken");
            const res = await fetch(`${API_URL}${endPoints.todos}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ title: newTodo }) // Adjust field if your api needs {name: ...} instead
            });
            const text = await res.text();

            let data: any = {};
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.log("Response is not JSON:", text);
            }

            if (res.ok) {
                setNewTodo('');
                fetchTodos();
            } else {
                Alert.alert("Error", data?.message || "Failed to add todo");
            }

            console.log('dataa', data)
        } catch (error: any) {
            console.log("POST ERROR:", error?.message || error);
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

    const saveEdit = async (id: string | undefined) => {
        if (!id || !editTodoTitle.trim()) return;
        try {
            const token = storage.getString("accessToken");
            const res = await fetch(`${API_URL}${endPoints.todos}/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ title: editTodoTitle })
            });

            if (res.ok) {
                setEditingTodoId(null);
                setEditTodoTitle('');
                fetchTodos();
            } else {
                const text = await res.text();
                let data: any = {};
                try { data = JSON.parse(text); } catch (e) { }
                Alert.alert("Error", data?.message || "Failed to edit todo");
            }
        } catch (error: any) {
            console.log("PUT ERROR:", error?.message || error);
            Alert.alert("Error", "Network error");
        }
    };

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.header}>To Do List</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    label="New Task"
                    value={newTodo}
                    onChangeText={setNewTodo}
                    mode="outlined"
                    style={styles.input}
                />
                <Button mode="contained" onPress={addTodo} style={styles.addButton}>
                    Add
                </Button>
            </View>

            {loading ? (
                <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={todos}
                    keyExtractor={(item, index) => item._id?.toString() || item.id?.toString() || index.toString()}
                    renderItem={({ item }) => (
                        <Card style={styles.card}>
                            {editingTodoId === (item._id || item.id) ? (
                                <View style={{ padding: 10, flexDirection: 'row', alignItems: 'center' }}>
                                    <TextInput
                                        value={editTodoTitle}
                                        onChangeText={setEditTodoTitle}
                                        style={{ flex: 1, backgroundColor: 'transparent', height: 40 }}
                                        mode="outlined"
                                    />
                                    <TouchableOpacity onPress={() => saveEdit(item._id || item.id)} style={{ padding: 10, marginLeft: 5 }}>
                                        <Text style={{ fontSize: 20 }}>💾</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setEditingTodoId(null)} style={{ padding: 10 }}>
                                        <Text style={{ fontSize: 20 }}>❌</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <Card.Title
                                    title={item.title || item.name || "Untitled"}
                                    right={(props) => (
                                        <View style={{ flexDirection: 'row' }}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setEditingTodoId(item._id || item.id || null);
                                                    setEditTodoTitle(item.title || item.name || "");
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    input: {
        flex: 1,
        marginRight: 10,
    },
    addButton: {
        justifyContent: 'center',
        height: 50,
    },
    listContainer: {
        paddingBottom: 20,
    },
    card: {
        marginBottom: 10,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    }
});

export default ToDoList;
