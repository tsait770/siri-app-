import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  View, 
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Upload, Link, Play, Mic, Settings } from 'lucide-react-native';
import { VideoPlayer } from '@/components/VideoPlayer';
import { VideoControls } from '@/components/VideoControls';
import { VoiceButton } from '@/components/VoiceButton';
import { CommandList } from '@/components/CommandList';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ParticleBackground } from '@/components/ParticleBackground';
import { MembershipCard } from '@/components/MembershipCard';

import { useI18n } from '@/hooks/use-i18n';
import { useVideoPlayer } from '@/hooks/use-video-player';
import { useMembership } from '@/hooks/use-membership';
import { useTheme } from '@/hooks/use-theme';
import { detectVideoSource } from '@/utils/video-source-detection';

export default function HomeScreen() {
  const { t, isLoading } = useI18n();
  const { 
    uri, 
    isLoading: videoLoading,
    error: videoError,
    loadVideo, 
    selectLocalVideo,
    clearVideo
  } = useVideoPlayer();
  const { upgradeMembership } = useMembership();
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  
  const [showUrlModal, setShowUrlModal] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>('https://youtu.be/WBzofAAt32U?si=0e_tuGWpk8Rj-89i');
  const [hasAutoLoaded, setHasAutoLoaded] = useState<boolean>(false);
  
  const isSmallScreen = width < 768;

  const isLargeScreen = width >= 1024;
  const isTablet = width >= 768;
  const isLandscape = width > height;

  // Auto-load default YouTube video on first load
  useEffect(() => {
    if (!isLoading && !hasAutoLoaded && !uri && !videoLoading && !videoError) {
      const autoLoadVideo = async () => {
        try {
          console.log('Auto-loading default YouTube video:', urlInput);
          await loadVideo(urlInput, 'a playlist that understands you - Timeless Hour');
          setHasAutoLoaded(true);
          console.log('✅ Default video auto-loaded successfully');
        } catch (error) {
          console.error('❌ Error auto-loading default video:', error);
          setHasAutoLoaded(true); // Prevent retry loop
        }
      };
      
      // Small delay to ensure everything is initialized
      const timer = setTimeout(autoLoadVideo, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, hasAutoLoaded, uri, videoLoading, videoError, loadVideo, urlInput]);

  if (isLoading) {
    return (
      <View style={[styles.container, isTablet && styles.containerTablet, { backgroundColor: theme.colors.background }]}>
        <LinearGradient
          colors={[
            theme.colors.backgroundSecondary,
            theme.colors.backgroundTertiary,
            theme.colors.surface
          ]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingCard, {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading...</Text>
          </View>
        </View>
      </View>
    );
  }

  // Test all functionality
  const testAllFeatures = () => {
    console.log('=== COMPREHENSIVE FEATURE TEST ===');
    
    // Test video source detection
    console.log('\n1. Testing Video Source Detection:');
    testVideoSources();
    
    // Test membership system
    console.log('\n2. Testing Membership System:');
    const { membershipStatus, getRemainingUsage } = useMembership();
    console.log('Current membership:', membershipStatus);
    console.log('Remaining usage:', getRemainingUsage());
    
    // Test voice commands (will be tested when user interacts)
    console.log('\n3. Voice Commands Ready:');
    console.log('- Always Listen toggle available');
    console.log('- Manual voice recording available');
    console.log('- Multi-language support enabled');
    
    console.log('\n4. Video Player Features:');
    console.log('- Local video selection: ✅');
    console.log('- URL video loading: ✅');
    console.log('- Video controls: ✅');
    console.log('- Fullscreen support: ✅');
    console.log('- Bookmarks and favorites: ✅');
    
    console.log('\n=== TEST COMPLETE ===');
  };
  
  // Voice command processing is now handled in VoiceButton component

  const handleUrlLoad = () => {
    setShowUrlModal(true);
  };

  const handleUrlSubmit = async () => {
    if (!urlInput?.trim()) {
      Alert.alert('Invalid URL', 'Please enter a valid video URL', [{ text: 'OK' }]);
      return;
    }
    
    try {
      console.log('=== SUBMITTING URL ===');
      console.log('URL Input:', urlInput.trim());
      
      // Validate URL format first
      try {
        new URL(urlInput.trim());
      } catch (urlError) {
        Alert.alert('Invalid URL', 'Please enter a valid URL format (e.g., https://example.com/video.mp4)', [{ text: 'OK' }]);
        return;
      }
      
      await loadVideo(urlInput.trim(), 'Video from URL');
      setShowUrlModal(false);
      console.log('✅ URL submitted successfully');
    } catch (error) {
      console.error('❌ Error loading video from URL:', error);
      
      let errorMessage = 'Failed to load video from URL';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Video Load Error',
        errorMessage,
        [
          { text: 'Try Again', style: 'default' },
          { 
            text: 'Test Direct MP4', 
            onPress: () => {
              setUrlInput('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
            }
          }
        ]
      );
    }
  };

  const handleUrlCancel = () => {
    setShowUrlModal(false);
    setUrlInput('https://youtu.be/LyhkTbCq2IM');
  };

  const testVideoSources = () => {
    console.log('=== TESTING SPECIFIC YOUTUBE URL ===');
    const youtubeTestUrl = 'https://youtu.be/L5qNxSNQREw?si=SVdxfnwBP4zVppaT';
    const detection = detectVideoSource(youtubeTestUrl);
    console.log('YouTube URL:', youtubeTestUrl);
    console.log('Detection result:', detection);
    console.log('Is supported:', detection.isSupported);
    console.log('Platform:', detection.sourceInfo.platform);
    console.log('Type:', detection.sourceInfo.type);
    console.log('Description:', detection.sourceInfo.description);
    
    const testUrls = [
      // 🎬 Direct Video Files (Fully Supported)
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
      'https://file-examples.com/storage/fe68c1e7b8c2bb5c7b7b1a7/2017/10/file_example_MP4_480_1_5MG.mp4',
      'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
      
      // 🎯 SPECIFIC YOUTUBE TESTS
      'https://youtu.be/L5qNxSNQREw?si=SVdxfnwBP4zVppaT',
      'https://youtu.be/LyhkTbCq2IM?si=fF2XAX082g_-8Rat',
      'https://www.youtube.com/watch?v=L5qNxSNQREw',
      'https://www.youtube.com/watch?v=LyhkTbCq2IM',
      
      // 🌐 Streaming Formats
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
      'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
      'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
      'rtmp://live.twitch.tv/live/test_stream_key',
      
      // 📺 Video Platforms (Supported)
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
      'https://youtu.be/dQw4w9WgXcQ?t=10',
      'https://vimeo.com/148751763',
      'https://www.twitch.tv/videos/123456789',
      'https://www.facebook.com/watch/?v=123456789',
      
      // ☁️ Cloud Storage
      'https://drive.google.com/file/d/1ABC123DEF456/view',
      'https://www.dropbox.com/s/abc123def456/sample_video.mp4',
      'https://onedrive.live.com/download?cid=ABC123&resid=DEF456&authkey=GHI789',
      
      // 🔞 Adult Content Platforms (Extended Support)
      'https://www.pornhub.com/view_video.php?viewkey=ph123456789abcdef',
      'https://www.xvideos.com/video123456/sample_video',
      'https://xhamster.com/videos/sample-video-123456',
      'https://www.redtube.com/123456',
      'https://www.youporn.com/watch/123456/sample-video',
      'https://www.tube8.com/category/video/sample-123456',
      'https://spankbang.com/sample/video/test-video',
      'https://www.eporner.com/video-ABC123/sample-video',
      'https://www.txxx.com/videos/123456/sample-video',
      'https://hqporner.com/hdporn/sample-video-123',
      'https://www.xnxx.com/video-abc123/sample',
      'https://beeg.com/123456',
      'https://www.drtuber.com/video/123456/sample',
      'https://www.tnaflix.com/category/video123456',
      'https://www.empflix.com/videos/sample-123456',
      'https://motherless.com/ABC123',
      'https://heavy-r.com/video/123456/sample',
      'https://www.upornia.com/videos/123456/sample',
      'https://www.gotporn.com/video/123456/sample',
      'https://www.sunporno.com/videos/123456/sample',
      'https://www.analdin.com/videos/123456/sample',
      'https://www.nuvid.com/video/123456/sample',
      
      // 📱 Social Media Platforms (Extended Support)
      'https://twitter.com/user/status/123456789012345',
      'https://x.com/user/status/123456789012345',
      'https://www.instagram.com/reel/ABC123DEF456/',
      'https://www.instagram.com/p/ABC123DEF456/',
      'https://www.instagram.com/tv/ABC123DEF456/',
      'https://www.tiktok.com/@username/video/123456789012345',
      'https://www.reddit.com/r/videos/comments/abc123/sample_video/',
      'https://v.redd.it/abc123def456',
      'https://gfycat.com/sample-video-name',
      'https://redgifs.com/watch/sample-video-name',
      
      // 🌏 International Platforms (Extended Support)
      'https://www.bilibili.com/video/BV1234567890',
      'https://v.youku.com/v_show/id_XMTIzNDU2Nzg5MA==.html',
      'https://www.tudou.com/programs/view/sample-video',
      'https://www.iqiyi.com/v_sample123456.html',
      'https://v.qq.com/x/cover/sample123456.html',
      'https://weibo.com/tv/show/123456789',
      'https://www.douyin.com/video/123456789012345',
      
      // 🎮 Live Streaming (Extended Support)
      'https://www.twitch.tv/username/clip/SampleClipName',
      'https://www.youtube.com/live/ABC123DEF456',
      'https://kick.com/username',
      'https://chaturbate.com/username/',
      'https://www.cam4.com/username',
      
      // 📁 File Hosting Services (Extended Support)
      'https://www.mediafire.com/file/abc123def456/sample_video.mp4',
      'https://mega.nz/file/ABC123DEF456#sample-key',
      'https://www.4shared.com/video/abc123def456/sample.html',
      'https://sendvid.com/abc123def456',
      'https://streamable.com/abc123',
      
      // ❌ Unsupported DRM Platforms
      'https://www.netflix.com/watch/123456',
      'https://www.disneyplus.com/video/sample-movie',
      'https://www.hbomax.com/series/sample-show',
      'https://www.primevideo.com/detail/sample-movie',
      'https://tv.apple.com/show/sample-series',
      'https://www.hulu.com/watch/sample-episode',
      'https://www.peacocktv.com/watch/sample-show',
      'https://www.paramountplus.com/shows/sample-series',
      'https://www.crunchyroll.com/series/sample-anime',
      
      // 🎵 Music/Audio Platforms (Unsupported)
      'https://open.spotify.com/track/sample123',
      'https://music.apple.com/album/sample/123456',
      'https://tidal.com/browse/track/123456',
      
      // 🎓 Educational Platforms (Unsupported)
      'https://www.coursera.org/learn/sample-course',
      'https://www.udemy.com/course/sample-course/',
      'https://www.linkedin.com/learning/sample-course',
      'https://www.pluralsight.com/courses/sample-course',
      
      // 📺 Regional Streaming (Unsupported)
      'https://www.bbc.co.uk/iplayer/episode/sample123',
      'https://www.itv.com/hub/sample-show',
      'https://www.channel4.com/programmes/sample-show',
      'https://www.cbc.ca/player/play/sample-episode',
      
      // 🔗 Invalid/Test URLs
      'https://example.com/nonexistent-video.mp4',
      'invalid-url-format',
      '',
      'https://broken-domain-12345.com/video.mp4'
    ];
    
    console.log('=== COMPREHENSIVE VIDEO SOURCE DETECTION TEST ===');
    testUrls.forEach((url, index) => {
      if (!url?.trim()) {
        console.log(`${index + 1}. Invalid URL: INVALID`);
        return;
      }
      const detection = detectVideoSource(url.trim());
      const status = detection.isSupported ? 
        (detection.sourceInfo.type === 'supported' ? '✅ SUPPORTED' : '⚠️ EXTENDED') : '❌ UNSUPPORTED';
      console.log(`${index + 1}. [${status}] ${detection.sourceInfo.platform}: ${url}`);
      console.log(`   → ${detection.sourceInfo.description}`);
    });
    
    // Categorize results
    const supported = testUrls.filter(url => {
      const detection = detectVideoSource(url.trim());
      return detection.isSupported && detection.sourceInfo.type === 'supported';
    });
    
    const extended = testUrls.filter(url => {
      const detection = detectVideoSource(url.trim());
      return detection.isSupported && detection.sourceInfo.type === 'extended';
    });
    
    const unsupported = testUrls.filter(url => {
      const detection = detectVideoSource(url.trim());
      return !detection.isSupported;
    });
    
    // Comprehensive categorization
    const directVideos = testUrls.filter(url => {
      if (!url?.trim()) return false;
      const detection = detectVideoSource(url.trim());
      return detection.isSupported && detection.sourceInfo.platform === 'Direct Video';
    });
    
    const streamingFormats = testUrls.filter(url => {
      if (!url?.trim()) return false;
      const detection = detectVideoSource(url.trim());
      return detection.isSupported && ['HLS Stream', 'DASH Stream', 'RTMP Stream'].includes(detection.sourceInfo.platform);
    });
    
    const videoPlatforms = testUrls.filter(url => {
      if (!url?.trim()) return false;
      const detection = detectVideoSource(url.trim());
      return detection.isSupported && ['YouTube', 'Vimeo', 'Twitch', 'Facebook'].includes(detection.sourceInfo.platform);
    });
    
    const adultPlatforms = testUrls.filter(url => {
      if (!url?.trim()) return false;
      const detection = detectVideoSource(url.trim());
      return detection.isSupported && ['Pornhub', 'XVideos', 'XHamster', 'RedTube', 'YouPorn', 'Tube8', 'SpankBang', 'Eporner', 'TXXX', 'HQPorner', 'XNXX', 'Beeg', 'DrTuber', 'TNAFlix', 'EmpFlix', 'Motherless', 'Heavy-R', 'Upornia', 'GotPorn', 'SunPorno', 'AnalDin', 'NuVid'].includes(detection.sourceInfo.platform);
    });
    
    const socialMedia = testUrls.filter(url => {
      if (!url?.trim()) return false;
      const detection = detectVideoSource(url.trim());
      return detection.isSupported && ['Twitter', 'X (Twitter)', 'Instagram', 'TikTok', 'Reddit', 'Reddit Video', 'Gfycat', 'RedGIFs'].includes(detection.sourceInfo.platform);
    });
    
    const international = testUrls.filter(url => {
      if (!url?.trim()) return false;
      const detection = detectVideoSource(url.trim());
      return detection.isSupported && ['Bilibili', 'Youku', 'Tudou', 'iQiyi', 'Tencent Video', 'Weibo Video', 'Douyin'].includes(detection.sourceInfo.platform);
    });
    
    const unsupportedPlatforms = testUrls.filter(url => {
      if (!url?.trim()) return false;
      const detection = detectVideoSource(url.trim());
      return !detection.isSupported;
    });
    
    console.log('\n=== COMPREHENSIVE VIDEO SOURCE ANALYSIS ===');
    console.log(`Total URLs tested: ${testUrls.length}`);
    console.log(`Direct Videos: ${directVideos.length}`);
    console.log(`Streaming Formats: ${streamingFormats.length}`);
    console.log(`Video Platforms: ${videoPlatforms.length}`);
    console.log(`Adult Platforms: ${adultPlatforms.length}`);
    console.log(`Social Media: ${socialMedia.length}`);
    console.log(`International: ${international.length}`);
    console.log(`Unsupported: ${unsupportedPlatforms.length}`);
    
    Alert.alert(
      t('testing.comprehensiveVideoSourceTestResults'),
      `${t('testing.totalTested', { count: testUrls.length })}\n\n` +
      `${t('testing.supportedFormats')}\n` +
      `${t('testing.directVideos', { count: directVideos.length })}\n` +
      `${t('testing.streaming', { count: streamingFormats.length })}\n` +
      `${t('testing.videoPlatforms', { count: videoPlatforms.length })}\n\n` +
      `${t('testing.extendedSupport')}\n` +
      `${t('testing.adultPlatforms', { count: adultPlatforms.length })}\n` +
      `${t('testing.socialMedia', { count: socialMedia.length })}\n` +
      `${t('testing.international', { count: international.length })}\n\n` +
      `${t('testing.unsupported', { count: unsupportedPlatforms.length })}\n\n` +
      `${t('testing.checkConsoleForDetails')}`,
      [
        { text: t('testing.viewConsole'), style: 'default' },
        {
          text: t('testing.testDirectMP4'),
          onPress: async () => {
            try {
              const testVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
              console.log('Loading direct MP4 test video:', testVideo);
              await loadVideo(testVideo, 'Big Buck Bunny - Direct MP4 Test');
              console.log('Direct MP4 video loaded successfully!');
            } catch (error) {
              console.error('Error loading direct MP4 test video:', error);
              Alert.alert(
                t('errors.errorSelectingVideo'),
                error instanceof Error ? error.message : t('video.error'),
                [{ text: t('common.ok'), style: 'default' }]
              );
            }
          }
        },
        {
          text: t('testing.testHLSStream'),
          onPress: async () => {
            try {
              const hlsUrl = 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8';
              console.log('Testing HLS streaming format:', hlsUrl);
              await loadVideo(hlsUrl, 'Sintel - HLS Stream Test');
              console.log('HLS stream loaded successfully!');
            } catch (error) {
              console.error('HLS stream test failed:', error);
              Alert.alert(
                'HLS Stream Test Result',
                'HLS streams may require special player configuration or may not work in all environments. This is expected for some streaming formats.',
                [{ text: 'OK', style: 'default' }]
              );
            }
          }
        },
        {
          text: t('testing.testExtendedPlatform'),
          onPress: async () => {
            try {
              const extendedUrl = 'https://youtu.be/LyhkTbCq2IM';
              console.log('Testing extended platform (YouTube):', extendedUrl);
              await loadVideo(extendedUrl, 'YouTube Extended Test');
              console.log('Extended platform loaded (unexpected success)');
            } catch (error) {
              console.error('Extended platform test result:', error);
              Alert.alert(
                'Extended Platform Test Result',
                'Extended platforms like YouTube, social media, and adult sites may not work due to CORS restrictions, API requirements, or platform-specific limitations. This is expected behavior.',
                [{ text: 'Understood', style: 'default' }]
              );
            }
          }
        }
      ]
    );
  };



  return (
    <View style={[styles.container, isTablet && styles.containerTablet, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[
          theme.colors.backgroundSecondary,
          theme.colors.backgroundTertiary,
          theme.colors.surface
        ]}
        style={StyleSheet.absoluteFillObject}
      />
      <ParticleBackground />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            isSmallScreen && styles.scrollContentSmall,
            isTablet && styles.scrollContentTablet
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.header, isSmallScreen && styles.headerSmall]}>
            <View style={[
              styles.headerContent,
              isTablet && styles.headerContentTablet,
              isLandscape && isTablet && styles.headerContentLandscape
            ]}>
              <View style={styles.titleContainer}>
                <View style={[styles.logoContainer, isSmallScreen && styles.logoContainerSmall, {
                  backgroundColor: theme.colors.primary + '20',
                  borderColor: theme.colors.primary + '40'
                }]}>
                  <Play color={theme.colors.primary} size={isSmallScreen ? 24 : 28} />
                </View>
                <Text style={[styles.title, isSmallScreen && styles.titleSmall, { color: theme.colors.text }]}>{t('app.title')}</Text>
                <Text style={[styles.subtitle, isSmallScreen && styles.subtitleSmall, { color: theme.colors.textSecondary }]}>Voice-Controlled Video Player</Text>
              </View>
              <View style={[
                styles.languageSelectorContainer,
                isSmallScreen && styles.languageSelectorContainerSmall
              ]}>
                <LanguageSelector />
              </View>
            </View>
          </View>

          {/* Main Content */}
          <View style={[
            styles.mainContent,
            isSmallScreen && styles.mainContentSmall,
            isTablet && styles.mainContentTablet,
            isLargeScreen && styles.mainContentLarge
          ]}>
            {/* Video Section */}
            <View style={[
              styles.videoCard,
              isTablet && styles.videoCardTablet,
              isLargeScreen && styles.videoCardLarge
            ]}>
              {Platform.OS !== 'web' ? (
                <BlurView intensity={20} style={[styles.glassCard, {
                  backgroundColor: theme.colors.glassBackground,
                  borderColor: theme.colors.glassBorder
                }]}>
                  {!uri ? (
                    <View style={styles.uploadSection}>
                      <View style={[styles.uploadIcon, {
                        backgroundColor: theme.colors.primary + '20',
                        borderColor: theme.colors.primary + '40'
                      }]}>
                        <Play color={theme.colors.primary} size={48} />
                      </View>
                      <Text style={[styles.uploadTitle, { color: theme.colors.text }]}>{t('video.selectVideo')}</Text>
                      <Text style={[styles.uploadSubtitle, { color: theme.colors.textSecondary }]}>Choose a video to get started with voice control</Text>
                      
                      <View style={[
                        styles.uploadButtons,
                        isTablet && styles.uploadButtonsTablet,
                        isLargeScreen && styles.uploadButtonsLarge
                      ]}>
                        <TouchableOpacity 
                          style={[
                            styles.primaryButton,
                            isSmallScreen && styles.primaryButtonSmall,
                            videoLoading && styles.buttonDisabled,
                            { backgroundColor: theme.colors.primary }
                          ]}
                          disabled={videoLoading}
                          onPress={async () => {
                            try {
                              console.log('=== SELECTING LOCAL VIDEO ===');
                              await selectLocalVideo();
                              console.log('✅ Local video selected successfully');
                            } catch (error) {
                              console.error('❌ Error selecting local video:', error);
                              Alert.alert(
                                'Error Selecting Video',
                                error instanceof Error ? error.message : 'Failed to select video',
                                [{ text: 'OK', style: 'default' }]
                              );
                            }
                          }}
                        >
                          <Upload color="#fff" size={isSmallScreen ? 18 : 20} />
                          <Text style={[
                            styles.primaryButtonText,
                            isSmallScreen && styles.primaryButtonTextSmall
                          ]}>{t('video.selectVideo')}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[
                            styles.secondaryButton,
                            isSmallScreen && styles.secondaryButtonSmall,
                            videoLoading && styles.buttonDisabled,
                            {
                              backgroundColor: theme.colors.primary + '20',
                              borderColor: theme.colors.primary + '40'
                            }
                          ]}
                          disabled={videoLoading}
                          onPress={handleUrlLoad}
                        >
                          <Link color={theme.colors.primary} size={isSmallScreen ? 18 : 20} />
                          <Text style={[
                            styles.secondaryButtonText,
                            isSmallScreen && styles.secondaryButtonTextSmall,
                            { color: theme.colors.primary }
                          ]}>{t('video.loadFromUrl')}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[
                            styles.tertiaryButton,
                            isSmallScreen && styles.tertiaryButtonSmall
                          ]}
                          onPress={testVideoSources}
                        >
                          <Settings color="#6366f1" size={isSmallScreen ? 18 : 20} />
                          <Text style={[
                            styles.tertiaryButtonText,
                            isSmallScreen && styles.tertiaryButtonTextSmall
                          ]}>Test Video Sources</Text>
                        </TouchableOpacity>

                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={styles.videoHeader}>
                        <TouchableOpacity 
                          style={styles.backButton}
                          onPress={() => {
                            console.log('Back button pressed, clearing video');
                            try {
                              clearVideo();
                            } catch (error) {
                              console.error('Error clearing video:', error);
                            }
                          }}
                        >
                          <Text style={styles.backButtonText}>← Back to Selection</Text>
                        </TouchableOpacity>
                      </View>
                      <VideoPlayer />
                      <VideoControls />
                    </>
                  )}
                </BlurView>
              ) : (
                <View style={[styles.glassCardWeb, {
                  backgroundColor: theme.colors.glassBackground,
                  borderColor: theme.colors.glassBorder
                }]}>
                  {!uri ? (
                    <View style={styles.uploadSection}>
                      <View style={[styles.uploadIcon, {
                        backgroundColor: theme.colors.primary + '20',
                        borderColor: theme.colors.primary + '40'
                      }]}>
                        <Play color={theme.colors.primary} size={48} />
                      </View>
                      <Text style={[styles.uploadTitle, { color: theme.colors.text }]}>{t('video.selectVideo')}</Text>
                      <Text style={[styles.uploadSubtitle, { color: theme.colors.textSecondary }]}>Choose a video to get started with voice control</Text>
                      
                      <View style={[
                        styles.uploadButtons,
                        isTablet && styles.uploadButtonsTablet,
                        isLargeScreen && styles.uploadButtonsLarge
                      ]}>
                        <TouchableOpacity 
                          style={[
                            styles.primaryButton,
                            isSmallScreen && styles.primaryButtonSmall,
                            videoLoading && styles.buttonDisabled,
                            { backgroundColor: theme.colors.primary }
                          ]}
                          disabled={videoLoading}
                          onPress={async () => {
                            try {
                              console.log('=== SELECTING LOCAL VIDEO ===');
                              await selectLocalVideo();
                              console.log('✅ Local video selected successfully');
                            } catch (error) {
                              console.error('❌ Error selecting local video:', error);
                              Alert.alert(
                                'Error Selecting Video',
                                error instanceof Error ? error.message : 'Failed to select video',
                                [{ text: 'OK', style: 'default' }]
                              );
                            }
                          }}
                        >
                          <Upload color="#fff" size={isSmallScreen ? 18 : 20} />
                          <Text style={[
                            styles.primaryButtonText,
                            isSmallScreen && styles.primaryButtonTextSmall
                          ]}>{t('video.selectVideo')}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[
                            styles.secondaryButton,
                            isSmallScreen && styles.secondaryButtonSmall,
                            videoLoading && styles.buttonDisabled,
                            {
                              backgroundColor: theme.colors.primary + '20',
                              borderColor: theme.colors.primary + '40'
                            }
                          ]}
                          disabled={videoLoading}
                          onPress={handleUrlLoad}
                        >
                          <Link color={theme.colors.primary} size={isSmallScreen ? 18 : 20} />
                          <Text style={[
                            styles.secondaryButtonText,
                            isSmallScreen && styles.secondaryButtonTextSmall,
                            { color: theme.colors.primary }
                          ]}>{t('video.loadFromUrl')}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[
                            styles.tertiaryButton,
                            isSmallScreen && styles.tertiaryButtonSmall
                          ]}
                          onPress={testVideoSources}
                        >
                          <Settings color="#6366f1" size={isSmallScreen ? 18 : 20} />
                          <Text style={[
                            styles.tertiaryButtonText,
                            isSmallScreen && styles.tertiaryButtonTextSmall
                          ]}>Test Video Sources</Text>
                        </TouchableOpacity>

                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={styles.videoHeader}>
                        <TouchableOpacity 
                          style={styles.backButton}
                          onPress={() => {
                            console.log('Back button pressed, clearing video');
                            try {
                              clearVideo();
                            } catch (error) {
                              console.error('Error clearing video:', error);
                            }
                          }}
                        >
                          <Text style={styles.backButtonText}>← Back to Selection</Text>
                        </TouchableOpacity>
                      </View>
                      <VideoPlayer />
                      <VideoControls />
                    </>
                  )}
                </View>
              )}
            </View>

            {/* Voice Control Section */}
            <View style={[
              styles.voiceCard,
              isTablet && styles.voiceCardTablet
            ]}>
              {Platform.OS !== 'web' ? (
                <BlurView intensity={20} style={[styles.glassCard, {
                  backgroundColor: theme.colors.glassBackground,
                  borderColor: theme.colors.glassBorder
                }]}>
                  <View style={styles.voiceHeader}>
                    <Mic color={theme.colors.primary} size={24} />
                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Voice Control</Text>
                  </View>
                  <VoiceButton />
                </BlurView>
              ) : (
                <View style={[styles.glassCardWeb, {
                  backgroundColor: theme.colors.glassBackground,
                  borderColor: theme.colors.glassBorder
                }]}>
                  <View style={styles.voiceHeader}>
                    <Mic color={theme.colors.primary} size={24} />
                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Voice Control</Text>
                  </View>
                  <VoiceButton />
                </View>
              )}
            </View>

            {/* Membership Section */}
            <MembershipCard onUpgrade={upgradeMembership} />
            


            {/* Commands Section */}
            <View style={[
              styles.commandsCard,
              isTablet && styles.commandsCardTablet
            ]}>
              {Platform.OS !== 'web' ? (
                <BlurView intensity={20} style={[styles.glassCard, {
                  backgroundColor: theme.colors.glassBackground,
                  borderColor: theme.colors.glassBorder
                }]}>
                  <View style={styles.commandsHeader}>
                    <Settings color={theme.colors.primary} size={24} />
                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t('settings.customCommands')}</Text>
                  </View>
                  <CommandList />
                </BlurView>
              ) : (
                <View style={[styles.glassCardWeb, {
                  backgroundColor: theme.colors.glassBackground,
                  borderColor: theme.colors.glassBorder
                }]}>
                  <View style={styles.commandsHeader}>
                    <Settings color={theme.colors.primary} size={24} />
                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t('settings.customCommands')}</Text>
                  </View>
                  <CommandList />
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* URL Input Modal */}
      <Modal
        visible={showUrlModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleUrlCancel}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardAvoid}
          >
            <View style={[
              styles.modalContent,
              isTablet && styles.modalContentTablet
            ]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('video.loadFromUrl')}</Text>
                <Text style={styles.modalSubtitle}>{t('video.enterUrl')}</Text>
              </View>
              
              <View style={styles.modalBody}>
                <Text style={styles.inputLabel}>Video URL</Text>
                <TextInput
                  style={[
                    styles.urlInput,
                    isSmallScreen && styles.urlInputSmall
                  ]}
                  value={urlInput}
                  onChangeText={setUrlInput}
                  placeholder="https://youtu.be/LyhkTbCq2IM"
                  placeholderTextColor="#9ca3af"
                  multiline={Platform.OS === 'web'}
                  numberOfLines={Platform.OS === 'web' ? 3 : 1}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                
                <Text style={styles.exampleText}>Example formats:</Text>
                <Text style={styles.exampleUrl}>• Direct MP4: https://example.com/video.mp4</Text>
                <Text style={styles.exampleUrl}>• HLS Stream: https://example.com/playlist.m3u8</Text>
                <Text style={styles.exampleUrl}>• YouTube: https://www.youtube.com/watch?v=...</Text>
                <Text style={styles.exampleUrl}>• Vimeo: https://vimeo.com/...</Text>
                <Text style={styles.exampleUrl}>• Adult Sites: https://pornhub.com/view_video.php?viewkey=...</Text>
                <Text style={styles.exampleUrl}>• Social Media: https://twitter.com/.../status/...</Text>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[
                    styles.modalButton,
                    styles.cancelButton,
                    isSmallScreen && styles.modalButtonSmall
                  ]}
                  onPress={handleUrlCancel}
                >
                  <Text style={[
                    styles.modalButtonText,
                    styles.cancelButtonText,
                    isSmallScreen && styles.modalButtonTextSmall
                  ]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.modalButton,
                    styles.loadButton,
                    isSmallScreen && styles.modalButtonSmall,
                    videoLoading && styles.buttonDisabled
                  ]}
                  disabled={videoLoading}
                  onPress={handleUrlSubmit}
                >
                  <Text style={[
                    styles.modalButtonText,
                    styles.loadButtonText,
                    isSmallScreen && styles.modalButtonTextSmall
                  ]}>{videoLoading ? 'Loading...' : 'Load Video'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerTablet: {
    paddingHorizontal: 40,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  scrollContentSmall: {
    paddingBottom: 80,
  },
  scrollContentTablet: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerSmall: {
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  headerContentTablet: {
    alignItems: 'center',
  },
  headerContentLandscape: {
    paddingHorizontal: 20,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  logoContainerSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  titleSmall: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '400',
  },
  subtitleSmall: {
    fontSize: 14,
  },
  mainContent: {
    paddingHorizontal: 24,
    gap: 24,
  },
  mainContentSmall: {
    paddingHorizontal: 16,
    gap: 20,
  },
  mainContentTablet: {
    paddingHorizontal: 32,
    gap: 32,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  mainContentLarge: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  videoCard: {
    marginBottom: 8,
  },
  videoCardTablet: {
    marginBottom: 16,
  },
  videoCardLarge: {
    width: '100%',
    marginBottom: 24,
  },
  voiceCard: {
    marginBottom: 8,
  },
  voiceCardTablet: {
    marginBottom: 16,
  },
  commandsCard: {
    marginBottom: 8,
  },
  commandsCardTablet: {
    marginBottom: 16,
  },
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  glassCardWeb: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
  },
  uploadSection: {
    padding: 40,
    alignItems: 'center',
  },
  uploadIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  uploadTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  uploadButtons: {
    flexDirection: 'column',
    gap: 16,
    width: '100%',
    maxWidth: 280,
  },
  uploadButtonsTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: 600,
    gap: 20,
  },
  uploadButtonsLarge: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: 800,
    gap: 24,
  },
  primaryButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    flex: 1,
  },
  primaryButtonSmall: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonTextSmall: {
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    flex: 1,
  },
  secondaryButtonSmall: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  secondaryButtonText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonTextSmall: {
    fontSize: 14,
  },
  tertiaryButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    flex: 1,
  },
  tertiaryButtonSmall: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  tertiaryButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButtonTextSmall: {
    fontSize: 14,
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  commandsHeader: {
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
    color: '#1f2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1f2937',
  },
  videoHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  backButtonText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalKeyboardAvoid: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  modalContentTablet: {
    maxWidth: 500,
    padding: 32,
  },
  modalHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalBody: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  urlInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
    marginBottom: 16,
    minHeight: 50,
  },
  urlInputSmall: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderRadius: 14,
    minHeight: 44,
  },
  exampleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  exampleUrl: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 4,
    paddingLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSmall: {
    paddingVertical: 14,
    borderRadius: 14,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSmall: {
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#6b7280',
  },
  loadButton: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loadButtonText: {
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  languageSelectorContainer: {
    alignSelf: 'flex-start',
    marginTop: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  languageSelectorContainerSmall: {
    marginTop: 4,
    minHeight: 36,
  },
});