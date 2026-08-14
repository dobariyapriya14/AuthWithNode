import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation, { GeoPosition, GeoError } from 'react-native-geolocation-service';

export interface LocationCoordinates {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number | null;
    heading?: number | null;
    speed?: number | null;
}

// Default fallback coordinates (e.g. San Francisco / New York / Default City) if GPS is disabled or permission denied
export const DEFAULT_LOCATION: LocationCoordinates = {
    latitude: 37.7749,
    longitude: -122.4194,
};

/**
 * Request location permission on Android & iOS
 */
export const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
        try {
            const auth = await Geolocation.requestAuthorization('whenInUse');
            return auth === 'granted';
        } catch (error) {
            console.warn('iOS Location Authorization Error:', error);
            return false;
        }
    }

    if (Platform.OS === 'android') {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Location Permission',
                    message: 'Task App needs access to your location to show task pins near you.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn('Android Location Permission Error:', err);
            return false;
        }
    }

    return false;
};

/**
 * Fetch high-accuracy current location
 */
export const getCurrentUserLocation = (): Promise<LocationCoordinates> => {
    return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
            (position: GeoPosition) => {
                const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
                resolve({ latitude, longitude, accuracy, altitude, heading, speed });
            },
            (error: GeoError) => {
                console.warn('Error obtaining current location:', error.code, error.message);
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000,
                forceRequestLocation: true,
                showLocationDialog: true,
            }
        );
    });
};

/**
 * Subscribe to continuous location updates
 */
export const watchUserLocation = (
    onLocationUpdate: (location: LocationCoordinates) => void,
    onError?: (error: GeoError) => void
): number => {
    return Geolocation.watchPosition(
        (position: GeoPosition) => {
            const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
            onLocationUpdate({ latitude, longitude, accuracy, altitude, heading, speed });
        },
        (error: GeoError) => {
            console.warn('Location watch error:', error);
            if (onError) onError(error);
        },
        {
            enableHighAccuracy: true,
            distanceFilter: 10, // update every 10 meters
            interval: 5000,
            fastestInterval: 2000,
        }
    );
};

/**
 * Clear location subscription listener
 */
export const clearUserLocationWatch = (watchId: number) => {
    Geolocation.clearWatch(watchId);
};

export default {
    requestLocationPermission,
    getCurrentUserLocation,
    watchUserLocation,
    clearUserLocationWatch,
    DEFAULT_LOCATION,
};
