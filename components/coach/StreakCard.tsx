import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StreakCardProps {
  weeks: number;
  maxWeeks?: number;
}

export default function StreakCard({ weeks, maxWeeks = 5 }: StreakCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
      
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🔥</Text>
      </View>
      
      <Text style={styles.title}>
        STREAK: <Text style={styles.highlight}>{weeks} WEEKS!</Text>
      </Text>
      
      <Text style={styles.subtitle}>Your financial health is improving</Text>
      
      <View style={styles.dotsContainer}>
        {Array.from({ length: maxWeeks }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index < weeks ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(0, 82, 255, 0.1)',
    marginBottom: 32,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#0052FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  decorCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(0, 82, 255, 0.05)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0, 82, 255, 0.05)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 82, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  highlight: {
    color: '#0052FF',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  dot: {
    width: 32,
    height: 8,
    borderRadius: 999,
  },
  dotActive: {
    backgroundColor: '#0052FF',
  },
  dotInactive: {
    backgroundColor: '#E2E8F0',
  },
});
