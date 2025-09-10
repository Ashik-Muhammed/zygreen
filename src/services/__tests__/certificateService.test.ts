import { 
  createCertificate, 
  verifyCertificate, 
  checkCertificateEligibility,
  revokeCertificate,
  restoreCertificate
} from '../certificateService';

// Mock the Firebase Firestore functions
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockGetDocs = jest.fn();

jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  serverTimestamp: jest.fn(() => new Date('2023-01-01T00:00:00Z')),
  Timestamp: {
    fromDate: jest.fn((date) => date),
    now: jest.fn(() => new Date('2023-01-01T00:00:00Z'))
  }
}));

describe('Certificate Service', () => {
  const mockCertificate = {
    id: 'cert-123',
    userId: 'user-123',
    courseId: 'course-123',
    recipientName: 'Test User',
    email: 'test@example.com',
    courseName: 'Test Course',
    issueDate: new Date('2023-01-01'),
    verificationCode: 'CERT-ABC123',
    isRevoked: false,
    views: 0,
    downloads: 0,
    verificationCount: 0,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    lastViewedAt: null,
    lastDownloadedAt: null,
    lastVerifiedAt: null,
    metadata: {
      completionDate: new Date('2023-01-01'),
      score: 95,
      passingScore: 80
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCertificate', () => {
    it('should create a new certificate', async () => {
      const certificateData = {
        userId: 'user-123',
        courseId: 'course-123',
        recipientName: 'Test User',
        email: 'test@example.com',
        courseName: 'Test Course',
        issueDate: new Date('2023-01-01'),
        metadata: {
          completionDate: new Date('2023-01-01'),
          score: 95,
          passingScore: 80
        }
      };

      mockAddDoc.mockResolvedValueOnce({
        id: 'cert-123'
      });
      
      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await createCertificate(certificateData);

      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('id', 'cert-123');
      expect(result).toHaveProperty('verificationCode');
      expect(result.verificationCode).toContain('CERT-');
    });
  });

  describe('verifyCertificate', () => {
    it('should verify a valid certificate', async () => {
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{
          id: 'cert-123',
          data: () => ({
            ...mockCertificate,
            issueDate: { toDate: () => new Date('2023-01-01') },
            createdAt: { toDate: () => new Date('2023-01-01') },
            updatedAt: { toDate: () => new Date('2023-01-01') }
          })
        }]
      });

      const result = await verifyCertificate('CERT-ABC123');

      expect(result.isValid).toBe(true);
      expect(result.certificate).toBeDefined();
      expect(result.certificate?.verificationCode).toBe('CERT-ABC123');
    });

    it('should return invalid for non-existent certificate', async () => {
      mockGetDocs.mockResolvedValueOnce({
        empty: true,
        docs: []
      });

      const result = await verifyCertificate('INVALID-CODE');

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('checkCertificateEligibility', () => {
    it('should return eligibility status for a user', async () => {
      mockGetDocs.mockResolvedValueOnce({
        empty: true, // No existing certificate
        docs: []
      });

      const result = await checkCertificateEligibility('user-123', 'course-123');

      expect(result).toHaveProperty('isEligible');
      expect(result).toHaveProperty('requirements');
      expect(Array.isArray(result.requirements)).toBe(true);
    });
  });

  describe('revokeCertificate', () => {
    it('should revoke a certificate', async () => {
      const mockUpdateDoc = require('firebase/firestore').updateDoc;
      
      await revokeCertificate('cert-123', 'Test revocation');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        {
          isRevoked: true,
          revokeReason: 'Test revocation',
          revokedAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      );
    });
  });

  describe('restoreCertificate', () => {
    it('should restore a revoked certificate', async () => {
      const mockUpdateDoc = require('firebase/firestore').updateDoc;
      
      await restoreCertificate('cert-123');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        {
          isRevoked: false,
          revokeReason: null,
          revokedAt: null,
          updatedAt: expect.any(Date)
        }
      );
    });
  });
});
