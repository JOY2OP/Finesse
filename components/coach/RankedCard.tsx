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
      <Text style={[styles.categoryText, isCenter && styles.categoryTextCenter]}>
        {category}
      </Text>
      <Text style={[styles.amountText, isCenter && styles.amountTextCenter]}>
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
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  rankedCardCenter: {
    paddingVertical: 24,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  categoryTextCenter: {
    fontSize: 16,
    color: '#111827',
  },
  amountText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  amountTextCenter: {
    fontSize: 28,
    color: '#EF4444',
  },
  labelText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
