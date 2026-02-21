import { colors, fontSizes, spacing } from '@/constants/theme';
import { X } from 'lucide-react-native';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface NewExpense {
  amount: string;
  category: 'needs' | 'wants' | 'investing';
  note: string;
  date: string;
}

interface AddTransactionModalProps {
  visible: boolean;
  newExpense: NewExpense;
  onClose: () => void;
  onExpenseChange: (expense: NewExpense) => void;
  onSubmit: () => void;
}

export default function AddTransactionModal({
  visible,
  newExpense,
  onClose,
  onExpenseChange,
  onSubmit,
}: AddTransactionModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Transaction</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.background.dark} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numeric"
              value={newExpense.amount}
              onChangeText={(text) => onExpenseChange({ ...newExpense, amount: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryButtons}>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  { 
                    backgroundColor: newExpense.category === 'needs' 
                      ? colors.category.needs 
                      : `${colors.category.needs}20`,
                    borderColor: colors.category.needs,
                  },
                ]}
                onPress={() => onExpenseChange({ ...newExpense, category: 'needs' })}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    { 
                      color: newExpense.category === 'needs' ? '#FFFFFF' : colors.category.needs,
                      fontWeight: newExpense.category === 'needs' ? '700' : '600',
                    },
                  ]}
                >
                  Needs
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  { 
                    backgroundColor: newExpense.category === 'wants' 
                      ? colors.category.wants 
                      : `${colors.category.wants}20`,
                    borderColor: colors.category.wants,
                  },
                ]}
                onPress={() => onExpenseChange({ ...newExpense, category: 'wants' })}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    { 
                      color: newExpense.category === 'wants' ? '#FFFFFF' : colors.category.wants,
                      fontWeight: newExpense.category === 'wants' ? '700' : '600',
                    },
                  ]}
                >
                  Wants
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  { 
                    backgroundColor: newExpense.category === 'investing' 
                      ? colors.category.investing 
                      : `${colors.category.investing}20`,
                    borderColor: colors.category.investing,
                  },
                ]}
                onPress={() => onExpenseChange({ ...newExpense, category: 'investing' })}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    { 
                      color: newExpense.category === 'investing' ? '#FFFFFF' : colors.category.investing,
                      fontWeight: newExpense.category === 'investing' ? '700' : '600',
                    },
                  ]}
                >
                  Investing
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Note (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Grocery shopping"
              placeholderTextColor={colors.text.tertiary}
              value={newExpense.note}
              onChangeText={(text) => onExpenseChange({ ...newExpense, note: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text.tertiary}
              value={newExpense.date}
              onChangeText={(text) => onExpenseChange({ ...newExpense, date: text })}
            />
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={onSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>Add Expense</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: '#111827',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: '#374151',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: spacing.md,
    fontSize: fontSizes.md,
    color: '#111827',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: fontSizes.sm,
  },
  addButton: {
    backgroundColor: '#1A1E2E',
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  addButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
