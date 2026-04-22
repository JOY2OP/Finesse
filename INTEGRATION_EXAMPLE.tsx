/**
 * Example Integration of Native SMS Transaction System
 * 
 * This example shows how to integrate the native SMS notification system
 * into your existing React Native app.
 */

import React, { useEffect } from 'react';
import { Button, Modal, StyleSheet, Text, View } from 'react-native';
import { useSMSTransactions } from './app/features/sms';

export default function App() {
  const {
    isMonitoring,
    hasPermission,
    pendingTransaction,
    showCategorizationModal,
    requestPermissions,
    dismissCategorization,
    confirmCategorization,
  } = useSMSTransactions();

  // Request permissions on mount
  useEffect(() => {
    if (hasPermission === false) {
      console.log('Requesting SMS permissions...');
      requestPermissions();
    }
  }, [hasPermission, requestPermissions]);

  // Log monitoring status
  useEffect(() => {
    console.log('SMS Monitoring:', isMonitoring ? 'Active' : 'Inactive');
  }, [isMonitoring]);

  // Handle transaction categorization
  const handleCategorize = async (category: string) => {
    if (!pendingTransaction) return;
    
    console.log('Categorizing transaction:', {
      id: pendingTransaction.id,
      amount: pendingTransaction.amount,
      category,
    });

    // TODO: Save to your backend/database
    // await saveTransaction(pendingTransaction, category);

    // Confirm and dismiss
    await confirmCategorization(pendingTransaction.id, category);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SMS Transaction Monitor</Text>
      
      {/* Permission Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>SMS Permission:</Text>
        <Text style={styles.statusValue}>
          {hasPermission === null ? 'Checking...' : hasPermission ? '✅ Granted' : '❌ Denied'}
        </Text>
      </View>

      {/* Monitoring Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Monitoring:</Text>
        <Text style={styles.statusValue}>
          {isMonitoring ? '🟢 Active' : '🔴 Inactive'}
        </Text>
      </View>

      {/* Request Permission Button */}
      {hasPermission === false && (
        <Button
          title="Grant SMS Permission"
          onPress={requestPermissions}
        />
      )}

      {/* Categorization Modal */}
      <Modal
        visible={showCategorizationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={dismissCategorization}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Categorize Transaction</Text>
            
            {pendingTransaction && (
              <>
                {/* Transaction Details */}
                <View style={styles.transactionCard}>
                  <View style={styles.transactionRow}>
                    <Text style={styles.label}>Amount:</Text>
                    <Text style={styles.amount}>
                      ₹{pendingTransaction.amount.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.transactionRow}>
                    <Text style={styles.label}>Type:</Text>
                    <Text style={[
                      styles.type,
                      pendingTransaction.type === 'debit' ? styles.debit : styles.credit
                    ]}>
                      {pendingTransaction.type === 'debit' ? '💸 Debit' : '💰 Credit'}
                    </Text>
                  </View>

                  {pendingTransaction.merchant && (
                    <View style={styles.transactionRow}>
                      <Text style={styles.label}>Merchant:</Text>
                      <Text style={styles.value}>{pendingTransaction.merchant}</Text>
                    </View>
                  )}

                  {pendingTransaction.accountNumber && (
                    <View style={styles.transactionRow}>
                      <Text style={styles.label}>Account:</Text>
                      <Text style={styles.value}>XX{pendingTransaction.accountNumber}</Text>
                    </View>
                  )}

                  <View style={styles.transactionRow}>
                    <Text style={styles.label}>Date:</Text>
                    <Text style={styles.value}>
                      {new Date(pendingTransaction.timestamp).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Category Buttons */}
                <View style={styles.categoryButtons}>
                  <Button
                    title="🍔 Food"
                    onPress={() => handleCategorize('food')}
                  />
                  <Button
                    title="🛒 Shopping"
                    onPress={() => handleCategorize('shopping')}
                  />
                  <Button
                    title="🚗 Transport"
                    onPress={() => handleCategorize('transport')}
                  />
                  <Button
                    title="💡 Utilities"
                    onPress={() => handleCategorize('utilities')}
                  />
                  <Button
                    title="🎬 Entertainment"
                    onPress={() => handleCategorize('entertainment')}
                  />
                  <Button
                    title="📱 Other"
                    onPress={() => handleCategorize('other')}
                  />
                </View>

                {/* Dismiss Button */}
                <Button
                  title="Dismiss"
                  onPress={dismissCategorization}
                  color="#999"
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>How to Test:</Text>
        <Text style={styles.instructionsText}>
          1. Grant SMS permissions{'\n'}
          2. Send a test SMS from another phone:{'\n'}
          "Your A/C XX1234 debited by Rs. 500.00 at Swiggy on 20-Apr-26"{'\n'}
          3. You'll receive a notification{'\n'}
          4. Tap "Categorize" to open this modal{'\n'}
          5. Select a category to save the transaction
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  transactionCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#333',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  type: {
    fontSize: 14,
    fontWeight: '600',
  },
  debit: {
    color: '#e74c3c',
  },
  credit: {
    color: '#27ae60',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  instructions: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1976d2',
  },
  instructionsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
