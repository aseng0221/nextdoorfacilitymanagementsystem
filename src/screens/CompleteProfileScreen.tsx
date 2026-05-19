import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import CountryPicker, { Country } from 'react-native-country-picker-modal';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import { updateUserProfile } from '../services/userService';

export const CompleteProfileScreen = () => {
  const { user, setIsProfileComplete } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('MY');
  const [callingCode, setCallingCode] = useState('60');
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    if (!fullName.trim() || !phoneNumber.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!user) return;

    setIsLoading(true);
    try {
      const fullPhoneNumber = `+${callingCode}${phoneNumber}`;
      await updateUserProfile(user.uid, {
        fullName: fullName.trim(),
        phoneNumber: fullPhoneNumber,
      });
      setIsProfileComplete(true);
    } catch (error) {
      console.error('Failed to complete profile', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectCountry = (country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>Please provide your details as per your NRIC.</Text>

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
        onPress={handleComplete}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
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
