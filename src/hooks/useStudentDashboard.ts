import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  Timestamp, 
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  courseTitle: string;
  progress: number;
  hoursSpent: number;
  lastAccessed: Timestamp;
  completed: boolean;
  enrolledAt: Timestamp;
  currentLessonId?: string;
  completedLessons?: string[];
}

interface Course {
  id: string;
  title: string;
  thumbnailUrl?: string;
  instructor: string;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessons?: Array<{
    id: string;
    title: string;
    duration: number;
    order: number;
  }>;
}

// Assignment type is used in the component but not directly in this file

interface StudentStats {
  enrolledCourses: number;
  completedCourses: number;
  hoursSpent: number;
  learningStreak: number;
}

interface RecentCourse {
  id: string;
  title: string;
  progress: number;
  nextLesson: string;
  lastAccessed: string;
  thumbnailUrl?: string;
  instructor: string;
  level: string;
}

interface UpcomingDeadline {
  id: string;
  courseId: string;
  course: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  daysLeft: number;
}

const formatLastAccessed = (date?: Timestamp): string => {
  if (!date?.toDate) return 'Never';
  return formatDistanceToNow(date.toDate(), { addSuffix: true });
};

const formatDueDate = (dueDate: Timestamp): { display: string; daysLeft: number } => {
  const now = new Date();
  const due = dueDate.toDate();
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { display: `${Math.abs(diffDays)} days overdue`, daysLeft: diffDays };
  } else if (diffDays === 0) {
    return { display: 'Today', daysLeft: 0 };
  } else if (diffDays === 1) {
    return { display: 'Tomorrow', daysLeft: 1 };
  } else if (diffDays <= 7) {
    return { display: `in ${diffDays} days`, daysLeft: diffDays };
  } else {
    return { display: due.toLocaleDateString(), daysLeft: diffDays };
  }
};

const useStudentDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<StudentStats>({
    enrolledCourses: 0,
    completedCourses: 0,
    hoursSpent: 0,
    learningStreak: 0,
  });
  const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName] = useState('Student');

  const fetchDashboardData = useCallback(async () => {
    console.log('fetchDashboardData called');
    if (!currentUser?.uid) {
      console.log('No current user, skipping fetch');
      setError('No user is currently signed in');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Get user profile
      let userData;
      try {
        console.log('Fetching user document...');
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists()) {
          console.error('User document not found');
          throw new Error('User profile not found');
        }
        userData = userDoc.data();
        console.log('User document:', userDoc.exists() ? 'found' : 'not found');
        console.log('User data:', userData);
      } catch (userError) {
        console.error('Error fetching user document:', userError);
        throw new Error('Failed to load user profile');
      }

      // 2. Fetch user's enrollments and assignments in parallel
      let enrollmentsSnapshot, assignmentsSnapshot;
      
      try {
        console.log('Fetching enrollments and assignments...');
        
        // First, try to get all courses
        let coursesSnapshot;
        try {
          console.log('Fetching courses...');
          coursesSnapshot = await getDocs(collection(db, 'courses'));
          console.log(`Found ${coursesSnapshot.docs.length} courses`);
        } catch (courseError) {
          console.error('Error fetching courses:', courseError);
          throw new Error('Failed to load course list');
        }
        
        const courseIds = coursesSnapshot.docs.map(doc => doc.id);
        console.log(`Checking enrollments in ${courseIds.length} courses`);
        
        // Get enrollments for the current user from all courses
        try {
          const enrollmentPromises = courseIds.map(courseId => 
            getDocs(query(
              collection(db, 'courses', courseId, 'enrollments'),
              where('studentId', '==', currentUser.uid)
            ))
          );
          
          const enrollmentSnapshots = await Promise.all(enrollmentPromises);
          enrollmentsSnapshot = {
            docs: enrollmentSnapshots.flatMap(snapshot => snapshot.docs)
          };
          console.log(`Found ${enrollmentsSnapshot.docs.length} enrollments`);
        } catch (enrollmentError) {
          console.error('Error fetching enrollments:', enrollmentError);
          throw new Error('Failed to load your enrollments');
        }
        
        // Get assignments
        try {
          console.log('Fetching assignments...');
          const assignmentsQuery = query(
            collection(db, 'assignments'),
            where('studentId', '==', currentUser.uid),
            where('status', '!=', 'graded'),
            orderBy('dueDate')
          );
          assignmentsSnapshot = await getDocs(assignmentsQuery);
          console.log(`Found ${assignmentsSnapshot.docs.length} assignments`);
        } catch (assignmentError) {
          console.error('Error fetching assignments:', assignmentError);
          // Don't fail the whole request if assignments fail
          assignmentsSnapshot = { docs: [] };
        }
        
      } catch (queryError) {
        console.error('Error in fetchDashboardData:', queryError);
        throw new Error('Failed to load your course data. Please try again later.');
      }

      // Process enrollments
      const enrollments = enrollmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Enrollment[];

      // Calculate stats
      const enrolledCourses = enrollments.length;
      const completedCourses = enrollments.filter(e => e.completed).length;
      const hoursSpent = enrollments.reduce((total, e) => total + (e.hoursSpent || 0), 0);
      
      // Get course details for recent courses (up to 4 most recently accessed)
      const recentEnrollments = [...enrollments]
        .sort((a, b) => (b.lastAccessed?.seconds || 0) - (a.lastAccessed?.seconds || 0))
        .slice(0, 4);

      // Fetch course details for recent enrollments
      const recentCoursesWithDetails = await Promise.all(
        recentEnrollments.map(async (enrollment) => {
          let courseData: Partial<Course> = {};
          try {
            const courseDoc = await getDoc(doc(db, 'courses', enrollment.courseId));
            if (courseDoc.exists()) {
              courseData = courseDoc.data() as Course;
            }
          } catch (err) {
            console.error(`Error fetching course ${enrollment.courseId}:`, err);
          }
          
          // Determine next lesson or completion status
          let nextLesson = 'Course completed';
          if (enrollment.progress < 100 && courseData?.lessons?.length) {
            const nextLessonData = courseData.lessons.find(
              lesson => !enrollment.completedLessons?.includes(lesson.id)
            );
            nextLesson = nextLessonData ? `Next: ${nextLessonData.title}` : 'Starting soon';
          }

          return {
            id: enrollment.id,
            title: enrollment.courseTitle || 'Untitled Course',
            progress: Math.min(enrollment.progress || 0, 100),
            nextLesson,
            lastAccessed: formatLastAccessed(enrollment.lastAccessed),
            thumbnailUrl: courseData?.thumbnailUrl,
            instructor: courseData?.instructor || 'Instructor',
            level: courseData?.level || 'beginner'
          };
        })
      );

      // Process assignments
      const upcomingAssignments = assignmentsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((assignment: any) => assignment.dueDate)
        .map((assignment: any) => {
          const { display, daysLeft } = formatDueDate(assignment.dueDate);
          return {
            id: assignment.id,
            courseId: assignment.courseId,
            course: assignment.courseTitle || 'Course',
            title: assignment.title || 'Untitled Assignment',
            dueDate: display,
            status: assignment.status || 'pending',
            daysLeft
          } as UpcomingDeadline;
        })
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 5);

      // Update state with fetched data
      setStats({
        enrolledCourses,
        completedCourses,
        hoursSpent: Math.round(hoursSpent * 10) / 10, // Round to 1 decimal place
        learningStreak: 0, // TODO: Implement learning streak calculation
      });
      
      setRecentCourses(recentCoursesWithDetails);
      setUpcomingDeadlines(upcomingAssignments);
      
    } catch (err) {
      console.error('Error in fetchDashboardData:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
      
      // Set default empty data on error
      setStats({
        enrolledCourses: 0,
        completedCourses: 0,
        hoursSpent: 0,
        learningStreak: 0,
      });
      setRecentCourses([]);
      setUpcomingDeadlines([]);
    } finally {
      setLoading(false);
      console.log('Dashboard data fetch completed');
    }
  }, [currentUser]);

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser?.uid]);

  return {
    stats,
    recentCourses,
    upcomingDeadlines,
    loading,
    error,
    userName,
    refresh: fetchDashboardData,
  };
};

export default useStudentDashboard;
