export type SubmissionType = 'file' | 'text' | 'both' | 'quiz' | 'activity';
export type AssignmentStatus = 'draft' | 'published' | 'graded';
export type GradingStatus = 'pending' | 'in_progress' | 'completed';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface Assignment {
  id?: string;
  title: string;
  description: string;
  instructions: string;
  courseId: string;
  moduleId?: string;
  attachments: Attachment[];
  dueDate: Date | string;
  availableFrom?: Date | string;
  availableUntil?: Date | string;
  totalPoints: number;
  passingScore?: number;
  isPublished: boolean;
  status: AssignmentStatus;
  submissionType: SubmissionType;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: string;
  timeLimit?: number; // in minutes
  attemptsAllowed?: number;
  showCorrectAnswers?: boolean;
  requirePassword?: boolean;
  password?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'file_upload';
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  feedback?: string;
}

export interface Quiz extends Assignment {
  questions: QuizQuestion[];
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showQuestionPerPage: boolean;
  timeLimit: number;
  passingScore: number;
}

export interface Activity extends Assignment {
  // Additional activity-specific fields
  isGroupActivity?: boolean;
  maxGroupSize?: number;
  submissionInstructions?: string;
  rubric?: any; // Could be a more specific type
}

export interface Submission {
  id?: string;
  assignmentId: string;
  userId: string;
  courseId: string;
  files?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
  text?: string;
  answers?: {
    questionId: string;
    answer: string | string[];
    isCorrect?: boolean;
    pointsAwarded?: number;
    feedback?: string;
  }[];
  submittedAt: Date | string;
  gradedAt?: Date | string;
  score?: number;
  totalPoints: number;
  status: 'submitted' | 'graded' | 'late' | 'missing';
  feedback?: string;
  gradedBy?: string;
  attemptNumber: number;
  timeSpent?: number; // in seconds
}

export interface EvaluationResult {
  submissionId: string;
  assignmentId: string;
  userId: string;
  courseId: string;
  score: number;
  totalPoints: number;
  feedback?: string;
  gradedBy: string;
  gradedAt: Date | string;
  rubricScores?: Record<string, number>;
  isPassing: boolean;
  certificateEligible: boolean;
}

export interface CertificateEligibility {
  userId: string;
  courseId: string;
  isEligible: boolean;
  completedAssignments: string[];
  completedQuizzes: string[];
  completedActivities: string[];
  totalScore: number;
  totalPossibleScore: number;
  passingScore: number;
  certificateId?: string;
  lastUpdated: Date | string;
}
