import { firebaseFirestore } from './firebase';

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'top_up' | 'booking' | 'refund';
  description: string;
  createdAt: number;
}

export const getWalletTransactions = async (
  userId: string,
  limitNum: number = 20,
  lastDoc: any = null
): Promise<{ transactions: WalletTransaction[], lastVisible: any }> => {
  let query = firebaseFirestore
    .collection('walletTransactions')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limitNum);

  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }

  const snapshot = await query.get();

  const transactions = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as WalletTransaction[];

  const lastVisible = snapshot.docs[snapshot.docs.length - 1];

  return { transactions, lastVisible };
};
