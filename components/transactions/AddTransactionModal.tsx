import { useEffect, useState } from 'react';
import { Modal, PanResponder, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface NewExpense {
  amount: string;
  category: 'needs' | 'wants' | 'investing';
  note: string;
  date: string;
  subcategory?: string;
}

interface AddTransactionModalProps {
  visible: boolean;
  newExpense: NewExpense;
  onClose: () => void;
  onExpenseChange: (expense: NewExpense) => void;
  onSubmit: (expense?: NewExpense) => void;
  mode?: 'add' | 'edit';
}

const SUBCATEGORIES = {
  needs: [
    { id: 'rent', label: 'Rent', emoji: '🏠' },
    { id: 'groceries', label: 'Groceries', emoji: '🛒' },
    { id: 'utilities', label: 'Utilities', emoji: '💡' },
    { id: 'insurance', label: 'Insurance', emoji: '🛡️' },
    { id: 'healthcare', label: 'Health', emoji: '⚕️' },
    { id: 'transport', label: 'Transit', emoji: '🚗' },
    { id: 'internet_phone', label: 'Internet', emoji: '📱' },
    { id: 'fuel', label: 'Fuel', emoji: '⛽' },
  ],
  wants: [
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
  ],
  investing: [
    { id: 'mutual_funds', label: 'Mutual Funds', emoji: '📊' },
    { id: 'stocks', label: 'Stocks', emoji: '📈' },
    { id: 'sip', label: 'SIP', emoji: '💰' },
    { id: 'crypto', label: 'Crypto', emoji: '₿' },
    { id: 'gold', label: 'Gold', emoji: '🪙' },
    { id: 'fixed_deposit', label: 'Fixed Deposit', emoji: '🏦' },
    { id: 'real_estate', label: 'Real Estate', emoji: '🏢' },
    { id: 'nps_ppf', label: 'NPS/PPF', emoji: '📋' },
  ],
};

export default function AddTransactionModal({
  visible,
  newExpense,
  onClose,
  onExpenseChange,
  onSubmit,
  mode = 'add',
}: AddTransactionModalProps) {
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  // Internal category state so tabs always work regardless of onExpenseChange
  const [internalExpense, setInternalExpense] = useState<NewExpense>(newExpense);

  useEffect(() => {
    if (visible) {
      setInternalExpense(newExpense);
      setSelectedSubcategory(newExpense.subcategory ?? null);
    }
  }, [visible]);

  const handleExpenseChange = (updated: NewExpense) => {
    setInternalExpense(updated);
    onExpenseChange(updated);
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
    handleExpenseChange({ ...internalExpense, subcategory: subcategoryId });
  };

  const handleConfirm = () => {
    onSubmit(internalExpense);
  };

  const currentSubcategories = SUBCATEGORIES[internalExpense.category];

  // Pan responder for swipe down gesture
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return gestureState.dy > 5;
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 50) {
        onClose();
      }
    },
  });

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <View {...panResponder.panHandlers} style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Choose Category</Text>
              <Text style={styles.modalSubtitle}>Classify this transaction to optimize your AI insights.</Text>
            </View>
          </View>

          {/* Amount and Date Row */}
          <View style={styles.topInputs}>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#CBD5E1"
                keyboardType="numeric"
                value={internalExpense.amount}
                onChangeText={(text) => handleExpenseChange({ ...internalExpense, amount: text })}
              />
            </View>

            <View style={styles.dateRow}>
              <TextInput
                style={styles.noteInput}
                placeholder="Note (optional)"
                placeholderTextColor="#94A3B8"
                value={internalExpense.note}
                onChangeText={(text) => handleExpenseChange({ ...internalExpense, note: text })}
              />
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
                value={internalExpense.date}
                onChangeText={(text) => handleExpenseChange({ ...internalExpense, date: text })}
              />
            </View>
          </View>

          {/* Category Tabs */}
          <View style={styles.categoryTabsContainer}>
            <View style={styles.categoryTabs}>
              {(['needs', 'wants', 'investing'] as const).map((cat) => {
                const isActive = internalExpense.category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                    onPress={() => {
                      handleExpenseChange({ ...internalExpense, category: cat, subcategory: undefined });
                      setSelectedSubcategory(null);
                    }}
                  >
                    <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Subcategories Grid */}
          <ScrollView 
            style={styles.subcategoriesScroll}
            contentContainerStyle={styles.subcategoriesContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.subcategoriesGrid}>
              {currentSubcategories.map((subcat) => {
                const isSelected = selectedSubcategory === subcat.id;
                return (
                  <TouchableOpacity
                    key={subcat.id}
                    style={styles.subcategoryItem}
                    onPress={() => handleSubcategorySelect(subcat.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.subcategoryIcon,
                      isSelected && styles.subcategoryIconSelected
                    ]}>
                      <Text style={styles.subcategoryEmoji}>{subcat.emoji}</Text>
                    </View>
                    <Text style={[
                      styles.subcategoryLabel,
                      isSelected && styles.subcategoryLabelSelected
                    ]}>
                      {subcat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              
              {/* Add New Button - Add subcategory*/}
              {/* <TouchableOpacity style={styles.subcategoryItem} activeOpacity={0.7}>
                <View style={styles.subcategoryIcon}>
                  <Text style={styles.addIcon}>+</Text>
                </View>
                <Text style={styles.subcategoryLabelAdd}>Add New</Text>
              </TouchableOpacity> */}
            </View>
          </ScrollView>

          {/* Confirm Button */}
          <View style={styles.confirmButtonContainer}>
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>{mode === 'edit' ? 'Edit Transaction' : 'Add Transaction'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    height: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
    flexDirection: 'column',
  },
  handleContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  handle: {
    width: 48,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  topInputs: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '700',
    color: '#94A3B8',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 16,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  noteInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  categoryTabsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  categoryTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  categoryTabActive: {
    backgroundColor: '#2B6CEE',
    shadowColor: '#2B6CEE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: -0.2,
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  subcategoriesScroll: {
    flex: 1,
  },
  subcategoriesContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 20,
  },
  subcategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
  },
  subcategoryItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  subcategoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subcategoryIconSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#2B6CEE',
  },
  subcategoryEmoji: {
    fontSize: 28,
  },
  subcategoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    marginTop: 12,
  },
  subcategoryLabelSelected: {
    color: '#2B6CEE',
    fontWeight: '700',
  },
  subcategoryLabelAdd: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 12,
  },
  addIcon: {
    fontSize: 24,
    color: '#94A3B8',
    fontWeight: '300',
  },
  confirmButtonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  confirmButton: {
    backgroundColor: '#2B6CEE',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#2B6CEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
