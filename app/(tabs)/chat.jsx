import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { SendHorizontal, Bot } from 'lucide-react-native';
import { colors, spacing, fontSizes } from '@/constants/theme';
import { chatResponses, initialMessages } from '@/constants/mockData';
import GradientBackground from '@/components/GradientBackground';
import ChatMessage from '@/components/ChatMessage';

export default function ChatScreen() {
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  
  const sendButtonScale = useSharedValue(1);
  const typingIndicatorOpacity = useSharedValue(0);
  
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
    };
  }, []);
  
  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  const sendMessage = () => {
    if (!inputText.trim()) return;
    
    // Animate send button
    sendButtonScale.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withSpring(1)
    );
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    // Simulate bot typing
    setIsTyping(true);
    typingIndicatorOpacity.value = withTiming(1, { duration: 300 });
    
    // Find response or use default
    setTimeout(() => {
      typingIndicatorOpacity.value = withTiming(0, { duration: 300 });
      
      setTimeout(() => {
        setIsTyping(false);
        
        // Find a matching response or use default
        let responseText = null;
        const userTextLower = userMessage.text.toLowerCase();
        
        // Check for exact matches first
        if (chatResponses[userTextLower]) {
          responseText = chatResponses[userTextLower];
        } else {
          // Check for partial matches
          for (const [key, value] of Object.entries(chatResponses)) {
            if (userTextLower.includes(key)) {
              responseText = value;
              break;
            }
          }
          
          // If no match found, use a default response
          if (!responseText) {
            responseText = "I'm not sure how to answer that specific question. Could you ask about budgeting, investing, saving money, or another financial topic?";
          }
        }
        
        const botMessage = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: 'bot',
          timestamp: Date.now(),
        };
        
        setMessages(prev => [...prev, botMessage]);
      }, 300);
    }, 1500);
  };
  
  const sendButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: sendButtonScale.value }],
    };
  });
  
  const typingIndicatorStyle = useAnimatedStyle(() => {
    return {
      opacity: typingIndicatorOpacity.value,
    };
  });

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[
          styles.container, 
          { 
            paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, keyboardHeight > 0 ? 8 : insets.bottom) : 8
          }
        ]}>
          <Animated.View 
            style={styles.header}
            entering={FadeIn.duration(600)}
          >
            <Text style={styles.headerTitle}>Finesse Assistant</Text>
          </Animated.View>
          
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <ChatMessage 
                message={item} 
                isLast={index === messages.length - 1}
              />
            )}
            contentContainerStyle={[
              styles.messagesList,
              { paddingBottom: keyboardHeight > 0 ? spacing.sm : spacing.md }
            ]}
            keyboardShouldPersistTaps="handled"
          />
          
          {isTyping && (
            <Animated.View 
              style={[styles.typingIndicator, typingIndicatorStyle]}
            >
              <Bot size={16} color={colors.text.secondary} />
              <Text style={styles.typingText}>Assistant is typing...</Text>
            </Animated.View>
          )}
          
          <View style={[
            styles.inputContainer,
            { marginBottom: keyboardHeight > 0 ? spacing.sm : spacing.md }
          ]}>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Ask about budgeting, investing..."
                placeholderTextColor={colors.text.tertiary}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                multiline={false}
                blurOnSubmit={false}
                autoCorrect={true}
                autoCapitalize="sentences"
              />
            </View>
            <Animated.View style={sendButtonStyle}>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputText.trim() && styles.sendButtonDisabled,
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim()}
                activeOpacity={0.8}
              >
                <SendHorizontal size={20} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  messagesList: {
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.background.input,
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
    justifyContent: 'center',
  },
  input: {
    color: colors.text.primary,
    fontSize: fontSizes.md,
    lineHeight: 20,
    textAlignVertical: 'center',
    includeFontPadding: false,
    padding: 0,
    margin: 0,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: `${colors.primary}40`, // 40% opacity
    shadowOpacity: 0,
    elevation: 0,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  typingText: {
    color: colors.text.secondary,
    fontSize: fontSizes.xs,
    marginLeft: spacing.xs,
  },
});