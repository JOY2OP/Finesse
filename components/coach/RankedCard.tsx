import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type RankedCardProps = {
  rank: number;
  category: string;
  amount: string;
  label: string;
  isCenter?: boolean;
};

export default function RankedCard({
  rank,
  category,
  amount,
  label,
  isCenter,
}: RankedCardProps) {
  return (
    <View style={[styles.rankedCard, isCenter && styles.rankedCardCenter]}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankNumber}>#{rank}</Text>
      </View>
      <Text 
        style={[styles.categoryText, isCenter && styles.categoryTextCenter]}
        numberOfLines={1}
      >
        {category}
      </Text>
      <Text 
        style={[styles.amountText, isCenter && styles.amountTextCenter]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {amount}
      </Text>
      <Text style={styles.labelText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rankedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  rankedCardCenter: {
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  categoryTextCenter: {
    fontSize: 15,
    color: '#111827',
  },
  amountText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  amountTextCenter: {
    fontSize: 24,
    color: '#EF4444',
  },
  labelText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
