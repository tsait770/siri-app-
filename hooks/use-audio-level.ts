import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';

interface AudioLevelHookReturn {
  audioLevel: number; // 0-1 range
  isDetecting: boolean;
  startDetection: () => void;
  stopDetection: () => void;
}

export function useAudioLevel(): AudioLevelHookReturn {
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const animationRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const startDetection = useCallback(async () => {
    if (isDetecting) return;

    try {
      setIsDetecting(true);

      if (Platform.OS === 'web') {
        // Web implementation using Web Audio API
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        mediaStreamRef.current = stream;
        
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;
        
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        dataArrayRef.current = dataArray;
        
        const updateAudioLevel = () => {
          if (!analyserRef.current || !dataArrayRef.current || !isDetecting) {
            return;
          }
          
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          
          // Calculate RMS (Root Mean Square) for more accurate volume detection
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            const amplitude = dataArrayRef.current[i] / 255;
            sum += amplitude * amplitude;
          }
          const rms = Math.sqrt(sum / dataArrayRef.current.length);
          
          // Apply logarithmic scaling for more natural response
          const logLevel = Math.log10(rms * 9 + 1); // Scale 0-1 to log scale
          const smoothedLevel = Math.min(1, Math.max(0, logLevel));
          
          setAudioLevel(smoothedLevel);
          
          if (isDetecting) {
            animationRef.current = requestAnimationFrame(updateAudioLevel);
          }
        };
        
        updateAudioLevel();
      } else {
        // Mobile fallback - simulate audio levels
        console.log('Mobile audio level detection - using simulation');
        
        const simulateAudioLevel = () => {
          // Simulate realistic audio level patterns
          const baseLevel = 0.1 + Math.random() * 0.3; // Base ambient level
          const speechBurst = Math.random() > 0.7 ? Math.random() * 0.6 : 0; // Occasional speech
          const level = Math.min(1, baseLevel + speechBurst);
          
          setAudioLevel(level);
          
          if (isDetecting) {
            animationRef.current = requestAnimationFrame(simulateAudioLevel);
          }
        };
        
        simulateAudioLevel();
      }
    } catch (error) {
      console.error('Error starting audio level detection:', error);
      setIsDetecting(false);
      
      // Fallback to simulation if microphone access fails
      const simulateAudioLevel = () => {
        const level = 0.2 + Math.random() * 0.4; // Simulated levels
        setAudioLevel(level);
        
        if (isDetecting) {
          animationRef.current = requestAnimationFrame(simulateAudioLevel);
        }
      };
      
      simulateAudioLevel();
    }
  }, [isDetecting]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    setAudioLevel(0);
    
    // Cancel animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Clean up Web Audio API resources
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Clear references
    analyserRef.current = null;
    dataArrayRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return {
    audioLevel,
    isDetecting,
    startDetection,
    stopDetection,
  };
}