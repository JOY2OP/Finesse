import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type InsightBulletProps = {
  text: string;
};

export default function InsightBullet({ text }: InsightBulletProps) {
  return (
    <View style={styles.insightBullet}>
      <Text style={styles.insightText}>👉 {text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  insightBullet: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  insightText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
