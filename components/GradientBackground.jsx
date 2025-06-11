import React from 'react';
import { StyleSheet, View } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GradientBackground({ children, style }) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* <LinearGradient
        colors={gradients.background}
        style={[StyleSheet.absoluteFill, style]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      /> */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});