import { db } from '../firebase';
import { 
  doc, 
  getDoc 
} from 'firebase/firestore';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  instructorId: string;
  instructorName: string;
  duration?: number; // in hours
  level?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  isPublished: boolean;
  price?: number;
  currency?: string;
  requirements?: string[];
  learningOutcomes?: string[];
  totalLessons?: number;
  totalQuizzes?: number;
  totalAssignments?: number;
  passingScore?: number; // Minimum score required to pass the course (0-100)
  certificateTemplateId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export const getCourseById = async (courseId: string): Promise<Course | null> => {
  try {
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    
    if (!courseDoc.exists()) {
      return null;
    }
    
    const courseData = courseDoc.data();
    
    // Convert Firestore timestamps to Date objects
    const convertTimestamp = (timestamp: any) => 
      timestamp?.toDate ? timestamp.toDate() : new Date();
    
    return {
      id: courseDoc.id,
      title: courseData.title || '',
      description: courseData.description || '',
      thumbnailUrl: courseData.thumbnailUrl,
      instructorId: courseData.instructorId,
      instructorName: courseData.instructorName || 'Unknown Instructor',
      duration: courseData.duration,
      level: courseData.level || 'beginner',
      category: courseData.category,
      isPublished: courseData.isPublished === true,
      price: courseData.price,
      currency: courseData.currency || 'USD',
      requirements: Array.isArray(courseData.requirements) ? courseData.requirements : [],
      learningOutcomes: Array.isArray(courseData.learningOutcomes) ? courseData.learningOutcomes : [],
      totalLessons: typeof courseData.totalLessons === 'number' ? courseData.totalLessons : 0,
      totalQuizzes: typeof courseData.totalQuizzes === 'number' ? courseData.totalQuizzes : 0,
      totalAssignments: typeof courseData.totalAssignments === 'number' ? courseData.totalAssignments : 0,
      passingScore: typeof courseData.passingScore === 'number' ? courseData.passingScore : 70,
      certificateTemplateId: courseData.certificateTemplateId,
      createdAt: convertTimestamp(courseData.createdAt),
      updatedAt: convertTimestamp(courseData.updatedAt),
      metadata: courseData.metadata || {}
    };
  } catch (error) {
    console.error('Error getting course by ID:', error);
    throw new Error('Failed to get course');
  }
};

// Re-export types for consistency
export type { Course };
