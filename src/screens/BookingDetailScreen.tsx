import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { Booking, uploadPaymentReceipt } from '../services/bookingService';

import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingDetail'>;

export const BookingDetailScreen = ({ route, navigation }: Props) => {
  const { booking } = route.params;
  const [isUploading, setIsUploading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(booking.status);

  const isWithin24Hours = (booking.startTime - Date.now()) < 24 * 60 * 60 * 1000;
  const canReschedule = ['Upcoming', 'Payment Made', 'Pending Payment', 'Pending Verification'].includes(currentStatus);

  const handleUploadReceipt = async () => {
    setIsUploading(true);
    try {
      // Simulate receipt upload delay
      await new Promise(resolve => setTimeout(() => resolve(undefined), 1500));

      const dummyUrl = 'https://example.com/dummy-receipt.png';
      await uploadPaymentReceipt(booking.id, dummyUrl);

      setCurrentStatus('Pending Verification');
      Alert.alert('Success', 'Receipt uploaded successfully. Waiting for admin verification.');
    } catch (error) {
      console.error("Failed to upload receipt", error);
      Alert.alert('Error', 'Failed to upload receipt. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const dateString = new Date(booking.startTime).toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const durationHours = (booking.endTime - booking.startTime) / (1000 * 60 * 60);

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.facilityName}>{booking.facilityName}</Text>

          <View style={[styles.statusBadge, canReschedule ? styles.statusUpcoming : styles.statusCompleted]}>
            <Text style={[styles.statusText, canReschedule ? styles.statusTextUpcoming : styles.statusTextCompleted]}>
              {currentStatus}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{dateString}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.value}>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.value}>{durationHours} Hour{durationHours > 1 ? 's' : ''}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>{booking.paymentMethod || 'Wallet'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total Price</Text>
            <Text style={styles.totalValue}>${booking.totalPrice}</Text>
          </View>
        </View>

        {currentStatus === 'Pending Payment' && (
          <View style={styles.actionSection}>
            <Text style={styles.actionPrompt}>Please upload your payment receipt.</Text>
            <TouchableOpacity
              style={[styles.button, styles.uploadButton, isUploading && styles.buttonDisabled]}
              onPress={handleUploadReceipt}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Upload Receipt</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {canReschedule && (
          <View style={styles.actionSection}>
            {isWithin24Hours ? (
              <Text style={styles.noRescheduleText}>Cannot reschedule within 24 hours of start time.</Text>
            ) : (
              <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('Reschedule', { booking })}
              >
                <Text style={styles.buttonText}>Reschedule Booking</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  facilityName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusUpcoming: {
    backgroundColor: colors.primaryLight,
  },
  statusCompleted: {
    backgroundColor: '#e0e0e0',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusTextUpcoming: {
    color: colors.primaryDark,
  },
  statusTextCompleted: {
    color: colors.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: colors.textLight,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actionSection: {
    marginBottom: 16,
  },
  actionPrompt: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#2196F3',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  noRescheduleText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.error,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
