import { TypedStorage } from '@/app/lib/storage';
import ChatMessage from '@/components/ChatMessage';
import GradientBackground from '@/components/GradientBackground';
import { initialMessages } from '@/constants/mockData';
import { colors, fontSizes, spacing } from '@/constants/theme';
import { CircleAlert as AlertCircle, Bot, SendHorizontal } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Backend URL configuration
// IMPORTANT: Update this based on your setup:
// - Android Emulator: use 'http://10.0.2.2:3000'
// - iOS Simulator: use 'http://localhost:3000'
// - Physical Device (Expo Go): use your computer's IP (check with ipconfig)
// - Web: use 'http://localhost:3000'

const BACKEND_URLS = {
  android: 'http://10.84.85.229:3000',   // Physical Android device - using your PC's IP
  ios: 'http://152.58.122.26:3000',       // Physical iOS device - using your PC's IP
  web: 'http://localhost:3000',          // Web browser
};

const BACKEND_URL = BACKEND_URLS[Platform.OS] || 'http://localhost:3000';

console.log('🔗 Using backend URL:', BACKEND_URL, 'for platform:', Platform.OS);

export default function ChatScreen() {
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [connectionError, setConnectionError] = useState(false);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  
  const sendButtonScale = useSharedValue(1);
  const typingIndicatorOpacity = useSharedValue(0);
  
  // Load messages from storage on component mount
  useEffect(() => {
    loadMessages();
  }, []);
  
  // Save messages to storage whenever messages change
  useEffect(() => {
    if (!isLoading) {
      saveMessages();
    }
  }, [messages, isLoading]);
  
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

  // Test backend connection on component mount
  // useEffect(() => {
  //   testBackendConnection();
  // }, []);

  const loadMessages = async () => {
    try {
      const storedMessages = await TypedStorage.getObject('chatMessages');
      if (storedMessages && Array.isArray(storedMessages)) {
        setMessages(storedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveMessages = async () => {
    try {
      await TypedStorage.setObject('chatMessages', messages);
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const testBackendConnection = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      if (response.ok) {
        setConnectionError(false);
      } else {
        setConnectionError(true);
      }
    } catch (error) {
      console.log('🚩Backend connection TEST failed:', error);
      setConnectionError(true);
    }
  };

  const sendMessageToBackend = async (message) => {
    try {
      console.log("trying sending to backend")
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      console.log("data: ", data)
      return data.reply;
    } catch (error) {
      console.error('🚩Backend request failed:', error);
      throw error;
    }
  };
  
  const sendMessage = async () => {
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
    // const currentMessage = inputText.trim();
    const currentMessage = [{ role: "user", content: inputText.trim()}];
    setInputText('');
    
    // Show typing indicator
    setIsTyping(true);
    typingIndicatorOpacity.value = withTiming(1, { duration: 300 });
    
    try {
      // Send to backend
      console.log("currentMessage: ", currentMessage)
      const reply = await sendMessageToBackend(currentMessage);
      
      // Hide typing indicator
      typingIndicatorOpacity.value = withTiming(0, { duration: 300 });
      
      setTimeout(() => {
        setIsTyping(false);
        
        const botMessage = {
          id: (Date.now() + 1).toString(),
          text: reply,
          sender: 'bot',
          timestamp: Date.now(),
        };
        
        setMessages(prev => [...prev, botMessage]);
        setConnectionError(false);
      }, 300);
      
    } catch (error) {
      // Hide typing indicator
      typingIndicatorOpacity.value = withTiming(0, { duration: 300 });
      
      setTimeout(() => {
        setIsTyping(false);
        setConnectionError(true);
        
        // Add error message
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          text: "I'm having trouble connecting to the server right now. Please check if you have active internet connection.",
          sender: 'bot',
          timestamp: Date.now(),
          isError: true,
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }, 300);
    }
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

  if (isLoading) {
    return (
      <GradientBackground>
        <View style={[styles.container, styles.loadingContainer, { paddingBottom: insets.bottom }]}>
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </GradientBackground>
    );
  }

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
            {connectionError && (
              <View style={styles.connectionStatus}>
                <AlertCircle size={16} color={colors.status.warning} />
                <Text style={styles.connectionText}>Backend Offline</Text>
              </View>
            )}
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
                editable={!isTyping}
              />
            </View>
            <Animated.View style={sendButtonStyle}>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isTyping) && styles.sendButtonDisabled,
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isTyping}
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
    position: 'relative',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  connectionStatus: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.status.warning}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
  },
  connectionText: {
    color: colors.status.warning,
    fontSize: fontSizes.xs,
    fontWeight: '500',
    marginLeft: spacing.xs / 2,
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSizes.md,
    color: colors.text.secondary,
  },
});