import { fontSizes, spacing } from '@/constants/theme';
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

const CATEGORY_COLORS = {
  needs:     { active: '#2563EB', bg: '#DBEAFE', border: '#93C5FD' },
  wants:     { active: '#10B981', bg: '#D1FAE5', border: '#6EE7B7' },
  investing: { active: '#9333EA', bg: '#F3E8FF', border: '#D8B4FE' },
};

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
          <View style={styles.handle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Transaction</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={newExpense.amount}
              onChangeText={(text) => onExpenseChange({ ...newExpense, amount: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryButtons}>
              {(['needs', 'wants', 'investing'] as const).map((cat) => {
                const c = CATEGORY_COLORS[cat];
                const isActive = newExpense.category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: isActive ? c.active : c.bg,
                        borderColor: isActive ? c.active : c.border,
                      },
                    ]}
                    onPress={() => onExpenseChange({ ...newExpense, category: cat })}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        { color: isActive ? '#FFFFFF' : c.active },
                      ]}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Note <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Grocery shopping"
              placeholderTextColor="#94A3B8"
              value={newExpense.note}
              onChangeText={(text) => onExpenseChange({ ...newExpense, note: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
              value={newExpense.date}
              onChangeText={(text) => onExpenseChange({ ...newExpense, date: text })}
            />
          </View>

          <TouchableOpacity style={styles.addButton} onPress={onSubmit} activeOpacity={0.85}>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: spacing.lg,
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
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  closeButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    padding: 6,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: '#475569',
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  optional: {
    fontWeight: '400',
    color: '#94A3B8',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: spacing.md,
    fontSize: fontSizes.md,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  addButton: {
    backgroundColor: '#2B6CEE',
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    shadowColor: '#2B6CEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  addButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
