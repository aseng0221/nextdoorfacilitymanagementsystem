import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { Booking, getUserBookings } from '../services/bookingService';
import { useAuthStore } from '../store/authStore';

export const BookingHistoryScreen = () => {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    </View>
  );

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
});
