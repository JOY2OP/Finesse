import { colors, fontSizes, spacing } from '@/constants/theme';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import CategoryTag from './CategoryTag';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ExpenseItem({ expense, onCategoryChange }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownHeight = useSharedValue(0);
  const opacity = useSharedValue(1);
  
  const categories = [
    { id: 'needs', label: 'Needs' },
    { id: 'wants', label: 'Wants' },
    { id: 'investing', label: 'Investing' },
  ];
  
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    dropdownHeight.value = withTiming(isDropdownOpen ? 0 : 140, { duration: 300 });
  };
  
  const handleCategorySelect = (category) => {
    // Animate selection
    opacity.value = withSequence(
      withTiming(0.7, { duration: 100 }),
      withTiming(1, { duration: 200 })
    );
    
    // Update category
    onCategoryChange(expense.id, category);
    
    // Close dropdown
    setIsDropdownOpen(false);
    dropdownHeight.value = withTiming(0, { duration: 300 });
  };
  
  const dropdownStyle = useAnimatedStyle(() => {
    return {
      height: dropdownHeight.value,
      opacity: dropdownHeight.value > 0 ? 1 : 0,
    };
  });
  
  const cardStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });
  
  // Format date to a more readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <AnimatedPressable
      style={[styles.container, cardStyle]}
      entering={FadeIn.duration(400)}
    >
      <View style={styles.mainContent}>
        <View style={styles.leftSection}>
          <Text style={styles.description}>{expense.description}</Text>
          <Text style={styles.date}>{formatDate(expense.date)}</Text>
          <CategoryTag category={expense.category} />
        </View>
        
        <View style={styles.rightSection}>
          <Text style={styles.amount}>${expense.amount.toFixed(2)}</Text>
          <TouchableOpacity 
            style={styles.categoryButton}
            onPress={toggleDropdown}
            activeOpacity={0.7}
          >
            <Text style={styles.categoryButtonText}>Categorize</Text>
            {isDropdownOpen ? (
              <ChevronUp size={14} color={colors.text.primary} />
            ) : (
              <ChevronDown size={14} color={colors.text.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Dropdown */}
      <Animated.View style={[styles.dropdown, dropdownStyle]}>
        <View style={styles.dropdownContent}>
          {categories.map((category) => (
            <TouchableOpacity 
              key={category.id}
              style={[
                styles.categoryOption,
                expense.category === category.id && styles.selectedCategory
              ]}
              onPress={() => handleCategorySelect(category.id)}
            >
              <CategoryTag category={category.id} />
              {/* <Text style={styles.categoryText}>{category.label}</Text> */}
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftSection: {
    flex: 1,
    marginRight: spacing.md,
  },
  rightSection: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  description: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  date: {
    fontSize: fontSizes.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  amount: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.input,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    minWidth: 90,
  },
  categoryButtonText: {
    color: colors.text.primary,
    fontSize: fontSizes.xs,
    fontWeight: '500',
    marginRight: spacing.xs / 2,
  },
  dropdown: {
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  dropdownContent: {
    backgroundColor: colors.background.input,
    borderRadius: 12,
    padding: spacing.sm,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    marginVertical: spacing.xs / 2,
  },
  selectedCategory: {
    backgroundColor: `${colors.primary}20`, // 20% opacity
  },
  categoryText: {
    color: colors.text.primary,
    fontSize: fontSizes.sm,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
});