import { db } from '../src/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

const ACTIVITY_TYPES = [
  'user_registered',
  'course_created',
  'course_completed',
  'enrollment_created',
  'certificate_issued'
];

const SAMPLE_USERS = [
  { id: 'user1', name: 'John Doe' },
  { id: 'user2', name: 'Jane Smith' },
  { id: 'user3', name: 'Admin User' }
];

const SAMPLE_COURSES = [
  { id: 'course1', title: 'Introduction to Web Development' },
  { id: 'course2', title: 'Advanced React' },
  { id: 'course3', title: 'Firebase Fundamentals' }
];

const generateRandomActivity = () => {
  const type = ACTIVITY_TYPES[Math.floor(Math.random() * ACTIVITY_TYPES.length)];
  const user = SAMPLE_USERS[Math.floor(Math.random() * SAMPLE_USERS.length)];
  const course = SAMPLE_COURSES[Math.floor(Math.random() * SAMPLE_COURSES.length)];
  
  const baseActivity = {
    type,
    userId: user.id,
    userName: user.name,
    timestamp: serverTimestamp(),
    metadata: {}
  };

  switch (type) {
    case 'course_created':
    case 'course_completed':
      return {
        ...baseActivity,
        title: `Course ${type.split('_').join(' ')}`,
        description: `${user.name} ${type.split('_')[1]} ${course.title}`,
        metadata: { courseId: course.id, courseTitle: course.title }
      };
    case 'enrollment_created':
      return {
        ...baseActivity,
        title: 'New Enrollment',
        description: `${user.name} enrolled in ${course.title}`,
        metadata: { courseId: course.id, courseTitle: course.title }
      };
    case 'certificate_issued':
      return {
        ...baseActivity,
        title: 'Certificate Issued',
        description: `Certificate issued to ${user.name} for ${course.title}`,
        metadata: { 
          courseId: course.id, 
          courseTitle: course.title,
          certificateId: `cert_${Math.random().toString(36).substr(2, 9)}`
        }
      };
    case 'user_registered':
    default:
      return {
        ...baseActivity,
        title: 'New User Registration',
        description: `${user.name} created an account`
      };
  }
};

const seedActivities = async (count = 20) => {
  try {
    const activitiesRef = collection(db, 'activities');
    
    // Check if activities already exist
    const snapshot = await getDocs(query(activitiesRef, where('type', '!=', '')));
    
    if (!snapshot.empty) {
      console.log('Activities already exist. Skipping seed.');
      return;
    }
    
    console.log('Seeding activities...');
    const activities = Array.from({ length: count }, generateRandomActivity);
    
    for (const activity of activities) {
      await addDoc(activitiesRef, activity);
      console.log(`Added activity: ${activity.title}`);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✅ Successfully seeded ${count} activities`);
  } catch (error) {
    console.error('❌ Error seeding activities:', error);
  }
};

// Run the seed function
seedActivities(20);
