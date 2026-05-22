import { firebaseStorage } from './firebase';

export const uploadReceiptToStorage = async (userId: string, imageUri: string, context: string): Promise<string> => {
  const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
  const extension = filename.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const path = `receipts/${userId}/${context}_${timestamp}.${extension}`;

  const reference = firebaseStorage.ref(path);

  // Upload the file to Firebase Storage
  await reference.putFile(imageUri);

  // Get the download URL
  const downloadUrl = await reference.getDownloadURL();
  return downloadUrl;
};
