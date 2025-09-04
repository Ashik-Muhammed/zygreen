import { useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { Certificate } from '../types/certificate';
import { createCertificate, getCertificatesByUser, verifyCertificate, checkCertificateEligibility } from '../services/certificateService';

export const useCertificate = (userId?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

  const fetchCertificates = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const userCertificates = await getCertificatesByUser(userId);
      setCertificates(userCertificates);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch certificates:', err);
      toast({
        title: 'Error',
        description: 'Failed to load certificates',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  const issueCertificate = useCallback(async (certificateData: Omit<Certificate, 'id' | 'verificationCode' | 'issueDate'>) => {
    try {
      setIsLoading(true);
      const newCertificate = await createCertificate({
        ...certificateData,
        issueDate: new Date(),
      });
      
      setCertificates(prev => [...prev, newCertificate]);
      
      toast({
        title: 'Certificate Issued',
        description: 'Your certificate has been generated successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      return newCertificate;
    } catch (err) {
      setError(err as Error);
      console.error('Failed to issue certificate:', err);
      toast({
        title: 'Error',
        description: 'Failed to generate certificate',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const checkEligibility = useCallback(async (courseId: string) => {
    if (!userId) return { eligible: false, reason: 'User not authenticated' };
    
    try {
      setIsLoading(true);
      return await checkCertificateEligibility(userId, courseId);
    } catch (err) {
      console.error('Error checking certificate eligibility:', err);
      return { 
        eligible: false, 
        reason: 'Error checking eligibility. Please try again later.' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const verify = useCallback(async (verificationCode: string) => {
    try {
      setIsLoading(true);
      const result = await verifyCertificate(verificationCode);
      return result;
    } catch (err) {
      console.error('Error verifying certificate:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const downloadCertificate = useCallback(async (certificateId: string) => {
    try {
      // In a real implementation, this would trigger the download
      // For now, we'll just open the certificate URL in a new tab
      const cert = certificates.find(c => c.id === certificateId);
      if (cert?.certificateUrl) {
        window.open(cert.certificateUrl, '_blank');
      } else {
        throw new Error('Certificate URL not found');
      }
    } catch (err) {
      console.error('Error downloading certificate:', err);
      toast({
        title: 'Error',
        description: 'Failed to download certificate',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw err;
    }
  }, [certificates, toast]);

  return {
    certificates,
    isLoading,
    error,
    fetchCertificates,
    issueCertificate,
    checkEligibility,
    verifyCertificate: verify,
    downloadCertificate,
  };
};

export default useCertificate;
