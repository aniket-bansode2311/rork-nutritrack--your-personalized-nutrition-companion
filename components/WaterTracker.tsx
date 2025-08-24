import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Droplets, Plus } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';

interface WaterTrackerProps {
  date: string;
}

const QUICK_AMOUNTS = [250, 500, 750, 1000]; // ml

export function WaterTracker({ date }: WaterTrackerProps) {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [dailyGoal] = useState<number>(2000); // ml

  const waterHistoryQuery = trpc.progress.water.history.useQuery({
    period: 'day',
    startDate: date,
    endDate: date,
  });

  const waterLogMutation = trpc.progress.water.log.useMutation({
    onSuccess: () => {
      waterHistoryQuery.refetch();
      setShowModal(false);
      setCustomAmount('');
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to log water intake');
      console.error('Water log error:', error);
    },
  });

  const todayWater = waterHistoryQuery.data || [];
  const totalWater = todayWater.reduce((sum, entry) => sum + entry.amount, 0);
  const progressPercentage = Math.min((totalWater / dailyGoal) * 100, 100);

  const handleQuickAdd = (amount: number) => {
    waterLogMutation.mutate({
      amount,
      timestamp: new Date().toISOString(),
    });
  };

  const handleCustomAdd = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    
    waterLogMutation.mutate({
      amount,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Droplets size={24} color={colors.primary} />
          <Text style={styles.title}>Water Intake</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
          testID="add-water-button"
        >
          <Plus size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercentage}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {totalWater}ml / {dailyGoal}ml
        </Text>
      </View>

      <View style={styles.quickActions}>
        {QUICK_AMOUNTS.map((amount) => (
          <TouchableOpacity
            key={amount}
            style={styles.quickButton}
            onPress={() => handleQuickAdd(amount)}
            disabled={waterLogMutation.isPending}
            testID={`quick-add-${amount}`}
          >
            <Text style={styles.quickButtonText}>+{amount}ml</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Water Intake</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Amount (ml)"
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="numeric"
                testID="custom-water-input"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCustomAdd}
                disabled={waterLogMutation.isPending}
                testID="confirm-water-button"
              >
                <Text style={styles.confirmButtonText}>
                  {waterLogMutation.isPending ? 'Adding...' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickButton: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
  },
  quickButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: colors.lightGray,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
});