import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  FadeInLeft,
  FadeInRight,
} from 'react-native-reanimated';
import { colors, spacing, fontSizes } from '@/constants/theme';

const AnimatedView = Animated.createAnimatedComponent(View);

export default function ChatMessage({ message, isLast }) {
  const isBot = message.sender === 'bot';
  const isError = message.isError;
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  
  useEffect(() => {
    // Animate new messages
    if (isLast) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withTiming(0, { duration: 400 });
    } else {
      opacity.value = 1;
      translateY.value = 0;
    }
  }, [isLast]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });
  
  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <AnimatedView 
      style={[
        styles.container, 
        isBot ? styles.botContainer : styles.userContainer,
        isLast ? animatedStyle : null,
      ]}
      entering={isBot ? FadeInLeft.duration(400) : FadeInRight.duration(400)}
    >
      <View style={[
        styles.bubble, 
        isBot ? styles.botBubble : styles.userBubble,
        isError && styles.errorBubble
      ]}>
        <Text style={[
          styles.text, 
          isBot ? styles.botText : styles.userText,
          isError && styles.errorText
        ]}>
          {message.text}
        </Text>
      </View>
      <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    marginBottom: spacing.md,
  },
  botContainer: {
    alignSelf: 'flex-start',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  botBubble: {
    backgroundColor: colors.background.card,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  errorBubble: {
    backgroundColor: `${colors.status.error}20`,
    borderColor: colors.status.error,
    borderWidth: 1,
  },
  text: {
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  botText: {
    color: colors.text.primary,
  },
  userText: {
    color: '#FFFFFF',
  },
  errorText: {
    color: colors.status.error,
  },
  timestamp: {
    fontSize: fontSizes.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs / 2,
    alignSelf: 'flex-end',
  },
});