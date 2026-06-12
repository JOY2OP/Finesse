import React, { useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Trash2 } from 'lucide-react-native';

interface Transaction {
  id: string;
  description: string;
  category: string;
  subcategory?: string;
  amount: number;
  date: string;
  time?: string;
  created_at?: string;
}

interface TransactionItemProps {
  transaction: Transaction;
  isLast: boolean;
  isFirst?: boolean;         // used to trigger hint animation
  onCategoryChange: (id: string, category: string, subcategory?: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

const SWIPE_THRESHOLD = 80;   // px — full delete trigger
const HINT_DISTANCE   = 60;   // px — how far the hint animation peeks

export default function TransactionItem({
  transaction,
  isLast,
  isFirst = false,
  onCategoryChange,
  onEditTransaction,
  onDelete,
}: TransactionItemProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const hintPlayed  = useRef(false);

  // ── Hint animation on first item ──────────────────────────────────────────
  useEffect(() => {
    if (!isFirst || hintPlayed.current) return;
    hintPlayed.current = true;

    const delay = setTimeout(() => {
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: -HINT_DISTANCE,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(400),
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
        }),
      ]).start();
    }, 800);

    return () => clearTimeout(delay);
  }, [isFirst]);

  // ── Pan responder ──────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 && Math.abs(g.dy) < 15,
      onPanResponderMove: (_, g) => {
        // Only allow left swipe
        if (g.dx < 0) translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -SWIPE_THRESHOLD) {
          // Swipe far enough — slide out and delete
          Animated.timing(translateX, {
            toValue: -500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onDelete(transaction.id));
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    })
  ).current;

  // ── Category config ────────────────────────────────────────────────────────
  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'needs':     return { color: '#2563EB', bg: '#DBEAFE', icon: '🛒',  label: 'Needs'      };
      case 'wants':     return { color: '#10B981', bg: '#D1FAE5', icon: '🛍️', label: 'Wants'      };
      case 'investing': return { color: '#9333EA', bg: '#F3E8FF', icon: '📈',  label: 'Investing'  };
      default:          return { color: '#64748B', bg: '#F1F5F9', icon: '📊',  label: 'Categorize' };
    }
  };

  const getSubcategoryLabel = () => {
    if (!transaction.subcategory) return transaction.description.split(' ')[0];
    return transaction.subcategory.replace(/_/g, ' ');
  };

  const getTimeFromDate = () => {
    if (transaction.time) return transaction.time;
    if (transaction.created_at) {
      return new Date(transaction.created_at).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true,
      });
    }
    return '12:00 PM';
  };

  const formatCurrency = (amount: number) =>
    '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const config = getCategoryConfig(transaction.category);

  // Delete background opacity based on swipe distance
  const deleteOpacity = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.wrapper, !isLast && styles.borderBottom]}>
      {/* Red delete background */}
      <Animated.View style={[styles.deleteBackground, { opacity: deleteOpacity }]}>
        <Trash2 size={22} color="#691a1aff" />
      </Animated.View>

      {/* Swipeable row */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <View style={styles.container}>
          <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
            <Text style={styles.icon}>{config.icon}</Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.description}>{transaction.description}</Text>
            <Text style={styles.subcategory}>
              {getSubcategoryLabel()} • {getTimeFromDate()}
            </Text>
          </View>

          <View style={styles.rightContainer}>
            <Text style={styles.amount}>-{formatCurrency(transaction.amount)}</Text>
            <TouchableOpacity
              style={[styles.categoryButton, { backgroundColor: config.bg }]}
              onPress={() => onEditTransaction(transaction)}
            >
              <Text style={[styles.categoryText, { color: config.color }]}>
                {config.label.toUpperCase()}
              </Text>
              <Text style={[styles.chevron, { color: config.color }]}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fc8585ff',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 24,
  },
  trashIcon: {
    fontSize: 22,
  },  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon:          { fontSize: 20 },
  infoContainer: { flex: 1 },
  description: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  subcategory: {
    fontSize: 11,
    color: '#64748B',
  },
  rightContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chevron: { fontSize: 10 },
});
