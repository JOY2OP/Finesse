import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type InsightBulletProps = {
  text: string;
  icon?: string;
};

export default function InsightBullet({ text, icon = '💡' }: InsightBulletProps) {
  return (
    <View style={styles.insightBullet}>
      <Text style={styles.iconText}>{icon}</Text>
      <Text style={styles.insightText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  insightBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 14,
    marginRight: 10,
    marginTop: 1,
    flexShrink: 0,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
});
