export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  userName: string;
  courseName: string;
  issueDate: Date;
  certificateUrl: string;
  verificationCode: string;
  metadata?: {
    score?: number;
    completionDate: Date;
    instructorName?: string;
  };
}

export interface CertificateVerification extends Omit<Certificate, 'verificationCode'> {
  isValid: boolean;
  verifiedAt: Date;
}
