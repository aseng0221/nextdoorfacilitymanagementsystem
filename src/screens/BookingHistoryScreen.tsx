import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
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
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);

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

  const handleOpenReschedule = async (booking: Booking) => {
    setBookingToReschedule(booking);
    setIsModalVisible(true);
    setSelectedSlots([]);
    setBookedSlots([]);

    try {
      const facility = await getFacilityById(booking.facilityId);
      if (facility) {
        setFacilityPrice(facility.pricePerHour);
      }

      const today = new Date(booking.startTime);
      const otherBookings = await getFacilityBookingsByDate(booking.facilityId, today);

      const bookedHours: number[] = [];
      otherBookings.forEach(otherBooking => {
        // Exclude the current booking's slots so they appear available to the user
        if (otherBooking.status !== 'Cancelled' && otherBooking.id !== booking.id) {
          const startHour = new Date(otherBooking.startTime).getHours();
          const endHour = new Date(otherBooking.endTime).getHours();
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

  const handleToggleSlot = (hour: number) => {
    setSelectedSlots(prev => {
      let newSlots: number[];
      if (prev.includes(hour)) {
        newSlots = prev.filter(h => h !== hour).sort((a, b) => a - b);
      } else {
        newSlots = [...prev, hour].sort((a, b) => a - b);
      }
      for (let i = 0; i < newSlots.length - 1; i++) {
        if (newSlots[i + 1] - newSlots[i] !== 1) {
          Alert.alert('Error', 'Please select contiguous time slots.');
          return prev;
        }
      }
      return newSlots;
    });
  };

  const handleConfirmReschedule = async () => {
    if (!user || !bookingToReschedule || selectedSlots.length === 0) return;

    try {
      const oldDuration = (bookingToReschedule.endTime - bookingToReschedule.startTime) / 3600000;
      const newDuration = selectedSlots.length;

      const priceDifference = (newDuration - oldDuration) * facilityPrice;

      const baseDate = new Date(bookingToReschedule.startTime);
      const firstSlot = selectedSlots[0];
      const lastSlot = selectedSlots[selectedSlots.length - 1];

      const newStartTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), firstSlot, 0, 0).getTime();
      const newEndTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), lastSlot + 1, 0, 0).getTime();

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
      const isSelected = selectedSlots.includes(hour);
      return (
        <TouchableOpacity
          key={hour}
          style={[
            styles.timeSlotButton,
            isBooked ? styles.timeSlotBooked : (isSelected ? styles.timeSlotSelected : null)
          ]}
          onPress={() => handleToggleSlot(hour)}
          disabled={isBooked}
        >
          <Text style={[
            styles.timeSlotText,
            isBooked ? styles.timeSlotTextBooked : (isSelected ? styles.timeSlotTextSelected : null)
          ]}>
            {hour.toString().padStart(2, '0')}:00 - {(hour + 1).toString().padStart(2, '0')}:00
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

            <ScrollView contentContainerStyle={styles.timeSlotsContainer}>
              {renderTimeSlots()}
            </ScrollView>

            {selectedSlots.length > 0 && (
              <View style={styles.bookingSummary}>
                <Text style={styles.summaryText}>
                  Price Difference: ${(selectedSlots.length - ((bookingToReschedule?.endTime || 0) - (bookingToReschedule?.startTime || 0)) / 3600000) * facilityPrice}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.confirmButton, selectedSlots.length === 0 && styles.confirmButtonDisabled]}
              onPress={handleConfirmReschedule}
              disabled={selectedSlots.length === 0}
            >
              <Text style={styles.confirmButtonText}>Confirm Reschedule</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
  bookingSummary: {
    marginBottom: 16,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
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
