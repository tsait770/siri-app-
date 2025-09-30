import { Mic, MicOff, CheckCircle, XCircle, Headphones, Power, PowerOff } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Text, 
  Animated,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { useVoiceCommands } from '@/hooks/use-voice-commands';
import { useVideoPlayer } from '@/hooks/use-video-player';
import { useI18n } from '@/hooks/use-i18n';
import { useAudioLevel } from '@/hooks/use-audio-level';
import { AppleIntelligenceAnimation } from '@/components/AppleIntelligenceAnimation';



export function VoiceButton() {
  const { t } = useI18n();
  const {
    isRecording,
    isProcessing,
    isListening,
    isPersistentMode,
    lastCommand,
    error,
    toggleRecording,
    togglePersistentMode,
    processVoiceCommand,
  } = useVoiceCommands();
  const videoControls = useVideoPlayer();
  const { audioLevel, isDetecting, startDetection, stopDetection } = useAudioLevel();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const toggleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const [commandResult, setCommandResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Track if we should show the screen-edge animation - DISABLED
  const shouldShowAnimation = false;


  // Manage audio level detection based on voice activity
  useEffect(() => {
    if (shouldShowAnimation && !isDetecting) {
      console.log('🎵 Starting audio level detection for screen animation');
      startDetection();
    } else if (!shouldShowAnimation && isDetecting) {
      console.log('🎵 Stopping audio level detection');
      stopDetection();
    }
  }, [shouldShowAnimation, isDetecting, startDetection, stopDetection]);

  // Process voice commands when they come in
  useEffect(() => {
    if (lastCommand) {
      const processCommand = async () => {
        console.log('Processing voice command:', lastCommand);
        const success = await processVoiceCommand(lastCommand, videoControls);
        if (success) {
          console.log('Voice command executed successfully:', lastCommand);
          setCommandResult({ success: true, message: `Executed: "${lastCommand}"` });
        } else {
          console.log('Voice command not recognized:', lastCommand);
          setCommandResult({ success: false, message: `Not recognized: "${lastCommand}"` });
        }
        
        // Clear result after 4 seconds
        const timer = setTimeout(() => setCommandResult(null), 4000);
        return timer;
      };
      
      const timer = processCommand();
      return () => {
        if (timer instanceof Promise) {
          timer.then(clearTimeout);
        }
      };
    }
  }, [lastCommand, processVoiceCommand, videoControls]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  // Breathing animation for voice listening - reduced scale to stay within boundaries
  useEffect(() => {
    if (isListening || isPersistentMode) {
      const breathingLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, {
            toValue: 1.08,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(breatheAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      breathingLoop.start();
      return () => breathingLoop.stop();
    } else {
      breatheAnim.setValue(1);
    }
  }, [isListening, isPersistentMode, breatheAnim]);

  // Toggle animation for persistent mode
  useEffect(() => {
    Animated.timing(toggleAnim, {
      toValue: isPersistentMode ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isPersistentMode, toggleAnim]);

  // Glow animation for active listening
  useEffect(() => {
    if (isPersistentMode && isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [isPersistentMode, isListening, glowAnim]);


  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;
  const isMediumScreen = width >= 768 && width < 1024;

  return (
    <>
      {/* Apple Intelligence Screen Edge Animation */}
      <AppleIntelligenceAnimation 
        isActive={shouldShowAnimation}
        audioLevel={audioLevel}
        onAnimationComplete={() => {
          console.log('🎨 Screen edge animation completed');
        }}
      />
      
      <View style={[styles.container, isSmallScreen && styles.containerSmall]}>
        {/* Always Listen Toggle */}
      <View style={[styles.persistentContainer, isSmallScreen && styles.persistentContainerSmall]}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            isSmallScreen && styles.toggleButtonSmall
          ]}
          onPress={togglePersistentMode}
          activeOpacity={0.8}
        >
          <Animated.View style={[
            styles.toggleTrack,
            isSmallScreen && styles.toggleTrackSmall,
            {
              backgroundColor: toggleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['rgba(107, 114, 128, 0.3)', '#10b981']
              })
            }
          ]}>
            <Animated.View style={[
              styles.toggleThumb,
              isSmallScreen && styles.toggleThumbSmall,
              {
                transform: [{
                  translateX: toggleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [2, isSmallScreen ? 26 : 32]
                  })
                }]
              }
            ]}>
              {isPersistentMode ? (
                <Power color="#10b981" size={isSmallScreen ? 12 : 14} />
              ) : (
                <PowerOff color="#6b7280" size={isSmallScreen ? 12 : 14} />
              )}
            </Animated.View>
            
            {/* Glow effect when active */}
            {isPersistentMode && isListening && (
              <Animated.View style={[
                styles.toggleGlow,
                isSmallScreen && styles.toggleGlowSmall,
                {
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0.8]
                  }),
                  transform: [{
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.1]
                    })
                  }]
                }
              ]} />
            )}
          </Animated.View>
          
          <View style={styles.toggleLabelContainer}>
            <Text style={[
              styles.toggleLabel,
              isPersistentMode && styles.toggleLabelActive,
              isSmallScreen && styles.toggleLabelSmall
            ]}>
              {t('voice.alwaysListen')}
            </Text>
            <Text style={[
              styles.toggleStatus,
              isSmallScreen && styles.toggleStatusSmall
            ]}>
              {isPersistentMode ? (isListening ? t('common.active') : t('voice.starting')) : t('voice.tapToEnable')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.buttonContainer, isSmallScreen && styles.buttonContainerSmall]}>
        <Animated.View style={[
          styles.buttonWrapper, 
          { 
            transform: [
              { scale: isRecording ? pulseAnim : (isListening || isPersistentMode) ? breatheAnim : 1 }
            ] 
          }
        ]}>
          <TouchableOpacity
            style={[
              styles.button,
              isRecording && styles.recording,
              isProcessing && styles.processing,
              isListening && styles.listening,
              isSmallScreen && styles.buttonSmall,
              isMediumScreen && styles.buttonMedium
            ]}
            onPress={toggleRecording}
            disabled={isProcessing || isPersistentMode}
          >
            <View style={[styles.buttonInner, isSmallScreen && styles.buttonInnerSmall]}>
              {isProcessing ? (
                <ActivityIndicator color="#fff" size={isSmallScreen ? "small" : "large"} />
              ) : isListening ? (
                <Headphones color="#fff" size={isSmallScreen ? 28 : 36} />
              ) : isRecording ? (
                <MicOff color="#fff" size={isSmallScreen ? 28 : 36} />
              ) : (
                <Mic color="#fff" size={isSmallScreen ? 28 : 36} />
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
        
        {(isRecording || isListening) && (
          <View style={[styles.pulseRing, isSmallScreen && styles.pulseRingSmall]}>
            <Animated.View style={[
              styles.pulseRingInner, 
              isSmallScreen && styles.pulseRingInnerSmall,
              { 
                transform: [
                  { scale: isRecording ? pulseAnim : (isListening || isPersistentMode) ? breatheAnim : 1 }
                ] 
              }
            ]} />
          </View>
        )}
      </View>

      <View style={[styles.statusContainer, isSmallScreen && styles.statusContainerSmall]}>
        <Text style={[styles.statusText, isSmallScreen && styles.statusTextSmall]}>
          {isProcessing ? t('voice.processing') : 
           isPersistentMode && isListening ? t('common.alwaysListening') :
           isRecording ? t('voice.listening') :
           error ? error :
           lastCommand ? `${t('voice.lastCommand')}: "${lastCommand}"` :
           videoControls.uri ? (isPersistentMode ? t('voice.voiceCommandsActive') : t('voice.tapToGiveCommand')) : t('voice.loadVideoFirst')}
        </Text>
        
        {lastCommand && (
          <View style={[styles.commandBadge, isSmallScreen && styles.commandBadgeSmall]}>
            <Text style={[styles.commandText, isSmallScreen && styles.commandTextSmall]}>{lastCommand}</Text>
          </View>
        )}
        
        {!videoControls.uri && (
          <Text style={[styles.hintText, isSmallScreen && styles.hintTextSmall]}>
            {t('common.voiceCommandsWorkAfterVideo')}
          </Text>
        )}
        
        {commandResult && (
          <View style={[
            styles.resultBadge, 
            commandResult.success ? styles.successBadge : styles.errorBadge,
            isSmallScreen && styles.resultBadgeSmall
          ]}>
            {commandResult.success ? (
              <CheckCircle color="#10b981" size={isSmallScreen ? 14 : 16} />
            ) : (
              <XCircle color="#ef4444" size={isSmallScreen ? 14 : 16} />
            )}
            <Text style={[
              styles.resultText, 
              commandResult.success ? styles.successText : styles.errorText,
              isSmallScreen && styles.resultTextSmall
            ]}>
              {commandResult.message}
            </Text>
          </View>
        )}
      </View>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  containerSmall: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  persistentContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  persistentContainerSmall: {
    marginBottom: 20,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  toggleButtonSmall: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 12,
  },
  toggleTrack: {
    width: 56,
    height: 32,
    borderRadius: 16,
    position: 'relative',
    justifyContent: 'center',
  },
  toggleTrackSmall: {
    width: 48,
    height: 28,
    borderRadius: 14,
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleThumbSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  toggleGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    backgroundColor: '#10b981',
  },
  toggleGlowSmall: {
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 17,
  },
  toggleLabelContainer: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  toggleLabelSmall: {
    fontSize: 14,
  },
  toggleLabelActive: {
    color: '#10b981',
  },
  toggleStatus: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  toggleStatusSmall: {
    fontSize: 11,
  },
  buttonContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  buttonContainerSmall: {
    marginBottom: 20,
  },
  buttonWrapper: {
    position: 'relative',
    zIndex: 2,
  },
  button: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonSmall: {
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
  },
  buttonMedium: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  buttonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonInnerSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  recording: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  processing: {
    backgroundColor: '#6b7280',
    shadowColor: '#6b7280',
  },
  listening: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
  },
  pulseRing: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    zIndex: 1,
  },
  pulseRingSmall: {
    top: -16,
    left: -16,
    right: -16,
    bottom: -16,
  },
  pulseRingInner: {
    flex: 1,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  pulseRingInnerSmall: {
    borderRadius: 56,
  },
  statusContainer: {
    alignItems: 'center',
    gap: 12,
  },
  statusContainerSmall: {
    gap: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 24,
  },
  statusTextSmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  commandBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  commandBadgeSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  commandText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  commandTextSmall: {
    fontSize: 12,
  },
  hintText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  hintTextSmall: {
    fontSize: 12,
    marginTop: 6,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  resultBadgeSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginTop: 6,
  },
  successBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  errorBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultTextSmall: {
    fontSize: 12,
  },
  successText: {
    color: '#10b981',
  },
  errorText: {
    color: '#ef4444',
  },
});