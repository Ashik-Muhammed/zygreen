import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit
} from 'firebase/firestore';
import { db } from '../firebase';

type CollectionName = 'courses' | 'pricing' | 'testimonials' | 'contactSubmissions' | 'siteContent' | 'users' | 'enrollments';

// Types for admin dashboard
export interface Activity {
  id: string;
  type: 'enrollment' | 'course_created' | 'course_updated' | 'user_registered' | 'certificate_issued';
  title: string;
  description: string;
  timestamp: Date;
  userId: string;
  userName: string;
  metadata?: Record<string, any>;
}

interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalRevenue: number;
  completionRate: number;
  recentActivities: Activity[];
  recentEnrollments: Array<{
    id: string;
    student: string;
    email: string;
    course: string;
    date: string;
    status: 'active' | 'pending' | 'completed';
  }>;
  recentCourses: Array<{
    id: string;
    title: string;
    students: number;
    rating: number;
    status: 'published' | 'draft' | 'archived';
  }>;
}


// Generic function to get all documents from a collection
export const getAllDocuments = async (collectionName: CollectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error getting ${collectionName}:`, error);
    throw error;
  }
};

// Function to get a course by its custom ID
export const getCourseByCustomId = async (customId: string) => {
  try {
    const q = query(collection(db, 'courses'), where('id', '==', customId), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } else {
      throw new Error('Course not found');
    }
  } catch (error) {
    console.error('Error getting course by custom ID:', error);
    throw error;
  }
};

// Generic function to get a single document by ID or custom ID field
export const getDocumentById = async (collectionName: CollectionName, id: string) => {
  try {
    // First try to get by document ID
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      // If not found by document ID, try to find by custom 'id' field
      const q = query(
        collection(db, collectionName),
        where('id', '==', id),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        };
      }
      
      // If still not found and it's a course, try the course-specific function
      if (collectionName === 'courses') {
        try {
          return await getCourseByCustomId(id);
        } catch {
          throw new Error(`Document with ID or custom ID '${id}' not found in ${collectionName}`);
        }
      }
      
      throw new Error(`Document with ID or custom ID '${id}' not found in ${collectionName}`);
    }
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

// Generic function to add a document to a collection
export const addDocument = async (collectionName: CollectionName, data: any) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

// Generic function to update a document
export const updateDocument = async (collectionName: CollectionName, id: string, data: any) => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return { id, ...data };
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

// Generic function to delete a document
export const deleteDocument = async (collectionName: CollectionName, id: string) => {
  try {
    await deleteDoc(doc(db, collectionName, id));
    return id;
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

// Course-specific functions
// Admin Dashboard Functions
export const getDashboardStats = async (): Promise<DashboardStats> => {
  // Initialize default values
  const result: DashboardStats = {
    totalStudents: 0,
    totalCourses: 0,
    totalRevenue: 0,
    completionRate: 0,
    recentActivities: [],
    recentEnrollments: [],
    recentCourses: []
  };

  try {
    // Get total students (users with role 'student')
    const usersQuery = query(collection(db, 'users'), where('role', '==', 'student'));
    const usersSnapshot = await getDocs(usersQuery);
    result.totalStudents = usersSnapshot.size;

    // Get total courses
    const coursesSnapshot = await getDocs(collection(db, 'courses'));
    result.totalCourses = coursesSnapshot.size;

    // Get recent courses
    result.recentCourses = coursesSnapshot.docs
      .slice(0, 5)
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'Untitled Course',
          students: typeof data.students === 'number' ? data.students : 0,
          rating: typeof data.rating === 'number' ? data.rating : 0,
          status: ['published', 'draft', 'archived'].includes(data.status) 
            ? data.status as 'published' | 'draft' | 'archived' 
            : 'draft'
        };
      });

    try {
      // Get all courses to access their enrollments subcollections
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const allEnrollments: any[] = [];
      
      // Get enrollments from each course's enrollments subcollection
      for (const courseDoc of coursesSnapshot.docs) {
        const enrollmentsRef = collection(db, 'courses', courseDoc.id, 'enrollments');
        const enrollmentsSnapshot = await getDocs(enrollmentsRef);
        enrollmentsSnapshot.docs.forEach(doc => {
          allEnrollments.push({
            ...doc.data(),
            id: doc.id,
            courseId: courseDoc.id
          });
        });
      }
      
      // Calculate total revenue
      result.totalRevenue = allEnrollments.reduce((sum, enrollment) => {
        return sum + (typeof enrollment.amountPaid === 'number' ? enrollment.amountPaid : 0);
      }, 0);

      // Calculate completion rate
      const completedEnrollments = allEnrollments.filter(
        enrollment => enrollment.status === 'completed'
      ).length;
      
      result.completionRate = allEnrollments.length > 0 
        ? Math.round((completedEnrollments / allEnrollments.length) * 100) 
        : 0;

      // Process recent enrollments (last 5)
      const recentEnrollmentsData = [...allEnrollments]
        .sort((a, b) => {
          const aDate = a.enrolledAt?.toDate?.() || 0;
          const bDate = b.enrolledAt?.toDate?.() || 0;
          return (bDate as any) - (aDate as any);
        })
        .slice(0, 5);

      // Process recent enrollments
      for (const enrollment of recentEnrollmentsData) {
        let userName = 'Unknown User';
        let userEmail = '';
        let courseTitle = 'Unknown Course';
        
        try {
          const userId = enrollment.studentId || enrollment.userId;
          if (userId) {
            const userDoc = await getDoc(doc(db, 'users', userId));
            const userData = userDoc.data() as { name?: string; email?: string } | undefined;
            userName = userData?.name || 'Unknown User';
            userEmail = userData?.email || '';
          }
        } catch (e) {
          console.error('Error fetching user data:', e);
        }
        
        try {
          if (enrollment.courseId) {
            const courseDoc = await getDoc(doc(db, 'courses', enrollment.courseId));
            const courseData = courseDoc.data() as { title?: string } | undefined;
            courseTitle = courseData?.title || 'Unknown Course';
          }
        } catch (e) {
          console.error('Error fetching course data:', e);
        }
        
        const enrollDate = enrollment.enrolledAt?.toDate?.() || new Date();
        
        result.recentEnrollments.push({
          id: enrollment.id,
          student: userName,
          email: userEmail,
          course: courseTitle,
          date: enrollDate.toISOString().split('T')[0],
          status: enrollment.status || 'pending'
        });
      }

      // Get recent activities (last 5)
      const activitiesQuery = query(
        collection(db, 'activities'),
        orderBy('timestamp', 'desc'),
        limit(5)
      );

      const activitiesSnapshot = await getDocs(activitiesQuery);
      result.recentActivities = activitiesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || 'activity',
          title: data.title || 'New Activity',
          description: data.description || '',
          timestamp: data.timestamp?.toDate() || new Date(),
          userId: data.userId || '',
          userName: data.userName || 'System',
          metadata: data.metadata || {}
        };
      });

      return result;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return result; // Return partial data if there's an error
    }
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

export const getFeaturedCourses = async () => {
  const q = query(collection(db, 'courses'), where('isFeatured', '==', true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Contact form submission
export const submitContactForm = async (formData: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) => {
  return addDocument('contactSubmissions', formData);
};
