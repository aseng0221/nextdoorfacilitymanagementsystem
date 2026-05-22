import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { Plus } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { getUserProfile, UserProfile, topUpWallet } from '../services/userService';
import { getWalletTransactions, WalletTransaction } from '../services/walletService';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any, any>;
};

export const WalletScreen = ({ navigation }: Props) => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getUserProfile(user.uid);
      setProfile(data);

      const { transactions: newTx, lastVisible: newLast } = await getWalletTransactions(user.uid, 20);
      setTransactions(newTx);
      setLastVisible(newLast);
      setHasMore(newTx.length === 20);
    } catch (error) {
      console.error("Failed to load profile or transactions", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const loadMoreTransactions = async () => {
    if (!hasMore || isLoadingMore || !user || !lastVisible) return;

    setIsLoadingMore(true);
    try {
      const { transactions: moreTx, lastVisible: newLast } = await getWalletTransactions(user.uid, 20, lastVisible);
      setTransactions([...transactions, ...moreTx]);
      setLastVisible(newLast);
      setHasMore(moreTx.length === 20);
    } catch (error) {
      console.error("Failed to load more transactions", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleTopUp = () => {
    navigation.navigate('TopUp');
  };

  const renderItem = ({ item }: { item: WalletTransaction }) => {
    const isPositive = item.amount > 0;
    const amountStr = `${isPositive ? '+' : ''}$${Math.abs(item.amount).toFixed(2)}`;

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <Text style={styles.transactionTitle}>{item.description}</Text>
          <Text style={styles.transactionDate}>
            {new Date(item.createdAt).toLocaleString(undefined, {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </Text>
        </View>
        <Text style={isPositive ? styles.transactionAmountPositive : styles.transactionAmountNegative}>
          {amountStr}
        </Text>
      </View>
    );
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
        
        <TouchableOpacity style={styles.topUpButton} onPress={handleTopUp} disabled={isTopUpLoading}>
          {isTopUpLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Plus color={colors.primary} size={20} />
              <Text style={styles.topUpText}>Top Up</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      
      <View style={styles.transactionList}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ padding: 20 }} />
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreTransactions}
            onEndReachedThreshold={0.5}
            ListFooterComponent={isLoadingMore ? <ActivityIndicator color={colors.primary} style={{ padding: 10 }} /> : null}
            ListEmptyComponent={<Text style={styles.emptyText}>No recent transactions.</Text>}
            contentContainerStyle={styles.flatListContent}
          />
        )}
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
  transactionLeft: {
    flex: 1,
    paddingRight: 12,
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
  emptyText: {
    textAlign: 'center',
    color: colors.textLight,
    padding: 20,
  },
  flatListContent: {
    paddingBottom: 24,
  },
});
