import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import { uploadReceiptToStorage } from '../services/storageService';
import { createTopUpRequest } from '../services/walletService';

type Props = {
  navigation: NativeStackNavigationProp<any, any>;
};

export const TopUpScreen = ({ navigation }: Props) => {
  const { user } = useAuthStore();
  const [amountStr, setAmountStr] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectReceipt = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
    });

    if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in.');
      return;
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid top up amount.');
      return;
    }

    if (!receiptUri) {
      Alert.alert('Missing Receipt', 'Please upload a screenshot of your payment transfer.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload the image to Firebase Storage
      const receiptUrl = await uploadReceiptToStorage(user.uid, receiptUri, 'topup');

      // 2. Create the top up request record
      await createTopUpRequest(user.uid, amount, receiptUrl);

      Alert.alert('Success', 'Top up request submitted. Please wait for admin verification.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Failed to submit top up request', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          <Text style={styles.title}>Top Up Wallet</Text>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Bank Transfer Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Bank Name:</Text>
              <Text style={styles.value}>Maybank</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Account Number:</Text>
              <Text style={styles.value}>112233445566</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Account Name:</Text>
              <Text style={styles.value}>NextDoor Facility Admin</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>DuitNow QR</Text>
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrText}>[ DuitNow QR Image ]</Text>
              {/* In a real app, you would use an <Image> tag here with the QR code source */}
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Top Up Amount ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 50.00"
              keyboardType="decimal-pad"
              value={amountStr}
              onChangeText={setAmountStr}
            />
          </View>

          <View style={styles.uploadSection}>
            <Text style={styles.inputLabel}>Payment Receipt</Text>
            {receiptUri ? (
              <View style={styles.receiptPreviewContainer}>
                <Image source={{ uri: receiptUri }} style={styles.receiptPreview} resizeMode="cover" />
                <TouchableOpacity style={styles.changeReceiptBtn} onPress={handleSelectReceipt}>
                  <Text style={styles.changeReceiptText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadBtn} onPress={handleSelectReceipt}>
                <Text style={styles.uploadBtnText}>Select Receipt Image</Text>
              </TouchableOpacity>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Submit Top Up Request</Text>
          )}
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
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: colors.textLight,
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  qrPlaceholder: {
    width: 150,
    height: 150,
    backgroundColor: '#e0e0e0',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 8,
  },
  qrText: {
    color: colors.textLight,
    fontWeight: 'bold',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  uploadSection: {
    marginBottom: 24,
  },
  uploadBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  uploadBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  receiptPreviewContainer: {
    alignItems: 'center',
  },
  receiptPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  changeReceiptBtn: {
    padding: 8,
  },
  changeReceiptText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.primaryLight,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});