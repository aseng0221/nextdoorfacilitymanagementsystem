import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { colors } from '../theme/colors';
import { Facility, getFacilities, seedDummyFacilities } from '../services/facilityService';
import { bookFacility, getFacilityBookingsByDate, Booking } from '../services/bookingService';
import { useAuthStore } from '../store/authStore';

export const FacilitiesListScreen = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Booking state
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [bookedSlots, setBookedSlots] = useState<number[]>([]);
  const [selectedStartHour, setSelectedStartHour] = useState<number | null>(null);
  const [durationHours, setDurationHours] = useState<number>(1);

  const { user } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      await seedDummyFacilities();
      loadFacilities();
    };
    init();
  }, []);

  const loadFacilities = async () => {
    setIsLoading(true);
    try {
      const data = await getFacilities();
      setFacilities(data);
    } catch (error) {
      console.error("Failed to load facilities", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleOpenBookingModal = (facility: Facility) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to book a facility.');
      return;
    }

    const today = new Date();
    // Use local timezone offset to get the correct YYYY-MM-DD
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
    const todayStr = localDate.toISOString().split('T')[0];

    setSelectedFacility(facility);
    setSelectedDate(todayStr);
    setSelectedStartHour(null);
    setDurationHours(1);
    setBookedSlots([]);
    setIsModalVisible(true);

    loadBookingsForFacility(facility.id, todayStr);
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    setSelectedStartHour(null);
    setDurationHours(1);
    if (selectedFacility) {
      loadBookingsForFacility(selectedFacility.id, day.dateString);
    }
  };

  const handleSelectStartHour = (hour: number) => {
    setSelectedStartHour(hour);
    setDurationHours(1); // Reset duration when picking a new start time
  };

  const handleDurationChange = (delta: number) => {
    if (selectedStartHour === null) return;

    const newDuration = durationHours + delta;
    if (newDuration < 1 || newDuration > 4) return; // Max 4 hours limit

    // Check if the new duration overlaps with existing bookings
    for (let i = 0; i < newDuration; i++) {
      const hourToCheck = selectedStartHour + i;
      if (bookedSlots.includes(hourToCheck) || hourToCheck > 21) {
        return; // Cannot extend into a booked slot or past 10 PM
      }
    }

    setDurationHours(newDuration);
  };

  const handleConfirmBooking = async () => {
    if (!user || !selectedFacility || selectedStartHour === null || !selectedDate) {
      Alert.alert('Error', 'Please select a date and start time.');
      return;
    }

    try {
      const dateParts = selectedDate.split('-');
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
      const day = parseInt(dateParts[2], 10);

      const startTime = new Date(year, month, day, selectedStartHour, 0, 0).getTime();
      const endTime = new Date(year, month, day, selectedStartHour + durationHours, 0, 0).getTime();
      const totalPrice = selectedFacility.pricePerHour * durationHours;

      await bookFacility(user.uid, selectedFacility.id, selectedFacility.name, totalPrice, startTime, endTime);
      Alert.alert('Success', `Successfully booked ${selectedFacility.name}!`);
      setIsModalVisible(false);
      setSelectedFacility(null);
      setSelectedStartHour(null);
      setDurationHours(1);
    } catch (error) {
      console.error("Failed to book facility", error);
      Alert.alert('Error', 'Failed to book facility. Please try again.');
    }
  };

  const renderTimeSlots = () => {
    // Generate time slots from 7 AM to 10 PM (22:00 is the last slot)
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

  const renderItem = ({ item }: { item: Facility }) => (
    <View style={styles.card}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.cardContent}>
        <View>
          <Text style={styles.facilityName}>{item.name}</Text>
          <Text style={styles.facilityType}>{item.type}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${item.pricePerHour}</Text>
          <Text style={styles.priceUnit}>/hr</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.bookButton} onPress={() => handleOpenBookingModal(item)}>
        <Text style={styles.bookButtonText}>Book Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={facilities}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
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
            <Text style={styles.modalTitle}>{selectedFacility?.name}</Text>

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
                      Total Price: ${selectedFacility ? selectedFacility.pricePerHour * durationHours : 0}
                    </Text>
                    <Text style={styles.summaryTime}>
                      {selectedStartHour}:00 - {selectedStartHour + durationHours}:00
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.confirmButton, selectedStartHour === null && styles.confirmButtonDisabled]}
                onPress={handleConfirmBooking}
                disabled={selectedStartHour === null}
              >
                <Text style={styles.confirmButtonText}>Confirm Booking</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsModalVisible(false);
                  setSelectedStartHour(null);
                  setDurationHours(1);
                }}
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
  listContainer: {
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  imagePlaceholder: {
    height: 150,
    backgroundColor: colors.primaryLight,
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  facilityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  facilityType: {
    fontSize: 14,
    color: colors.textLight,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  priceUnit: {
    fontSize: 12,
    color: colors.textLight,
  },
  bookButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
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
    marginBottom: 8,
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
