import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { Facility } from '../services/facilityService';
import { Booking, rescheduleBooking } from '../services/bookingService';
import { useAuthStore } from '../store/authStore';

import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ReviewReschedule'>;

export const ReviewRescheduleScreen = ({ route, navigation }: Props) => {
  const { booking, facility, newStartTime, newEndTime, newDurationHours, priceDifference } = route.params;
  const { user } = useAuthStore();
  const [isRescheduling, setIsRescheduling] = useState(false);

  const handleConfirmReschedule = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in.');
      return;
    }

    setIsRescheduling(true);
    try {
      await rescheduleBooking(booking.id, user.uid, newStartTime, newEndTime, priceDifference);
      Alert.alert('Success', 'Successfully rescheduled booking!', [
        { text: 'OK', onPress: () => navigation.popTo('BookingHistory', undefined) }
      ]);
    } catch (error) {
      console.error("Failed to reschedule", error);
      Alert.alert('Error', 'Failed to reschedule. Please try again.');
    } finally {
      setIsRescheduling(false);
    }
  };

  const oldDate = new Date(booking.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const newDate = new Date(newStartTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:00`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.content}>
        <Text style={styles.title}>Review Reschedule</Text>

        <View style={styles.card}>
          <Text style={styles.facilityName}>{facility.name}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Previous Booking</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.valueStrikethrough}>{oldDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.valueStrikethrough}>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>New Booking</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.valueHighlight}>{newDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.valueHighlight}>{formatTime(newStartTime)} - {formatTime(newEndTime)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.value}>{newDurationHours} Hour{newDurationHours > 1 ? 's' : ''}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.totalLabel}>Price Difference</Text>
            <Text style={[styles.totalValue, priceDifference > 0 ? styles.priceCharge : styles.priceRefund]}>
              {priceDifference > 0 ? '+' : ''}${priceDifference.toFixed(2)}
            </Text>
          </View>
          {priceDifference < 0 && (
            <Text style={styles.refundNotice}>The difference will be refunded to your wallet.</Text>
          )}
          {priceDifference > 0 && (
            <Text style={styles.chargeNotice}>The difference will be deducted from your wallet.</Text>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, isRescheduling && styles.buttonDisabled]}
          onPress={handleConfirmReschedule}
          disabled={isRescheduling}
        >
          {isRescheduling ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Confirm Reschedule</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  facilityName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textLight,
    textTransform: 'uppercase',
    marginBottom: 12,
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
  valueStrikethrough: {
    fontSize: 16,
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },
  valueHighlight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  priceCharge: {
    color: colors.error,
  },
  priceRefund: {
    color: colors.success,
  },
  refundNotice: {
    fontSize: 12,
    color: colors.success,
    textAlign: 'right',
    marginTop: 4,
  },
  chargeNotice: {
    fontSize: 12,
    color: colors.error,
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.primaryLight,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
