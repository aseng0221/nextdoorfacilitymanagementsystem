import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Calendar } from 'react-native-calendars';
import { colors } from '../theme/colors';
import { Facility } from '../services/facilityService';
import { getFacilityBookingsByDate } from '../services/bookingService';
import { useAuthStore } from '../store/authStore';

import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'FacilityDetail'>;

export const FacilityDetailScreen = ({ route, navigation }: Props) => {
  const { facility } = route.params;
  const { user } = useAuthStore();

  // Booking state
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [bookedSlots, setBookedSlots] = useState<number[]>([]);
  const [selectedStartHour, setSelectedStartHour] = useState<number | null>(null);
  const [durationHours, setDurationHours] = useState<number>(1);

  useEffect(() => {
    const init = async () => {
      const today = new Date();
      const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
      const todayStr = localDate.toISOString().split('T')[0];

      setSelectedDate(todayStr);
      await loadBookingsForFacility(facility.id, todayStr);
    };
    init();
  }, [facility.id]);

  const loadBookingsForFacility = async (facilityId: string, dateString: string) => {
    const dateParts = dateString.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);
    const date = new Date(year, month, day);

    try {
      const bookings = await getFacilityBookingsByDate(facilityId, date);
      const bookedHours: number[] = [];
      bookings.forEach(booking => {
        if (booking.status !== 'Cancelled') {
          const startHour = new Date(booking.startTime).getHours();
          const endHour = new Date(booking.endTime).getHours();
          for (let i = startHour; i < endHour; i++) {
            bookedHours.push(i);
          }
        }
      });
      setBookedSlots(bookedHours);
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    }
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    setSelectedStartHour(null);
    setDurationHours(1);
    loadBookingsForFacility(facility.id, day.dateString);
  };

  const handleSelectStartHour = (hour: number) => {
    setSelectedStartHour(hour);
    setDurationHours(1);
  };

  const handleDurationChange = (delta: number) => {
    if (selectedStartHour === null) return;

    const newDuration = durationHours + delta;
    if (newDuration < 1 || newDuration > 4) return;

    for (let i = 0; i < newDuration; i++) {
      const hourToCheck = selectedStartHour + i;
      if (bookedSlots.includes(hourToCheck) || hourToCheck > 21) {
        return;
      }
    }

    setDurationHours(newDuration);
  };

  const handleReviewBooking = () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to book a facility.');
      return;
    }
    if (selectedStartHour === null || !selectedDate) {
      Alert.alert('Error', 'Please select a date and start time.');
      return;
    }

    const dateParts = selectedDate.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);

    const startTime = new Date(year, month, day, selectedStartHour, 0, 0).getTime();
    const endTime = new Date(year, month, day, selectedStartHour + durationHours, 0, 0).getTime();
    const totalPrice = facility.pricePerHour * durationHours;

    // Navigate to Review screen
    navigation.navigate('ReviewBooking', {
      facility,
      startTime,
      endTime,
      durationHours,
      totalPrice
    });
  };

  const renderTimeSlots = () => {
    const slots = Array.from({ length: 15 }, (_, i) => i + 7);

    return slots.map(hour => {
      const isBooked = bookedSlots.includes(hour);
      const isSelected = selectedStartHour !== null && hour >= selectedStartHour && hour < selectedStartHour + durationHours;
      const isStartSlot = selectedStartHour === hour;

      return (
        <TouchableOpacity
          key={hour}
          style={[
            styles.timeSlotButton,
            isBooked ? styles.timeSlotBooked : (isSelected ? styles.timeSlotSelected : null)
          ]}
          onPress={() => handleSelectStartHour(hour)}
          disabled={isBooked}
        >
          <Text style={[
            styles.timeSlotText,
            isBooked ? styles.timeSlotTextBooked : (isSelected ? styles.timeSlotTextSelected : null)
          ]}>
            {hour.toString().padStart(2, '0')}:00 {isStartSlot ? '(Start)' : ''}
          </Text>
        </TouchableOpacity>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imagePlaceholder} />

      <View style={styles.headerInfo}>
        <View style={styles.titleContainer}>
          <Text style={styles.facilityName}>{facility.name}</Text>
          <Text style={styles.facilityType}>{facility.type}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${facility.pricePerHour}</Text>
          <Text style={styles.priceUnit}>/hr</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionHeading}>Select Date</Text>
        <Calendar
          current={selectedDate}
          onDayPress={handleDateSelect}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: colors.primary }
          }}
          minDate={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
          theme={{
            todayTextColor: colors.primary,
            selectedDayBackgroundColor: colors.primary,
            arrowColor: colors.primary,
          }}
          style={styles.calendar}
        />

        <Text style={styles.sectionHeading}>Select Start Time</Text>
        <View style={styles.timeSlotsContainer}>
          {renderTimeSlots()}
        </View>

        {selectedStartHour !== null && (
          <View style={styles.durationContainer}>
            <Text style={styles.sectionHeading}>Duration</Text>
            <View style={styles.durationControls}>
              <TouchableOpacity
                style={styles.durationBtn}
                onPress={() => handleDurationChange(-1)}
              >
                <Text style={styles.durationBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.durationText}>{durationHours} Hour{durationHours > 1 ? 's' : ''}</Text>
              <TouchableOpacity
                style={styles.durationBtn}
                onPress={() => handleDurationChange(1)}
              >
                <Text style={styles.durationBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bookingSummary}>
              <Text style={styles.summaryText}>
                Total Price: ${facility.pricePerHour * durationHours}
              </Text>
              <Text style={styles.summaryTime}>
                {selectedStartHour}:00 - {selectedStartHour + durationHours}:00
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.confirmButton,
            selectedStartHour === null && styles.confirmButtonDisabled
          ]}
          onPress={handleReviewBooking}
          disabled={selectedStartHour === null}
        >
          <Text style={styles.confirmButtonText}>
            Review Booking
          </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: colors.primaryLight,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  facilityName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  facilityType: {
    fontSize: 16,
    color: colors.textLight,
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  priceUnit: {
    fontSize: 14,
    color: colors.textLight,
  },
  content: {
    padding: 24,
  },
  calendar: {
    marginBottom: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeSlotButton: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 12,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: colors.primary,
  },
  timeSlotBooked: {
    backgroundColor: '#e0e0e0',
    borderColor: '#bdbdbd',
  },
  timeSlotText: {
    color: colors.primary,
    fontWeight: '600',
  },
  timeSlotTextSelected: {
    color: colors.white,
  },
  timeSlotTextBooked: {
    color: '#9e9e9e',
    textDecorationLine: 'line-through',
  },
  durationContainer: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  durationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  durationBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBtnText: {
    fontSize: 24,
    color: colors.primaryDark,
    fontWeight: 'bold',
  },
  durationText: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 24,
    color: colors.text,
  },
  bookingSummary: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  summaryTime: {
    fontSize: 14,
    color: colors.textLight,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.primaryLight,
  },
  confirmButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
});
