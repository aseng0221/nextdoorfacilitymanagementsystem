import { firebaseFirestore, firestore } from './firebase';
import { topUpWallet } from './userService';

export interface Booking {
  id: string;
  userId: string;
  facilityId: string;
  facilityName: string;
  startTime: number;
  endTime: number;
  totalPrice: number;
  status: 'Upcoming' | 'Payment Made' | 'Pending Payment' | 'Pending Verification' | 'Completed' | 'Cancelled';
  paymentMethod?: 'Wallet' | 'Cash';
  receiptUrl?: string;
  createdAt: number;
}

export const getFacilityBookingsByDate = async (facilityId: string, date: Date): Promise<Booking[]> => {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

  const snapshot = await firebaseFirestore
    .collection('bookings')
    .where('facilityId', '==', facilityId)
    .where('startTime', '>=', startOfDay)
    .where('startTime', '<', endOfDay)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Booking[];
};

export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  const snapshot = await firebaseFirestore
    .collection('bookings')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
    
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Booking[];
};

export const uploadPaymentReceipt = async (bookingId: string, receiptUrl: string) => {
  const bookingRef = firebaseFirestore.collection('bookings').doc(bookingId);
  await bookingRef.update({
    receiptUrl,
    status: 'Pending Verification',
  });
};

export const rescheduleBooking = async (bookingId: string, userId: string, newStartTime: number, newEndTime: number, priceDifference: number) => {
  // If the new duration is longer, they pay more. If shorter, they get a refund.
  if (priceDifference > 0) {
    // They owe us money (shorter -> longer)
    await topUpWallet(userId, -priceDifference, 'booking', `Reschedule Charge`);
  } else if (priceDifference < 0) {
    // We owe them money (longer -> shorter)
    // Note: since priceDifference is negative, -priceDifference makes it positive
    await topUpWallet(userId, -priceDifference, 'refund', `Reschedule Refund`);
  }

  const bookingRef = firebaseFirestore.collection('bookings').doc(bookingId);

  await bookingRef.update({
    startTime: newStartTime,
    endTime: newEndTime,
    totalPrice: firestore.FieldValue.increment(priceDifference)
  });
};

export const bookFacility = async (
  userId: string,
  facilityId: string,
  facilityName: string,
  price: number,
  startTime: number,
  endTime: number,
  paymentMethod: 'Wallet' | 'Cash' = 'Wallet'
) => {
  // Simple booking logic (deduct from wallet, create booking)
  // In a real app this would be a secure batch/transaction.
  if (paymentMethod === 'Wallet') {
    await topUpWallet(userId, -price, 'booking', `Booking: ${facilityName}`);
  }
  
  const status = paymentMethod === 'Wallet' ? 'Payment Made' : 'Pending Payment';

  const bookingRef = firebaseFirestore.collection('bookings').doc();
  const booking: Omit<Booking, 'id'> = {
    userId,
    facilityId,
    facilityName,
    startTime,
    endTime,
    totalPrice: price,
    status,
    paymentMethod,
    createdAt: Date.now(),
  };
  
  await bookingRef.set(booking);
  return { id: bookingRef.id, ...booking };
};
