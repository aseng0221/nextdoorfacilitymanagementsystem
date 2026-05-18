import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import { Facility, getFacilities, seedDummyFacilities } from '../services/facilityService';
import { bookFacility, getFacilityBookingsByDate, Booking } from '../services/bookingService';
import { useAuthStore } from '../store/authStore';

export const FacilitiesListScreen = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<number[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
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

  const loadBookingsForFacility = async (facilityId: string) => {
    const today = new Date();
    try {
      const bookings = await getFacilityBookingsByDate(facilityId, today);
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

  const handleOpenBookingModal = async (facility: Facility) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to book a facility.');
      return;
    }
    setSelectedFacility(facility);
    setSelectedSlots([]);
    setBookedSlots([]);
    setIsModalVisible(true);
    await loadBookingsForFacility(facility.id);
  };

  const handleToggleSlot = (hour: number) => {
    setSelectedSlots(prev => {
      let newSlots: number[];
      if (prev.includes(hour)) {
        newSlots = prev.filter(h => h !== hour).sort((a, b) => a - b);
      } else {
        newSlots = [...prev, hour].sort((a, b) => a - b);
      }

      // Ensure slots are contiguous
      for (let i = 0; i < newSlots.length - 1; i++) {
        if (newSlots[i + 1] - newSlots[i] !== 1) {
          Alert.alert('Error', 'Please select contiguous time slots.');
          return prev; // Revert to previous state if non-contiguous
        }
      }
      return newSlots;
    });
  };

  const handleConfirmBooking = async () => {
    if (!user || !selectedFacility || selectedSlots.length === 0) {
      Alert.alert('Error', 'Please select at least one time slot.');
      return;
    }

    try {
      const now = new Date();
      const firstSlot = selectedSlots[0];
      const lastSlot = selectedSlots[selectedSlots.length - 1];

      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), firstSlot, 0, 0).getTime();
      const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), lastSlot + 1, 0, 0).getTime();
      const totalPrice = selectedFacility.pricePerHour * selectedSlots.length;

      await bookFacility(user.uid, selectedFacility.id, selectedFacility.name, totalPrice, startTime, endTime);
      Alert.alert('Success', `Successfully booked ${selectedFacility.name}!`);
      setIsModalVisible(false);
      setSelectedFacility(null);
      setSelectedSlots([]);
    } catch (error) {
      console.error("Failed to book facility", error);
      Alert.alert('Error', 'Failed to book facility. Please try again.');
    }
  };

  const renderTimeSlots = () => {
    // Generate time slots from 7 AM to 10 PM
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
            <Text style={styles.modalTitle}>Select Time for {selectedFacility?.name}</Text>
            <Text style={styles.modalSubtitle}>Today</Text>

            <ScrollView contentContainerStyle={styles.timeSlotsContainer}>
              {renderTimeSlots()}
            </ScrollView>

            {selectedSlots.length > 0 && (
              <View style={styles.bookingSummary}>
                <Text style={styles.summaryText}>
                  Total Price: ${selectedFacility ? selectedFacility.pricePerHour * selectedSlots.length : 0}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.confirmButton, selectedSlots.length === 0 && styles.confirmButtonDisabled]}
              onPress={handleConfirmBooking}
              disabled={selectedSlots.length === 0}
            >
              <Text style={styles.confirmButtonText}>Confirm Booking</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setIsModalVisible(false);
                setSelectedSlots([]);
              }}
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
