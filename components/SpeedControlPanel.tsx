import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { ChevronUp, ChevronDown } from 'lucide-react-native';
import { useVideoPlayer } from '@/hooks/use-video-player';
import { useTheme } from '@/hooks/use-theme';

interface SpeedOption {
  id: string;
  label: string;
  value: number;
}

const speedOptions: SpeedOption[] = [
  { id: 'speed05', label: '0.5倍速', value: 0.5 },
  { id: 'speed10', label: '正常速度', value: 1.0 },
  { id: 'speed125', label: '1.25倍速', value: 1.25 },
  { id: 'speed15', label: '1.5倍速', value: 1.5 },
  { id: 'speed20', label: '2.0倍速', value: 2.0 },
];

export function SpeedControlPanel() {
  const { theme } = useTheme();
  const { speed, setSpeed, volume, setVolume, position, duration } = useVideoPlayer();
  const [showProgressControl, setShowProgressControl] = useState(true);
  const [showVolumeControl, setShowVolumeControl] = useState(true);
  const [showSpeedControl, setShowSpeedControl] = useState(true);
  const [customValues, setCustomValues] = useState<{ [key: string]: string }>({});

  const formatTime = (ms: number) => {
    if (!ms || isNaN(ms)) return '0:00';
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSpeedSelect = (option: SpeedOption) => {
    setSpeed(option.value);
  };

  const handleCustomValueChange = (id: string, value: string) => {
    setCustomValues(prev => ({ ...prev, [id]: value }));
  };

  return (
    <View style={[styles.container, {
      backgroundColor: theme.colors.glassBackground,
      borderColor: theme.colors.glassBorder,
    }]}>
      {/* Progress Control Section */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setShowProgressControl(!showProgressControl)}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>進度控制</Text>
          <View style={[styles.chevronButton, {
            backgroundColor: theme.colors.primary + '20',
            borderColor: theme.colors.primary + '40',
          }]}>
            {showProgressControl ? (
              <ChevronUp color={theme.colors.primary} size={16} />
            ) : (
              <ChevronDown color={theme.colors.primary} size={16} />
            )}
          </View>
        </TouchableOpacity>
        
        {showProgressControl && (
          <View style={styles.sectionContent}>
            <View style={styles.progressInfo}>
              <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                {formatTime(position)} / {formatTime(duration)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Volume Control Section */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setShowVolumeControl(!showVolumeControl)}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>音量控制</Text>
          <View style={[styles.chevronButton, {
            backgroundColor: theme.colors.primary + '20',
            borderColor: theme.colors.primary + '40',
          }]}>
            {showVolumeControl ? (
              <ChevronUp color={theme.colors.primary} size={16} />
            ) : (
              <ChevronDown color={theme.colors.primary} size={16} />
            )}
          </View>
        </TouchableOpacity>
        
        {showVolumeControl && (
          <View style={styles.sectionContent}>
            <View style={styles.volumeInfo}>
              <Text style={[styles.volumeText, { color: theme.colors.textSecondary }]}>
                音量: {Math.round(volume * 100)}%
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Speed Control Section */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setShowSpeedControl(!showSpeedControl)}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>播放速度</Text>
          <View style={[styles.chevronButton, {
            backgroundColor: theme.colors.primary + '20',
            borderColor: theme.colors.primary + '40',
          }]}>
            {showSpeedControl ? (
              <ChevronUp color={theme.colors.primary} size={16} />
            ) : (
              <ChevronDown color={theme.colors.primary} size={16} />
            )}
          </View>
        </TouchableOpacity>
        
        {showSpeedControl && (
          <View style={styles.sectionContent}>
            {speedOptions.map((option) => (
              <View key={option.id} style={styles.speedOption}>
                <View style={styles.speedInfo}>
                  <Text style={[styles.speedLabel, { color: theme.colors.text }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.speedId, { color: theme.colors.textSecondary }]}>
                    ID: {option.id}
                  </Text>
                </View>
                <View style={styles.speedControls}>
                  <TextInput
                    style={[styles.customInput, {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      color: theme.colors.textSecondary,
                    }]}
                    value={customValues[option.id] || '--'}
                    onChangeText={(value) => handleCustomValueChange(option.id, value)}
                    placeholder="--"
                    placeholderTextColor={theme.colors.textSecondary}
                    editable={false}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginVertical: 16,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  chevronButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressInfo: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  volumeInfo: {
    alignItems: 'center',
  },
  volumeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  speedOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  speedInfo: {
    flex: 1,
  },
  speedLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  speedId: {
    fontSize: 14,
    fontWeight: '400',
  },
  speedControls: {
    width: 80,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});