import React, { useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, FAB, Chip, Button, Badge, IconButton, useTheme } from 'react-native-paper';
import MapView, { Marker, Callout, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTodos, Todo, useSaveTodoMutation } from '../hooks/useTodos';
import useUserLocation from '../hooks/useUserLocation';
import { DEFAULT_LOCATION } from '../services/locationService';

export const TaskMapScreen = ({ navigation: _navigation }: any) => {
    const theme = useTheme();
    const mapRef = useRef<MapView | null>(null);

    // Fetch todos with TanStack Query
    const { data: todos = [] } = useTodos(1);
    const saveTodoMutation = useSaveTodoMutation();

    // Fetch user location
    const { location: userLocation, isLoading: isLocationLoading, refreshLocation } = useUserLocation(true);

    // Filter state: 'ALL' | 'PENDING' | 'COMPLETED'
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

    // Filter tasks that have valid coordinates
    const tasksWithLocation = todos.filter(
        (t) => typeof t.latitude === 'number' && typeof t.longitude === 'number'
    );

    const filteredTasks = tasksWithLocation.filter((t) => {
        if (filter === 'PENDING') return !t.completed;
        if (filter === 'COMPLETED') return !!t.completed;
        return true;
    });

    // Default initial region
    const initialRegion = {
        latitude: userLocation?.latitude || (tasksWithLocation[0]?.latitude ?? DEFAULT_LOCATION.latitude),
        longitude: userLocation?.longitude || (tasksWithLocation[0]?.longitude ?? DEFAULT_LOCATION.longitude),
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    const handleCenterOnUser = () => {
        if (userLocation && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            }, 1000);
        } else {
            refreshLocation();
        }
    };

    const handleToggleTodoStatus = (todo: Todo) => {
        if (!todo._id && !todo.id) return;
        const todoId = todo._id || todo.id;
        
        const updatedStatus = !todo.completed;

        const formData = new FormData();
        formData.append('completed', String(updatedStatus));
        if (todo.title) formData.append('title', todo.title);
        if (todo.latitude) formData.append('latitude', String(todo.latitude));
        if (todo.longitude) formData.append('longitude', String(todo.longitude));
        if (todo.address) formData.append('address', todo.address);

        saveTodoMutation.mutate({
            formData,
            editingTodoId: todoId,
            optimisticTodo: { ...todo, completed: updatedStatus },
        });

        if (selectedTodo && (selectedTodo._id === todoId || selectedTodo.id === todoId)) {
            setSelectedTodo({ ...selectedTodo, completed: updatedStatus });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Map View */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                mapType="none"
                initialRegion={initialRegion}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsCompass={true}
                onPress={() => setSelectedTodo(null)}
            >
                <UrlTile
                    urlTemplate="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    maximumZ={19}
                    flipY={false}
                />
                {/* User Location Pulse Marker (Custom Fallback/Highlight) */}
                {userLocation && (
                    <Marker
                        coordinate={{
                            latitude: userLocation.latitude,
                            longitude: userLocation.longitude,
                        }}
                        title="You are here"
                        description="Current Live Location"
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={styles.userLocationDotOuter}>
                            <View style={styles.userLocationDotInner} />
                        </View>
                    </Marker>
                )}

                {/* Render Task Pins */}
                {filteredTasks.map((todo) => {
                    const id = todo._id || todo.id || String(Math.random());
                    const pinColor = todo.completed ? '#4CAF50' : theme.colors.primary;

                    return (
                        <Marker
                            key={id}
                            coordinate={{
                                latitude: todo.latitude!,
                                longitude: todo.longitude!,
                            }}
                            pinColor={pinColor}
                            onPress={() => setSelectedTodo(todo)}
                        >
                            <Callout tooltip onPress={() => setSelectedTodo(todo)}>
                                <Surface style={[styles.calloutBox, { backgroundColor: theme.colors.surface }]} elevation={3}>
                                    <Text variant="titleSmall" numberOfLines={1} style={styles.calloutTitle}>
                                        {todo.title || todo.name || 'Untitled Task'}
                                    </Text>
                                    {todo.address ? (
                                        <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.outline }}>
                                            📍 {todo.address}
                                        </Text>
                                    ) : null}
                                    <View style={styles.calloutBadgeRow}>
                                        <Badge style={{ backgroundColor: todo.completed ? '#4CAF50' : theme.colors.error }}>
                                            {todo.completed ? 'Completed' : 'Pending'}
                                        </Badge>
                                    </View>
                                </Surface>
                            </Callout>
                        </Marker>
                    );
                })}
            </MapView>

            {/* Header Controls / Filter Bar */}
            <Surface style={[styles.filterContainer, { backgroundColor: theme.colors.surface }]} elevation={2}>
                <View style={styles.filterRow}>
                    <Chip
                        selected={filter === 'ALL'}
                        onPress={() => setFilter('ALL')}
                        style={styles.chip}
                        showSelectedCheck={false}
                    >
                        All ({tasksWithLocation.length})
                    </Chip>
                    <Chip
                        selected={filter === 'PENDING'}
                        onPress={() => setFilter('PENDING')}
                        style={styles.chip}
                        showSelectedCheck={false}
                    >
                        Pending ({tasksWithLocation.filter((t) => !t.completed).length})
                    </Chip>
                    <Chip
                        selected={filter === 'COMPLETED'}
                        onPress={() => setFilter('COMPLETED')}
                        style={styles.chip}
                        showSelectedCheck={false}
                    >
                        Done ({tasksWithLocation.filter((t) => !!t.completed).length})
                    </Chip>
                </View>
            </Surface>

            {/* Center on Live Location FAB */}
            <FAB
                icon="crosshairs-gps"
                label={isLocationLoading ? 'Locating...' : ''}
                style={[styles.locationFab, { backgroundColor: theme.colors.surface }]}
                color={theme.colors.primary}
                onPress={handleCenterOnUser}
            />

            {/* Selected Task Details Bottom Card */}
            {selectedTodo && (
                <Surface style={[styles.selectedCard, { backgroundColor: theme.colors.surface }]} elevation={5}>
                    <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                                {selectedTodo.title || selectedTodo.name || 'Untitled Task'}
                            </Text>
                            {selectedTodo.address ? (
                                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                                    📍 {selectedTodo.address}
                                </Text>
                            ) : null}
                        </View>
                        <IconButton icon="close" size={20} onPress={() => setSelectedTodo(null)} />
                    </View>

                    {selectedTodo.description ? (
                        <Text variant="bodyMedium" style={styles.descriptionText} numberOfLines={2}>
                            {selectedTodo.description}
                        </Text>
                    ) : null}

                    <View style={styles.cardActions}>
                        <Button
                            mode={selectedTodo.completed ? 'outlined' : 'contained'}
                            icon={selectedTodo.completed ? 'undo' : 'check-circle-outline'}
                            onPress={() => handleToggleTodoStatus(selectedTodo)}
                            style={{ flex: 1 }}
                        >
                            {selectedTodo.completed ? 'Mark Pending' : 'Mark Complete'}
                        </Button>
                    </View>
                </Surface>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    filterContainer: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        borderRadius: 24,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    chip: {
        marginHorizontal: 2,
    },
    locationFab: {
        position: 'absolute',
        bottom: 90,
        right: 16,
        borderRadius: 28,
    },
    userLocationDotOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(33, 150, 243, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userLocationDotInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#2196F3',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    calloutBox: {
        padding: 8,
        borderRadius: 8,
        minWidth: 140,
        maxWidth: 200,
    },
    calloutTitle: {
        fontWeight: 'bold',
    },
    calloutBadgeRow: {
        marginTop: 4,
        alignItems: 'flex-start',
    },
    selectedCard: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        borderRadius: 16,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    descriptionText: {
        marginTop: 6,
        marginBottom: 12,
    },
    cardActions: {
        flexDirection: 'row',
        marginTop: 8,
    },
});

export default TaskMapScreen;
