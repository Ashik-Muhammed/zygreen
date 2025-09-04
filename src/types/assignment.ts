export type SubmissionType = 'file' | 'text' | 'both';

export interface Assignment {
  id?: string;
  title: string;
  description: string;
  instructions: string;
  courseId: string;
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  dueDate: Date | string;
  totalPoints: number;
  isPublished: boolean;
  submissionType: SubmissionType;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: string; // user ID of the creator
}
