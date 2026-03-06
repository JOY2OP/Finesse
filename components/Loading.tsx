import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const F_PATH =
  'M 10 95 L 10 5 ' +
  'L 50 5 ' +
  'L 10 5 ' +
  'L 10 52 ' +
  'L 42 52 ' +
  'L 10 52';

const PATH_LENGTH = 281;
const PILL_LENGTH = 60;

const AnimatedPath = Animated.createAnimatedComponent(Path);

const Loading = () => {
  const progress = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [PATH_LENGTH, 0],
  });

  return (
    <Animated.View style={[styles.wrapper, { opacity }]}>
      <Svg
        width={60}
        height={100}
        viewBox="0 0 60 100"
        style={styles.svg}
      >
        {/* Track – faint ghost of the F */}
        <Path
          d={F_PATH}
          stroke="rgba(43, 108, 238, 0.15)"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Animated glowing pill */}
        <AnimatedPath
          d={F_PATH}
          stroke="#2B6CEE"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={`${PILL_LENGTH} ${PATH_LENGTH}`}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    shadowColor: '#2B6CEE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});

export default Loading;
