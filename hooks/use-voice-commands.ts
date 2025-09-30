import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useI18n } from './use-i18n';

export interface VoiceCommand {
  id: string;
  key: string;
  customTrigger?: string;
  action: () => void;
}

interface RecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  lastCommand?: string;
  error?: string;
  isListening: boolean;
  isPersistentMode: boolean;
}

export const [VoiceCommandProvider, useVoiceCommands] = createContextHook(() => {
  const { t, language } = useI18n();
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isProcessing: false,
    isListening: false,
    isPersistentMode: false,
  });
  const [customCommands, setCustomCommands] = useState<Record<string, string>>({});
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const persistentRecognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadCustomCommands = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('customCommands');
      if (stored) {
        setCustomCommands(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading custom commands:', error);
    }
  }, []);

  useEffect(() => {
    loadCustomCommands();
  }, [loadCustomCommands]);

  const saveCustomCommand = useCallback(async (commandId: string, trigger: string) => {
    const updated = { ...customCommands, [commandId]: trigger };
    setCustomCommands(updated);
    await AsyncStorage.setItem('customCommands', JSON.stringify(updated));
  }, [customCommands]);

  // Start persistent listening mode
  const startPersistentListening = useCallback(async () => {
    try {
      console.log('Starting persistent listening mode...');
      
      if (Platform.OS === 'web') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (SpeechRecognition) {
          // Stop any existing recognition first
          if (persistentRecognitionRef.current) {
            console.log('Stopping existing persistent recognition');
            persistentRecognitionRef.current.stop();
            persistentRecognitionRef.current = null;
          }
          
          // Clear any existing restart timeout
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
            restartTimeoutRef.current = null;
          }
          
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.lang = language || 'en-US';
          recognition.maxAlternatives = 1;
          
          // Add timeout settings to prevent hanging
          if ('grammars' in recognition) {
            // Some browsers support additional settings
            try {
              (recognition as any).serviceURI = undefined; // Use default service
            } catch {
              // Ignore if not supported
            }
          }

          recognition.onstart = () => {
            console.log('Persistent voice recognition started successfully');
            setState(prev => ({ 
              ...prev, 
              isListening: true,
              isPersistentMode: true,
              error: undefined 
            }));
          };

          recognition.onresult = (event: any) => {
            try {
              const lastResult = event.results[event.results.length - 1];
              if (lastResult.isFinal) {
                const text = lastResult[0].transcript.toLowerCase().trim();
                console.log('Persistent voice command received:', text);
                setState(prev => ({ 
                  ...prev, 
                  lastCommand: text,
                  error: undefined 
                }));
              }
            } catch (error) {
              console.error('Error processing speech result:', error);
            }
          };

          recognition.onerror = (event: any) => {
            console.log('Speech recognition event:', event.error);
            
            // Handle different types of errors
            if (event.error === 'no-speech') {
              console.log('No speech detected - this is normal, continuing to listen...');
              // For no-speech, don't show error or restart - this is expected behavior
              // The recognition will automatically restart via onend handler
              return;
            } else if (event.error === 'audio-capture') {
              console.error('Audio capture error - microphone may not be available');
              setState(prev => ({ 
                ...prev, 
                error: 'Microphone access denied or not available',
                isListening: false,
                isPersistentMode: false
              }));
              return;
            } else if (event.error === 'not-allowed') {
              console.error('Microphone permission denied');
              setState(prev => ({ 
                ...prev, 
                error: 'Microphone permission denied. Please allow microphone access.',
                isListening: false,
                isPersistentMode: false
              }));
              return;
            } else if (event.error === 'network') {
              console.log('Network error - will retry...');
              // Network errors are recoverable, continue listening
            } else if (event.error === 'aborted') {
              console.log('Recognition aborted - likely due to restart');
              // Aborted is normal when we restart recognition
              return;
            } else {
              console.error('Other speech recognition error:', event.error);
              setState(prev => ({ 
                ...prev, 
                error: `Speech recognition error: ${event.error}`,
                isListening: false 
              }));
            }
            
            // For recoverable errors (network, etc.), try to restart after a delay
            if (event.error === 'network') {
              if (restartTimeoutRef.current) {
                clearTimeout(restartTimeoutRef.current);
              }
              restartTimeoutRef.current = setTimeout(() => {
                setState(prev => {
                  if (prev.isPersistentMode) {
                    console.log('Restarting after network error...');
                    startPersistentListening();
                  }
                  return prev;
                });
              }, 3000); // Longer delay for network recovery
            }
          };

          recognition.onend = () => {
            console.log('Recognition session ended naturally');
            
            // Clear any existing restart timeout
            if (restartTimeoutRef.current) {
              clearTimeout(restartTimeoutRef.current);
            }
            
            // Auto-restart if still in persistent mode and not manually stopped
            setState(prev => {
              if (prev.isPersistentMode && persistentRecognitionRef.current) {
                console.log('Auto-restarting recognition...');
                // Restart immediately for normal end events
                restartTimeoutRef.current = setTimeout(() => {
                  if (prev.isPersistentMode) {
                    startPersistentListening();
                  }
                }, 500); // Shorter delay for normal restarts
              } else {
                console.log('Not restarting - persistent mode disabled or manually stopped');
              }
              return prev;
            });
          };

          console.log('Starting speech recognition...');
          recognition.start();
          persistentRecognitionRef.current = recognition;
        } else {
          console.error('Speech Recognition not supported in this browser');
          setState(prev => ({ 
            ...prev, 
            error: 'Speech Recognition not supported in this browser. Please use Chrome, Edge, or Safari.',
            isPersistentMode: false
          }));
        }
      } else {
        // For mobile, we'll implement a different approach
        console.log('Mobile persistent listening - using alternative approach');
        setState(prev => ({ 
          ...prev, 
          isPersistentMode: true,
          isListening: true,
          error: undefined
        }));
        
        // TODO: Implement mobile-specific persistent listening
        // This could use expo-speech or other mobile-specific APIs
      }
    } catch (error) {
      console.error('Failed to start persistent listening:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to start persistent listening mode',
        isPersistentMode: false,
        isListening: false
      }));
    }
  }, [language]);

  const stopPersistentListening = useCallback(() => {
    console.log('Stopping persistent listening mode...');
    
    // Clear any restart timeouts
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    // Stop the recognition
    if (persistentRecognitionRef.current) {
      try {
        persistentRecognitionRef.current.stop();
        persistentRecognitionRef.current = null;
        console.log('Persistent recognition stopped successfully');
      } catch (error) {
        console.error('Error stopping persistent recognition:', error);
      }
    }
    
    // Update state
    setState(prev => ({ 
      ...prev, 
      isListening: false,
      isPersistentMode: false,
      error: undefined
    }));
    
    console.log('Persistent listening stopped completely');
  }, []);

  const togglePersistentMode = useCallback(async () => {
    console.log('Toggling persistent mode. Current state:', state.isPersistentMode);
    
    if (state.isPersistentMode) {
      stopPersistentListening();
    } else {
      // Request microphone permission first on web
      if (Platform.OS === 'web') {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('Microphone permission granted');
        } catch (error) {
          console.error('Microphone permission denied:', error);
          setState(prev => ({ 
            ...prev, 
            error: 'Microphone permission is required for voice commands'
          }));
          return;
        }
      }
      
      await startPersistentListening();
    }
  }, [state.isPersistentMode, startPersistentListening, stopPersistentListening]);

  const startRecording = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        // Web Speech Recognition API
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
          // Fallback to MediaRecorder for web
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
          };

          mediaRecorder.start();
          mediaRecorderRef.current = mediaRecorder;
        } else {
          // Use Web Speech Recognition
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = language;

          recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript.toLowerCase().trim();
            setState(prev => ({ 
              ...prev, 
              isRecording: false,
              lastCommand: text,
              error: undefined 
            }));
          };

          recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setState(prev => ({ 
              ...prev, 
              isRecording: false,
              error: t('voice.error') 
            }));
          };

          recognition.start();
          recognitionRef.current = recognition;
        }
      } else {
        // Mobile: Use MediaRecorder fallback
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
      }

      setState(prev => ({ ...prev, isRecording: true, error: undefined }));
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      setState(prev => ({ ...prev, error: t('voice.error') }));
    }
  }, [t, language]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      setState(prev => ({ ...prev, isRecording: false, isProcessing: true }));

      // If using Web Speech Recognition, just stop it
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setState(prev => ({ ...prev, isProcessing: false }));
        return null; // Result will come from onresult callback
      }

      let audioBlob: Blob | null = null;

      // Stop MediaRecorder recording
      if (mediaRecorderRef.current) {
        await new Promise<void>((resolve) => {
          mediaRecorderRef.current!.onstop = () => resolve();
          mediaRecorderRef.current!.stop();
        });

        // Stop all tracks
        const stream = mediaRecorderRef.current.stream;
        stream.getTracks().forEach(track => track.stop());

        audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        mediaRecorderRef.current = null;
      }

      if (!audioBlob) {
        setState(prev => ({ ...prev, isProcessing: false }));
        return null;
      }

      // Send to speech-to-text API
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);

      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Speech recognition API error:', response.status, errorText);
        throw new Error(`Speech recognition failed: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('STT API response:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse STT response as JSON:', parseError);
        console.error('Response text:', responseText);
        throw new Error('Invalid response from speech recognition service');
      }
      
      const text = result.text?.toLowerCase().trim();

      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        lastCommand: text,
        error: undefined 
      }));

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      return text;
    } catch (error) {
      console.error('Failed to process recording:', error);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: t('voice.error') 
      }));
      
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      return null;
    }
  }, [t, language]);

  const toggleRecording = useCallback(async () => {
    if (state.isRecording) {
      return await stopRecording();
    } else {
      await startRecording();
      return null;
    }
  }, [state.isRecording, stopRecording, startRecording]);

  // Add Siri integration for iOS
  const setupSiriIntegration = useCallback(() => {
    if (Platform.OS === 'ios') {
      // This would require native iOS integration with SiriKit
      // For now, we'll use the standard voice recognition
      console.log('Siri integration would be set up here for iOS');
    }
  }, []);

  useEffect(() => {
    setupSiriIntegration();
  }, [setupSiriIntegration]);

  // Listen for voice command results and show feedback
  useEffect(() => {
    if (state.lastCommand) {
      console.log('New voice command received:', state.lastCommand);
      // Clear the command after a delay to reset the UI
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, lastCommand: undefined }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.lastCommand]);

  // Voice command processing
  const executeCommand = useCallback(async (commandId: string, videoControls: any) => {
    try {
      console.log('Executing command:', commandId);
      
      if (!videoControls.uri) {
        console.log('No video loaded, cannot execute command');
        return false;
      }
      
      if (!videoControls.player) {
        console.log('No video player available, cannot execute command');
        return false;
      }
      
      switch (commandId) {
        case 'play':
          await videoControls.play();
          break;
        case 'pause':
          await videoControls.pause();
          break;
        case 'stop':
          await videoControls.stop();
          break;
        case 'forward10':
          await videoControls.seek(10);
          break;
        case 'forward20':
          await videoControls.seek(20);
          break;
        case 'forward30':
          await videoControls.seek(30);
          break;
        case 'backward10':
          await videoControls.seek(-10);
          break;
        case 'backward20':
          await videoControls.seek(-20);
          break;
        case 'backward30':
          await videoControls.seek(-30);
          break;
        case 'volumeUp':
          await videoControls.setVolume(Math.min(1, videoControls.volume + 0.1));
          break;
        case 'volumeDown':
          await videoControls.setVolume(Math.max(0, videoControls.volume - 0.1));
          break;
        case 'volumeMax':
          await videoControls.setVolume(1);
          break;
        case 'mute':
          await videoControls.setVolume(0);
          break;
        case 'unmute':
          const currentVolume = videoControls.volume || 0;
          await videoControls.setVolume(currentVolume > 0 ? currentVolume : 1);
          break;
        case 'speed05':
          await videoControls.setSpeed(0.5);
          break;
        case 'speed1':
        case 'speed10':
          await videoControls.setSpeed(1);
          break;
        case 'speed125':
          await videoControls.setSpeed(1.25);
          break;
        case 'speed15':
          await videoControls.setSpeed(1.5);
          break;
        case 'speed2':
          await videoControls.setSpeed(2);
          break;
        case 'fullscreen':
        case 'exitFullscreen':
          videoControls.toggleFullscreen();
          break;
        case 'bookmark':
          await videoControls.addBookmark();
          break;
        case 'favorite':
          await videoControls.toggleFavorite();
          break;
        default:
          console.log('Unknown command:', commandId);
          return false;
      }
      
      console.log('Command executed successfully:', commandId);
      return true;
    } catch (error) {
      console.error('Error executing command:', error);
      return false;
    }
  }, []);

  const processVoiceCommand = useCallback(async (text: string, videoControls: any) => {
    if (!text) return false;

    const command = text.toLowerCase().trim();
    console.log('Processing voice command:', command);

    // Check custom commands first
    const customCommand = Object.entries(customCommands).find(([_, trigger]) => 
      command.includes(trigger.toLowerCase())
    );
    
    if (customCommand) {
      const [commandId] = customCommand;
      return await executeCommand(commandId, videoControls);
    }

    // Built-in commands in multiple languages
    const commands = {
      // Play control
      play: ['play', '播放', '再生', 'reproducir', 'jouer', 'spielen', 'воспроизвести', 'تشغيل', '재생', 'start'],
      pause: ['pause', '暫停', '一時停止', 'pausar', 'pause', 'pausieren', 'пауза', 'إيقاف مؤقت', '일시정지'],
      stop: ['stop', '停止', '停止', 'parar', 'arrêter', 'stoppen', 'остановить', 'توقف', '정지'],
      
      // Seek control
      forward10: ['forward 10', 'skip 10', 'forward ten', '快轉10秒', '10秒進む', 'adelantar 10', 'avancer 10', 'вперед 10', 'تقديم 10', '10초 앞으로'],
      forward20: ['forward 20', 'skip 20', 'forward twenty', '快轉20秒', '20秒進む', 'adelantar 20', 'avancer 20', 'вперед 20', 'تقديم 20', '20초 앞으로'],
      forward30: ['forward 30', 'skip 30', 'forward thirty', '快轉30秒', '30秒進む', 'adelantar 30', 'avancer 30', 'вперед 30', 'تقديم 30', '30초 앞으로'],
      backward10: ['backward 10', 'back 10', 'rewind 10', '倒轉10秒', '10秒戻る', 'retroceder 10', 'reculer 10', 'назад 10', 'تراجع 10', '10초 뒤로'],
      backward20: ['backward 20', 'back 20', 'rewind 20', '倒轉20秒', '20秒戻る', 'retroceder 20', 'reculer 20', 'назад 20', 'تراجع 20', '20초 뒤로'],
      backward30: ['backward 30', 'back 30', 'rewind 30', '倒轉30秒', '30秒戻る', 'retroceder 30', 'reculer 30', 'назад 30', 'تراجع 30', '30초 뒤로'],
      
      // Volume control
      volumeUp: ['volume up', 'louder', 'increase volume', '音量調高', '音量上げる', 'subir volumen', 'augmenter volume', 'громче', 'رفع الصوت', '볼륨 올리기'],
      volumeDown: ['volume down', 'quieter', 'decrease volume', '音量調低', '音量下げる', 'bajar volumen', 'baisser volume', 'тише', 'خفض الصوت', '볼륨 내리기'],
      volumeMax: ['max volume', 'volume max', 'maximum volume', '音量最大', '最大音量', 'volumen máximo', 'volume maximum', 'максимальная громкость', 'أقصى صوت', '최대 볼륨'],
      mute: ['mute', '靜音', 'ミュート', 'silenciar', 'muet', 'stumm', 'без звука', 'كتم الصوت', '음소거'],
      unmute: ['unmute', '解除靜音', 'ミュート解除', 'activar sonido', 'activer son', 'звук включить', 'إلغاء كتم الصوت', '음소거 해제'],
      
      // Speed control
      speed05: ['0.5 speed', 'half speed', 'slow', '0.5倍速', '0.5倍速', '0.5 velocidad', '0.5 vitesse', '0.5 скорость', 'سرعة 0.5', '0.5배속'],
      speed1: ['normal speed', '1x speed', '1 speed', 'regular speed', '正常速度', '通常速度', 'velocidad normal', 'vitesse normale', 'обычная скорость', 'السرعة العادية', '정상 속도'],
      speed125: ['1.25 speed', '1.25x speed', '1.25倍速', '1.25倍速', '1.25 velocidad', '1.25 vitesse', '1.25 скорость', 'سرعة 1.25', '1.25배속'],
      speed15: ['1.5 speed', '1.5x speed', 'fast', '1.5倍速', '1.5倍速', '1.5 velocidad', '1.5 vitesse', '1.5 скорость', 'سرعة 1.5', '1.5배속'],
      speed2: ['2 speed', '2x speed', 'double speed', '2倍速', '2倍速', '2 velocidad', '2 vitesse', '2 скорость', 'سرعة 2', '2배속'],
      
      // Fullscreen
      fullscreen: ['fullscreen', 'full screen', 'enter fullscreen', '全螢幕', 'フルスクリーン', 'pantalla completa', 'plein écran', 'полный экран', 'ملء الشاشة', '전체화면'],
      exitFullscreen: ['exit fullscreen', 'leave fullscreen', '離開全螢幕', 'フルスクリーン終了', 'salir pantalla completa', 'quitter plein écran', 'выйти из полного экрана', 'الخروج من ملء الشاشة', '전체화면 나가기'],
      
      // Additional features
      bookmark: ['bookmark', 'add bookmark', 'mark', '書籤', 'ブックマーク', 'marcador', 'marque-page', 'закладка', 'إشارة مرجعية', '북마크'],
      favorite: ['favorite', 'add favorite', 'like', '最愛', 'お気に入り', 'favorito', 'favori', 'избранное', 'مفضل', '즐겨찾기'],
    };

    // Find matching command
    for (const [action, triggers] of Object.entries(commands)) {
      if (triggers.some(trigger => command.includes(trigger.toLowerCase()))) {
        return await executeCommand(action, videoControls);
      }
    }

    console.log('No matching command found for:', command);
    return false;
  }, [customCommands, executeCommand]);



  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPersistentListening();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [stopPersistentListening]);

  return useMemo(() => ({
    ...state,
    customCommands,
    saveCustomCommand,
    startRecording,
    stopRecording,
    toggleRecording,
    processVoiceCommand,
    executeCommand,
    startPersistentListening,
    stopPersistentListening,
    togglePersistentMode,
  }), [state, customCommands, saveCustomCommand, startRecording, stopRecording, toggleRecording, processVoiceCommand, executeCommand, startPersistentListening, stopPersistentListening, togglePersistentMode]);
});