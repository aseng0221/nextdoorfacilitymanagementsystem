import { firebaseFirestore } from './firebase';

export interface UserProfile {
  email: string | null;
  displayName: string | null;
  fullName?: string;
  phoneNumber?: string;
  walletBalance: number;
  emailVerified: boolean;
  createdAt: number;
}

export const createUserProfile = async (uid: string, email: string, displayName: string) => {
  const userRef = firebaseFirestore.collection('users').doc(uid);
  const profile: UserProfile = {
    email,
    displayName,
    walletBalance: 0,
    emailVerified: false,
    createdAt: Date.now(),
  };
  await userRef.set(profile);
  return profile;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  const userRef = firebaseFirestore.collection('users').doc(uid);
  await userRef.update(data);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const doc = await firebaseFirestore.collection('users').doc(uid).get();
  if (doc.data()) {
    return doc.data() as UserProfile;
  }
  return null;
};

export const topUpWallet = async (uid: string, amount: number) => {
  const userRef = firebaseFirestore.collection('users').doc(uid);
  
  return firebaseFirestore.runTransaction(async (transaction) => {
    const doc = await transaction.get(userRef);

    if (!doc.exists) {
      // Create user doc if it doesn't exist (e.g. user created via Firebase console)
      const newBalance = amount;
      transaction.set(userRef, {
        email: null,
        displayName: 'User',
        walletBalance: newBalance,
        emailVerified: false,
        createdAt: Date.now(),
      });
      return newBalance;
    }

    const newBalance = (doc.data()?.walletBalance || 0) + amount;
    transaction.update(userRef, { walletBalance: newBalance });
    return newBalance;
  });
};
