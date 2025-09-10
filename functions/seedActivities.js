const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Sample data for activities
const activities = [
  {
    type: 'enrollment_created',
    title: 'New Enrollment',
    description: 'Student enrolled in course',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    metadata: {
      courseId: 'course1',
      courseTitle: 'Introduction to Web Development'
    }
  },
  {
    type: 'course_completed',
    title: 'Course Completed',
    description: 'Student completed a course',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    metadata: {
      courseId: 'course1',
      courseTitle: 'Introduction to Web Development'
    }
  },
  {
    type: 'certificate_issued',
    title: 'Certificate Issued',
    description: 'Certificate was issued to student',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    metadata: {
      courseId: 'course1',
      certificateId: 'cert123'
    }
  }
];

// Add activities to Firestore
async function seedActivities() {
  const batch = db.batch();
  const activitiesRef = db.collection('activities');
  
  // Add each activity to the batch
  activities.forEach(activity => {
    const docRef = activitiesRef.doc();
    batch.set(docRef, activity);
  });
  
  // Commit the batch
  try {
    await batch.commit();
    console.log('Successfully added activities to Firestore');
  } catch (error) {
    console.error('Error adding activities:', error);
  }
}

seedActivities();
