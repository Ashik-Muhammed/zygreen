import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  increment,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Course, Lesson, UserCourseProgress, Certificate } from '../types';

const COURSES_COLLECTION = 'courses';
const LESSONS_COLLECTION = 'lessons';
const USER_PROGRESS_COLLECTION = 'userProgress';
const CERTIFICATES_COLLECTION = 'certificates';

// Helper to convert Firestore data to typed objects
const courseFromFirestore = (doc: DocumentSnapshot<DocumentData>): Course => {
  const data = doc.data();
  if (!data) throw new Error('Document data is undefined');
  
  return {
    id: doc.id,
    ...data as Omit<Course, 'id' | 'createdAt' | 'updatedAt'>,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

const lessonFromFirestore = (doc: DocumentSnapshot<DocumentData>): Lesson => {
  const data = doc.data();
  if (!data) throw new Error('Document data is undefined');
  
  return {
    id: doc.id,
    ...data as Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

// Course CRUD Operations
export const createCourse = async (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, userId: string): Promise<Course> => {
  try {
    const courseRef = doc(collection(db, COURSES_COLLECTION));
    const newCourse: Course = {
      ...courseData,
      id: courseRef.id,
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };

    await setDoc(courseRef, newCourse);
    return newCourse;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

export const getCourse = async (courseId: string): Promise<Course | null> => {
  try {
    const courseDoc = await getDoc(doc(db, COURSES_COLLECTION, courseId));
    return courseDoc.exists() ? courseFromFirestore(courseDoc) : null;
  } catch (error) {
    console.error('Error getting course:', error);
    throw error;
  }
};

export const updateCourse = async (courseId: string, updates: Partial<Omit<Course, 'id' | 'createdAt' | 'createdBy'>>): Promise<void> => {
  try {
    const courseRef = doc(db, COURSES_COLLECTION, courseId);
    await updateDoc(courseRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    // Note: You might want to delete related lessons and user progress as well
    await deleteDoc(doc(db, COURSES_COLLECTION, courseId));
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

export interface Enrollment {
  id: string;
  userId?: string;  // Made optional for backward compatibility
  studentId?: string;
  courseId: string;
  courseTitle?: string;
  enrolledAt: Date;
  status: 'active' | 'completed' | 'cancelled';
  progress: number;
  completed: boolean;
  hoursSpent: number;
  completedLessons: string[];
  lastAccessed: Date;
  currentLessonId?: string;
}

export const enrollInCourse = async (userId: string, courseId: string): Promise<Enrollment> => {
  if (!courseId) {
    throw new Error('Course ID is required');
  }
  
  try {
    // First, check if course exists by document ID
    let courseRef = doc(db, 'courses', courseId);
    let courseDoc = await getDoc(courseRef);
    let courseData: any;
    let documentId = courseId; // Default to the provided ID
    
    // If not found by document ID, try to find by custom 'id' field
    if (!courseDoc.exists()) {
      console.log(`Course not found by document ID ${courseId}, trying custom ID field...`);
      const courseQuery = query(
        collection(db, 'courses'),
        where('id', '==', courseId),
        limit(1)
      );
      
      const querySnapshot = await getDocs(courseQuery);
      if (!querySnapshot.empty) {
        console.log(`Found course by custom ID: ${courseId}`);
        courseDoc = querySnapshot.docs[0];
        courseRef = doc(db, 'courses', courseDoc.id);
        courseData = courseDoc.data();
        documentId = courseDoc.id; // Store the actual document ID
      } else {
        console.error(`Course with ID ${courseId} not found by document ID or custom ID`);
        throw new Error('The requested course could not be found. It may have been removed or is currently unavailable.');
      }
    } else {
      console.log(`Found course by document ID: ${courseId}`);
      courseData = courseDoc.data();
      // If the course has a custom ID, use that for enrollment
      if (courseData.id) {
        documentId = courseData.id;
      }
    }

    // Then check if user is already enrolled
    console.log(`Checking enrollment for user ${userId} in course ${documentId}`);
    const enrollmentQuery = query(
      collection(db, 'enrollments'),
      where('studentId', '==', userId),
      where('courseId', '==', documentId)
    );
    
    const enrollmentSnapshot = await getDocs(enrollmentQuery);
    if (!enrollmentSnapshot.empty) {
      console.log('User is already enrolled in this course');
      throw new Error('You are already enrolled in this course');
    }

    // Create enrollment with course data
    console.log(`Creating enrollment for user ${userId} in course ${documentId}`);
    const enrollmentRef = doc(collection(db, 'enrollments'));
    const enrollmentId = enrollmentRef.id;
    const enrollmentData: Enrollment = {
      id: enrollmentId,
      studentId: userId,
      courseId: documentId, // Use the document ID for consistency
      courseTitle: courseData?.title || 'Untitled Course',
      enrolledAt: new Date(),
      status: 'active',
      progress: 0,
      completed: false,
      hoursSpent: 0,
      completedLessons: [],
      lastAccessed: new Date(),
    };

    // Use batch to ensure both operations succeed or fail together
    const batch = writeBatch(db);
    
    // Create enrollment
    batch.set(enrollmentRef, enrollmentData);
    
    // Update course's enrolled students count
    batch.update(courseRef, {
      enrolledStudents: increment(1)
    });

    await batch.commit();

    return {
      ...enrollmentData,
      enrolledAt: new Date(),
      lastAccessed: new Date()
    };
  } catch (error) {
    console.error('Error enrolling in course:', error);
    throw error;
  }
};

export const listCourses = async (filters: {
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  isPublished?: boolean;
} = {}): Promise<Course[]> => {
  try {
    const q = query(
      collection(db, COURSES_COLLECTION),
      ...(filters.category ? [where('category', '==', filters.category)] : []),
      ...(filters.level ? [where('level', '==', filters.level)] : []),
      ...(filters.isPublished !== undefined ? [where('isPublished', '==', filters.isPublished)] : []),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => courseFromFirestore(doc as QueryDocumentSnapshot<DocumentData>));
  } catch (error) {
    console.error('Error listing courses:', error);
    throw error;
  }
};

// Lesson CRUD Operations
export const createLesson = async (courseId: string, lessonData: Omit<Lesson, 'id' | 'courseId' | 'createdAt' | 'updatedAt'>): Promise<Lesson> => {
  try {
    const lessonRef = doc(collection(db, LESSONS_COLLECTION));
    const newLesson: Lesson = {
      ...lessonData,
      id: lessonRef.id,
      courseId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(lessonRef, newLesson);
    return newLesson;
  } catch (error) {
    console.error('Error creating lesson:', error);
    throw error;
  }
};

export const getLesson = async (lessonId: string): Promise<Lesson | null> => {
  try {
    const lessonDoc = await getDoc(doc(db, LESSONS_COLLECTION, lessonId));
    return lessonDoc.exists() ? lessonFromFirestore(lessonDoc) : null;
  } catch (error) {
    console.error('Error getting lesson:', error);
    throw error;
  }
};

export const getCourseLessons = async (courseId: string): Promise<Lesson[]> => {
  try {
    const q = query(
      collection(db, LESSONS_COLLECTION),
      where('courseId', '==', courseId),
      orderBy('order', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => lessonFromFirestore(doc as QueryDocumentSnapshot<DocumentData>));
  } catch (error) {
    console.error('Error getting course lessons:', error);
    throw error;
  }
};

// User Progress Operations
export const getUserCourseProgress = async (userId: string, courseId: string): Promise<UserCourseProgress | null> => {
  try {
    const progressDoc = await getDoc(doc(db, USER_PROGRESS_COLLECTION, `${userId}_${courseId}`));
    
    if (!progressDoc.exists()) {
      // Create a new progress document if it doesn't exist
      const newProgress: UserCourseProgress = {
        userId,
        courseId,
        completedLessons: [],
        progress: 0,
        startedAt: new Date(),
        completedAt: null,
        lastAccessed: new Date(),
      };
      
      await setDoc(doc(db, USER_PROGRESS_COLLECTION, `${userId}_${courseId}`), newProgress);
      return newProgress;
    }
    
    return {
      id: progressDoc.id,
      ...progressDoc.data() as Omit<UserCourseProgress, 'id'>,
      startedAt: progressDoc.data().startedAt?.toDate() || new Date(),
      completedAt: progressDoc.data().completedAt?.toDate() || null,
      lastAccessed: progressDoc.data().lastAccessed?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error getting user course progress:', error);
    throw error;
  }
};

export const markLessonComplete = async (userId: string, courseId: string, lessonId: string): Promise<UserCourseProgress> => {
  try {
    const progressRef = doc(db, USER_PROGRESS_COLLECTION, `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);
    
    let progressData: UserCourseProgress;
    
    if (!progressDoc.exists()) {
      // Create new progress if it doesn't exist
      progressData = {
        userId,
        courseId,
        completedLessons: [lessonId],
        progress: 0, // Will be calculated below
        startedAt: new Date(),
        completedAt: null,
        lastAccessed: new Date(),
      };
    } else {
      // Update existing progress
      const existingData = progressDoc.data() as Omit<UserCourseProgress, 'id'>;
      
      // Add lesson to completed if not already there
      const completedLessons = existingData.completedLessons.includes(lessonId)
        ? existingData.completedLessons
        : [...existingData.completedLessons, lessonId];
      
      progressData = {
        ...existingData,
        completedLessons,
        lastAccessed: new Date(),
      };
    }
    
    // Get total lessons to calculate progress
    const lessons = await getCourseLessons(courseId);
    const progress = Math.round((progressData.completedLessons.length / Math.max(lessons.length, 1)) * 100);
    
    // Update progress and check if course is completed
    const now = new Date();
    const isCompleted = progress >= 100;
    
    const updateData: Partial<UserCourseProgress> = {
      ...progressData,
      progress,
      lastAccessed: now,
      ...(isCompleted && !progressData.completedAt ? { completedAt: now } : {}),
    };
    
    await setDoc(progressRef, updateData, { merge: true });
    
    return {
      ...progressData,
      progress,
      lastAccessed: now,
      ...(isCompleted && !progressData.completedAt ? { completedAt: now } : {}),
    };
  } catch (error) {
    console.error('Error marking lesson complete:', error);
    throw error;
  }
};

// Certificate Operations
export const generateCertificate = async (userId: string, courseId: string): Promise<Certificate> => {
  try {
    // In a real app, you would generate a certificate PDF and upload it to storage
    // For now, we'll just create a record in Firestore with a placeholder URL
    const certificateRef = doc(collection(db, CERTIFICATES_COLLECTION));
    const certificate: Certificate = {
      id: certificateRef.id,
      userId,
      courseId,
      certificateUrl: `https://zygreen.app/certificates/${certificateRef.id}`,
      issuedAt: new Date(),
      expiresAt: null, // Certificates don't expire by default
    };
    
    await setDoc(certificateRef, certificate);
    return certificate;
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw error;
  }
};

export const getUserCertificates = async (userId: string): Promise<Certificate[]> => {
  try {
    const q = query(
      collection(db, CERTIFICATES_COLLECTION),
      where('userId', '==', userId),
      orderBy('issuedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Certificate, 'id'>,
      issuedAt: doc.data().issuedAt?.toDate() || new Date(),
      expiresAt: doc.data().expiresAt?.toDate() || null,
    }));
  } catch (error) {
    console.error('Error getting user certificates:', error);
    throw error;
  }
};
