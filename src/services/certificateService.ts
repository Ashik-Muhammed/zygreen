import { db } from '../firebase';
import { addDoc, collection, getDoc, doc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { Certificate, CertificateVerification } from '../types/certificate';
import { v4 as uuidv4 } from 'uuid';

export const generateVerificationCode = (): string => {
  return `CERT-${uuidv4().substring(0, 8).toUpperCase()}`;
};

export const createCertificate = async (certificateData: Omit<Certificate, 'id' | 'verificationCode'>): Promise<Certificate> => {
  try {
    const certificate: Omit<Certificate, 'id'> = {
      ...certificateData,
      issueDate: new Date(),
      verificationCode: generateVerificationCode(),
    };

    const docRef = await addDoc(collection(db, 'certificates'), certificate);
    
    // Generate certificate URL (in production, this would be a cloud function or API endpoint)
    const certificateUrl = await generateCertificatePdf({
      ...certificate,
      id: docRef.id,
    });

    // Update the certificate with the generated URL
    await updateDoc(doc(db, 'certificates', docRef.id), {
      certificateUrl,
    });

    return {
      ...certificate,
      id: docRef.id,
      certificateUrl,
    };
  } catch (error) {
    console.error('Error creating certificate:', error);
    throw new Error('Failed to create certificate');
  }
};

export const getCertificateById = async (certificateId: string): Promise<Certificate | null> => {
  try {
    const docRef = doc(db, 'certificates', certificateId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Certificate;
    }
    return null;
  } catch (error) {
    console.error('Error fetching certificate:', error);
    throw new Error('Failed to fetch certificate');
  }
};

export const getCertificatesByUser = async (userId: string): Promise<Certificate[]> => {
  try {
    const q = query(
      collection(db, 'certificates'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Certificate[];
  } catch (error) {
    console.error('Error fetching user certificates:', error);
    throw new Error('Failed to fetch user certificates');
  }
};

export const verifyCertificate = async (verificationCode: string): Promise<CertificateVerification> => {
  try {
    const q = query(
      collection(db, 'certificates'),
      where('verificationCode', '==', verificationCode)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        isValid: false,
        verifiedAt: new Date(),
      } as CertificateVerification;
    }

    const certData = querySnapshot.docs[0].data() as Certificate;
    
    return {
      ...certData,
      id: querySnapshot.docs[0].id,
      isValid: true,
      verifiedAt: new Date(),
    };
  } catch (error) {
    console.error('Error verifying certificate:', error);
    throw new Error('Failed to verify certificate');
  }
};

// This would be implemented with a PDF generation library or API
const generateCertificatePdf = async (certificate: Certificate): Promise<string> => {
  // In a real implementation, this would generate a PDF and upload it to storage
  // For now, we'll return a placeholder URL
  return `https://your-app.com/certificates/${certificate.id}/download`;
};

// Check if user is eligible for a certificate
export const checkCertificateEligibility = async (_userId: string, _courseId: string): Promise<{ eligible: boolean; reason?: string }> => {
  try {
    // In a real implementation, you would check:
    // 1. If all course modules are completed
    // 2. If all quizzes are passed
    // 3. If all assignments are submitted and approved
    // 4. If certificate wasn't already issued
    
    // For now, we'll return a mock response
    return { eligible: true };
  } catch (error) {
    console.error('Error checking certificate eligibility:', error);
    return { eligible: false, reason: 'Error checking eligibility' };
  }
};
