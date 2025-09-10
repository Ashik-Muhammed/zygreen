// User types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'student';
  createdAt: Date;
  updatedAt: Date;
}

// Course types
export interface Course {
  id?: string;
  title: string;
  description: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in hours
  imageUrl: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  isFeatured?: boolean;
  rating?: number;
  enrolledStudents?: number;
  instructor?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
  slug?: string;
  prerequisites?: string[];
  learningOutcomes?: string[];
  requirements?: string[];
  tags?: string[];
}

export interface Lesson {
  id?: string;
  courseId: string;
  title: string;
  description: string;
  duration: number; // in minutes
  videoUrl: string;
  order: number;
  isPreview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: Date;
  status: 'active' | 'completed' | 'cancelled';
  progress: number; // 0-100
  completed: boolean;
  hoursSpent: number;
  completedLessons: string[];
  lastAccessed: Date;
  amountPaid: number;
  paymentMethod: string;
  paymentId: string | null;
  originalPrice: number;
  currentLessonId?: string;
}

export interface EnrollmentOptions {
  amountPaid?: number;
  paymentMethod?: string;
  paymentId?: string;
}

export interface UserCourseProgress {
  id?: string;
  userId: string;
  courseId: string;
  completedLessons: string[];
  progress: number; // 0-100
  startedAt: Date;
  completedAt: Date | null;
  lastAccessed: Date;
}

export interface Certificate {
  id?: string;
  userId: string;
  courseId: string;
  certificateUrl: string;
  issuedAt: Date;
  expiresAt: Date | null;
}

// Product types (for future implementation)
export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Activity types (for future implementation)
export interface Activity {
  id?: string;
  title: string;
  description: string;
  type: 'webinar' | 'quiz' | 'challenge' | 'event';
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  maxParticipants?: number;
  participants: string[]; // Array of user IDs
  createdAt: Date;
  updatedAt: Date;
}
