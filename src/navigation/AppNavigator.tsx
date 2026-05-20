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
import { ReviewBookingScreen } from '../screens/ReviewBookingScreen';
import { RescheduleScreen } from '../screens/RescheduleScreen';
import { ReviewRescheduleScreen } from '../screens/ReviewRescheduleScreen';
import { CompleteProfileScreen } from '../screens/CompleteProfileScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { VerifyEmailScreen } from '../screens/VerifyEmailScreen';
import { getUserProfile } from '../services/userService';
import { Facility } from '../services/facilityService';
import { Booking } from '../services/bookingService';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: undefined;
  CompleteProfile: undefined;
  Dashboard: undefined;
  FacilitiesList: undefined;
  FacilityDetail: { facility: Facility };
  ReviewBooking: {
    facility: Facility;
    startTime: number;
    endTime: number;
    durationHours: number;
    totalPrice: number;
  };
  BookingHistory: undefined;
  Reschedule: { booking: Booking };
  ReviewReschedule: {
    booking: Booking;
    facility: Facility;
    newStartTime: number;
    newEndTime: number;
    newDurationHours: number;
    priceDifference: number;
  };
  Wallet: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const {
    user, setUser,
    isLoading, setLoading,
    isProfileComplete, setIsProfileComplete,
    isEmailVerified, setIsEmailVerified,
    setProfile
  } = useAuthStore();

  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const subscriber = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });

        // Check email verification status
        // Refresh token if needed to get latest emailVerified status
        await firebaseUser.reload();
        setIsEmailVerified(firebaseUser.emailVerified);

        // Check if profile is complete
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setProfile(profile);
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
        setProfile(null);
        setIsProfileComplete(false);
        setIsEmailVerified(false);
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
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        {!user ? (
          // Auth Flow
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        ) : !isEmailVerified ? (
          // Email Verification Flow
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ headerShown: false }} />
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
            <Stack.Screen name="ReviewBooking" component={ReviewBookingScreen} options={{ title: 'Review Booking' }} />
            <Stack.Screen name="BookingHistory" component={BookingHistoryScreen} options={{ title: 'My Bookings' }} />
            <Stack.Screen name="Reschedule" component={RescheduleScreen} options={{ title: 'Reschedule' }} />
            <Stack.Screen name="ReviewReschedule" component={ReviewRescheduleScreen} options={{ title: 'Review Reschedule' }} />
            <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: 'Wallet' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
