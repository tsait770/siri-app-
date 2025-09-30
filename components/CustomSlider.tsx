import React, { useState, useRef, useCallback } from 'react';
import { View, PanResponder, StyleSheet, Animated, Platform } from 'react-native';

interface CustomSliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  onValueChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  style?: any;
  disabled?: boolean;
}

export const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  minimumValue = 0,
  maximumValue = 1,
  onValueChange,
  onSlidingComplete,
  minimumTrackTintColor = '#10b981',
  maximumTrackTintColor = 'rgba(255, 255, 255, 0.3)',
  thumbTintColor = '#10b981',
  style,
  disabled = false,
}) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const sliderRef = useRef<View>(null);

  // Calculate the position percentage
  const getPercentage = useCallback((val: number) => {
    const range = maximumValue - minimumValue;
    return range > 0 ? Math.max(0, Math.min(1, (val - minimumValue) / range)) : 0;
  }, [minimumValue, maximumValue]);

  // Calculate value from position
  const getValueFromPosition = useCallback((position: number) => {
    const percentage = Math.max(0, Math.min(1, position / sliderWidth));
    const range = maximumValue - minimumValue;
    return minimumValue + (percentage * range);
  }, [sliderWidth, minimumValue, maximumValue]);

  // Update animated value when value prop changes
  React.useEffect(() => {
    if (!isDragging && sliderWidth > 0) {
      const percentage = getPercentage(value);
      Animated.timing(animatedValue, {
        toValue: percentage * sliderWidth,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  }, [value, sliderWidth, isDragging, getPercentage, animatedValue]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: (evt) => {
      if (disabled) return;
      setIsDragging(true);
      const locationX = evt.nativeEvent.locationX;
      const newValue = getValueFromPosition(locationX);
      animatedValue.setValue(locationX);
      onValueChange?.(newValue);
    },
    onPanResponderMove: (evt, gestureState) => {
      if (disabled) return;
      const locationX = Math.max(0, Math.min(sliderWidth, gestureState.moveX - (evt.nativeEvent.pageX - evt.nativeEvent.locationX)));
      const newValue = getValueFromPosition(locationX);
      animatedValue.setValue(locationX);
      onValueChange?.(newValue);
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (disabled) return;
      setIsDragging(false);
      const locationX = Math.max(0, Math.min(sliderWidth, gestureState.moveX - (evt.nativeEvent.pageX - evt.nativeEvent.locationX)));
      const newValue = getValueFromPosition(locationX);
      onSlidingComplete?.(newValue);
    },
  });

  // Web-specific mouse handlers
  const webHandlers = Platform.OS === 'web' ? {
    onMouseDown: (event: any) => {
      if (disabled) return;
      event.preventDefault();
      setIsDragging(true);
      const rect = event.currentTarget.getBoundingClientRect();
      const locationX = Math.max(0, Math.min(sliderWidth, event.clientX - rect.left));
      const newValue = getValueFromPosition(locationX);
      animatedValue.setValue(locationX);
      onValueChange?.(newValue);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const moveLocationX = Math.max(0, Math.min(sliderWidth, moveEvent.clientX - rect.left));
        const moveNewValue = getValueFromPosition(moveLocationX);
        animatedValue.setValue(moveLocationX);
        onValueChange?.(moveNewValue);
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        setIsDragging(false);
        const upLocationX = Math.max(0, Math.min(sliderWidth, upEvent.clientX - rect.left));
        const upNewValue = getValueFromPosition(upLocationX);
        onSlidingComplete?.(upNewValue);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
  } : {};

  const percentage = getPercentage(value);

  return (
    <View
      style={[styles.container, style]}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setSliderWidth(width - 20); // Account for thumb size
      }}
    >
      <View
        ref={sliderRef}
        style={styles.track}
        {...panResponder.panHandlers}
        {...webHandlers}
      >
        {/* Track background */}
        <View style={[styles.trackBackground, { backgroundColor: maximumTrackTintColor }]} />
        
        {/* Minimum track (filled portion) */}
        <View
          style={[
            styles.minimumTrack,
            {
              backgroundColor: minimumTrackTintColor,
              width: `${percentage * 100}%`,
            },
          ]}
        />
        
        {/* Thumb */}
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: thumbTintColor,
              transform: [{ translateX: animatedValue }],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  track: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  trackBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
  },
  minimumTrack: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    top: -8,
    marginLeft: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});