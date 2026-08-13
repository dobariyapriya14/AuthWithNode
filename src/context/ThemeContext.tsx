import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import {
  AppLightTheme,
  AppDarkTheme,
  NavLightTheme,
  NavDarkTheme,
} from '../theme/theme';
import { storageService } from '../services/storageService';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  paperTheme: typeof AppLightTheme;
  navTheme: typeof NavLightTheme;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  isDark: false,
  setThemeMode: () => {},
  paperTheme: AppLightTheme,
  navTheme: NavLightTheme,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const savedMode = storageService.get('themeMode') as ThemeMode;
    return savedMode || 'system';
  });

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const paperTheme = isDark ? AppDarkTheme : AppLightTheme;
  const navTheme = isDark ? NavDarkTheme : NavLightTheme;

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    storageService.set('themeMode', mode);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDark,
        setThemeMode,
        paperTheme,
        navTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
export default ThemeContext;
