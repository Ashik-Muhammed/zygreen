import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const testActivities = [
  {
    type: 'enrollment_created',
    title: 'New Enrollment',
    description: 'John Doe enrolled in Introduction to Web Development',
    timestamp: serverTimestamp(),
    userName: 'John Doe',
    metadata: {
      courseId: 'course1',
      courseTitle: 'Introduction to Web Development'
    }
  },
  {
    type: 'course_completed',
    title: 'Course Completed',
    description: 'Jane Smith completed Advanced React',
    timestamp: serverTimestamp(),
    userName: 'Jane Smith',
    metadata: {
      courseId: 'course2',
      courseTitle: 'Advanced React'
    }
  },
  {
    type: 'certificate_issued',
    title: 'Certificate Issued',
    description: 'Certificate issued to Alex Johnson for Firebase Fundamentals',
    timestamp: serverTimestamp(),
    userName: 'Alex Johnson',
    metadata: {
      courseId: 'course3',
      courseTitle: 'Firebase Fundamentals',
      certificateId: 'cert_abc123'
    }
  }
];

export const addTestActivities = async () => {
  try {
    const activitiesRef = collection(db, 'activities');
    
    for (const activity of testActivities) {
      await addDoc(activitiesRef, activity);
      console.log('Added activity:', activity.title);
    }
    
    console.log('Successfully added test activities');
    return true;
  } catch (error) {
    console.error('Error adding test activities:', error);
    return false;
  }
};

// For testing purposes, you can uncomment and run this directly
// addTestActivities().then(console.log).catch(console.error);
