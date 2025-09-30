import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput 
} from 'react-native';
import { useI18n } from '@/hooks/use-i18n';
import { useVoiceCommands } from '@/hooks/use-voice-commands';
import { useTheme, createThemedStyles } from '@/hooks/use-theme';

interface CommandSection {
  title: string;
  commands: { id: string; label: string }[];
}

export function CommandList() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const { customCommands, saveCustomCommand } = useVoiceCommands();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const styles = createThemedStyles(createStyles)(theme);

  const sections: CommandSection[] = [
    {
      title: t('controls.playback'),
      commands: [
        { id: 'play', label: t('controls.play') },
        { id: 'pause', label: t('controls.pause') },
        { id: 'stop', label: t('controls.stop') },
        { id: 'next', label: t('controls.next') },
        { id: 'previous', label: t('controls.previous') },
        { id: 'replay', label: t('controls.replay') },
      ],
    },
    {
      title: t('controls.progress'),
      commands: [
        { id: 'forward10', label: t('controls.forward10') },
        { id: 'forward20', label: t('controls.forward20') },
        { id: 'forward30', label: t('controls.forward30') },
        { id: 'backward10', label: t('controls.backward10') },
        { id: 'backward20', label: t('controls.backward20') },
        { id: 'backward30', label: t('controls.backward30') },
      ],
    },
    {
      title: t('controls.volume'),
      commands: [
        { id: 'volumeMax', label: t('controls.volumeMax') },
        { id: 'mute', label: t('controls.mute') },
        { id: 'unmute', label: t('controls.unmute') },
        { id: 'volumeUp', label: t('controls.volumeUp') },
        { id: 'volumeDown', label: t('controls.volumeDown') },
      ],
    },
    {
      title: t('controls.speed'),
      commands: [
        { id: 'speed05', label: t('controls.speed05') },
        { id: 'speed10', label: t('controls.speed10') },
        { id: 'speed125', label: t('controls.speed125') },
        { id: 'speed15', label: t('controls.speed15') },
      ],
    },
    {
      title: t('controls.screen'),
      commands: [
        { id: 'fullscreen', label: t('controls.fullscreen') },
        { id: 'exitFullscreen', label: t('controls.exitFullscreen') },
      ],
    },
  ];

  const toggleSection = (title: string) => {
    setExpandedSections(prev =>
      prev.includes(title)
        ? prev.filter(s => s !== title)
        : [...prev, title]
    );
  };

  return (
    <View style={styles.container}>
      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection(section.title)}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.chevronContainer}>
              {expandedSections.includes(section.title) ? (
                <ChevronUp color={theme.colors.primary} size={20} />
              ) : (
                <ChevronDown color={theme.colors.textSecondary} size={20} />
              )}
            </View>
          </TouchableOpacity>

          {expandedSections.includes(section.title) && (
            <View style={styles.commandList}>
              {section.commands.map((command, index) => (
                <View key={command.id} style={[
                  styles.commandItem,
                  index === section.commands.length - 1 && styles.lastCommandItem
                ]}>
                  <View style={styles.commandInfo}>
                    <Text style={styles.commandLabel}>{command.label}</Text>
                    <Text style={styles.commandId}>ID: {command.id}</Text>
                  </View>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.customInput}
                      value={customCommands[command.id] || ''}
                      onChangeText={(text) => saveCustomCommand(command.id, text)}
                      placeholder="--"
                      placeholderTextColor={theme.colors.textTertiary}
                      maxLength={2}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const createStyles = createThemedStyles((theme) => ({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 16,
    backgroundColor: theme.colors.glassBackground,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
  },
  commandList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  commandItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lastCommandItem: {
    borderBottomWidth: 0,
  },
  commandInfo: {
    flex: 1,
    marginRight: 16,
  },
  commandLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  commandId: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },
  inputContainer: {
    alignItems: 'center',
  },
  customInput: {
    width: 60,
    height: 40,
    borderWidth: 2,
    borderColor: theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
}));