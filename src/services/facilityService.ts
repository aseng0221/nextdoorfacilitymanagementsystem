import { firebaseFirestore } from './firebase';

export interface Facility {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
  imageUrl?: string;
}

export const getFacilities = async (): Promise<Facility[]> => {
  const snapshot = await firebaseFirestore.collection('facilities').get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Facility[];
};
