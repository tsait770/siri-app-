import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoView, useVideoPlayer as useExpoVideoPlayer } from 'expo-video';
import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { 
  detectVideoSource, 
  convertYouTubeToEmbedUrl, 
  convertToPlayableUrl, 
  getYouTubeVideoId, 
  VideoSourceDetectionResult,
  isDirectVideoFile,
  isStreamingFormat,
  requiresSpecialHandling,
  getOptimalVideoQuality
} from '@/utils/video-source-detection';
import { useMembership } from '@/hooks/use-membership';

interface VideoState {
  uri?: string;
  title?: string;
  isPlaying: boolean;
  volume: number;
  speed: number;
  duration: number;
  position: number;
  isFullscreen: boolean;
}

interface Bookmark {
  id: string;
  videoUri: string;
  position: number;
  title: string;
  createdAt: number;
}

export const [VideoPlayerProvider, useVideoPlayer] = createContextHook(() => {
  const { incrementUsage, getRemainingUsage } = useMembership();
  const videoRef = useRef<VideoView>(null);
  const youtubePlayerRef = useRef<any>(null);
  const [currentUri, setCurrentUri] = useState<string>('');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize player with empty source first
  const player = useExpoVideoPlayer('');
  const [state, setState] = useState<VideoState>({
    isPlaying: false,
    volume: 1,
    speed: 1,
    duration: 0,
    position: 0,
    isFullscreen: false,
  });
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [storedBookmarks, storedFavorites] = await Promise.all([
        AsyncStorage.getItem('bookmarks'),
        AsyncStorage.getItem('favorites'),
      ]);

      if (storedBookmarks) setBookmarks(JSON.parse(storedBookmarks));
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadVideo = useCallback(async (uri: string, title?: string, sourceInfo?: VideoSourceDetectionResult) => {
    if (!uri?.trim()) {
      console.log('Empty URI provided to loadVideo');
      setError('Empty video URL provided');
      return;
    }
    
    console.log('=== LOADING VIDEO ===');
    console.log('Original URI:', uri);
    setIsLoading(true);
    setError(null);
    
    try {
      // Detect video source if not provided
      const detection = sourceInfo || detectVideoSource(uri);
      console.log('Video source detection result:', detection);
      
      // Handle YouTube and Vimeo videos specially - they need special player
      if (detection.sourceInfo.platform === 'YouTube' || detection.sourceInfo.platform === 'Vimeo') {
        console.log(`${detection.sourceInfo.platform} video detected - will use special player`);
        
        // Set state to indicate special handling is needed
        setState(prev => ({ 
          ...prev, 
          uri: uri, // Keep original URL for special player
          title: title || `${detection.sourceInfo.platform} Video`,
          isPlaying: false,
          position: 0,
          duration: 0
        }));
        
        setCurrentUri(uri);
        setHasInitialized(true);
        setIsLoading(false);
        console.log(`✅ ${detection.sourceInfo.platform} video ready for special player:`, uri);
        return;
      }
      
      // Check if source is supported
      if (!detection.isSupported) {
        setIsLoading(false);
        const errorMsg = `Unsupported video source: ${detection.sourceInfo.description}`;
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Process URL for playback
      let processedUri = convertToPlayableUrl(uri);
      console.log('Processed URI:', processedUri);
      console.log('Video source platform:', detection.sourceInfo.platform);
      console.log('Video source type:', detection.sourceInfo.type);
      console.log('Is direct video file:', isDirectVideoFile(uri));
      console.log('Is streaming format:', isStreamingFormat(uri));
      
      // Validate URL format
      try {
        new URL(processedUri);
      } catch (urlError) {
        setIsLoading(false);
        const errorMsg = 'Invalid video URL format';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Log video type information
      const quality = getOptimalVideoQuality(uri);
      console.log(`Video quality detected: ${quality}`);
      
      if (isDirectVideoFile(uri)) {
        console.log('✅ Direct video file detected - should play without issues');
      } else if (isStreamingFormat(uri)) {
        console.log('📡 Streaming format detected - may require special player configuration');
      } else if (detection.sourceInfo.type === 'extended') {
        console.log('⚠️ Extended platform detected - may have limitations:', detection.sourceInfo.platform);
      }
      
      // Reset video state
      setState(prev => ({ 
        ...prev, 
        isPlaying: false,
        position: 0,
        duration: 0,
        uri: undefined,
        title: undefined
      }));
      
      // Clear current video first
      setCurrentUri('');
      setHasInitialized(false);
      
      // Small delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Set new video
      console.log('Setting new video source:', processedUri);
      setCurrentUri(processedUri);
      setHasInitialized(true);
      
      // Replace player source
      if (player) {
        console.log('Replacing player source...');
        console.log('Player current state:', {
          duration: player.duration,
          currentTime: player.currentTime,
          playing: player.playing,
          volume: player.volume
        });
        
        try {
          await player.replace({ uri: processedUri });
          console.log('✅ Player source replaced successfully');
          
          // Wait a bit for the player to initialize
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log('Player state after replace:', {
            duration: player.duration,
            currentTime: player.currentTime,
            playing: player.playing,
            volume: player.volume
          });
          
        } catch (replaceError) {
          console.error('❌ Error replacing player source:', replaceError);
          console.error('Error details:', {
            name: replaceError instanceof Error ? replaceError.name : 'Unknown',
            message: replaceError instanceof Error ? replaceError.message : 'Unknown error',
            stack: replaceError instanceof Error ? replaceError.stack : 'No stack trace'
          });
          setIsLoading(false);
          const errorMsg = `Failed to load video: ${replaceError instanceof Error ? replaceError.message : 'Unknown player error'}`;
          setError(errorMsg);
          throw new Error(errorMsg);
        }
      }
      
      // Update state
      setState(prev => ({ 
        ...prev, 
        uri: processedUri, 
        title: title || 'Video'
      }));
      
      setIsLoading(false);
      console.log('✅ Video loaded successfully:', processedUri);
      
    } catch (error) {
      console.error('❌ Error in loadVideo:', error);
      setIsLoading(false);
      
      // Clear video state on error
      setCurrentUri('');
      setHasInitialized(false);
      setState(prev => ({ 
        ...prev, 
        uri: undefined, 
        title: undefined,
        isPlaying: false,
        position: 0,
        duration: 0
      }));
      
      // Set error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while loading video';
      setError(errorMessage);
      
      throw error;
    }
  }, [player]);

  const selectLocalVideo = useCallback(async () => {
    try {
      // Check usage limits before allowing video selection
      const remaining = getRemainingUsage();
      if (!remaining.canUse) {
        throw new Error('Usage limit reached. Please upgrade your membership.');
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Increment usage count
        const canUse = await incrementUsage();
        if (!canUse) {
          throw new Error('Usage limit reached during video loading.');
        }
        
        await loadVideo(asset.uri, asset.name);
      }
    } catch (error) {
      console.error('Error selecting video:', error);
      throw error;
    }
  }, [loadVideo, incrementUsage, getRemainingUsage]);

  const play = useCallback(async () => {
    try {
      // Check if this is a YouTube video
      if (state.uri && detectVideoSource(state.uri).sourceInfo.platform === 'YouTube') {
        if (youtubePlayerRef.current?.youtubeControls) {
          youtubePlayerRef.current.youtubeControls.play();
          setState(prev => ({ ...prev, isPlaying: true }));
          console.log('YouTube video playing');
          return;
        }
      }
      
      if (!player) {
        console.log('No player available');
        return;
      }
      player.play();
      setState(prev => ({ ...prev, isPlaying: true }));
      console.log('Video playing');
    } catch (error) {
      console.error('Error playing video:', error);
    }
  }, [player, state.uri]);

  const pause = useCallback(async () => {
    try {
      // Check if this is a YouTube video
      if (state.uri && detectVideoSource(state.uri).sourceInfo.platform === 'YouTube') {
        if (youtubePlayerRef.current?.youtubeControls) {
          youtubePlayerRef.current.youtubeControls.pause();
          setState(prev => ({ ...prev, isPlaying: false }));
          console.log('YouTube video paused');
          return;
        }
      }
      
      if (!player) {
        console.log('No player available');
        return;
      }
      player.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
      console.log('Video paused');
    } catch (error) {
      console.error('Error pausing video:', error);
    }
  }, [player, state.uri]);

  const stop = useCallback(async () => {
    try {
      if (!player) {
        console.log('No player available');
        return;
      }
      player.pause();
      player.currentTime = 0;
      setState(prev => ({ ...prev, isPlaying: false, position: 0 }));
      console.log('Video stopped');
    } catch (error) {
      console.error('Error stopping video:', error);
    }
  }, [player]);

  const seek = useCallback(async (seconds: number) => {
    try {
      // Check if this is a YouTube video
      if (state.uri && detectVideoSource(state.uri).sourceInfo.platform === 'YouTube') {
        if (youtubePlayerRef.current?.youtubeControls) {
          const currentTime = state.position / 1000; // Convert from milliseconds
          const newPosition = Math.max(0, currentTime + seconds);
          youtubePlayerRef.current.youtubeControls.seekTo(newPosition);
          setState(prev => ({ ...prev, position: newPosition * 1000 }));
          console.log(`YouTube seeking ${seconds}s to position: ${newPosition}s`);
          return;
        }
      }
      
      if (!player) {
        console.log('No player available for seeking');
        return;
      }
      
      const currentTime = player.currentTime || 0;
      const duration = player.duration || state.duration || 0;
      const newPosition = Math.max(0, Math.min(currentTime + seconds, duration));
      
      player.currentTime = newPosition;
      setState(prev => ({ ...prev, position: newPosition }));
      console.log(`Seeking ${seconds}s from ${currentTime}s to position: ${newPosition}s`);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  }, [player, state.duration, state.uri, state.position]);

  const setVolume = useCallback(async (volume: number) => {
    if (typeof volume !== 'number' || isNaN(volume)) {
      console.log('Invalid volume value:', volume);
      return;
    }
    
    const clampedVolume = Math.max(0, Math.min(1, volume));
    try {
      // Check if this is a YouTube video
      if (state.uri && detectVideoSource(state.uri).sourceInfo.platform === 'YouTube') {
        if (youtubePlayerRef.current?.youtubeControls) {
          youtubePlayerRef.current.youtubeControls.setVolume(clampedVolume);
          setState(prev => ({ ...prev, volume: clampedVolume }));
          console.log('YouTube volume set to:', clampedVolume);
          return;
        }
      }
      
      if (!player) {
        console.log('No player available for volume control');
        return;
      }
      
      player.volume = clampedVolume;
      setState(prev => ({ ...prev, volume: clampedVolume }));
      console.log('Volume set to:', clampedVolume);
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }, [player, state.uri]);

  const setSpeed = useCallback(async (speed: number) => {
    try {
      // Check if this is a YouTube video
      if (state.uri && detectVideoSource(state.uri).sourceInfo.platform === 'YouTube') {
        if (youtubePlayerRef.current?.youtubeControls) {
          youtubePlayerRef.current.youtubeControls.setPlaybackRate(speed);
          setState(prev => ({ ...prev, speed }));
          console.log('YouTube speed set to:', speed);
          return;
        }
      }
      
      if (!player) {
        console.log('No player available for speed control');
        return;
      }
      
      player.playbackRate = speed;
      setState(prev => ({ ...prev, speed }));
      console.log('Speed set to:', speed);
    } catch (error) {
      console.error('Error setting speed:', error);
    }
  }, [player, state.uri]);

  const toggleFullscreen = useCallback(() => {
    if (Platform.OS === 'web') {
      const video = document.querySelector('video');
      if (video) {
        if (!document.fullscreenElement) {
          video.requestFullscreen();
          setState(prev => ({ ...prev, isFullscreen: true }));
        } else {
          document.exitFullscreen();
          setState(prev => ({ ...prev, isFullscreen: false }));
        }
      }
    } else {
      setState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
    }
  }, []);

  const addBookmark = useCallback(async () => {
    if (!state.uri) return;

    const bookmark: Bookmark = {
      id: Date.now().toString(),
      videoUri: state.uri,
      position: state.position,
      title: state.title || 'Bookmark',
      createdAt: Date.now(),
    };

    const updated = [...bookmarks, bookmark];
    setBookmarks(updated);
    await AsyncStorage.setItem('bookmarks', JSON.stringify(updated));
  }, [state.uri, state.position, state.title, bookmarks]);

  const toggleFavorite = useCallback(async () => {
    if (!state.uri) return;

    const updated = favorites.includes(state.uri)
      ? favorites.filter(f => f !== state.uri)
      : [...favorites, state.uri];

    setFavorites(updated);
    await AsyncStorage.setItem('favorites', JSON.stringify(updated));
  }, [state.uri, favorites]);

  const clearVideo = useCallback(() => {
    console.log('Clearing video');
    setCurrentUri('');
    setHasInitialized(false);
    setState(prev => ({
      ...prev,
      uri: undefined,
      title: undefined,
      isPlaying: false,
      position: 0,
      duration: 0,
      isFullscreen: false,
    }));
  }, []);

  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (status.error) {
      console.error('Playback status error:', status.error);
    } else {
      console.log('Playback status update:', {
        isPlaying: status.isPlaying,
        currentTime: status.currentTime,
        duration: status.duration
      });
    }
    setState(prev => ({
      ...prev,
      duration: status.duration || prev.duration || 0,
      position: status.currentTime || prev.position || 0,
      isPlaying: status.isPlaying !== undefined ? status.isPlaying : prev.isPlaying,
    }));
  }, []);

  // Enhanced video analysis
  const getVideoInfo = useCallback((uri: string) => {
    if (!uri) return null;
    
    const detection = detectVideoSource(uri);
    const quality = getOptimalVideoQuality(uri);
    const isDirect = isDirectVideoFile(uri);
    const isStreaming = isStreamingFormat(uri);
    const needsSpecialHandling = requiresSpecialHandling(uri);
    
    return {
      detection,
      quality,
      isDirect,
      isStreaming,
      needsSpecialHandling,
      platform: detection.sourceInfo.platform,
      type: detection.sourceInfo.type,
      supported: detection.isSupported
    };
  }, []);

  // Method to register YouTube player reference
  const registerYouTubePlayer = useCallback((playerRef: any) => {
    youtubePlayerRef.current = playerRef;
    console.log('YouTube player registered');
  }, []);

  return useMemo(() => ({
    videoRef,
    player,
    youtubePlayerRef,
    ...state,
    bookmarks,
    favorites,
    isLoading,
    error,
    loadVideo,
    selectLocalVideo,
    clearVideo,
    play,
    pause,
    stop,
    seek,
    setVolume,
    setSpeed,
    toggleFullscreen,
    addBookmark,
    toggleFavorite,
    onPlaybackStatusUpdate,
    getVideoInfo,
    registerYouTubePlayer,
    isFavorite: state.uri ? favorites.includes(state.uri) : false,
  }), [state, bookmarks, favorites, isLoading, error, loadVideo, selectLocalVideo, clearVideo, play, pause, stop, seek, setVolume, setSpeed, toggleFullscreen, addBookmark, toggleFavorite, onPlaybackStatusUpdate, getVideoInfo, registerYouTubePlayer, player]);
});