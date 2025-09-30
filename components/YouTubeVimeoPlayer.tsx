import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { AlertCircle, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { detectVideoSource } from '@/utils/video-source-detection';
import { useVideoPlayer } from '@/hooks/use-video-player';

interface YouTubeVimeoPlayerProps {
  url: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
}

const YouTubeVimeoPlayer: React.FC<YouTubeVimeoPlayerProps> = ({ url, onError, onLoad }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const { onPlaybackStatusUpdate, registerYouTubePlayer, isFullscreen, toggleFullscreen } = useVideoPlayer();
  const insets = useSafeAreaInsets();

  const sourceInfo = detectVideoSource(url);

  // 獲取嵌入URL with API enabled
  const getEmbedUrl = useCallback(() => {
    if (sourceInfo.sourceInfo.platform === 'YouTube' && sourceInfo.sourceInfo.videoId) {
      return `https://www.youtube.com/embed/${sourceInfo.sourceInfo.videoId}?enablejsapi=1&autoplay=0&controls=1&rel=0&modestbranding=1&playsinline=1&origin=${Platform.OS === 'web' ? window.location.origin : 'https://localhost'}`;
    } else if (sourceInfo.sourceInfo.platform === 'Vimeo' && sourceInfo.sourceInfo.videoId) {
      return `https://player.vimeo.com/video/${sourceInfo.sourceInfo.videoId}?autoplay=0&playsinline=1&api=1`;
    }
    return null;
  }, [sourceInfo]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
    
    // Initialize YouTube API communication
    if (sourceInfo.sourceInfo.platform === 'YouTube' && webViewRef.current) {
      const initScript = `
        // Initialize YouTube API
        function initYouTubePlayer() {
          if (typeof YT !== 'undefined' && YT.Player) {
            const iframe = document.querySelector('iframe');
            if (iframe) {
              const player = new YT.Player(iframe, {
                events: {
                  'onReady': function(event) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'youtube_ready',
                      duration: event.target.getDuration()
                    }));
                  },
                  'onStateChange': function(event) {
                    const state = event.data;
                    const isPlaying = state === YT.PlayerState.PLAYING;
                    const currentTime = event.target.getCurrentTime();
                    const duration = event.target.getDuration();
                    
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'youtube_state_change',
                      isPlaying: isPlaying,
                      currentTime: currentTime,
                      duration: duration,
                      state: state
                    }));
                  }
                }
              });
              window.youtubePlayer = player;
            }
          } else {
            // Retry if YT is not ready yet
            setTimeout(initYouTubePlayer, 500);
          }
        }
        
        // Start initialization
        initYouTubePlayer();
        true;
      `;
      
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(initScript);
      }, 2000);
    }
  }, [onLoad, sourceInfo]);

  const handleError = useCallback((error: any) => {
    console.error('WebView error:', error);
    setIsLoading(false);
    setHasError(true);
    onError?.('Failed to load video');
  }, [onError]);

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'youtube_ready') {
        onPlaybackStatusUpdate({
          duration: data.duration * 1000, // Convert to milliseconds
          isPlaying: false,
          currentTime: 0
        });
      } else if (data.type === 'youtube_state_change') {
        onPlaybackStatusUpdate({
          isPlaying: data.isPlaying,
          currentTime: data.currentTime * 1000, // Convert to milliseconds
          duration: data.duration * 1000 // Convert to milliseconds
        });
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  }, [onPlaybackStatusUpdate]);

  // Expose control methods
  useEffect(() => {
    if (webViewRef.current && sourceInfo.sourceInfo.platform === 'YouTube') {
      const controls = {
        play: () => {
          webViewRef.current?.injectJavaScript(`
            if (window.youtubePlayer && window.youtubePlayer.playVideo) {
              window.youtubePlayer.playVideo();
            }
            true;
          `);
        },
        pause: () => {
          webViewRef.current?.injectJavaScript(`
            if (window.youtubePlayer && window.youtubePlayer.pauseVideo) {
              window.youtubePlayer.pauseVideo();
            }
            true;
          `);
        },
        seekTo: (seconds: number) => {
          webViewRef.current?.injectJavaScript(`
            if (window.youtubePlayer && window.youtubePlayer.seekTo) {
              window.youtubePlayer.seekTo(${seconds}, true);
            }
            true;
          `);
        },
        setVolume: (volume: number) => {
          webViewRef.current?.injectJavaScript(`
            if (window.youtubePlayer && window.youtubePlayer.setVolume) {
              window.youtubePlayer.setVolume(${volume * 100});
            }
            true;
          `);
        },
        setPlaybackRate: (rate: number) => {
          webViewRef.current?.injectJavaScript(`
            if (window.youtubePlayer && window.youtubePlayer.setPlaybackRate) {
              window.youtubePlayer.setPlaybackRate(${rate});
            }
            true;
          `);
        }
      };
      
      // Store reference for external control
      (webViewRef.current as any).youtubeControls = controls;
      
      // Register with the video player hook
      registerYouTubePlayer({
        youtubeControls: controls
      });
    }
  }, [sourceInfo, registerYouTubePlayer]);

  // 處理不支援的源
  if (!sourceInfo.isSupported || (sourceInfo.sourceInfo.platform !== 'YouTube' && sourceInfo.sourceInfo.platform !== 'Vimeo')) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <AlertCircle size={48} color="#ef4444" />
          <Text style={styles.errorText}>不支援的視頻格式或平台</Text>
          <Text style={styles.platformText}>僅支援 YouTube 和 Vimeo 視頻</Text>
        </View>
      </View>
    );
  }

  // 處理空URL
  if (!url || url.trim() === '') {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <AlertCircle size={48} color="#ef4444" />
          <Text style={styles.errorText}>無效的視頻連結</Text>
        </View>
      </View>
    );
  }

  const embedUrl = getEmbedUrl();

  if (!embedUrl) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <AlertCircle size={48} color="#ef4444" />
          <Text style={styles.errorText}>無法解析視頻ID</Text>
          <Text style={styles.platformText}>請檢查連結格式</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <AlertCircle size={48} color="#ef4444" />
          <Text style={styles.errorText}>視頻載入失敗</Text>
          <Text style={styles.platformText}>請檢查網路連接或稍後再試</Text>
        </View>
      </View>
    );
  }

  // Render WebView for mobile or iframe for web
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>載入中...</Text>
          </View>
        )}
        <iframe
          src={embedUrl}
          style={styles.iframe}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleLoadEnd}
          onError={handleError}
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
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ 
          uri: embedUrl,
          headers: {
            'Referer': 'https://localhost'
          }
        }}
        style={styles.webview}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onMessage={handleMessage}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState={false}
        scalesPageToFit
        mixedContentMode="compatibility"
        originWhitelist={['*']}
        injectedJavaScript={`
          // Load YouTube API
          if (!window.YT && !window.ytApiLoading) {
            window.ytApiLoading = true;
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            tag.onload = function() {
              console.log('YouTube API loaded');
            };
            const firstScriptTag = document.getElementsByTagName('script')[0];
            if (firstScriptTag && firstScriptTag.parentNode) {
              firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            } else {
              document.head.appendChild(tag);
            }
          }
          
          // Setup message posting
          window.addEventListener('message', function(event) {
            if (event.data && typeof event.data === 'string') {
              try {
                const data = JSON.parse(event.data);
                if (data.type === 'youtube_control') {
                  // Handle control commands from React Native
                }
              } catch (e) {}
            }
          });
          
          true;
        `}
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
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#000',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  errorContent: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  platformText: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '500',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    borderRadius: 20,
  } as any,
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

export default YouTubeVimeoPlayer;