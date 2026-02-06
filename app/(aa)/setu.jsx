import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Button } from 'react-native';
import { colors, fontSizes, spacing } from '@/constants/theme';
import GradientBackground from '@/components/GradientBackground';

export default function WebviewScreen({ searchParams }) {
  const insets = useSafeAreaInsets();
  const { url } = useLocalSearchParams();
  // console.log('url=========',url)
  return (
     <GradientBackground>
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <WebView source={{ uri: url }} />
      </View>
    </GradientBackground>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});