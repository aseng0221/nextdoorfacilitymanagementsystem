import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { colors } from '../theme/colors';
import { Booking, getUserBookings, rescheduleBooking, getFacilityBookingsByDate } from '../services/bookingService';
import { getFacilityById } from '../services/facilityService';
import { useAuthStore } from '../store/authStore';

export const BookingHistoryScreen = () => {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reschedule state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [bookingToReschedule, setBookingToReschedule] = useState<Booking | null>(null);
  const [facilityPrice, setFacilityPrice] = useState(0);
  const [bookedSlots, setBookedSlots] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStartHour, setSelectedStartHour] = useState<number | null>(null);
  const [durationHours, setDurationHours] = useState<number>(1);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const data = await getUserBookings(user!.uid);
      setBookings(data);
    } catch (error) {
      console.error("Failed to load bookings", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.facilityName}>{item.facilityName}</Text>
        <View style={[styles.statusBadge, item.status === 'Upcoming' ? styles.statusUpcoming : styles.statusCompleted]}>
          <Text style={[styles.statusText, item.status === 'Upcoming' ? styles.statusTextUpcoming : styles.statusTextCompleted]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsText}>Date: {new Date(item.startTime).toLocaleDateString()}</Text>
        <Text style={styles.detailsText}>Time: {new Date(item.startTime).toLocaleTimeString()} - {new Date(item.endTime).toLocaleTimeString()}</Text>
        <Text style={styles.detailsText}>Total: ${item.totalPrice}</Text>
      </View>
      {item.status === 'Upcoming' && (
        <TouchableOpacity
          style={styles.rescheduleButton}
          onPress={() => handleOpenReschedule(item)}
        >
          <Text style={styles.rescheduleButtonText}>Reschedule</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const loadBookingsForReschedule = async (facilityId: string, dateString: string, currentBookingId: string) => {
    const dateParts = dateString.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);
    const date = new Date(year, month, day);

    try {
      const bookings = await getFacilityBookingsByDate(facilityId, date);
      const bookedHours: number[] = [];
      bookings.forEach(booking => {
        if (booking.status !== 'Cancelled' && booking.id !== currentBookingId) {
          const startHour = new Date(booking.startTime).getHours();
          const endHour = new Date(booking.endTime).getHours();
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

  const handleOpenReschedule = async (booking: Booking) => {
    setBookingToReschedule(booking);

    const initialDate = new Date(booking.startTime);
    // Use local timezone offset to get the correct YYYY-MM-DD
    const localDate = new Date(initialDate.getTime() - initialDate.getTimezoneOffset() * 60000);
    const dateStr = localDate.toISOString().split('T')[0];

    setSelectedDate(dateStr);
    setSelectedStartHour(initialDate.getHours());
    setDurationHours((booking.endTime - booking.startTime) / 3600000);
    setBookedSlots([]);
    setIsModalVisible(true);

    try {
      const facility = await getFacilityById(booking.facilityId);
      if (facility) {
        setFacilityPrice(facility.pricePerHour);
      }
      await loadBookingsForReschedule(booking.facilityId, dateStr, booking.id);
    } catch (error) {
      console.error("Error opening reschedule modal", error);
    }
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    setSelectedStartHour(null);
    setDurationHours(1);
    if (bookingToReschedule) {
      loadBookingsForReschedule(bookingToReschedule.facilityId, day.dateString, bookingToReschedule.id);
    }
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

  const handleConfirmReschedule = async () => {
    if (!user || !bookingToReschedule || selectedStartHour === null || !selectedDate) return;

    try {
      const oldDuration = (bookingToReschedule.endTime - bookingToReschedule.startTime) / 3600000;
      const priceDifference = (durationHours - oldDuration) * facilityPrice;

      const dateParts = selectedDate.split('-');
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);

      const newStartTime = new Date(year, month, day, selectedStartHour, 0, 0).getTime();
      const newEndTime = new Date(year, month, day, selectedStartHour + durationHours, 0, 0).getTime();

      await rescheduleBooking(bookingToReschedule.id, user.uid, newStartTime, newEndTime, priceDifference);
      Alert.alert('Success', 'Successfully rescheduled booking!');
      setIsModalVisible(false);
      setBookingToReschedule(null);
      loadBookings(); // Reload to show updated times
    } catch (error) {
      console.error("Failed to reschedule", error);
      Alert.alert('Error', 'Failed to reschedule. Please try again.');
    }
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
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>No bookings found.</Text>}
        />
      )}

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reschedule Booking</Text>
            <Text style={styles.modalSubtitle}>{bookingToReschedule?.facilityName}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
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
                      Price Difference: ${(durationHours - ((bookingToReschedule?.endTime || 0) - (bookingToReschedule?.startTime || 0)) / 3600000) * facilityPrice}
                    </Text>
                    <Text style={styles.summaryTime}>
                      {selectedStartHour}:00 - {selectedStartHour + durationHours}:00
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.confirmButton, selectedStartHour === null && styles.confirmButtonDisabled]}
                onPress={handleConfirmReschedule}
                disabled={selectedStartHour === null}
              >
                <Text style={styles.confirmButtonText}>Confirm Reschedule</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: colors.textLight,
  },
  listContainer: {
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusUpcoming: {
    backgroundColor: colors.primaryLight,
  },
  statusCompleted: {
    backgroundColor: '#e0e0e0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusTextUpcoming: {
    color: colors.primaryDark,
  },
  statusTextCompleted: {
    color: colors.textLight,
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailsText: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  rescheduleButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  rescheduleButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 16,
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
  durationContainer: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
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
    marginBottom: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.primaryLight,
  },
  confirmButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: colors.error,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
