import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

type ActivityType = 'enrollment' | 'course_created' | 'course_updated' | 'user_registered' | 'certificate_issued';

interface ActivityData {
  type: ActivityType;
  title: string;
  description: string;
  userId: string;
  userName: string;
  metadata?: Record<string, any>;
}

export const logActivity = async (activityData: Omit<ActivityData, 'timestamp'>) => {
  try {
    const activitiesRef = collection(db, 'activities');
    await addDoc(activitiesRef, {
      ...activityData,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Helper functions for common activity types
export const logUserRegistered = async (userId: string, userName: string) => {
  await logActivity({
    type: 'user_registered',
    title: 'New User Registration',
    description: `${userName} has registered for an account`,
    userId,
    userName
  });
};

export const logCourseCreated = async (userId: string, userName: string, courseTitle: string, courseId: string) => {
  await logActivity({
    type: 'course_created',
    title: 'New Course Created',
    description: `${userName} created a new course: ${courseTitle}`,
    userId,
    userName,
    metadata: {
      courseId,
      courseTitle
    }
  });
};

export const logCourseUpdated = async (userId: string, userName: string, courseTitle: string, courseId: string) => {
  await logActivity({
    type: 'course_updated',
    title: 'Course Updated',
    description: `${userName} updated the course: ${courseTitle}`,
    userId,
    userName,
    metadata: {
      courseId,
      courseTitle
    }
  });
};

export const logEnrollment = async (userId: string, userName: string, courseTitle: string, courseId: string) => {
  await logActivity({
    type: 'enrollment',
    title: 'New Enrollment',
    description: `${userName} enrolled in ${courseTitle}`,
    userId,
    userName,
    metadata: {
      courseId,
      courseTitle
    }
  });
};

export const logCertificateIssued = async (userId: string, userName: string, courseTitle: string, certificateId: string) => {
  await logActivity({
    type: 'certificate_issued',
    title: 'Certificate Issued',
    description: `${userName} received a certificate for completing ${courseTitle}`,
    userId,
    userName,
    metadata: {
      certificateId,
      courseTitle
    }
  });
};
