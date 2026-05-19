import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import { firebaseAuth } from '../services/firebase';
import { updateUserProfile } from '../services/userService';

export const VerifyEmailScreen = () => {
  const { user, setIsEmailVerified, profile } = useAuthStore();
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleCheckVerified = async () => {
    if (!user) return;
    setIsChecking(true);
    try {
      const currentUser = firebaseAuth.currentUser;
      if (currentUser) {
        // Reload pulls the latest data from the Firebase Auth server
        await currentUser.reload();

        if (currentUser.emailVerified) {
          // Update the custom profile document in Firestore
          await updateUserProfile(user.uid, { emailVerified: true });
          // Update local store to unblock navigation
          setIsEmailVerified(true);
          Alert.alert('Success', 'Your email has been verified!');
        } else {
          Alert.alert('Not Verified', 'We have not detected your verification yet. Please check your inbox and click the link.');
        }
      }
    } catch (error: any) {
      console.error('Error checking verification status', error);
      Alert.alert('Error', error.message || 'An error occurred.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const currentUser = firebaseAuth.currentUser;
      if (currentUser) {
        await currentUser.sendEmailVerification();
        Alert.alert('Sent!', 'A new verification email has been sent to your inbox.');
      }
    } catch (error: any) {
      console.error('Error sending verification email', error);
      Alert.alert('Error', error.message || 'Could not send the email. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We sent a verification link to <Text style={styles.boldText}>{user?.email}</Text>.
          Please check your inbox and click the link to continue.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleCheckVerified}
          disabled={isChecking}
        >
          {isChecking ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>I have verified my email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleResendEmail}
          disabled={isResending}
        >
          {isResending ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.secondaryButtonText}>Resend Email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => firebaseAuth.signOut()}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  boldText: {
    fontWeight: 'bold',
    color: colors.text,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 32,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 16,
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
});
