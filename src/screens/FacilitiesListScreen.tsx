import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { colors } from '../theme/colors';
import { Facility, getFacilities } from '../services/facilityService';
import { bookFacility } from '../services/bookingService';
import { useAuthStore } from '../store/authStore';

export const FacilitiesListScreen = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    loadFacilities();
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

  const handleOpenBookingModal = (facility: Facility) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to book a facility.');
      return;
    }
    setSelectedFacility(facility);
    setIsModalVisible(true);
  };

  const handleConfirmBooking = async (startHour: number) => {
    if (!user || !selectedFacility) return;

    try {
      const now = new Date();
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, 0, 0).getTime();
      const endTime = startTime + 3600000; // 1 hour later

      await bookFacility(user.uid, selectedFacility.id, selectedFacility.name, selectedFacility.pricePerHour, startTime, endTime);
      Alert.alert('Success', `Successfully booked ${selectedFacility.name}!`);
      setIsModalVisible(false);
      setSelectedFacility(null);
    } catch (error) {
      console.error("Failed to book facility", error);
      Alert.alert('Error', 'Failed to book facility. Please try again.');
    }
  };

  const renderTimeSlots = () => {
    // Generate some mock available time slots for today
    const slots = [9, 10, 11, 13, 14, 15, 16];

    return slots.map(hour => (
      <TouchableOpacity
        key={hour}
        style={styles.timeSlotButton}
        onPress={() => handleConfirmBooking(hour)}
      >
        <Text style={styles.timeSlotText}>
          {hour.toString().padStart(2, '0')}:00 - {(hour + 1).toString().padStart(2, '0')}:00
        </Text>
      </TouchableOpacity>
    ));
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

            <View style={styles.timeSlotsContainer}>
              {renderTimeSlots()}
            </View>

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
  timeSlotText: {
    color: colors.primary,
    fontWeight: '600',
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
