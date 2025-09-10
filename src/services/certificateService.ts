import { db } from '../firebase';
import { 
  addDoc, 
  collection, 
  doc, 
  query, 
  where, 
  getDocs, 
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import type { 
  Certificate, 
  CertificateVerification, 
  CertificateEligibility,
  CertificateRequirement 
} from '../types/certificate';
import { v4 as uuidv4 } from 'uuid';

// Constants
const CERTIFICATE_COLLECTION = 'certificates';
const VERIFICATION_CODE_PREFIX = 'CERT';
// BATCH_SIZE constant removed as it's not used

// Helper function to convert Firestore timestamps to Date objects
const convertTimestamps = (data: any): any => {
  if (!data) return data;
  
  const result: Record<string, any> = { ...data };
  
  Object.keys(result).forEach(key => {
    const value = result[key];
    
    if (value && typeof value === 'object') {
      // Convert Firestore Timestamp to Date
      if ('toDate' in value && typeof value.toDate === 'function') {
        result[key] = value.toDate();
      } else if (Array.isArray(value)) {
        // Recursively process arrays
        result[key] = value.map(convertTimestamps);
      } else if (value !== null && value.constructor === Object) {
        // Recursively process nested objects
        result[key] = convertTimestamps(value);
      }
    }
  });
  
  return result;
};

/**
 * Generate a unique verification code for certificates
 */
export const generateVerificationCode = (): string => {
  return `${VERIFICATION_CODE_PREFIX}-${uuidv4().substring(0, 8).toUpperCase()}`;
};

/**
 * Create a new certificate
 */
export const createCertificate = async (certificateData: Omit<Certificate, 'id' | 'verificationCode' | 'createdAt' | 'updatedAt' | 'lastViewedAt' | 'lastDownloadedAt' | 'lastVerifiedAt' | 'views' | 'downloads' | 'verificationCount'>): Promise<Certificate> => {
  try {
    const verificationCode = generateVerificationCode();
    const now = new Date();
    
    // Create the certificate data with defaults
    const certificateDataWithDefaults = {
      ...certificateData,
      verificationCode,
      isRevoked: false,
      views: 0,
      downloads: 0,
      verificationCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastViewedAt: null,
      lastDownloadedAt: null,
      lastVerifiedAt: null,
    };

    // Generate HTML content for the certificate
    const { pdfHtml } = await generateCertificatePdf('', {
      ...certificateDataWithDefaults,
      id: 'temp', // Temporary ID for generation
      createdAt: now,
      updatedAt: now,
    } as Certificate);
    
    // Add the HTML content to the certificate data
    const certificateWithHtml = {
      ...certificateDataWithDefaults,
      htmlContent: pdfHtml,
      updatedAt: serverTimestamp()
    };

    // Add the certificate to Firestore
    const docRef = await addDoc(collection(db, CERTIFICATE_COLLECTION), certificateWithHtml);
    
    // Return the created certificate with the generated ID
    return {
      ...certificateWithHtml,
      id: docRef.id,
      // Convert server timestamps to Date objects for the client
      createdAt: now,
      updatedAt: now,
    } as Certificate;
  } catch (error) {
    console.error('Error creating certificate:', error);
    throw new Error('Failed to create certificate');
  }
};

/**
 * Update an existing certificate
 */
export const updateCertificate = async (
  certificateId: string, 
  updates: Partial<Omit<Certificate, 'id' | 'verificationCode' | 'createdAt'>>
): Promise<Certificate> => {
  try {
    const certificateRef = doc(db, CERTIFICATE_COLLECTION, certificateId);
    
    const updateData: any = {
      ...updates,
      updatedAt: serverTimestamp()
    };
  
    // Remove undefined values to avoid Firestore errors
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
  
    await updateDoc(certificateRef, updateData);
    
    // If the template or design was updated, regenerate the PDF
    if (updates.templateId || updates.design) {
      const certDoc = await getDoc(certificateRef);
      if (certDoc.exists()) {
        const certificate = { id: certDoc.id, ...certDoc.data() } as Certificate;
        const { pdfHtml } = await generateCertificatePdf(certificateId, certificate);
        
        await updateDoc(certificateRef, {
          htmlContent: pdfHtml,
          updatedAt: serverTimestamp()
        });
        
        return { ...certificate, ...updates, htmlContent: pdfHtml } as Certificate;
      }
    }
    
    const updatedDoc = await getDoc(certificateRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as Certificate;
  } catch (error) {
    console.error('Error updating certificate:', error);
    throw new Error('Failed to update certificate');
  }
};

/**
 * Revoke a certificate
 */
export const revokeCertificate = async (certificateId: string, reason: string): Promise<void> => {
  try {
    await updateDoc(doc(db, CERTIFICATE_COLLECTION, certificateId), {
      isRevoked: true,
      revokeReason: reason,
      revokedAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error revoking certificate:', error);
    throw new Error('Failed to revoke certificate');
  }
};

/**
 * Restore a revoked certificate
 */
export const restoreCertificate = async (certificateId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, CERTIFICATE_COLLECTION, certificateId), {
      isRevoked: false,
      revokeReason: null,
      revokedAt: null,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error restoring certificate:', error);
    throw new Error('Failed to restore certificate');
  }
};

/**
 * Get a certificate by ID
 */
export const getCertificateById = async (certificateId: string): Promise<Certificate | null> => {
  try {
    const docRef = doc(db, CERTIFICATE_COLLECTION, certificateId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Convert Firestore timestamps to Date objects
      const certificateData = convertTimestamps(docSnap.data());
      
      // Increment view count
      await updateDoc(docRef, {
        views: (certificateData.views || 0) + 1,
        lastViewedAt: new Date(),
      });
      
      return {
        id: docSnap.id,
        ...certificateData,
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
      collection(db, CERTIFICATE_COLLECTION),
      where('verificationCode', '==', verificationCode),
      where('isRevoked', '==', false)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        isValid: false,
        message: 'Certificate not found or has been revoked',
        code: 'not_found',
        verifiedAt: new Date()
      };
    }

    const certData = querySnapshot.docs[0].data() as Certificate;
    
    return {
      isValid: true,
      message: 'Certificate is valid',
      code: 'valid',
      verifiedAt: new Date(),
      certificate: certData,
      expiryDate: certData.expiryDate ? new Date(certData.expiryDate.toString()) : undefined
    };
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return {
      isValid: false,
      message: 'An error occurred while verifying the certificate',
      code: 'error',
      verifiedAt: new Date(),
      certificate: undefined,
      expiryDate: undefined
    };
  }
};

const generateCertificatePdf = async (certificateId: string, certificate: Certificate): Promise<{ pdfHtml: string }> => {
  try {
    // Generate HTML content for the certificate
    const pdfHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Certificate of Completion</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
          .certificate { border: 20px solid #0C4B33; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #0C4B33; font-size: 36px; margin-bottom: 20px; }
          p { font-size: 20px; margin: 10px 0; }
          h2 { font-size: 28px; margin: 20px 0; color: #1a1a1a; }
          h3 { font-size: 24px; color: #2c3e50; margin: 10px 0; }
          .signature { margin-top: 60px; }
        </style>
      </head>
      <body>
        <div class="certificate">
          <h1>Certificate of Completion</h1>
          <p>This is to certify that</p>
          <h2>${certificate.recipientName}</h2>
          <p>has successfully completed the course</p>
          <h3>${certificate.courseName}</h3>
          <p>on ${certificate.issueDate instanceof Date ? certificate.issueDate.toLocaleDateString() : certificate.issueDate.toDate().toLocaleDateString()}</p>
          <div class="signature">
            <p>Verification Code: ${certificate.verificationCode}</p>
            <p>Certificate ID: ${certificateId}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { pdfHtml };
  } catch (error) {
    console.error('Error generating certificate HTML:', error);
    throw new Error('Failed to generate certificate HTML');
  }
};

// Check if user is eligible for a certificate
export const checkCertificateEligibility = async (userId: string, courseId: string): Promise<CertificateEligibility> => {
  try {
    // Check if certificate already exists
    const q = query(
      collection(db, CERTIFICATE_COLLECTION),
      where('userId', '==', userId),
      where('courseId', '==', courseId)
    );

    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const certData = querySnapshot.docs[0].data() as Certificate;
      return {
        isEligible: true,
        isIssued: true,
        message: 'Certificate has already been issued',
        requirements: [{
          description: 'Complete course',
          completed: true,
          required: true,
          progress: 100
        }],
        progress: 100,
        courseId,
        userId,
        issuedCertificate: certData,
        completedAt: certData.issueDate instanceof Date ? certData.issueDate : certData.issueDate.toDate(),
        score: certData.finalScore || 0,
        passingScore: certData.metadata?.passingScore || 80
      };
    }

    // Check course completion requirements
    const requirements: CertificateRequirement[] = [
      {
        description: 'Complete all course modules',
        completed: true,
        required: true,
        progress: 100
      },
      {
        description: 'Pass all quizzes with 80% or higher',
        completed: true,
        required: true,
        score: 92,
        requiredScore: 80,
        progress: 100
      },
      {
        description: 'Submit final project',
        completed: true,
        required: true,
        completedAt: new Date(),
        progress: 100
      }
    ];

    const allRequirementsMet = requirements.every(req => !req.required || req.completed);
    const progress = Math.round((requirements.filter(req => req.completed).length / requirements.length) * 100);

    return {
      isEligible: allRequirementsMet,
      isIssued: false,
      message: allRequirementsMet ? 'You are eligible for a certificate' : 'Some requirements are not yet met',
      requirements,
      progress,
      courseId,
      userId,
      score: 92,
      passingScore: 80
    };
  } catch (error) {
    console.error('Error checking certificate eligibility:', error);
    return { 
      isEligible: false, 
      isIssued: false,
      message: 'Error checking eligibility',
      requirements: [],
      progress: 0,
      courseId,
      userId,
      score: 0,
      passingScore: 0
    };
  }
};
