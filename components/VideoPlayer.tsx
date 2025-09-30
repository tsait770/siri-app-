import { VideoView } from 'expo-video';
import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer } from '@/hooks/use-video-player';
import { detectVideoSource } from '@/utils/video-source-detection';
import YouTubeVimeoPlayer from './YouTubeVimeoPlayer';

export function VideoPlayer() {
  const { videoRef, player, uri, isFullscreen, isLoading, error, onPlaybackStatusUpdate, registerYouTubePlayer, toggleFullscreen } = useVideoPlayer();
  const insets = useSafeAreaInsets();

  // Listen for playback status updates
  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener('playingChange', (isPlaying) => {
      onPlaybackStatusUpdate({ isPlaying });
    });

    const timeSubscription = player.addListener('timeUpdate', (status) => {
      onPlaybackStatusUpdate({
        currentTime: status.currentTime * 1000, // Convert to milliseconds
        duration: player.duration * 1000, // Convert to milliseconds
        isPlaying: player.playing,
      });
    });

    return () => {
      subscription?.remove();
      timeSubscription?.remove();
    };
  }, [player, onPlaybackStatusUpdate]);

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.container, isFullscreen && styles.fullscreen]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      </View>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <View style={[styles.container, isFullscreen && styles.fullscreen]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Video Load Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }
  
  // Don't render VideoView if no URI is set
  if (!uri || !uri.trim()) {
    return null;
  }

  // Check if this is a YouTube or Vimeo video that needs special handling
  const sourceInfo = detectVideoSource(uri);
  const isYouTubeOrVimeo = sourceInfo.sourceInfo.platform === 'YouTube' || sourceInfo.sourceInfo.platform === 'Vimeo';

  if (isYouTubeOrVimeo) {
    return (
      <View style={[styles.container, isFullscreen && styles.fullscreen]}>
        <YouTubeVimeoPlayer 
          url={uri}
          onError={(error) => console.error('YouTube/Vimeo player error:', error)}
          onLoad={() => {
            console.log('YouTube/Vimeo player loaded');
            // Register the player for external control
            registerYouTubePlayer({
              youtubeControls: {
                play: () => console.log('YouTube play called'),
                pause: () => console.log('YouTube pause called'),
                seekTo: (seconds: number) => console.log('YouTube seekTo called:', seconds),
                setVolume: (volume: number) => console.log('YouTube setVolume called:', volume),
                setPlaybackRate: (rate: number) => console.log('YouTube setPlaybackRate called:', rate)
              }
            });
          }}
        />
        {isFullscreen && (
          <TouchableOpacity 
            onPress={toggleFullscreen}
            style={[styles.backButton, { top: insets.top + 16 }]}
          >
            <View style={styles.backButtonInner}>
              <ArrowLeft color="#ffffff" size={24} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreen]}>
      <VideoView
        ref={videoRef}
        player={player}
        style={[styles.video, isFullscreen && styles.fullscreenVideo]}
        nativeControls={false}
        contentFit="contain"
        allowsFullscreen={true}
        allowsPictureInPicture={true}
      />
      {isFullscreen && (
        <TouchableOpacity 
          onPress={toggleFullscreen}
          style={[styles.backButton, { top: insets.top + 16 }]}
        >
          <View style={styles.backButtonInner}>
            <ArrowLeft color="#ffffff" size={24} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    borderRadius: 0,
    borderWidth: 0,
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    gap: 16,
  },
  loadingText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
    gap: 12,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  backButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});