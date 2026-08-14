import { useState, useEffect, useCallback } from 'react';
import {
    requestLocationPermission,
    getCurrentUserLocation,
    watchUserLocation,
    clearUserLocationWatch,
    LocationCoordinates,
} from '../services/locationService';

export interface UseUserLocationResult {
    location: LocationCoordinates | null;
    hasPermission: boolean | null;
    isLoading: boolean;
    error: string | null;
    refreshLocation: () => Promise<LocationCoordinates | null>;
}

export const useUserLocation = (enableWatch: boolean = false): UseUserLocationResult => {
    const [location, setLocation] = useState<LocationCoordinates | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const refreshLocation = useCallback(async (): Promise<LocationCoordinates | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const granted = await requestLocationPermission();
            setHasPermission(granted);
            if (!granted) {
                setError('Location permission denied');
                setIsLoading(false);
                return null;
            }

            const currentPos = await getCurrentUserLocation();
            setLocation(currentPos);
            setIsLoading(false);
            return currentPos;
        } catch (err: any) {
            console.warn('Failed to fetch user location:', err);
            setError(err?.message || 'Failed to get current location');
            setIsLoading(false);
            return null;
        }
    }, []);

    useEffect(() => {
        let watchId: number | null = null;

        const initLocation = async () => {
            setIsLoading(true);
            const granted = await requestLocationPermission();
            setHasPermission(granted);

            if (granted) {
                try {
                    const pos = await getCurrentUserLocation();
                    setLocation(pos);
                } catch (err: any) {
                    console.warn('Location retrieval error, using default:', err);
                    setError(err?.message || 'Could not fetch current GPS location');
                }

                if (enableWatch) {
                    watchId = watchUserLocation(
                        (newPos) => {
                            setLocation(newPos);
                        },
                        (err) => {
                            setError(err.message);
                        }
                    );
                }
            } else {
                setError('Location permission not granted');
            }
            setIsLoading(false);
        };

        initLocation();

        return () => {
            if (watchId !== null) {
                clearUserLocationWatch(watchId);
            }
        };
    }, [enableWatch]);

    return {
        location,
        hasPermission,
        isLoading,
        error,
        refreshLocation,
    };
};

export default useUserLocation;
