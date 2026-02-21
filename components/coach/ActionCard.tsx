import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ActionCardProps = {
  emoji: string;
  title: string;
  subtitle: string;
  targetAmount: string;
  currentSpent: string;
  color: string;
  isActive: boolean;
  onSetLimit: () => void;
};

export default function ActionCard({
  emoji,
  title,
  subtitle,
  targetAmount,
  currentSpent,
  color,
  isActive,
  onSetLimit,
}: ActionCardProps) {
  const spentNum = parseFloat(currentSpent);
  const targetNum = parseFloat(targetAmount);
  const progressPercentage = (spentNum / targetNum) * 100;

  return (
    <View style={styles.actionCard}>
      <View style={styles.actionCardContent}>
        <Text style={styles.actionEmoji}>{emoji}</Text>
        <View style={styles.actionCardText}>
          <Text style={styles.actionCardTitle}>{title}</Text>
          <Text style={styles.actionCardSubtitle}>{subtitle}</Text>
        </View>
      </View>
      
      {isActive ? (
        <>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercentage}%`, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              ₹{currentSpent} / {targetAmount} used
            </Text>
          </View>
          
          <View style={styles.inProgressButton}>
            <Text style={styles.inProgressButtonText}>In Progress</Text>
          </View>
        </>
      ) : (
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: color }]}
          onPress={onSetLimit}
        >
          <Text style={styles.actionButtonText}>Set Limit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionEmoji: {
    fontSize: 32,
    marginRight: 8,
  },
  actionCardText: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  inProgressButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
  },
  inProgressButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
});
