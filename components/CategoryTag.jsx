import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, fontSizes } from '@/constants/theme';

export default function CategoryTag({ category }) {
  const getTagStyles = () => {
    switch (category) {
      case 'needs':
        return {
          backgroundColor: `${colors.category.needs}20`,
          textColor: colors.category.needs,
        };
      case 'wants':
        return {
          backgroundColor: `${colors.category.wants}20`,
          textColor: colors.category.wants,
        };
      case 'investing':
        return {
          backgroundColor: `${colors.category.investing}20`,
          textColor: colors.category.investing,
        };
      default:
        return {
          backgroundColor: `${colors.text.tertiary}20`,
          textColor: colors.text.tertiary,
        };
    }
  };
  
  const getLabel = () => {
    switch (category) {
      case 'needs':
        return 'Needs';
      case 'wants':
        return 'Wants';
      case 'investing':
        return 'Investing';
      default:
        return 'Uncategorized';
    }
  };
  
  const tagStyles = getTagStyles();
  
  return (
    <View style={[styles.container, { backgroundColor: tagStyles.backgroundColor }]}>
      <Text style={[styles.text, { color: tagStyles.textColor }]}>
        {getLabel()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
});