import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform, Appearance } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceSecondary: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Accent colors
  accent: string;
  accentLight: string;
  accentDark: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Border colors
  border: string;
  borderLight: string;
  borderDark: string;
  
  // Glass/Blur effects
  glassBackground: string;
  glassBorder: string;
  
  // Tab bar
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  
  // Header
  headerBackground: string;
  headerText: string;
  
  // Modal
  modalOverlay: string;
  modalBackground: string;
  
  // Shadow
  shadowColor: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
}

const lightTheme: Theme = {
  mode: 'light',
  colors: {
    // Background colors
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    backgroundTertiary: '#f1f5f9',
    surface: '#ffffff',
    surfaceSecondary: '#f8fafc',
    
    // Text colors
    text: '#1f2937',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    textInverse: '#ffffff',
    
    // Primary colors
    primary: '#10b981',
    primaryLight: '#34d399',
    primaryDark: '#059669',
    
    // Accent colors
    accent: '#6366f1',
    accentLight: '#818cf8',
    accentDark: '#4f46e5',
    
    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Border colors
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    borderDark: '#d1d5db',
    
    // Glass/Blur effects
    glassBackground: 'rgba(255, 255, 255, 0.15)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',
    
    // Tab bar
    tabBarBackground: '#191A2C',
    tabBarBorder: '#e5e7eb',
    tabBarActive: '#3977F1',
    tabBarInactive: '#3977F1',
    
    // Header
    headerBackground: '#ffffff',
    headerText: '#1f2937',
    
    // Modal
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    modalBackground: '#ffffff',
    
    // Shadow
    shadowColor: '#000000',
  },
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    // Background colors
    background: '#0f172a',
    backgroundSecondary: '#1e293b',
    backgroundTertiary: '#334155',
    surface: '#1e293b',
    surfaceSecondary: '#334155',
    
    // Text colors
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textTertiary: '#94a3b8',
    textInverse: '#0f172a',
    
    // Primary colors
    primary: '#10b981',
    primaryLight: '#34d399',
    primaryDark: '#059669',
    
    // Accent colors
    accent: '#6366f1',
    accentLight: '#818cf8',
    accentDark: '#4f46e5',
    
    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Border colors
    border: '#475569',
    borderLight: '#64748b',
    borderDark: '#334155',
    
    // Glass/Blur effects
    glassBackground: 'rgba(30, 41, 59, 0.8)',
    glassBorder: 'rgba(100, 116, 139, 0.3)',
    
    // Tab bar
    tabBarBackground: '#191A2C',
    tabBarBorder: '#475569',
    tabBarActive: '#3977F1',
    tabBarInactive: '#3977F1',
    
    // Header
    headerBackground: '#1e293b',
    headerText: '#f8fafc',
    
    // Modal
    modalOverlay: 'rgba(0, 0, 0, 0.8)',
    modalBackground: '#1e293b',
    
    // Shadow
    shadowColor: '#000000',
  },
};

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = '@theme_mode';

export const [ThemeProvider, useTheme] = createContextHook<ThemeContextValue>(() => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(
    Platform.OS === 'web' 
      ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : (Appearance.getColorScheme() || 'light')
  );

  // Load saved theme mode from storage (simplified without AsyncStorage)
  useEffect(() => {
    // For now, we'll use localStorage on web and default to system on mobile
    if (Platform.OS === 'web') {
      try {
        const savedMode = localStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme mode:', error);
      }
    }
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    if (Platform.OS === 'web') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setSystemTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setSystemTheme(colorScheme || 'light');
      });
      
      return () => subscription?.remove();
    }
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    // Validate input
    if (!mode || !['light', 'dark', 'system'].includes(mode)) {
      console.error('Invalid theme mode:', mode);
      return;
    }
    
    try {
      setThemeModeState(mode);
      if (Platform.OS === 'web') {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
      }
      console.log(`Theme mode changed to: ${mode}`);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const currentEffectiveTheme = themeMode === 'system' ? systemTheme : themeMode;
    const newMode = currentEffectiveTheme === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  }, [themeMode, systemTheme, setThemeMode]);

  // Determine the effective theme
  const effectiveTheme = themeMode === 'system' ? systemTheme : themeMode;
  const theme = effectiveTheme === 'dark' ? darkTheme : lightTheme;
  const isDark = effectiveTheme === 'dark';

  return useMemo(() => ({
    theme,
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
  }), [theme, themeMode, isDark, setThemeMode, toggleTheme]);
});

// Utility function to create theme-aware styles
export const createThemedStyles = <T extends Record<string, any>>(
  styleCreator: (theme: Theme) => T
) => {
  return (theme: Theme): T => {
    // Validate theme input
    if (!theme || typeof theme !== 'object' || !theme.colors) {
      console.error('Invalid theme object provided to createThemedStyles');
      return {} as T;
    }
    return styleCreator(theme);
  };
};

// Hook to get theme-aware colors
export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};

// Hook to check if current theme is dark
export const useIsDark = () => {
  const { isDark } = useTheme();
  return isDark;
};