import React, { useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Animated,
  Platform,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/use-theme';

interface AppleIntelligenceAnimationProps {
  isActive: boolean;
  audioLevel?: number; // 0-1 range for audio level
  onAnimationComplete?: () => void;
}

export function AppleIntelligenceAnimation({ 
  isActive, 
  audioLevel = 0.3,
  onAnimationComplete 
}: AppleIntelligenceAnimationProps) {
  const { theme } = useTheme();
  
  // Get screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');
  
  // iPhone 16 Pro dimensions (393x852 points)
  // Scale animation to current device while maintaining proportions
  const iphone16ProWidth = 393;
  const iphone16ProHeight = 852;
  
  // Use full screen dimensions for maximum coverage
  const animationWidth = screenWidth;
  const animationHeight = screenHeight;
  
  // Animation values for screen edge effects only
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const topEdgeAnim = useRef(new Animated.Value(0)).current;
  const rightEdgeAnim = useRef(new Animated.Value(0)).current;
  const bottomEdgeAnim = useRef(new Animated.Value(0)).current;
  const leftEdgeAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const colorShiftAnim = useRef(new Animated.Value(0)).current;
  
  // Animation loop reference
  const animationLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  
  // Get dynamic colors based on audio level and theme - Apple Intelligence style
  const getEdgeColors = useCallback(() => {
    const intensity = Math.max(0.1, audioLevel);
    const isDark = theme.mode === 'dark';
    
    // Apple Intelligence uses blue-purple-pink gradient with breathing effect
    if (intensity < 0.3) {
      // Quiet - soft blue
      return {
        primary: isDark ? `rgba(0, 122, 255, ${0.3 + intensity * 0.4})` : `rgba(0, 122, 255, ${0.4 + intensity * 0.4})`,
        secondary: isDark ? `rgba(88, 86, 214, ${0.2 + intensity * 0.3})` : `rgba(88, 86, 214, ${0.3 + intensity * 0.3})`,
        accent: isDark ? `rgba(175, 82, 222, ${0.1 + intensity * 0.2})` : `rgba(175, 82, 222, ${0.2 + intensity * 0.2})`
      };
    } else if (intensity < 0.6) {
      // Medium - blue to purple
      return {
        primary: isDark ? `rgba(88, 86, 214, ${0.4 + intensity * 0.4})` : `rgba(88, 86, 214, ${0.5 + intensity * 0.4})`,
        secondary: isDark ? `rgba(175, 82, 222, ${0.3 + intensity * 0.3})` : `rgba(175, 82, 222, ${0.4 + intensity * 0.3})`,
        accent: isDark ? `rgba(255, 45, 85, ${0.2 + intensity * 0.2})` : `rgba(255, 45, 85, ${0.3 + intensity * 0.2})`
      };
    } else {
      // Loud - full spectrum with pink
      return {
        primary: isDark ? `rgba(175, 82, 222, ${0.5 + intensity * 0.4})` : `rgba(175, 82, 222, ${0.6 + intensity * 0.4})`,
        secondary: isDark ? `rgba(255, 45, 85, ${0.4 + intensity * 0.3})` : `rgba(255, 45, 85, ${0.5 + intensity * 0.3})`,
        accent: isDark ? `rgba(255, 149, 0, ${0.3 + intensity * 0.2})` : `rgba(255, 149, 0, ${0.4 + intensity * 0.2})`
      };
    }
  }, [audioLevel, theme.mode]);
  
  // Start breathing animation that responds to audio level - Apple Intelligence style
  const startBreathingAnimation = useCallback(() => {
    // Breathing animation with audio-responsive intensity
    const breathingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1 + (audioLevel * 0.6), // More pronounced breathing
          duration: Math.max(600, 1200 - (audioLevel * 600)), // Faster with more audio
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: Math.max(600, 1200 - (audioLevel * 600)),
          useNativeDriver: true,
        })
      ])
    );
    
    // Color shifting animation for dynamic effect
    const colorShiftLoop = Animated.loop(
      Animated.timing(colorShiftAnim, {
        toValue: 1,
        duration: 4000 - (audioLevel * 1000), // Faster color shifts with audio
        useNativeDriver: true,
      })
    );
    
    breathingLoop.start();
    colorShiftLoop.start();
    
    animationLoopRef.current = breathingLoop;
    
    return () => {
      breathingLoop.stop();
      colorShiftLoop.stop();
    };
  }, [audioLevel, breatheAnim, colorShiftAnim]);
  
  // Start edge animations
  const startEdgeAnimations = useCallback(() => {
    const edgeAnimations = Animated.stagger(100, [
      Animated.timing(topEdgeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rightEdgeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(bottomEdgeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(leftEdgeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]);
    
    edgeAnimations.start();
    return startBreathingAnimation();
  }, [topEdgeAnim, rightEdgeAnim, bottomEdgeAnim, leftEdgeAnim, startBreathingAnimation]);
  
  const stopEdgeAnimations = useCallback(() => {
    animationLoopRef.current?.stop();
    
    Animated.parallel([
      Animated.timing(topEdgeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rightEdgeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(bottomEdgeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(leftEdgeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [topEdgeAnim, rightEdgeAnim, bottomEdgeAnim, leftEdgeAnim]);

  // Main animation controller
  useEffect(() => {
    if (isActive) {
      console.log('🎨 Starting Apple Intelligence edge animation');
      
      // Start entrance animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Start edge animations
      const cleanup = startEdgeAnimations();
      return cleanup;
    } else {
      console.log('🎨 Stopping Apple Intelligence edge animation');
      
      // Exit animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onAnimationComplete?.();
      });
      
      stopEdgeAnimations();
    }
  }, [isActive, fadeAnim, startEdgeAnimations, stopEdgeAnimations, onAnimationComplete]);
  
  // Audio level responsive breathing
  useEffect(() => {
    if (isActive && audioLevel > 0) {
      console.log('🎵 Audio level changed:', audioLevel, '- updating breathing animation');
      // The breathing animation automatically responds to audioLevel changes
      // through the startBreathingAnimation callback dependency
    }
  }, [audioLevel, isActive]);
  
  // Get edge thickness based on audio level - optimized for screen edges
  const getEdgeThickness = useCallback(() => {
    const baseThickness = Math.max(6, audioLevel * 24); // 6-24px thickness for better visibility
    const screenScale = Math.min(screenWidth / iphone16ProWidth, screenHeight / iphone16ProHeight);
    return Math.max(6, baseThickness * screenScale); // Ensure minimum visibility
  }, [audioLevel, screenWidth, screenHeight, iphone16ProWidth, iphone16ProHeight]);
  
  const colors = getEdgeColors();
  const edgeThickness = getEdgeThickness();
  
  // Don't render if not active
  if (!isActive) {
    return null;
  }
  
  // Disable on web for performance
  if (Platform.OS === 'web') {
    return null;
  }
  

  
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          width: animationWidth,
          height: animationHeight,
          opacity: fadeAnim,
        }
      ]}
      pointerEvents="none"
    >
      {/* Top Edge - Full width with Apple Intelligence gradient */}
      <Animated.View
        style={[
          styles.topEdge,
          {
            width: animationWidth,
            height: edgeThickness,
            opacity: topEdgeAnim,
            transform: [{ 
              scaleY: breatheAnim.interpolate({
                inputRange: [1, 1.6],
                outputRange: [1, 1 + (audioLevel * 0.8)]
              })
            }]
          }
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            colors.primary,
            colors.secondary,
            colors.accent || colors.primary,
            colors.secondary,
            colors.primary,
            'transparent'
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientFill}
        />
      </Animated.View>
      
      {/* Right Edge - Full height with Apple Intelligence gradient */}
      <Animated.View
        style={[
          styles.rightEdge,
          {
            width: edgeThickness,
            height: animationHeight,
            opacity: rightEdgeAnim,
            transform: [{ 
              scaleX: breatheAnim.interpolate({
                inputRange: [1, 1.6],
                outputRange: [1, 1 + (audioLevel * 0.8)]
              })
            }]
          }
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            colors.primary,
            colors.secondary,
            colors.accent || colors.primary,
            colors.secondary,
            colors.primary,
            'transparent'
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradientFill}
        />
      </Animated.View>
      
      {/* Bottom Edge - Full width with Apple Intelligence gradient */}
      <Animated.View
        style={[
          styles.bottomEdge,
          {
            width: animationWidth,
            height: edgeThickness,
            opacity: bottomEdgeAnim,
            transform: [{ 
              scaleY: breatheAnim.interpolate({
                inputRange: [1, 1.6],
                outputRange: [1, 1 + (audioLevel * 0.8)]
              })
            }]
          }
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            colors.secondary,
            colors.accent || colors.secondary,
            colors.primary,
            colors.accent || colors.secondary,
            colors.secondary,
            'transparent'
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientFill}
        />
      </Animated.View>
      
      {/* Left Edge - Full height with Apple Intelligence gradient */}
      <Animated.View
        style={[
          styles.leftEdge,
          {
            width: edgeThickness,
            height: animationHeight,
            opacity: leftEdgeAnim,
            transform: [{ 
              scaleX: breatheAnim.interpolate({
                inputRange: [1, 1.6],
                outputRange: [1, 1 + (audioLevel * 0.8)]
              })
            }]
          }
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            colors.secondary,
            colors.accent || colors.secondary,
            colors.primary,
            colors.accent || colors.secondary,
            colors.secondary,
            'transparent'
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradientFill}
        />
      </Animated.View>
      
      {/* Corner Glow Effects - Apple Intelligence style */}
      <Animated.View style={[
        styles.cornerGlow, 
        styles.topLeft,
        {
          width: Math.max(40, 80 * (screenWidth / iphone16ProWidth)),
          height: Math.max(40, 80 * (screenHeight / iphone16ProHeight)),
          opacity: topEdgeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.6]
          }),
          backgroundColor: colors.primary,
          transform: [{ 
            scale: breatheAnim.interpolate({
              inputRange: [1, 1.6],
              outputRange: [1, 1 + (audioLevel * 0.6)]
            })
          }]
        }
      ]} />
      
      <Animated.View style={[
        styles.cornerGlow, 
        styles.topRight,
        {
          width: Math.max(40, 80 * (screenWidth / iphone16ProWidth)),
          height: Math.max(40, 80 * (screenHeight / iphone16ProHeight)),
          opacity: rightEdgeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.6]
          }),
          backgroundColor: colors.secondary,
          transform: [{ 
            scale: breatheAnim.interpolate({
              inputRange: [1, 1.6],
              outputRange: [1, 1 + (audioLevel * 0.6)]
            })
          }]
        }
      ]} />
      
      <Animated.View style={[
        styles.cornerGlow, 
        styles.bottomLeft,
        {
          width: Math.max(40, 80 * (screenWidth / iphone16ProWidth)),
          height: Math.max(40, 80 * (screenHeight / iphone16ProHeight)),
          opacity: leftEdgeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.6]
          }),
          backgroundColor: colors.accent || colors.secondary,
          transform: [{ 
            scale: breatheAnim.interpolate({
              inputRange: [1, 1.6],
              outputRange: [1, 1 + (audioLevel * 0.6)]
            })
          }]
        }
      ]} />
      
      <Animated.View style={[
        styles.cornerGlow, 
        styles.bottomRight,
        {
          width: Math.max(40, 80 * (screenWidth / iphone16ProWidth)),
          height: Math.max(40, 80 * (screenHeight / iphone16ProHeight)),
          opacity: bottomEdgeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.6]
          }),
          backgroundColor: colors.primary,
          transform: [{ 
            scale: breatheAnim.interpolate({
              inputRange: [1, 1.6],
              outputRange: [1, 1 + (audioLevel * 0.6)]
            })
          }]
        }
      ]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1000,
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  rightEdge: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  bottomEdge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  leftEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gradientFill: {
    flex: 1,
  },
  cornerGlow: {
    position: 'absolute',
    borderRadius: 40,
    shadowRadius: 20,
    shadowOpacity: 0.8,
    elevation: 10,
  },
  topLeft: {
    top: 60,
    left: 20,
  },
  topRight: {
    top: 60,
    right: 20,
  },
  bottomLeft: {
    bottom: 100,
    left: 20,
  },
  bottomRight: {
    bottom: 100,
    right: 20,
  },
});