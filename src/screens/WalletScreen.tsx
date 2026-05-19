import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Plus } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { getUserProfile, UserProfile } from '../services/userService';

export const WalletScreen = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await getUserProfile(user!.uid);
      setProfile(data);
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.card}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        {isLoading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.balanceAmount}>${profile?.walletBalance?.toFixed(2) || '0.00'}</Text>
        )}
        
        <TouchableOpacity style={styles.topUpButton}>
          <Plus color={colors.primary} size={20} />
          <Text style={styles.topUpText}>Top Up</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      
      <View style={styles.transactionList}>
        <View style={styles.transactionItem}>
          <View>
            <Text style={styles.transactionTitle}>Basketball Court Booking</Text>
            <Text style={styles.transactionDate}>16 May 2026, 14:00</Text>
          </View>
          <Text style={styles.transactionAmountNegative}>-$20.00</Text>
        </View>
        
        <View style={styles.transactionItem}>
          <View>
            <Text style={styles.transactionTitle}>Top Up</Text>
            <Text style={styles.transactionDate}>15 May 2026, 10:00</Text>
          </View>
          <Text style={styles.transactionAmountPositive}>+$50.00</Text>
        </View>
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
  card: {
    backgroundColor: colors.primary,
    padding: 24,
    borderRadius: 16,
    marginBottom: 32,
    alignItems: 'center',
  },
  balanceLabel: {
    color: colors.primaryLight,
    fontSize: 16,
    marginBottom: 8,
  },
  balanceAmount: {
    color: colors.white,
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  topUpButton: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  topUpText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  transactionList: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: colors.textLight,
  },
  transactionAmountNegative: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.error,
  },
  transactionAmountPositive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
  },
});
