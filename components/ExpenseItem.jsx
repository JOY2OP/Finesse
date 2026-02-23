import { colors, fontSizes, spacing } from '@/constants/theme';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import CategoryTag from './CategoryTag';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ExpenseItem({ expense, onCategoryChange }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const dropdownHeight = useSharedValue(0);
  const opacity = useSharedValue(1);
  
  const categories = [
    { 
      id: 'needs', 
      label: 'Needs',
      subcategories: [
        { id: 'groceries', label: 'Groceries', emoji: '🛒' },
        { id: 'rent', label: 'Rent', emoji: '🏠' },
        { id: 'utilities', label: 'Utilities', emoji: '💡' },
        { id: 'transport', label: 'Transport', emoji: '🚗' },
        { id: 'healthcare', label: 'Healthcare', emoji: '⚕️' },
        { id: 'insurance', label: 'Insurance', emoji: '🛡️' },
        { id: 'internet_phone', label: 'Internet/Phone', emoji: '📱' },
        { id: 'pet_care', label: 'Pet Care', emoji: '🐾' },
      ]
    },
    { 
      id: 'wants', 
      label: 'Wants',
      subcategories: [
        { id: 'food_delivery', label: 'Food Delivery', emoji: '🛵' },
        { id: 'dining_out', label: 'Dining Out', emoji: '🍽️' },
        { id: 'movies', label: 'Movies', emoji: '🎬' },
        { id: 'streaming', label: 'Streaming', emoji: '📺' },
        { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
        { id: 'travel', label: 'Travel', emoji: '✈️' },
        { id: 'fitness', label: 'Fitness', emoji: '💪' },
        { id: 'gaming', label: 'Gaming', emoji: '🎮' },
        { id: 'beauty_care', label: 'Beauty & Care', emoji: '💅' },
        { id: 'concerts_events', label: 'Concerts & Events', emoji: '🎵' },
        { id: 'gifts', label: 'Gifts', emoji: '🎁' },
        { id: 'hobbies', label: 'Hobbies', emoji: '🎨' },
      ]
    },
    { 
      id: 'investing', 
      label: 'Investing',
      subcategories: [
        { id: 'mutual_funds', label: 'Mutual Funds', emoji: '📊' },
        { id: 'stocks', label: 'Stocks', emoji: '📈' },
        { id: 'sip', label: 'SIP', emoji: '💰' },
        { id: 'crypto', label: 'Crypto', emoji: '₿' },
        { id: 'gold', label: 'Gold', emoji: '🪙' },
        { id: 'fixed_deposit', label: 'Fixed Deposit', emoji: '🏦' },
        { id: 'real_estate', label: 'Real Estate', emoji: '🏢' },
        { id: 'nps_ppf', label: 'NPS/PPF', emoji: '📋' },
      ]
    },
  ];
  
  const toggleDropdown = () => {
    const newState = !isDropdownOpen;
    setIsDropdownOpen(newState);
    dropdownHeight.value = withTiming(newState ? 500 : 0, { duration: 300 });
    if (!newState) {
      setExpandedCategory(null);
    }
  };
  
  const handleCategoryClick = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };
  
  const handleSubcategorySelect = (category, subcategory) => {
    // Animate selection
    opacity.value = withSequence(
      withTiming(0.7, { duration: 100 }),
      withTiming(1, { duration: 200 })
    );
    
    // Update category with subcategory
    onCategoryChange(expense.id, category, subcategory);
    
    // Close dropdown after a short delay
    setTimeout(() => {
      setIsDropdownOpen(false);
      setExpandedCategory(null);
      dropdownHeight.value = withTiming(0, { duration: 300 });
    }, 200);
  };
  
  // Get subcategory details if exists
  const getSubcategoryDetails = () => {
    if (!expense.subcategory) return null;
    
    const category = categories.find(cat => cat.id === expense.category);
    if (!category) return null;
    
    return category.subcategories.find(sub => sub.id === expense.subcategory);
  };
  
  const subcategoryDetails = getSubcategoryDetails();
  
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
  
  // Get category color
  const getCategoryColor = (category) => {
    switch (category) {
      case 'needs':
        return '#10b981'; // green
      case 'wants':
        return '#f59e0b'; // amber
      case 'investing':
        return '#3b82f6'; // blue
      default:
        return colors.text.secondary;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={cardStyle}>
        <View style={styles.mainContent}>
          <View style={styles.leftSection}>
            <Text style={styles.description}>{expense.description}</Text>
            <Text style={styles.date}>{formatDate(expense.date)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <CategoryTag category={expense.category} />
              {subcategoryDetails && (
                <View style={styles.subcategoryTag}>
                  <Text style={[styles.subcategoryText, { color: getCategoryColor(expense.category) }]}>
                    → {subcategoryDetails.emoji} {subcategoryDetails.label}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.rightSection}>
            <Text style={styles.amount}>₹{expense.amount.toFixed(2)}</Text>
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
      </Animated.View>
      
      {/* Dropdown */}
      <Animated.View style={[styles.dropdown, dropdownStyle]}>
        <View style={styles.dropdownContent}>
          {categories.map((category) => (
            <View key={category.id}>
              <TouchableOpacity 
                style={[
                  styles.categoryOption,
                  expense.category === category.id && styles.selectedCategory
                ]}
                onPress={() => handleCategoryClick(category.id)}
              >
                <CategoryTag category={category.id} />
                <ChevronDown 
                  size={14} 
                  color={colors.text.secondary} 
                  style={[
                    styles.chevron,
                    expandedCategory === category.id && styles.chevronExpanded
                  ]}
                />
              </TouchableOpacity>
              
              {expandedCategory === category.id && (
                <View style={styles.subcategoriesContainer}>
                  {category.subcategories.map((subcategory) => (
                    <TouchableOpacity
                      key={subcategory.id}
                      style={[
                        styles.subcategoryChip,
                        { borderColor: getCategoryColor(category.id) },
                        expense.subcategory === subcategory.id && {
                          backgroundColor: `${getCategoryColor(category.id)}30`
                        }
                      ]}
                      onPress={() => handleSubcategorySelect(category.id, subcategory.id)}
                    >
                      <Text style={styles.subcategoryChipText}>
                        {subcategory.emoji} {subcategory.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
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
    position: 'absolute',
    top: '100%',
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
    overflow: 'hidden',
  },
  dropdownContent: {
    backgroundColor: colors.background.input,
    borderRadius: 12,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  chevron: {
    marginLeft: spacing.sm,
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  subcategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  subcategoryChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: colors.background.dark,
  },
  subcategoryChipText: {
    color: colors.text.primary,
    fontSize: fontSizes.xs,
    fontWeight: '500',
  },
  subcategoryTag: {
    marginTop: spacing.xs,
  },
  subcategoryText: {
    fontSize: fontSizes.xs,
    fontWeight: '500',
  },
});