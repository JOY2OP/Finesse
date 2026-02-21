import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const LoadingBar = () => {
  const position = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in slowly
    Animated.timing(opacity, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Bounce left to right loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(position, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(position, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const BAR_WIDTH = 240;
  const PILL_WIDTH = 72;

  const translateX = position.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BAR_WIDTH - PILL_WIDTH],
  });

  return (
    <Animated.View style={[styles.wrapper, { opacity }]}>
      <View style={[styles.track, { width: BAR_WIDTH }]}>
        <Animated.View
          style={[
            styles.pill,
            { width: PILL_WIDTH, transform: [{ translateX }] },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  pill: {
    height: 3,
    backgroundColor: '#ffffff',
    borderRadius: 999,
  },
});

export default LoadingBar;