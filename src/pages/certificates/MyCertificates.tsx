import { useEffect, useState } from 'react';
import { Certificate } from '../../types/certificate';
import { Box, Heading, VStack, Text, SimpleGrid, useToast, Input, Button, HStack } from '@chakra-ui/react';
import { FiDownload, FiCheck, FiX } from 'react-icons/fi';
import { CertificateViewer } from '../../components/certificate/CertificateViewer';
import { useAuth } from '../../contexts/AuthContext';
import useCertificate from '../../hooks/useCertificate';

const MyCertificates = () => {
  const { currentUser } = useAuth();
  const { 
    certificates, 
    isLoading, 
    fetchCertificates, 
    downloadCertificate,
    verifyCertificate,
  } = useCertificate(currentUser?.uid);
  
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    certificate?: any; // Using any to avoid type issues with CertificateVerification
  } | null>(null);
  
  const toast = useToast();

  useEffect(() => {
    if (currentUser?.uid) {
      fetchCertificates();
    }
  }, [currentUser?.uid, fetchCertificates]);

  const handleVerify = async () => {
    if (!verificationCode.trim()) return;
    
    try {
      const result = await verifyCertificate(verificationCode);
      setVerificationResult({
        isValid: result.isValid,
        certificate: result as any, // Type assertion to avoid CertificateVerification type issues
      });
      
      toast({
        title: result.isValid ? 'Certificate Verified' : 'Verification Failed',
        status: result.isValid ? 'success' : 'error',
        description: result.isValid 
          ? 'This certificate is valid and was issued by our platform.'
          : 'No matching certificate found with this verification code.',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error verifying certificate:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while verifying the certificate.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isLoading && certificates.length === 0) {
    return <Box p={8}>Loading your certificates...</Box>;
  }

  return (
    <Box p={{ base: 4, md: 8 }} maxW="1200px" mx="auto">
      <Heading as="h1" size="xl" mb={8} color="blue.700">
        My Certificates
      </Heading>

      {/* Certificate Verification Section */}
      <Box mb={12} p={6} bg="gray.50" borderRadius="lg" boxShadow="sm">
        <Heading as="h2" size="md" mb={4} color="gray.700">
          Verify a Certificate
        </Heading>
        <Text mb={4} color="gray.600">
          Enter a verification code to check the authenticity of a certificate
        </Text>
        <HStack>
          <Input
            placeholder="Enter verification code (e.g., CERT-ABC123)"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxW="400px"
          />
          <Button 
            colorScheme="blue" 
            leftIcon={<FiCheck />}
            onClick={handleVerify}
            isLoading={isLoading}
          >
            Verify
          </Button>
        </HStack>
        
        {verificationResult && (
          <Box mt={4} p={4} bg="white" borderRadius="md" borderWidth="1px">
            <HStack color={verificationResult.isValid ? 'green.500' : 'red.500'}>
              {verificationResult.isValid ? <FiCheck size={24} /> : <FiX size={24} />}
              <Text fontWeight="bold">
                {verificationResult.isValid 
                  ? 'This certificate is valid and verified.'
                  : 'No matching certificate found.'}
              </Text>
            </HStack>
            
            {verificationResult.isValid && verificationResult.certificate && (
              <Box mt={4}>
                <Text>Issued to: {verificationResult.certificate.userName}</Text>
                <Text>Course: {verificationResult.certificate.courseName}</Text>
                <Text>Issued on: {new Date(verificationResult.certificate.issueDate).toLocaleDateString()}</Text>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* My Certificates Section */}
      <Box>
        <Heading as="h2" size="lg" mb={6} color="gray.700">
          My Awarded Certificates
        </Heading>
        
        {certificates.length === 0 ? (
          <Box textAlign="center" py={12} bg="white" borderRadius="lg" boxShadow="sm">
            <Text fontSize="lg" color="gray.500" mb={4}>
              You don't have any certificates yet.
            </Text>
            <Text color="gray.500">
              Complete courses to earn certificates that you can share with employers and colleagues.
            </Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {certificates.map((cert) => (
              <Box
                key={cert.id}
                p={6}
                borderWidth="1px"
                borderRadius="lg"
                bg="white"
                boxShadow="sm"
                _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
                cursor="pointer"
                onClick={() => setSelectedCertificate(cert)}
              >
                <VStack align="stretch" spacing={4}>
                  <Box
                    h="120px"
                    bgGradient="linear(to-r, blue.100, purple.100)"
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="4xl" fontWeight="bold" color="blue.600">
                      {cert.courseName.charAt(0)}
                    </Text>
                  </Box>
                  <Box>
                    <Heading size="md" mb={2} color="gray.800">
                      {cert.courseName}
                    </Heading>
                    <Text fontSize="sm" color="gray.500" mb={2}>
                      Issued on {new Date(cert.issueDate).toLocaleDateString()}
                    </Text>
                    {cert.metadata?.score !== undefined && (
                      <Text fontSize="sm" color="gray.700">
                        Score: <strong>{cert.metadata.score}%</strong>
                      </Text>
                    )}
                  </Box>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                    leftIcon={<FiDownload />}
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadCertificate(cert.id);
                    }}
                    width="100%"
                  >
                    Download
                  </Button>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>

      {/* Certificate Viewer Modal */}
      {selectedCertificate && (
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
          onClick={() => setSelectedCertificate(null)}
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
              certificate={selectedCertificate} 
              onDownload={() => downloadCertificate(selectedCertificate.id)}
              showVerification={true}
            />
            <Button 
              mt={4} 
              onClick={() => setSelectedCertificate(null)}
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

export default MyCertificates;
