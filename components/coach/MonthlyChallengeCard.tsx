import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MonthlyChallengeCardProps {
  emoji: string;
  missionType: string;
  title: string;
  amount: string;
  progress: number;
  status: 'completed' | 'warning' | 'regular';
  statusText?: string;
  color: string;
}

export default function MonthlyChallengeCard({
  emoji,
  missionType,
  title,
  amount,
  progress,
  status,
  statusText,
  color,
}: MonthlyChallengeCardProps) {
  // Bar fills up to 100% visually; label shows the real number (e.g. 126%)
  const barProgress = Math.max(0, Math.min(100, progress || 0));
  const labelProgress = Math.max(0, progress || 0);

  const getStatusIcon = () => {
    if (status === 'completed') {
      return '✓';
    }
    if (status === 'warning') {
      return null;
    }
    return '⟳';
  };

  const getStatusColor = () => {
    if (status === 'completed') return '#10B981';
    if (status === 'warning') return '#EF4444';
    return '#94A3B8';
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>
          <View>
            <Text style={styles.missionType}>MISSION: {missionType}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.amount}>{amount}</Text>
          {statusText && (
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {statusText}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { 
                width: `${barProgress}%`, 
                backgroundColor: color 
              },
            ]}
          />
        </View>
        {status === 'completed' && (
          <Text style={[styles.regularPercentage, { color: getStatusColor() }]}>
            {labelProgress > 100 ? `${labelProgress}%` : getStatusIcon()}
          </Text>
        )}
        {status === 'warning' && (
          <Text style={styles.limitText}>{labelProgress}%</Text>
        )}
        {status === 'regular' && (
          <Text style={styles.regularPercentage}>{labelProgress}%</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  missionType: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    textTransform: 'uppercase',
    // letterSpacing: -0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  statusIcon: {
    fontSize: 20,
    fontWeight: '700',
  },
  limitText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  regularPercentage: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
});
