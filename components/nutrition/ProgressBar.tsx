import React, { useEffect, useRef, memo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export interface ProgressBarProps {
  percentage: number; // 0–100
  color: string;
  size?: 'small' | 'large';
  children?: React.ReactNode;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  color,
  size = 'large',
  children,
}) => {
  // ---- sizing ----
  const containerSize = size === 'large' ? 120 : 80;
  const strokeWidth = size === 'large' ? 8 : 6;
  const radius = (containerSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // ---- animation ----
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 600,
      useNativeDriver: false, // SVG strokeDashoffset needs JS
    }).start();
  }, [percentage]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View
      style={[
        styles.container,
        { width: containerSize, height: containerSize },
      ]}
    >
      <Svg width={containerSize} height={containerSize}>
        {/* Background Circle */}
        <Circle
          cx={containerSize / 2}
          cy={containerSize / 2}
          r={radius}
          stroke={`${color}20`}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress Circle */}
        <AnimatedCircle
          cx={containerSize / 2}
          cy={containerSize / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          originX={containerSize / 2}
          originY={containerSize / 2}
        />
      </Svg>

      {/* Center Content */}
      <View style={styles.centerContent}>{children}</View>
    </View>
  );
};

export default ProgressBar;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
