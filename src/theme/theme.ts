import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import {
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';

// Custom Paper Light Theme
export const AppLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    onPrimary: '#ffffff',
    primaryContainer: '#bb86fc',
    onPrimaryContainer: '#3700b3',
    background: '#f6f6f6',
    onBackground: '#1c1b1f',
    surface: '#ffffff',
    onSurface: '#1c1b1f',
    surfaceVariant: '#e7e0ec',
    onSurfaceVariant: '#49454f',
  },
};

// Custom Paper Dark Theme
export const AppDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#bb86fc',
    onPrimary: '#000000',
    primaryContainer: '#3700b3',
    onPrimaryContainer: '#e0bbf8',
    background: '#121212',
    onBackground: '#e6e1e5',
    surface: '#1e1e1e',
    onSurface: '#e6e1e5',
    surfaceVariant: '#49454f',
    onSurfaceVariant: '#cac4d0',
  },
};

// Custom Navigation Light Theme
export const NavLightTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: '#6200ee',
    background: '#f6f6f6',
    card: '#ffffff',
    text: '#1c1b1f',
    border: '#e0e0e0',
    notification: '#ff80ab',
  },
};

// Custom Navigation Dark Theme
export const NavDarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: '#bb86fc',
    background: '#121212',
    card: '#1e1e1e',
    text: '#e6e1e5',
    border: '#2c2c2c',
    notification: '#ff80ab',
  },
};
