import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Calendar } from 'react-native-calendars';
import { colors } from '../theme/colors';
import { getFacilityById, Facility } from '../services/facilityService';
import { getFacilityBookingsByDate, Booking } from '../services/bookingService';

type RootStackParamList = {
  Reschedule: { booking: Booking };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Reschedule'>;

export const RescheduleScreen = ({ route, navigation }: Props) => {
  const { booking } = route.params;
  const [facility, setFacility] = useState<Facility | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [bookedSlots, setBookedSlots] = useState<number[]>([]);
  const [selectedStartHour, setSelectedStartHour] = useState<number | null>(null);
  const [durationHours, setDurationHours] = useState<number>(1);

  useEffect(() => {
    const init = async () => {
      try {
        const fac = await getFacilityById(booking.facilityId);
        setFacility(fac);
      } catch (error) {
        console.error("Failed to load facility for reschedule", error);
      }

      const initialDate = new Date(booking.startTime);
      const localDate = new Date(initialDate.getTime() - initialDate.getTimezoneOffset() * 60000);
      const dateStr = localDate.toISOString().split('T')[0];

      setSelectedDate(dateStr);
      setSelectedStartHour(initialDate.getHours());
      setDurationHours((booking.endTime - booking.startTime) / 3600000);
      await loadBookingsForReschedule(booking.facilityId, dateStr, booking.id);
    };
    init();
  }, [booking]);

  const loadBookingsForReschedule = async (facilityId: string, dateString: string, currentBookingId: string) => {
    const dateParts = dateString.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);
    const date = new Date(year, month, day);

    try {
      const bookings = await getFacilityBookingsByDate(facilityId, date);
      const bookedHours: number[] = [];
      bookings.forEach(b => {
        if (b.status !== 'Cancelled' && b.id !== currentBookingId) {
          const startHour = new Date(b.startTime).getHours();
          const endHour = new Date(b.endTime).getHours();
          for (let i = startHour; i < endHour; i++) {
            bookedHours.push(i);
          }
        }
      });
      setBookedSlots(bookedHours);
    } catch (error) {
      console.error("Failed to load availability for reschedule", error);
    }
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    setSelectedStartHour(null);
    setDurationHours(1);
    loadBookingsForReschedule(booking.facilityId, day.dateString, booking.id);
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

  const handleReviewReschedule = () => {
    if (selectedStartHour === null || !selectedDate || !facility) {
      Alert.alert('Error', 'Please select a date and start time.');
      return;
    }

    const oldDuration = (booking.endTime - booking.startTime) / 3600000;
    const priceDifference = (durationHours - oldDuration) * facility.pricePerHour;

    const dateParts = selectedDate.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);

    const newStartTime = new Date(year, month, day, selectedStartHour, 0, 0).getTime();
    const newEndTime = new Date(year, month, day, selectedStartHour + durationHours, 0, 0).getTime();

    (navigation as any).navigate('ReviewReschedule', {
      booking,
      facility,
      newStartTime,
      newEndTime,
      newDurationHours: durationHours,
      priceDifference
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Reschedule Booking</Text>
        <Text style={styles.subtitle}>{booking.facilityName}</Text>

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
          </View>
        )}

        <TouchableOpacity
          style={[styles.confirmButton, selectedStartHour === null && styles.confirmButtonDisabled]}
          onPress={handleReviewReschedule}
          disabled={selectedStartHour === null}
        >
          <Text style={styles.confirmButtonText}>Review Reschedule</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 24,
  },
  calendar: {
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
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
    marginBottom: 8,
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
    fontSize: 16,
  },
});
