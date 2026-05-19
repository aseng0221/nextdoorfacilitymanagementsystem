import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { Facility, getFacilities, seedDummyFacilities } from '../services/facilityService';

type Props = {
  navigation: NativeStackNavigationProp<any, any>;
};

export const FacilitiesListScreen = ({ navigation }: Props) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => navigation.navigate('FacilityDetail', { facility: item })}
      >
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
});
