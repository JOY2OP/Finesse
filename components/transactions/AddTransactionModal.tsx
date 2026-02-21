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
  needs:     { active: '#E8643A', bg: 'rgba(232,100,58,0.12)',     border: 'rgba(232,100,58,0.35)' },
  wants:     { active: '#7C6FCD', bg: 'rgba(124,111,205,0.12)',    border: 'rgba(124,111,205,0.35)' },
  investing: { active: '#3A9E7E', bg: 'rgba(58,158,126,0.12)',     border: 'rgba(58,158,126,0.35)' },
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
              <X size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#4B5563"
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
              placeholderTextColor="#4B5563"
              value={newExpense.note}
              onChangeText={(text) => onExpenseChange({ ...newExpense, note: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#4B5563"
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#161B27',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
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
    color: '#F9FAFB',
    letterSpacing: -0.3,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 999,
    padding: 6,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: '#b0b0b0ff',
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  optional: {
    fontWeight: '400',
    color: '#6B7280',
  },
  input: {
    backgroundColor: '#1F2637',
    borderRadius: 12,
    padding: spacing.md,
    fontSize: fontSizes.md,
    color: '#F9FAFB',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
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
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    shadowColor: '#3B82F6',
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