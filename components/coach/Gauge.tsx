import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type GaugeProps = {
  status: 'OK' | 'Good' | 'Great';
};

export default function Gauge({ status }: GaugeProps) {
  const statusConfig = {
    OK: { percentage: 30, color: '#F59E0B', label: 'OK' },
    Good: { percentage: 50, color: '#10B981', label: 'Good' },
    Great: { percentage: 95, color: '#059669', label: 'Great' },
  };

  const config = statusConfig[status];
  const size = 200;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI;
  const progress = (config.percentage / 100) * circumference;

  return (
    <View style={styles.gaugeContainer}>
      <Svg width={size} height={size / 2 + 20}>
        <Path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <Path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={config.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
        />
        <Circle cx={size / 2} cy={size / 2} r={8} fill={config.color} />
      </Svg>
      <Text style={styles.gaugeLabel}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gaugeContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  gaugeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
});
