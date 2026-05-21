import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { Booking, getUserBookings } from '../services/bookingService';
import { useAuthStore } from '../store/authStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any, any>;
};

export const BookingHistoryScreen = ({ navigation }: Props) => {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadBookings();
      }
    }, [user])
  );

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

  const renderItem = ({ item }: { item: Booking }) => {
    const isActive = item.status === 'Upcoming' || item.status === 'Payment Made' || item.status === 'Pending Payment' || item.status === 'Pending Verification';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('BookingDetail', { booking: item })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.facilityName}>{item.facilityName}</Text>
        </View>
        <View style={[styles.statusBadge, isActive ? styles.statusUpcoming : styles.statusCompleted]}>
          <Text style={[styles.statusText, isActive ? styles.statusTextUpcoming : styles.statusTextCompleted]}>
            {item.status}
          </Text>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsText}>Date: {new Date(item.startTime).toLocaleDateString()}</Text>
          <Text style={styles.detailsText}>Time: {new Date(item.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(item.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
          <Text style={styles.detailsText}>Total: ${item.totalPrice}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
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
    </SafeAreaView>
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
    marginBottom: 4,
  },
  facilityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
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
    marginTop: 4,
  },
  detailsText: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
});
