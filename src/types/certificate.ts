import { Timestamp } from 'firebase/firestore';

/**
 * Base certificate interface
 */
export interface Certificate {
  // Core fields
  id: string;
  userId: string;
  courseId: string;
  verificationCode: string;
  
  // Recipient information
  recipientName: string;
  email?: string;
  
  // Course information
  courseName: string;
  courseDescription?: string;
  
  // Issue and expiry
  issueDate: Date | Timestamp;
  expiryDate?: Date | Timestamp;
  
  // Status flags
  isRevoked?: boolean;
  revokeReason?: string;
  revokedAt?: Date | Timestamp;
  
  // Content and URLs
  htmlContent?: string;  // HTML content of the certificate
  pdfUrl?: string;       // URL to the generated PDF (if using storage)
  thumbnailUrl?: string; // URL to the certificate thumbnail (if using storage)
  
  // Performance
  finalScore?: number;
  grade?: string;
  
  // Template and design
  templateId?: string;
  design?: CertificateDesign;
  
  // Metadata
  metadata?: CertificateMetadata;
  
  // Stats
  views?: number;
  downloads?: number;
  verificationCount?: number;
  
  // Timestamps
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  lastViewedAt?: Date | Timestamp | null;
  lastDownloadedAt?: Date | Timestamp | null;
  lastVerifiedAt?: Date | Timestamp | null;
}

/**
 * Certificate verification result
 */
export interface CertificateVerification {
  isValid: boolean;
  message: string;
  code: 'valid' | 'not_found' | 'revoked' | 'expired' | 'error';
  verifiedAt?: Date;
  certificate?: Certificate;
  
  // Additional verification details
  expiryDate?: Date;
  revokeReason?: string;
  revokedAt?: Date;
}

/**
 * Certificate design configuration
 */
export interface CertificateDesign {
  // Layout
  layout: 'portrait' | 'landscape';
  background: {
    type: 'color' | 'image' | 'gradient';
    value: string;
    opacity?: number;
  };
  
  // Typography
  fontFamily: string;
  primaryColor: string;
  secondaryColor: string;
  
  // Logo and seals
  logoUrl?: string;
  sealUrl?: string;
  
  // Custom fields
  customCss?: string;
  customFields?: Record<string, any>;
}

/**
 * Certificate metadata
 */
export interface CertificateMetadata {
  completionDate: Date | Timestamp;
  instructorName?: string;
  instructorTitle?: string;
  instructorSignature?: string;
  organizationName?: string;
  organizationLogo?: string;
  credits?: number;
  duration?: string;
  passingScore?: number;
  score?: number;
  customFields?: Record<string, any>;
}

// Utility type to handle Firestore timestamps
export type MaybeTimestamp = Date | Timestamp;

// Utility function to convert Firestore timestamps to Date
export function toDate(value: MaybeTimestamp | undefined | null): Date | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value : value.toDate();
}

/**
 * Certificate eligibility information
 */
export interface CertificateEligibility {
  isEligible: boolean;
  isIssued: boolean;
  message: string;
  requirements: CertificateRequirement[];
  progress: number;
  
  // Context
  courseId: string;
  userId: string;
  
  // If already issued
  issuedCertificate?: Certificate;
  
  // Additional context
  completedAt?: Date;
  score?: number;
  passingScore?: number;
}

/**
 * Individual requirement for certificate eligibility
 */
export interface CertificateRequirement {
  description: string;
  completed: boolean;
  required: boolean;
  
  // For progress tracking
  progress?: number;
  
  // For score-based requirements
  score?: number;
  requiredScore?: number;
  
  // For date-based requirements
  completedAt?: Date;
  
  // Additional metadata
  metadata?: Record<string, any>;
}

/**
 * Certificate template
 */
export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  
  // Design configuration
  design: CertificateDesign;
  
  // Default fields
  defaultFields: string[];
  
  // Preview image
  previewImage?: string;
  
  // Metadata
  isActive: boolean;
  isDefault: boolean;
  
  // Timestamps
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  
  // Created by
  createdBy: string;
  updatedBy?: string;
}

/**
 * Certificate issuance request
 */
export interface CertificateRequest {
  id: string;
  userId: string;
  courseId: string;
  status: 'pending' | 'approved' | 'rejected' | 'issued';
  
  // Request details
  requestedAt: Date | Timestamp;
  processedAt?: Date | Timestamp;
  processedBy?: string;
  
  // Rejection reason (if applicable)
  rejectionReason?: string;
  
  // Issued certificate (if applicable)
  certificateId?: string;
  
  // Metadata
  metadata?: Record<string, any>;
}

/**
 * Certificate verification log entry
 */
export interface CertificateVerificationLog {
  id: string;
  certificateId: string;
  
  // Verification details
  verifiedAt: Date | Timestamp;
  verifiedBy?: string;
  
  // Verification result
  result: 'valid' | 'invalid' | 'revoked' | 'expired';
  
  // Client information
  ipAddress?: string;
  userAgent?: string;
  
  // Additional context
  context?: Record<string, any>;
}

/**
 * Certificate bulk issuance request
 */
export interface BulkCertificateRequest {
  id: string;
  name: string;
  description?: string;
  
  // Template and design
  templateId: string;
  design?: CertificateDesign;
  
  // Recipients
  recipients: Array<{
    userId: string;
    email: string;
    name: string;
    metadata?: Record<string, any>;
  }>;
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: {
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
  };
  
  // Error information
  errors?: Array<{
    userId: string;
    error: string;
    details?: any;
  }>;
  
  // Timestamps
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  startedAt?: Date | Timestamp;
  completedAt?: Date | Timestamp;
  
  // Created by
  createdBy: string;
  updatedBy?: string;
}

/**
 * Certificate analytics data
 */
export interface CertificateAnalytics {
  certificateId: string;
  
  // View statistics
  totalViews: number;
  uniqueViews: number;
  viewsByDate: Array<{
    date: string;
    count: number;
  }>;
  
  // Download statistics
  totalDownloads: number;
  downloadsByDate: Array<{
    date: string;
    count: number;
  }>;
  
  // Verification statistics
  totalVerifications: number;
  verificationsByDate: Array<{
    date: string;
    count: number;
  }>;
  
  // Referrer information
  topReferrers: Array<{
    referrer: string;
    count: number;
  }>;
  
  // Device information
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
    other: number;
  };
  
  // Geographic information
  countries: Array<{
    country: string;
    count: number;
  }>;
  
  // Timestamp of last update
  updatedAt: Date | Timestamp;
}
