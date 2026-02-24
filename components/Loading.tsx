import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * Finesse – F-shaped loader
 *
 * The letter F is drawn as a single continuous stroke path:
 *   Start bottom-left → up the spine → right along top bar →
 *   back to spine → right along middle bar → back to spine
 *
 * A glowing pill (stroke-dashoffset) travels the full outline.
 * We drive it with Animated + a JS-side interpolation written
 * into the SVG strokeDashoffset prop via AnimatedComponent.
 */

// ─── F path geometry (viewBox 0 0 60 100) ───────────────────
//  The stroke traces the skeleton of F, not the filled outline.
//  This gives us a clean single-stroke path to animate along.
//
//  M 10 95        – bottom of spine
//  L 10 5         – up to top-left
//  L 50 5         – top bar rightward
//  M 10 5         – back to spine top  (pen-up trick via two Ms
//  M 10 52        – mid-point on spine
//  L 42 52        – middle bar rightward
//
//  But SVG dashoffset needs ONE continuous path, so we fold the
//  pen-lifts into the path with zero-length moves (same coord).
//  Total path length ≈ 90 + 40 + 0 + 0 + 32 = 162 px (approx)

const F_PATH =
  // Spine: bottom → top (90 units tall)
  'M 10 95 L 10 5 ' +
  // Top bar: left → right (40 units)
  'L 50 5 ' +
  // Back to spine at top (40 units back – hidden by dash gap)
  'L 10 5 ' +
  // Down spine to mid (47 units)
  'L 10 52 ' +
  // Middle bar: left → right (32 units)
  'L 42 52 ' +
  // Back to spine at mid (32 units back)
  'L 10 52';

// Approximate total stroke length for dasharray.
// Measured: spine=90, topBar=40, return=40, downToMid=47, midBar=32, return=32 → 281
const PATH_LENGTH = 281;
const PILL_LENGTH = 60; // how long the glowing segment appears

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
          useNativeDriver: false, // SVG props can't use native driver
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

  // The pill travels from offset=PATH_LENGTH (invisible) → offset=0 (fully drawn)
  // We show only PILL_LENGTH of stroke, rest is gap.
  // dasharray: [PILL_LENGTH, PATH_LENGTH - PILL_LENGTH]
  // dashoffset: travels from PATH_LENGTH → 0 (forward pass) and back
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
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Animated glowing pill */}
        <AnimatedPath
          d={F_PATH}
          stroke="#ffffff"
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
    // Subtle glow using shadow on the wrapper view
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
});

export default Loading;