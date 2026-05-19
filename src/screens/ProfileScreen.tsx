import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import CountryPicker, { Country } from 'react-native-country-picker-modal';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import { getUserProfile, updateUserProfile, UserProfile } from '../services/userService';

export const ProfileScreen = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('MY');
  const [callingCode, setCallingCode] = useState('60');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const data = await getUserProfile(user!.uid);
      if (data) {
        setProfile(data);
        setFullName(data.fullName || '');

        // Very basic parse to split calling code if possible, otherwise just set it all to phoneNumber
        if (data.phoneNumber && data.phoneNumber.startsWith('+')) {
          // Assume +60 for now to prefill correctly, in a real app use libphonenumber-js
          if (data.phoneNumber.startsWith('+60')) {
             setCountryCode('MY');
             setCallingCode('60');
             setPhoneNumber(data.phoneNumber.substring(3));
          } else {
             setPhoneNumber(data.phoneNumber);
          }
        } else {
          setPhoneNumber(data.phoneNumber || '');
        }
      }
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim() || !phoneNumber.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!user) return;

    setIsSaving(true);
    try {
      const fullPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${callingCode}${phoneNumber}`;
      await updateUserProfile(user.uid, {
        fullName: fullName.trim(),
        phoneNumber: fullPhoneNumber,
      });
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const onSelectCountry = (country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Details</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={profile?.email || ''}
            editable={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. John Doe"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.phoneContainer}>
            <View style={styles.countryPickerWrapper}>
              <CountryPicker
                withFilter
                withFlag
                withCallingCode
                withCallingCodeButton
                countryCode={countryCode as any}
                onSelect={onSelectCountry}
              />
            </View>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              placeholder="123456789"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: colors.textLight,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryPickerWrapper: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
  },
  phoneInput: {
    flex: 1,
    height: 56,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
