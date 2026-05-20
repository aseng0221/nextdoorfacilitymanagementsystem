import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { Facility } from '../services/facilityService';
import { bookFacility } from '../services/bookingService';
import { useAuthStore } from '../store/authStore';

import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ReviewBooking'>;

export const ReviewBookingScreen = ({ route, navigation }: Props) => {
  const { facility, startTime, endTime, durationHours, totalPrice } = route.params;
  const { user } = useAuthStore();
  const [isBooking, setIsBooking] = useState(false);

  const handleConfirmBooking = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to book a facility.');
      return;
    }

    setIsBooking(true);
    try {
      await bookFacility(user.uid, facility.id, facility.name, totalPrice, startTime, endTime);
      Alert.alert('Success', `Successfully booked ${facility.name}!`, [
        { text: 'OK', onPress: () => navigation.popTo('Dashboard', undefined) }
      ]);
    } catch (error) {
      console.error("Failed to book facility", error);
      Alert.alert('Error', 'Failed to book facility. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const startDate = new Date(startTime);
  const dateString = startDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Format hours nicely (e.g., 09:00 - 11:00)
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:00`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.content}>
        <Text style={styles.title}>Review Booking</Text>

        <View style={styles.card}>
          <Text style={styles.facilityName}>{facility.name}</Text>
          <Text style={styles.facilityType}>{facility.type}</Text>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{dateString}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.value}>{formatTime(startTime)} - {formatTime(endTime)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.value}>{durationHours} Hour{durationHours > 1 ? 's' : ''}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total Price</Text>
            <Text style={styles.totalValue}>${totalPrice}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, isBooking && styles.buttonDisabled]}
          onPress={handleConfirmBooking}
          disabled={isBooking}
        >
          {isBooking ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Confirm Booking</Text>
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
    marginBottom: 4,
  },
  facilityType: {
    fontSize: 16,
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
