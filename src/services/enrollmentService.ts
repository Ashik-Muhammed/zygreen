import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  Timestamp
} from 'firebase/firestore';

const ENROLLMENT_COLLECTION = 'enrollments';

interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date | Timestamp;
  status: 'active' | 'completed' | 'dropped' | 'pending';
  progress: number;
  completedLessons: string[];
  lastAccessedAt: Date | Timestamp;
  metadata?: {
    score?: number;
    completionDate?: Date | Timestamp;
    certificateId?: string;
  };
}

export const getEnrollmentByUserAndCourse = async (userId: string, courseId: string): Promise<Enrollment | null> => {
  try {
    const enrollmentQuery = query(
      collection(db, ENROLLMENT_COLLECTION),
      where('userId', '==', userId),
      where('courseId', '==', courseId)
    );
    
    const querySnapshot = await getDocs(enrollmentQuery);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Return the first matching enrollment
    const doc = querySnapshot.docs[0];
    return { 
      id: doc.id, 
      ...doc.data() 
    } as Enrollment;
  } catch (error) {
    console.error('Error getting enrollment:', error);
    throw new Error('Failed to get enrollment');
  }
};

export const createEnrollment = async (enrollmentData: Omit<Enrollment, 'id' | 'enrolledAt'>): Promise<Enrollment> => {
  try {
    const enrollmentRef = doc(collection(db, ENROLLMENT_COLLECTION));
    const enrollmentWithDefaults = {
      ...enrollmentData,
      enrolledAt: Timestamp.now(),
      status: 'active' as const,
      progress: 0,
      completedLessons: [],
      lastAccessedAt: Timestamp.now()
    };
    
    await setDoc(enrollmentRef, enrollmentWithDefaults);
    
    return {
      id: enrollmentRef.id,
      ...enrollmentWithDefaults
    };
  } catch (error) {
    console.error('Error creating enrollment:', error);
    throw new Error('Failed to create enrollment');
  }
};

export const updateEnrollmentProgress = async (
  enrollmentId: string, 
  updates: Partial<Pick<Enrollment, 'progress' | 'completedLessons' | 'status' | 'metadata'>>
): Promise<void> => {
  try {
    const enrollmentRef = doc(db, ENROLLMENT_COLLECTION, enrollmentId);
    await updateDoc(enrollmentRef, {
      ...updates,
      lastAccessedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating enrollment progress:', error);
    throw new Error('Failed to update enrollment progress');
  }
};
