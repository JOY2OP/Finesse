import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type RankedCardProps = {
  rank: number;
  category: string;
  amount: string;
  label: string;
  icon?: string;
  isCenter?: boolean;
};

export default function RankedCard({
  rank,
  category,
  amount,
  label,
  icon,
  isCenter,
}: RankedCardProps) {
  const getIconEmoji = (cat: string) => {
    const lowerCat = cat.toLowerCase();
    if (lowerCat.includes('deposit') || lowerCat.includes('saving')) return '💰';
    if (lowerCat.includes('grocer')) return '🛒';
    if (lowerCat.includes('real estate') || lowerCat.includes('rent')) return '🏢';
    if (lowerCat.includes('food')) return '🍔';
    if (lowerCat.includes('transport')) return '🚗';
    return '📊';
  };

  return (
    <View style={[
      styles.card,
      isCenter && styles.cardCenter,
      rank === 1 && styles.cardFirst
    ]}>
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, isCenter && styles.iconContainerLarge]}>
          <Text style={[styles.iconText, isCenter && styles.iconTextLarge]}>
            {icon || getIconEmoji(category)}
          </Text>
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <View style={[styles.rankBadge, rank === 1 && styles.rankBadgeFirst]}>
              <Text style={[styles.rankText, rank === 1 && styles.rankTextFirst]}>#{rank}</Text>
            </View>
            <Text style={[styles.categoryText, isCenter && styles.categoryTextLarge]} numberOfLines={1}>
              {category.toUpperCase()}
            </Text>
          </View>
          <Text
            style={[styles.amountText, isCenter && styles.amountTextLarge]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {amount}
          </Text>
        </View>

        {rank === 1 && (
          <View style={styles.labelBadge}>
            <Text style={styles.labelText} numberOfLines={1}>{label.toUpperCase()}</Text>
          </View>
        )}
      </View>
      
      {rank !== 1 && label ? (
        <Text style={styles.subLabel} numberOfLines={1}>{label}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardCenter: {
    padding: 16,
  },
  cardFirst: {
    borderColor: '#DBEAFE',
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconContainerLarge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
  },
  iconText: {
    fontSize: 18,
  },
  iconTextLarge: {
    fontSize: 24,
  },
  infoContainer: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  rankBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    flexShrink: 0,
  },
  rankBadgeFirst: {
    backgroundColor: '#0052FF',
  },
  rankText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  rankTextFirst: {
    color: '#FFFFFF',
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  categoryTextLarge: {
    fontSize: 10,
  },
  amountText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  amountTextLarge: {
    fontSize: 24,
  },
  labelBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  labelText: {
    fontSize: 6,
    fontWeight: '700',
    color: '#0052FF',
    letterSpacing: 0.3,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 6,
  },
});
