import React, { useState } from 'react';
import { Box, Button, Flex, Heading, Text, useToast, VStack, HStack, Badge, Divider } from '@chakra-ui/react';
import { FiDownload, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { Certificate } from '../../types/certificate';

interface CertificateViewerProps {
  certificate: Certificate;
  onDownload?: () => void;
  showVerification?: boolean;
}

export const CertificateViewer: React.FC<CertificateViewerProps> = ({
  certificate,
  onDownload,
  showVerification = false,
}) => {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const toast = useToast();

  const handleVerify = async () => {
    try {
      // In a real implementation, you would call verifyCertificate from certificateService
      // const result = await verifyCertificate(certificate.verificationCode);
      // setIsVerified(result.isValid);
      
      // Mock verification for now
      setIsVerified(true);
      
      toast({
        title: 'Certificate verified',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error verifying certificate:', error);
      toast({
        title: 'Error verifying certificate',
        description: 'Failed to verify certificate. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box 
      maxW="800px" 
      mx="auto" 
      p={8} 
      borderWidth="1px" 
      borderRadius="lg" 
      boxShadow="lg"
      bg="white"
    >
      {/* Certificate Header */}
      <VStack spacing={4} mb={8}>
        <Heading as="h1" size="xl" color="blue.600">
          Certificate of Completion
        </Heading>
        <Text fontSize="lg" color="gray.600">
          This is to certify that
        </Text>
        <Heading as="h2" size="2xl" color="blue.700" textAlign="center">
          {certificate.userName}
        </Heading>
        <Text fontSize="lg" color="gray.600" textAlign="center">
          has successfully completed the course
        </Text>
        <Heading as="h3" size="lg" color="blue.600" textAlign="center">
          {certificate.courseName}
        </Heading>
      </VStack>

      {/* Certificate Details */}
      <VStack spacing={4} align="stretch" mb={8}>
        <Divider />
        <HStack justify="space-between">
          <Text fontWeight="medium">Issued on:</Text>
          <Text>{new Date(certificate.issueDate).toLocaleDateString()}</Text>
        </HStack>
        
        {certificate.metadata?.completionDate && (
          <HStack justify="space-between">
            <Text fontWeight="medium">Completion Date:</Text>
            <Text>{new Date(certificate.metadata.completionDate).toLocaleDateString()}</Text>
          </HStack>
        )}
        
        {certificate.metadata?.score !== undefined && (
          <HStack justify="space-between">
            <Text fontWeight="medium">Score:</Text>
            <Text>{certificate.metadata.score}%</Text>
          </HStack>
        )}
        
        {showVerification && (
          <HStack justify="space-between">
            <Text fontWeight="medium">Verification Code:</Text>
            <Box>
              <Badge colorScheme={isVerified ? 'green' : 'gray'} p={2} borderRadius="md">
                {certificate.verificationCode}
              </Badge>
            </Box>
          </HStack>
        )}
        <Divider />
      </VStack>

      {/* Verification Status */}
      {showVerification && (
        <Box mb={8} p={4} bg="gray.50" borderRadius="md">
          <HStack spacing={2} mb={2}>
            {isVerified === true ? (
              <>
                <FiCheckCircle color="green" />
                <Text color="green.600" fontWeight="medium">This certificate has been verified</Text>
              </>
            ) : isVerified === false ? (
              <>
                <FiXCircle color="red" />
                <Text color="red.600" fontWeight="medium">Verification failed</Text>
              </>
            ) : (
              <Text>Verify this certificate to confirm its authenticity</Text>
            )}
          </HStack>
          <Button 
            size="sm" 
            colorScheme="blue" 
            variant="outline"
            onClick={handleVerify}
            isDisabled={isVerified === true}
          >
            {isVerified === true ? 'Verified' : 'Verify Certificate'}
          </Button>
        </Box>
      )}

      {/* Actions */}
      <Flex justify="center" mt={8}>
        <Button
          leftIcon={<FiDownload />}
          colorScheme="blue"
          size="lg"
          onClick={onDownload}
          isLoading={!certificate.certificateUrl}
          loadingText="Generating..."
        >
          Download Certificate (PDF)
        </Button>
      </Flex>
    </Box>
  );
};

export default CertificateViewer;
