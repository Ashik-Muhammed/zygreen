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

const PROGRESS_COLLECTION = 'user_progress';

interface UserProgress {
  id: string;
  userId: string;
  courseId: string;
  completedLessons: string[];
  completedQuizzes: string[];
  completedAssignments: string[];
  lastAccessedAt: Date | Timestamp;
  progress: number;
  metadata?: {
    totalLessons?: number;
    totalQuizzes?: number;
    totalAssignments?: number;
  };
}

export const getCompletedLessons = async (userId: string, courseId: string): Promise<string[]> => {
  try {
    const progress = await getUserProgress(userId, courseId);
    return progress?.completedLessons || [];
  } catch (error) {
    console.error('Error getting completed lessons:', error);
    return [];
  }
};

export const getUserProgress = async (userId: string, courseId: string): Promise<UserProgress | null> => {
  try {
    const progressQuery = query(
      collection(db, PROGRESS_COLLECTION),
      where('userId', '==', userId),
      where('courseId', '==', courseId)
    );
    
    const querySnapshot = await getDocs(progressQuery);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return { 
      id: doc.id, 
      ...doc.data() 
    } as UserProgress;
  } catch (error) {
    console.error('Error getting user progress:', error);
    throw new Error('Failed to get user progress');
  }
};

export const updateLessonProgress = async (
  userId: string, 
  courseId: string, 
  lessonId: string, 
  isCompleted: boolean
): Promise<void> => {
  try {
    const progress = await getOrCreateUserProgress(userId, courseId);
    
    let completedLessons = [...(progress.completedLessons || [])];
    
    if (isCompleted && !completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId);
    } else if (!isCompleted) {
      completedLessons = completedLessons.filter(id => id !== lessonId);
    } else {
      return; // No change needed
    }
    
    await updateUserProgress(progress.id, { completedLessons });
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    throw new Error('Failed to update lesson progress');
  }
};

const getOrCreateUserProgress = async (userId: string, courseId: string): Promise<UserProgress> => {
  const existingProgress = await getUserProgress(userId, courseId);
  
  if (existingProgress) {
    return existingProgress;
  }
  
  // Create new progress record
  const progressRef = doc(collection(db, PROGRESS_COLLECTION));
  const newProgress: Omit<UserProgress, 'id'> = {
    userId,
    courseId,
    completedLessons: [],
    completedQuizzes: [],
    completedAssignments: [],
    lastAccessedAt: Timestamp.now(),
    progress: 0
  };
  
  await setDoc(progressRef, newProgress);
  
  return {
    id: progressRef.id,
    ...newProgress
  };
};

const updateUserProgress = async (
  progressId: string, 
  updates: Partial<Omit<UserProgress, 'id' | 'userId' | 'courseId'>>
): Promise<void> => {
  try {
    const progressRef = doc(db, PROGRESS_COLLECTION, progressId);
    await updateDoc(progressRef, {
      ...updates,
      lastAccessedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating user progress:', error);
    throw new Error('Failed to update user progress');
  }
};
