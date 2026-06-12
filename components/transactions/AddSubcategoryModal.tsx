import { Smile } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface AddSubcategoryModalProps {
  visible: boolean;
  category: 'needs' | 'wants' | 'investing';
  onClose: () => void;
  onAdd: (label: string, emoji: string) => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  needs: 'Needs',
  wants: 'Wants',
  investing: 'Investing',
};

export default function AddSubcategoryModal({
  visible,
  category,
  onClose,
  onAdd,
}: AddSubcategoryModalProps) {
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('');
  const emojiInputRef = useRef<TextInput>(null);

  const canAdd = label.trim().length > 0;
  const displayEmoji = emoji || null;

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd(label.trim(), emoji || '🏷️');
    setLabel('');
    setEmoji('');
  };

  const handleClose = () => {
    setLabel('');
    setEmoji('');
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={styles.modal}>
          <Text style={styles.title}>
            New <Text style={styles.categoryName}>{CATEGORY_LABEL[category]}</Text> subcategory
          </Text>
          <Text style={styles.subtitle}>Give it a name</Text>

          {/* Icon + name row */}
          <View style={styles.row}>
            {/* Tapping the icon focuses the hidden emoji input */}
            <TouchableOpacity
              style={styles.outerDash}
              onPress={() => emojiInputRef.current?.focus()}
              activeOpacity={0.7}
            >
              <View style={styles.innerCircle}>
                {displayEmoji
                  ? <Text style={styles.emojiDisplay}>{displayEmoji}</Text>
                  : <Smile size={26} color="#94A3B8" strokeWidth={1.5} />
                }
              </View>
            </TouchableOpacity>

            {/* Hidden emoji input — focused when icon tapped */}
            <TextInput
              ref={emojiInputRef}
              style={styles.hiddenEmojiInput}
              value={emoji}
              onChangeText={(text) => {
                // Keep only the last character (most recent emoji)
                const chars = [...text];
                if (chars.length > 0) setEmoji(chars[chars.length - 1]);
                else setEmoji('');
              }}
              keyboardType="default"
              multiline={false}
              caretHidden
            />

            <TextInput
              style={styles.nameInput}
              placeholder="Subcategory name"
              placeholderTextColor="#94A3B8"
              value={label}
              onChangeText={setLabel}
              maxLength={24}
              autoFocus
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} activeOpacity={0.8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, !canAdd && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={!canAdd}
              activeOpacity={0.8}
            >
              <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '88%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  categoryName: {
    color: '#2B6CEE',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 28,
  },
  // Dashed outer ring
  outerDash: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Solid inner circle — no border
  innerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiDisplay: {
    fontSize: 26,
  },
  // Invisible — just needs to be focusable to open keyboard
  hiddenEmojiInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  nameInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  addBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#2B6CEE',
  },
  addBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  addText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
