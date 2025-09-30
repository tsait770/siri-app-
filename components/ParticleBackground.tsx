import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  size: number;
  duration: number;
}

export function ParticleBackground() {
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    // Create particles
    for (let i = 0; i < 20; i++) {
      const particle: Particle = {
        x: new Animated.Value(Math.random() * width),
        y: new Animated.Value(Math.random() * height),
        size: Math.random() * 4 + 2,
        duration: Math.random() * 20000 + 10000,
      };

      particles.current.push(particle);

      // Animate particle
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(particle.x, {
              toValue: Math.random() * width,
              duration: particle.duration,
              useNativeDriver: true,
            }),
            Animated.timing(particle.x, {
              toValue: Math.random() * width,
              duration: particle.duration,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(particle.y, {
              toValue: Math.random() * height,
              duration: particle.duration * 1.5,
              useNativeDriver: true,
            }),
            Animated.timing(particle.y, {
              toValue: Math.random() * height,
              duration: particle.duration * 1.5,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
});