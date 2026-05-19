import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import { User, CreditCard, Building, Clock, LogOut } from 'lucide-react-native';
import { firebaseAuth } from '../services/firebase';

type Props = {
  navigation: NativeStackNavigationProp<any, any>;
};

export const DashboardScreen = ({ navigation }: Props) => {
  const { user, profile } = useAuthStore();

  const handleLogout = async () => {
    try {
      await firebaseAuth.signOut();
    } catch (error) {
      console.error(error);
    }
  };

  const MenuItem = ({ title, icon, onPress }: { title: string, icon: React.ReactNode, onPress: () => void }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <Text style={styles.menuText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{profile?.fullName || user?.displayName || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        <MenuItem 
          title="Book Facility" 
          icon={<Building size={32} color={colors.primary} />} 
          onPress={() => navigation.navigate('FacilitiesList')} 
        />
        <MenuItem 
          title="My Bookings" 
          icon={<Clock size={32} color={colors.primary} />} 
          onPress={() => navigation.navigate('BookingHistory')} 
        />
        <MenuItem 
          title="Wallet" 
          icon={<CreditCard size={32} color={colors.primary} />} 
          onPress={() => navigation.navigate('Wallet')} 
        />
        <MenuItem 
          title="Profile" 
          icon={<User size={32} color={colors.primary} />} 
          onPress={() => navigation.navigate('Profile')}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  greeting: {
    fontSize: 16,
    color: colors.textLight,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '47%',
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 50,
    marginBottom: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});
