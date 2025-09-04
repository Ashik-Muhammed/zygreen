import React, { useState, useEffect } from 'react';
import { Box, Button, VStack, Text, HStack, useDisclosure, Alert, AlertIcon, Spinner, useToast } from '@chakra-ui/react';
import { FiAward, FiCheckCircle } from 'react-icons/fi';
import { CertificateViewer } from './CertificateViewer';
import useCertificate from '../../hooks/useCertificate';
import { useAuth } from '../../contexts/AuthContext';

interface CertificateEligibilityProps {
  courseId: string;
  courseName: string;
  onCertificateIssued?: () => void;
}

const CertificateEligibility: React.FC<CertificateEligibilityProps> = ({
  courseId,
  courseName,
  onCertificateIssued,
}) => {
  const { currentUser } = useAuth();
  const { 
    onOpen, 
    onClose 
  } = useDisclosure();
  
  const [certificate, setCertificate] = useState<any>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [eligibilityReason, setEligibilityReason] = useState<string>('');
  
  const { 
    issueCertificate,
    downloadCertificate,
    certificates,
    fetchCertificates,
  } = useCertificate(currentUser?.uid);
  
  const toast = useToast();

  useEffect(() => {
    const checkEligibility = async () => {
      if (!currentUser?.uid) return;
      
      try {
        setIsCheckingEligibility(true);
        
        // First, check if user already has a certificate for this course
        await fetchCertificates();
        const existingCert = certificates.find(cert => cert.courseId === courseId);
        
        if (existingCert) {
          setCertificate(existingCert);
          setIsEligible(false);
          setEligibilityReason('You have already earned a certificate for this course.');
          return;
        }
        
        // In a real implementation, you would check course completion status
        // For now, we'll assume the user is eligible if they don't have a certificate yet
        const { eligible, reason } = await checkCourseCompletion(courseId);
        
        setIsEligible(eligible);
        setEligibilityReason(reason || '');
      } catch (error) {
        console.error('Error checking certificate eligibility:', error);
        toast({
          title: 'Error',
          description: 'Failed to check certificate eligibility. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsCheckingEligibility(false);
      }
    };
    
    checkEligibility();
  }, [courseId, currentUser?.uid, fetchCertificates, certificates, toast]);

  // Mock function to check course completion
  const checkCourseCompletion = async (_courseId: string) => {
    // In a real implementation, you would check:
    // 1. If all course modules are completed
    // 2. If all quizzes are passed
    // 3. If all assignments are submitted and approved
    
    // For demo purposes, we'll return a mock response
    return new Promise<{ eligible: boolean; reason?: string }>((resolve) => {
      setTimeout(() => {
        resolve({ 
          eligible: true,
          reason: 'You have successfully completed all requirements for this course.'
        });
      }, 500);
    });
  };

  const handleIssueCertificate = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setIsIssuing(true);
      
      // In a real implementation, you would verify eligibility again before issuing
      const newCertificate = await issueCertificate({
        userId: currentUser.uid,
        courseId,
        userName: currentUser.displayName || 'Student',
        courseName,
        certificateUrl: '', // This will be updated by the backend
        metadata: {
          completionDate: new Date(),
          score: 95, // This would be calculated based on quiz/assignment scores
        },
      });
      
      setCertificate(newCertificate);
      onOpen();
      
      if (onCertificateIssued) {
        onCertificateIssued();
      }
      
      toast({
        title: 'Certificate Generated',
        description: 'Your certificate has been successfully generated!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error issuing certificate:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate certificate. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsIssuing(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!certificate) return;
    
    try {
      await downloadCertificate(certificate.id);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast({
        title: 'Error',
        description: 'Failed to download certificate. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isCheckingEligibility) {
    return (
      <Box textAlign="center" p={6} bg="white" borderRadius="md" boxShadow="sm">
        <Spinner size="md" />
        <Text mt={2}>Checking certificate eligibility...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Box 
        p={6} 
        bg="white" 
        borderRadius="md" 
        boxShadow="sm"
        borderLeft="4px solid"
        borderColor={isEligible ? 'green.500' : 'blue.500'}
      >
        <VStack spacing={4} align="stretch">
          <HStack spacing={3} color={isEligible ? 'green.600' : 'blue.600'}>
            <Box as={isEligible ? FiCheckCircle : FiAward} size={24} />
            <Text fontSize="lg" fontWeight="bold">
              {isEligible ? 'Certificate Available' : 'Course Certificate'}
            </Text>
          </HStack>
          
          <Text color="gray.700">
            {isEligible 
              ? 'Congratulations! You have completed all requirements to earn a certificate for this course.'
              : eligibilityReason || 'Complete all course requirements to earn your certificate.'}
          </Text>
          
          {isEligible ? (
            <HStack spacing={4} mt={4}>
              <Button
                leftIcon={<FiAward />}
                colorScheme="green"
                onClick={handleIssueCertificate}
                isLoading={isIssuing}
                loadingText="Generating..."
              >
                Get Certificate
              </Button>
              <Text fontSize="sm" color="gray.500">
                Earn a verifiable certificate upon completion
              </Text>
            </HStack>
          ) : (
            <Alert status="info" mt={4} borderRadius="md">
              <AlertIcon />
              {eligibilityReason || 'Complete all course modules and pass all assessments to earn your certificate.'}
            </Alert>
          )}
        </VStack>
      </Box>

      {/* Certificate Preview Modal */}
      {certificate && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.7)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1000}
          p={4}
          onClick={onClose}
        >
          <Box 
            maxW="800px" 
            w="100%" 
            maxH="90vh" 
            overflowY="auto" 
            bg="white" 
            borderRadius="lg"
            p={6}
            onClick={(e) => e.stopPropagation()}
          >
            <CertificateViewer 
              certificate={certificate} 
              onDownload={handleDownloadCertificate}
              showVerification={true}
            />
            <Button 
              mt={4} 
              onClick={onClose}
              width="100%"
              variant="outline"
            >
              Close
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CertificateEligibility;
