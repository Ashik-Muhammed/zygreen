export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of the correct answer in options array
  points: number;
}

export interface Quiz {
  id?: string;
  title: string;
  description: string;
  courseId: string;
  questions: QuizQuestion[];
  timeLimit: number; // in minutes
  dueDate: Date | string;
  totalPoints: number;
  isPublished: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: string; // user ID of the creator
}
