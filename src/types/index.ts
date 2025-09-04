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

export interface UserCourseProgress {
  id?: string;
  userId: string;
  courseId: string;
  completedLessons: string[]; // Array of lesson IDs
  progress: number; // Percentage (0-100)
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
