import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Sun, Moon, Monitor } from 'lucide-react-native';
import { useTheme, ThemeMode } from '@/hooks/use-theme';

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  style?: any;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 'medium', 
  showLabel = false,
  style 
}) => {
  const { theme, themeMode, setThemeMode } = useTheme();
  
  const iconSize = size === 'small' ? 16 : size === 'large' ? 28 : 20;
  const buttonSize = size === 'small' ? 32 : size === 'large' ? 48 : 40;
  
  const modes: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'light', icon: <Sun color={theme.colors.text} size={iconSize} />, label: 'Light' },
    { mode: 'dark', icon: <Moon color={theme.colors.text} size={iconSize} />, label: 'Dark' },
    { mode: 'system', icon: <Monitor color={theme.colors.text} size={iconSize} />, label: 'System' },
  ];
  
  const currentModeIndex = modes.findIndex(m => m.mode === themeMode);
  
  const handleToggle = () => {
    const nextIndex = (currentModeIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex].mode);
  };
  
  const currentMode = modes[currentModeIndex];
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          width: buttonSize,
          height: buttonSize,
        },
        style
      ]}
      onPress={handleToggle}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {currentMode.icon}
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {currentMode.label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Simple dark mode toggle that only switches between light and dark
export const SimpleDarkModeToggle: React.FC<{ style?: any }> = ({ style }) => {
  const { theme, isDark, toggleTheme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.simpleDarkToggle,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        style
      ]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <View style={[
        styles.toggleTrack,
        {
          backgroundColor: isDark ? theme.colors.primary : theme.colors.border,
        }
      ]}>
        <View style={[
          styles.toggleThumb,
          {
            backgroundColor: theme.colors.surface,
            transform: [{ translateX: isDark ? 20 : 0 }],
          }
        ]}>
          {isDark ? (
            <Moon color={theme.colors.primary} size={14} />
          ) : (
            <Sun color={theme.colors.textSecondary} size={14} />
          )}
        </View>
      </View>
      <Text style={[
        styles.toggleLabel,
        { color: theme.colors.text }
      ]}>
        {isDark ? 'Dark Mode' : 'Light Mode'}
      </Text>
    </TouchableOpacity>
  );
};

export const ThemeSelector: React.FC = () => {
  const { theme, themeMode, setThemeMode } = useTheme();
  
  const modes: { mode: ThemeMode; icon: React.ReactNode; label: string; description: string }[] = [
    { 
      mode: 'light', 
      icon: <Sun color={theme.colors.primary} size={20} />, 
      label: 'Light Mode',
      description: 'Always use light theme'
    },
    { 
      mode: 'dark', 
      icon: <Moon color={theme.colors.primary} size={20} />, 
      label: 'Dark Mode',
      description: 'Always use dark theme'
    },
    { 
      mode: 'system', 
      icon: <Monitor color={theme.colors.primary} size={20} />, 
      label: 'System',
      description: 'Follow system preference'
    },
  ];
  
  return (
    <View style={styles.selectorContainer}>
      {modes.map((mode) => (
        <TouchableOpacity
          key={mode.mode}
          style={[
            styles.selectorOption,
            {
              backgroundColor: themeMode === mode.mode ? theme.colors.primaryLight + '20' : 'transparent',
              borderColor: themeMode === mode.mode ? theme.colors.primary : theme.colors.border,
            }
          ]}
          onPress={() => setThemeMode(mode.mode)}
          activeOpacity={0.7}
        >
          <View style={styles.selectorIcon}>
            {mode.icon}
          </View>
          <View style={styles.selectorContent}>
            <Text style={[
              styles.selectorLabel,
              { 
                color: themeMode === mode.mode ? theme.colors.primary : theme.colors.text,
                fontWeight: themeMode === mode.mode ? '600' : '500'
              }
            ]}>
              {mode.label}
            </Text>
            <Text style={[styles.selectorDescription, { color: theme.colors.textSecondary }]}>
              {mode.description}
            </Text>
          </View>
          {themeMode === mode.mode && (
            <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  simpleDarkToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectorContainer: {
    gap: 12,
  },
  selectorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  selectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorContent: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 16,
    marginBottom: 2,
  },
  selectorDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});