import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Maximize,
  Minimize,
  Heart,
  Copy
} from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { CustomSlider } from './CustomSlider';
import { useVideoPlayer } from '@/hooks/use-video-player';
import { useTheme } from '@/hooks/use-theme';

export function VideoControls() {
  const { theme } = useTheme();
  const {
    uri,
    isPlaying,
    volume,
    speed,
    duration,
    position,
    isFullscreen,
    isFavorite,
    play,
    pause,
    seek,
    setVolume,
    setSpeed,
    toggleFullscreen,
    toggleFavorite,

  } = useVideoPlayer();

  // Don't render controls if no video is loaded
  if (!uri || !uri.trim()) {
    return null;
  }

  const formatTime = (ms: number) => {
    if (!ms || isNaN(ms)) return '0:00';
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, {
      backgroundColor: theme.colors.glassBackground,
      borderColor: theme.colors.glassBorder,
    }]}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: theme.colors.text }]}>{formatTime(position)}</Text>
        </View>
        <View style={[styles.sliderContainer, {
          backgroundColor: theme.colors.surface + '80',
          borderColor: theme.colors.border,
        }]}>
          <CustomSlider
            style={styles.slider}
            value={position}
            minimumValue={0}
            maximumValue={duration}
            onSlidingComplete={(value: number) => {
              const seekTime = (value - position) / 1000;
              seek(seekTime);
            }}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
          />
        </View>
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: theme.colors.text }]}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Main Controls */}
      <View style={styles.mainControls}>
        <TouchableOpacity onPress={() => seek(-10)} style={[styles.controlButton, {
          backgroundColor: theme.colors.surface + '80',
          borderColor: theme.colors.border,
        }]}>
          <View style={styles.controlButtonInner}>
            <SkipBack color={theme.colors.text} size={20} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={isPlaying ? pause : play} 
          style={[styles.playButton, {
            backgroundColor: theme.colors.primary,
          }]}
        >
          <View style={styles.playButtonInner}>
            {isPlaying ? (
              <Pause color={theme.colors.textInverse} size={28} />
            ) : (
              <Play color={theme.colors.textInverse} size={28} />
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => seek(10)} style={[styles.controlButton, {
          backgroundColor: theme.colors.surface + '80',
          borderColor: theme.colors.border,
        }]}>
          <View style={styles.controlButtonInner}>
            <SkipForward color={theme.colors.text} size={20} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Secondary Controls */}
      <View style={styles.secondaryControls}>
        {/* Volume */}
        <View style={[styles.volumeContainer, {
          backgroundColor: theme.colors.surface + '80',
          borderColor: theme.colors.border,
        }]}>
          <TouchableOpacity 
            onPress={() => setVolume(volume > 0 ? 0 : 1)}
            style={[styles.volumeButton, {
              backgroundColor: theme.colors.surface,
            }]}
          >
            {volume > 0 ? (
              <Volume2 color={theme.colors.text} size={18} />
            ) : (
              <VolumeX color={theme.colors.text} size={18} />
            )}
          </TouchableOpacity>
          <View style={styles.volumeSliderContainer}>
            <CustomSlider
              style={styles.volumeSlider}
              value={volume}
              minimumValue={0}
              maximumValue={1}
              onValueChange={(value: number) => setVolume(value)}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.border}
              thumbTintColor={theme.colors.primary}
            />
          </View>
        </View>

        {/* Speed */}
        <TouchableOpacity 
          onPress={() => {
            const speeds = [0.5, 1, 1.25, 1.5, 2];
            const currentIndex = speeds.indexOf(speed);
            const nextIndex = (currentIndex + 1) % speeds.length;
            setSpeed(speeds[nextIndex]);
          }}
          style={[styles.speedButton, {
            backgroundColor: theme.colors.primary + '20',
            borderColor: theme.colors.primary + '40',
          }]}
        >
          <Text style={[styles.speedText, { color: theme.colors.primary }]}>{speed}x</Text>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={toggleFavorite} style={[styles.iconButton, {
            backgroundColor: theme.colors.surface + '80',
            borderColor: theme.colors.border,
          }]}>
            <Heart 
              color={isFavorite ? theme.colors.error : theme.colors.textSecondary} 
              fill={isFavorite ? theme.colors.error : "none"}
              size={18} 
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={async () => {
            if (!uri) {
              Alert.alert('錯誤', '沒有可複製的影片連結');
              return;
            }

            try {
              await Clipboard.setStringAsync(uri);
              Alert.alert('成功', '影片連結已複製到剪貼簿');
            } catch (error) {
              console.error('Error copying to clipboard:', error);
              Alert.alert('錯誤', '複製失敗，請稍後再試');
            }
          }} style={[styles.iconButton, {
            backgroundColor: theme.colors.surface + '80',
            borderColor: theme.colors.border,
          }]}>
            <Copy color={theme.colors.textSecondary} size={18} />
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleFullscreen} style={[styles.iconButton, {
            backgroundColor: theme.colors.surface + '80',
            borderColor: theme.colors.border,
          }]}>
            {isFullscreen ? (
              <Minimize color={theme.colors.textSecondary} size={18} />
            ) : (
              <Maximize color={theme.colors.textSecondary} size={18} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  timeContainer: {
    minWidth: 50,
    alignItems: 'center',
  },
  sliderContainer: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 24,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 0,
  },
  playButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  volumeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  volumeSliderContainer: {
    flex: 1,
  },
  volumeSlider: {
    flex: 1,
    height: 32,
  },
  speedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  speedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});