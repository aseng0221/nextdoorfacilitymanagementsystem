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

export const getFacilityById = async (facilityId: string): Promise<Facility | null> => {
  const doc = await firebaseFirestore.collection('facilities').doc(facilityId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Facility;
};

export const seedDummyFacilities = async () => {
  const snapshot = await firebaseFirestore.collection('facilities').limit(1).get();
  if (!snapshot.empty) {
    return; // Already seeded
  }

  const dummyFacilities: Omit<Facility, 'id'>[] = [
    { name: 'Downtown Basketball Court A', type: 'Basketball', pricePerHour: 20 },
    { name: 'Downtown Basketball Court B', type: 'Basketball', pricePerHour: 20 },
    { name: 'Community Center Badminton Court 1', type: 'Badminton', pricePerHour: 15 },
    { name: 'Community Center Badminton Court 2', type: 'Badminton', pricePerHour: 15 },
    { name: 'Community Center Badminton Court 3', type: 'Badminton', pricePerHour: 15 },
    { name: 'Riverside Pickleball Court 1', type: 'Pickleball', pricePerHour: 25 },
    { name: 'Riverside Pickleball Court 2', type: 'Pickleball', pricePerHour: 25 },
  ];

  const batch = firebaseFirestore.batch();
  dummyFacilities.forEach(facility => {
    const docRef = firebaseFirestore.collection('facilities').doc();
    batch.set(docRef, facility);
  });

  await batch.commit();
};
