import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

type Category = 'needs' | 'wants' | 'investing';

interface CategoryFilterProps {
  selectedCategories: Category[];
  onToggleCategory: (category: Category) => void;
}

export default function CategoryFilter({ selectedCategories, onToggleCategory }: CategoryFilterProps) {
  const categories: { id: Category; label: string; color: string }[] = [
    { id: 'needs', label: 'Needs', color: '#2563EB' },
    { id: 'wants', label: 'Wants', color: '#10B981' },
    { id: 'investing', label: 'Investing', color: '#9333EA' },
  ];

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => {
        const isSelected = selectedCategories.includes(category.id);
        return (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.filterButton,
              { backgroundColor: category.color }
            ]}
            onPress={() => onToggleCategory(category.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.filterText}>{category.label}</Text>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chevron: {
    fontSize: 10,
    color: '#FFFFFF',
  },
});
