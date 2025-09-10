import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  HStack,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  VStack,
  Progress,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { FiAward, FiCheckCircle, FiClock, FiDownload } from 'react-icons/fi';
import { checkCertificateEligibility, createCertificate } from '../../services/certificateService';
import { CertificateEligibility as CertificateEligibilityType, Certificate } from '../../types/certificate';

interface Requirement {
  description: string;
  completed: boolean;
  required: boolean;
}

interface CertificateEligibilityProps {
  courseId: string;
  userId?: string;
  showTitle?: boolean;
  showRequestButton?: boolean;
  showProgress?: boolean;
  variant?: 'card' | 'full';
}

const CertificateEligibility: React.FC<CertificateEligibilityProps> = ({
  courseId,
  userId,
  showRequestButton = true,
  showProgress = true,
}) => {
  const [eligibility, setEligibility] = useState<CertificateEligibilityType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [issuedCertificate, setIssuedCertificate] = useState<Certificate | null>(null);
  const toast = useToast();
  const successColor = useColorModeValue('green.600', 'green.400');
  const warningColor = useColorModeValue('orange.500', 'orange.300');

  useEffect(() => {
    const fetchEligibility = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const data = await checkCertificateEligibility(userId, courseId);
        setEligibility(data);

        if (data.issuedCertificate) {
          setIssuedCertificate(data.issuedCertificate);
        }
      } catch (error) {
        console.error('Error fetching certificate eligibility:', error);
        toast({
          title: 'Error',
          description: 'Failed to load certificate eligibility. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchEligibility();
    }
  }, [courseId, userId, toast]);

  const handleRequestCertificate = async () => {
    if (!userId || !eligibility) return;

    try {
      setIsRequesting(true);
      const certificate = await createCertificate({
        userId,
        courseId,
        recipientName: 'User', // This should come from user profile
        courseName: 'Course', // This should come from course data
        issueDate: new Date(),
        // Other required fields based on the Certificate type
      } as any); // Temporary type assertion to satisfy TypeScript
      setIssuedCertificate(certificate);

      toast({
        title: 'Certificate Generated',
        description: 'Your certificate has been generated successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate certificate. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!issuedCertificate) return;

    try {
      window.open(`/api/certificates/${issuedCertificate.id}/download`, '_blank');
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

  const renderProgress = () => {
    if (!eligibility || !showProgress) return null;

    const progress = eligibility.progress || 0;
    const isComplete = progress >= 100;

    return (
      <Box mb={6}>
        <Flex justify="space-between" mb={2}>
          <Text fontWeight="medium">Completion Progress</Text>
          <Text color={isComplete ? successColor : 'inherit'}>
            {isComplete ? 'Completed!' : `${Math.round(progress)}%`}
          </Text>
        </Flex>
        <Progress
          value={progress}
          size="sm"
          colorScheme={isComplete ? 'green' : 'blue'}
          borderRadius="full"
        />
      </Box>
    );
  };

  const renderRequirements = () => {
    if (!eligibility?.requirements?.length) return null;

    return (
      <VStack align="stretch" spacing={3} mb={6}>
        <Text fontWeight="medium">Requirements:</Text>
        {eligibility.requirements.map((req: Requirement, index: number) => (
          <HStack key={index} spacing={3}>
            <Icon
              as={req.completed ? FiCheckCircle : FiClock}
              color={req.completed ? successColor : warningColor}
              boxSize={5}
            />
            <Text>{req.description}</Text>
          </HStack>
        ))}
      </VStack>
    );
  };

  if (isLoading) {
    return (
      <Flex justify="center" p={8}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!eligibility) {
    return (
      <Alert status="error">
        <AlertIcon />
        Could not load certificate eligibility information.
      </Alert>
    );
  }

  return (
    <Box>
      {issuedCertificate ? (
        <Alert status="success" mb={6}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Certificate Issued!</AlertTitle>
            <AlertDescription>
              You've successfully earned a certificate for this course.
            </AlertDescription>
            <Button
              mt={3}
              colorScheme="blue"
              leftIcon={<FiDownload />}
              onClick={handleDownloadPDF}
            >
              Download Certificate
            </Button>
          </Box>
        </Alert>
      ) : (
        <Alert status="info" mb={6}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Earn a Certificate</AlertTitle>
            <AlertDescription>
              Complete all requirements to earn your certificate.
            </AlertDescription>
            {showRequestButton && eligibility.isEligible && (
              <Button
                mt={3}
                colorScheme="blue"
                leftIcon={<FiAward />}
                onClick={handleRequestCertificate}
                isLoading={isRequesting}
                loadingText="Generating..."
              >
                Request Certificate
              </Button>
            )}
          </Box>
        </Alert>
      )}

      {renderProgress()}
      {renderRequirements()}
    </Box>
  );
};

export default CertificateEligibility;
