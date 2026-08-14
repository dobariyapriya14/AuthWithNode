import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Text, Button, TextInput, IconButton, Surface, useTheme } from 'react-native-paper';
import MapView, { Marker, MapPressEvent, UrlTile } from 'react-native-maps';
import { DEFAULT_LOCATION, LocationCoordinates } from '../services/locationService';

interface LocationPickerModalProps {
    visible: boolean;
    initialLocation?: { latitude: number; longitude: number; address?: string } | null;
    currentLocation?: LocationCoordinates | null;
    onDismiss: () => void;
    onSelectLocation: (location: { latitude: number; longitude: number; address?: string }) => void;
    onRemoveLocation?: () => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
    visible,
    initialLocation,
    currentLocation,
    onDismiss,
    onSelectLocation,
    onRemoveLocation,
}) => {
    const theme = useTheme();

    const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number }>({
        latitude: initialLocation?.latitude || currentLocation?.latitude || DEFAULT_LOCATION.latitude,
        longitude: initialLocation?.longitude || currentLocation?.longitude || DEFAULT_LOCATION.longitude,
    });

    const [addressInput, setAddressInput] = useState<string>(initialLocation?.address || '');

    useEffect(() => {
        if (visible) {
            setSelectedCoords({
                latitude: initialLocation?.latitude || currentLocation?.latitude || DEFAULT_LOCATION.latitude,
                longitude: initialLocation?.longitude || currentLocation?.longitude || DEFAULT_LOCATION.longitude,
            });
            setAddressInput(initialLocation?.address || '');
        }
    }, [visible, initialLocation, currentLocation]);

    const handleMapPress = (e: MapPressEvent) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setSelectedCoords({ latitude, longitude });
    };

    const handleConfirm = () => {
        onSelectLocation({
            latitude: selectedCoords.latitude,
            longitude: selectedCoords.longitude,
            address: addressInput.trim() || `Lat: ${selectedCoords.latitude.toFixed(4)}, Lng: ${selectedCoords.longitude.toFixed(4)}`,
        });
        onDismiss();
    };

    const handleRemove = () => {
        if (onRemoveLocation) {
            onRemoveLocation();
        }
        onDismiss();
    };

    const handleCenterOnUser = () => {
        if (currentLocation) {
            setSelectedCoords({
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
            });
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                {/* Header */}
                <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={2}>
                    <IconButton icon="close" size={24} onPress={onDismiss} />
                    <Text variant="titleMedium" style={styles.headerTitle}>
                        Pick Task Location
                    </Text>
                    <Button mode="contained" compact onPress={handleConfirm} style={styles.saveBtn}>
                        Done
                    </Button>
                </Surface>

                {/* Map View */}
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        mapType="none"
                        initialRegion={{
                            latitude: selectedCoords.latitude,
                            longitude: selectedCoords.longitude,
                            latitudeDelta: 0.02,
                            longitudeDelta: 0.02,
                        }}
                        onPress={handleMapPress}
                        showsUserLocation={true}
                        showsMyLocationButton={false}
                    >
                        <UrlTile
                            urlTemplate="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                            maximumZ={19}
                            flipY={false}
                        />
                        <Marker
                            coordinate={selectedCoords}
                            draggable
                            onDragEnd={(e) => setSelectedCoords(e.nativeEvent.coordinate)}
                            title="Task Pin"
                            description="Drag or tap map to re-position"
                            pinColor={theme.colors.primary}
                        />
                    </MapView>

                    {/* Recenter Button */}
                    {currentLocation && (
                        <TouchableOpacity
                            style={[styles.recenterBtn, { backgroundColor: theme.colors.elevation.level3 }]}
                            onPress={handleCenterOnUser}
                        >
                            <IconButton icon="crosshairs-gps" iconColor={theme.colors.primary} size={24} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Bottom Address Card */}
                <Surface style={[styles.bottomCard, { backgroundColor: theme.colors.surface }]} elevation={4}>
                    <TextInput
                        label="Location Label / Address"
                        placeholder="e.g. Office, Home, Coffee Shop"
                        value={addressInput}
                        onChangeText={setAddressInput}
                        mode="outlined"
                        dense
                        left={<TextInput.Icon icon="map-marker-outline" />}
                        style={styles.input}
                    />
                    <View style={styles.coordsRow}>
                        <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                            Coordinates: {selectedCoords.latitude.toFixed(5)}, {selectedCoords.longitude.toFixed(5)}
                        </Text>
                    </View>
                    <View style={styles.actionRow}>
                        {initialLocation && onRemoveLocation ? (
                            <Button
                                mode="outlined"
                                textColor={theme.colors.error}
                                onPress={handleRemove}
                                style={{ marginRight: 6 }}
                                icon="trash-can-outline"
                            >
                                Clear Pin
                            </Button>
                        ) : null}
                        <Button mode="outlined" onPress={onDismiss} style={{ flex: 1, marginRight: 6 }}>
                            Cancel
                        </Button>
                        <Button mode="contained" onPress={handleConfirm} style={{ flex: 1, marginLeft: 2 }}>
                            Save Location
                        </Button>
                    </View>
                </Surface>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 4,
        zIndex: 10,
    },
    headerTitle: {
        fontWeight: 'bold',
    },
    saveBtn: {
        marginRight: 8,
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    recenterBtn: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    bottomCard: {
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    input: {
        marginBottom: 8,
    },
    coordsRow: {
        marginBottom: 12,
    },
    actionRow: {
        flexDirection: 'row',
    },
});

export default LocationPickerModal;
