import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type GaugeProps = {
  status: 'OK' | 'Good' | 'Great';
};

export default function Gauge({ status }: GaugeProps) {
  const statusConfig = {
    OK: { color: '#F59E0B', label: 'OK' },
    Good: { color: '#10B981', label: 'Good' },
    Great: { color: '#0052FF', label: 'Great!' },
  };

  const config = statusConfig[status];

  return (
    <View style={styles.gaugeContainer}>
      <View style={styles.patternBackground} />
      <View style={styles.gradientOverlay} />
      <View style={styles.contentContainer}>
        <Text style={styles.statusLabel}>
          Status: <Text style={[styles.statusValue, { color: config.color }]}>{config.label}</Text>
        </Text>
        <Text style={styles.statusSubtext}>Your financial health is improving</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gaugeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  patternBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 82, 255, 0.02)',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 82, 255, 0.03)',
  },
  contentContainer: {
    zIndex: 10,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  statusValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  statusSubtext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
});
