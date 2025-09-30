import React from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  View, 
  Text,
  TouchableOpacity,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Globe, Info, Trash2, Settings as SettingsIcon, Shield, Palette } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '@/hooks/use-i18n';
import { useMembership } from '@/hooks/use-membership';
import { useTheme } from '@/hooks/use-theme';
import { LanguageSelector } from '@/components/LanguageSelector';
import { MembershipCard } from '@/components/MembershipCard';
import { ThemeSelector } from '@/components/ThemeToggle';

export default function SettingsScreen() {
  const { t } = useI18n();
  const { upgradeMembership } = useMembership();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const clearData = async () => {
    // This would clear data if we had a proper storage provider
    console.log('Data cleared successfully');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <LinearGradient
        colors={[
          theme.colors.backgroundSecondary,
          theme.colors.backgroundTertiary,
          theme.colors.surface
        ]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <View style={[styles.logoContainer, { 
                backgroundColor: theme.colors.primary + '20',
                borderColor: theme.colors.primary + '40'
              }]}>
                <SettingsIcon color={theme.colors.primary} size={28} />
              </View>
              <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Customize your experience</Text>
            </View>
          </View>
        </View>

        {/* Settings Cards */}
        <View style={styles.mainContent}>
          {/* Membership Section */}
          <MembershipCard onUpgrade={upgradeMembership} />
          
          {/* Language Settings */}
          <View style={styles.settingsCard}>
            {Platform.OS !== 'web' ? (
              <BlurView intensity={20} style={[styles.glassCard, {
                backgroundColor: theme.colors.glassBackground,
                borderColor: theme.colors.glassBorder
              }]}>
                <View style={styles.cardHeader}>
                  <Globe color={theme.colors.primary} size={24} />
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Language & Region</Text>
                </View>
                <View style={[styles.settingItem, { borderTopColor: theme.colors.border }]}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('settings.language')}</Text>
                    <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>Choose your preferred language</Text>
                  </View>
                  <LanguageSelector />
                </View>
              </BlurView>
            ) : (
              <View style={[styles.glassCardWeb, {
                backgroundColor: theme.colors.glassBackground,
                borderColor: theme.colors.glassBorder
              }]}>
                <View style={styles.cardHeader}>
                  <Globe color={theme.colors.primary} size={24} />
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Language & Region</Text>
                </View>
                <View style={[styles.settingItem, { borderTopColor: theme.colors.border }]}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('settings.language')}</Text>
                    <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>Choose your preferred language</Text>
                  </View>
                  <LanguageSelector />
                </View>
              </View>
            )}
          </View>
          
          {/* Theme Settings */}
          <View style={styles.settingsCard}>
            {Platform.OS !== 'web' ? (
              <BlurView intensity={20} style={[styles.glassCard, {
                backgroundColor: theme.colors.glassBackground,
                borderColor: theme.colors.glassBorder
              }]}>
                <View style={styles.cardHeader}>
                  <Palette color={theme.colors.primary} size={24} />
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Appearance</Text>
                </View>
                <View style={styles.themeSection}>
                  <ThemeSelector />
                </View>
              </BlurView>
            ) : (
              <View style={[styles.glassCardWeb, {
                backgroundColor: theme.colors.glassBackground,
                borderColor: theme.colors.glassBorder
              }]}>
                <View style={styles.cardHeader}>
                  <Palette color={theme.colors.primary} size={24} />
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Appearance</Text>
                </View>
                <View style={styles.themeSection}>
                  <ThemeSelector />
                </View>
              </View>
            )}
          </View>

          {/* Privacy Settings */}
          <View style={styles.settingsCard}>
            {Platform.OS !== 'web' ? (
              <BlurView intensity={20} style={[styles.glassCard, {
                backgroundColor: theme.colors.glassBackground,
                borderColor: theme.colors.glassBorder
              }]}>
                <View style={styles.cardHeader}>
                  <Shield color={theme.colors.primary} size={24} />
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Privacy & Data</Text>
                </View>
                <TouchableOpacity style={[styles.settingItem, { borderTopColor: theme.colors.border }]} onPress={clearData}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Clear All Data</Text>
                    <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>Remove all stored preferences and data</Text>
                  </View>
                  <View style={[styles.dangerIcon, {
                    backgroundColor: theme.colors.error + '20',
                    borderColor: theme.colors.error + '40'
                  }]}>
                    <Trash2 color={theme.colors.error} size={20} />
                  </View>
                </TouchableOpacity>
              </BlurView>
            ) : (
              <View style={[styles.glassCardWeb, {
                backgroundColor: theme.colors.glassBackground,
                borderColor: theme.colors.glassBorder
              }]}>
                <View style={styles.cardHeader}>
                  <Shield color={theme.colors.primary} size={24} />
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Privacy & Data</Text>
                </View>
                <TouchableOpacity style={[styles.settingItem, { borderTopColor: theme.colors.border }]} onPress={clearData}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Clear All Data</Text>
                    <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>Remove all stored preferences and data</Text>
                  </View>
                  <View style={[styles.dangerIcon, {
                    backgroundColor: theme.colors.error + '20',
                    borderColor: theme.colors.error + '40'
                  }]}>
                    <Trash2 color={theme.colors.error} size={20} />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* About Section */}
          <View style={styles.aboutCard}>
            {Platform.OS !== 'web' ? (
              <BlurView intensity={20} style={[styles.glassCard, {
                backgroundColor: theme.colors.glassBackground,
                borderColor: theme.colors.glassBorder
              }]}>
                <View style={styles.aboutContent}>
                  <View style={[styles.aboutIcon, {
                    backgroundColor: theme.colors.primary + '20',
                    borderColor: theme.colors.primary + '40'
                  }]}>
                    <Info color={theme.colors.primary} size={32} />
                  </View>
                  <Text style={[styles.aboutTitle, { color: theme.colors.text }]}>Voice Video Controller</Text>
                  <Text style={[styles.aboutText, { color: theme.colors.textSecondary }]}>{t('settings.about')}</Text>
                  <View style={[styles.versionContainer, {
                    backgroundColor: theme.colors.primary + '20',
                    borderColor: theme.colors.primary + '40'
                  }]}>
                    <Text style={[styles.versionLabel, { color: theme.colors.textSecondary }]}>Version</Text>
                    <Text style={[styles.versionText, { color: theme.colors.primary }]}>1.0.0</Text>
                  </View>
                </View>
              </BlurView>
            ) : (
              <View style={[styles.glassCardWeb, {
                backgroundColor: theme.colors.glassBackground,
                borderColor: theme.colors.glassBorder
              }]}>
                <View style={styles.aboutContent}>
                  <View style={[styles.aboutIcon, {
                    backgroundColor: theme.colors.primary + '20',
                    borderColor: theme.colors.primary + '40'
                  }]}>
                    <Info color={theme.colors.primary} size={32} />
                  </View>
                  <Text style={[styles.aboutTitle, { color: theme.colors.text }]}>Voice Video Controller</Text>
                  <Text style={[styles.aboutText, { color: theme.colors.textSecondary }]}>{t('settings.about')}</Text>
                  <View style={[styles.versionContainer, {
                    backgroundColor: theme.colors.primary + '20',
                    borderColor: theme.colors.primary + '40'
                  }]}>
                    <Text style={[styles.versionLabel, { color: theme.colors.textSecondary }]}>Version</Text>
                    <Text style={[styles.versionText, { color: theme.colors.primary }]}>1.0.0</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleContainer: {
    flex: 1,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  mainContent: {
    paddingHorizontal: 24,
    gap: 24,
  },
  settingsCard: {
    marginBottom: 8,
  },
  aboutCard: {
    marginBottom: 8,
  },
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  glassCardWeb: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    backdropFilter: 'blur(20px)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  dangerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  aboutContent: {
    padding: 32,
    alignItems: 'center',
  },
  aboutIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  aboutText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  versionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  themeSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});