import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { firebaseAuth } from '../services/firebase';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { FacilitiesListScreen } from '../screens/FacilitiesListScreen';
import { BookingHistoryScreen } from '../screens/BookingHistoryScreen';
import { FacilityDetailScreen } from '../screens/FacilityDetailScreen';
import { Facility } from '../services/facilityService';
import { CompleteProfileScreen } from '../screens/CompleteProfileScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { getUserProfile } from '../services/userService';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  FacilitiesList: undefined;
  FacilityDetail: { facility: Facility };
  BookingHistory: undefined;
  Wallet: undefined;
  CompleteProfile: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { user, setUser, isLoading, setLoading, isProfileComplete, setIsProfileComplete } = useAuthStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const subscriber = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });

        // Check if profile is complete
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile && profile.fullName && profile.phoneNumber) {
            setIsProfileComplete(true);
          } else {
            setIsProfileComplete(false);
          }
        } catch (error) {
          console.error('Error fetching user profile status:', error);
          setIsProfileComplete(false);
        }
      } else {
        setUser(null);
        setIsProfileComplete(false);
      }
      
      if (initializing) setInitializing(false);
      setLoading(false);
    });
    return subscriber; // unsubscribe on unmount
  }, [initializing]);

  if (initializing) return null; // Or a loading screen

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.white,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!user ? (
          // Auth Flow
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        ) : !isProfileComplete ? (
          // Complete Profile Flow
          <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} options={{ headerShown: false }} />
        ) : (
          // Main App Flow
          <>
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen} 
              options={{ title: 'NextDoor Facility', headerShown: false }}
            />
            <Stack.Screen name="FacilitiesList" component={FacilitiesListScreen} options={{ title: 'Book Facility' }} />
            <Stack.Screen name="FacilityDetail" component={FacilityDetailScreen} options={{ title: 'Facility Details' }} />
            <Stack.Screen name="BookingHistory" component={BookingHistoryScreen} options={{ title: 'My Bookings' }} />
            <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: 'Wallet' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
