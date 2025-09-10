import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Heading,
  Button,
  useToast,
  VStack,
  HStack,
  Badge,
  IconButton,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Divider,
  useColorModeValue,
  Spinner,
  Image,
  Link,
} from '@chakra-ui/react';
import { FiDownload, FiExternalLink, FiCopy, FiCheck, FiShare2, FiPrinter } from 'react-icons/ffi';
import { format } from 'date-fns';
import { getCertificate, verifyCertificate, downloadCertificatePDF } from '../../../services/certificateService';
import { Certificate, CertificateVerification } from '../../../types/certificate';

interface CertificateViewerProps {
  certificateId: string;
  onClose?: () => void;
  showActions?: boolean;
  showVerification?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  variant?: 'card' | 'full' | 'minimal';
  width?: string | number;
  height?: string | number;
}

const CertificateViewer: React.FC<CertificateViewerProps> = ({
  certificateId,
  onClose,
  showActions = true,
  showVerification = true,
  showHeader = true,
  showFooter = true,
  variant = 'card',
  width,
  height,
}) => {
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [verification, setVerification] = useState<CertificateVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose: onModalClose } = useDisclosure();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const primaryColor = useColorModeValue('blue.600', 'blue.400');
  const secondaryColor = useColorModeValue('gray.600', 'gray.400');
  
  // Fetch certificate data
  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setIsLoading(true);
        const cert = await getCertificate(certificateId);
        setCertificate(cert);
        
        // Auto-verify if enabled
        if (showVerification) {
          await handleVerify();
        }
      } catch (error) {
        console.error('Error fetching certificate:', error);
        toast({
          title: 'Error',
          description: 'Failed to load certificate. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (certificateId) {
      fetchCertificate();
    }
  }, [certificateId, showVerification, toast]);
  
  // Handle certificate verification
  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      const result = await verifyCertificate(certificateId);
      setVerification(result);
      
      if (!result.isValid) {
        toast({
          title: 'Verification Failed',
          description: result.message || 'This certificate could not be verified.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error verifying certificate:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify certificate. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!certificate) return;
    
    try {
      setIsDownloading(true);
      await downloadCertificatePDF(certificate.id, `${certificate.courseName.replace(/\s+/g, '-').toLowerCase()}-certificate`);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast({
        title: 'Error',
        description: 'Failed to download certificate. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Copy verification link to clipboard
  const copyVerificationLink = () => {
    if (!certificate) return;
    
    const verificationLink = `${window.location.origin}/verify/${certificate.verificationCode}`;
    navigator.clipboard.writeText(verificationLink);
    
    setCopied(true);
    toast({
      title: 'Link copied!',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Share certificate
  const handleShare = async () => {
    if (!certificate) return;
    
    try {
      const shareData = {
        title: `${certificate.courseName} Certificate`,
        text: `Check out my ${certificate.courseName} certificate!`,
        url: `${window.location.origin}/certificates/${certificate.id}`,
      };
      
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: 'Link copied to clipboard!',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error sharing certificate:', error);
    }
  };
  
  // Print certificate
  const handlePrint = () => {
    window.print();
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Flex align="center" justify="center" p={8} minH="300px">
        <Spinner size="xl" color={primaryColor} />
      </Flex>
    );
  }
  
  // Render error state
  if (!certificate) {
    return (
      <Box p={6} textAlign="center" bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
        <Heading size="md" mb={2}>Certificate Not Found</Heading>
        <Text color={secondaryColor} mb={4}>
          The requested certificate could not be found or you don't have permission to view it.
        </Text>
        {onClose && (
          <Button colorScheme="blue" onClick={onClose}>
            Close
          </Button>
        )}
      </Box>
    );
  }
  
  // Format issue date
  const issueDate = certificate.issuedAt?.toDate
    ? format(certificate.issuedAt.toDate(), 'MMMM d, yyyy')
    : format(new Date(certificate.issuedAt), 'MMMM d, yyyy');
  
  // Format expiry date if applicable
  const expiryDate = certificate.expiryDate
    ? certificate.expiryDate.toDate
      ? format(certificate.expiryDate.toDate(), 'MMMM d, yyyy')
      : format(new Date(certificate.expiryDate), 'MMMM d, yyyy')
    : null;
  
  // Render verification badge
  const renderVerificationBadge = () => {
    if (!verification) return null;
    
    return (
      <Badge 
        colorScheme={verification.isValid ? 'green' : 'red'} 
        px={2} py={1} borderRadius="full"
        display="flex" alignItems="center" gap={1}
      >
        {verification.isValid ? '✓' : '✗'}
        {verification.isValid ? 'Verified' : 'Not Verified'}
      </Badge>
    );
  };
  
  // Render certificate card (minimal view)
  if (variant === 'card') {
    return (
      <Box 
        bg={cardBg} 
        borderRadius="lg" 
        borderWidth="1px" 
        borderColor={borderColor}
        overflow="hidden"
        width={width || '100%'}
        boxShadow="sm"
        _hover={{ boxShadow: 'md' }}
        transition="all 0.2s"
      >
        <Box p={5}>
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" color={secondaryColor} fontWeight="medium">
              {certificate.courseName}
            </Text>
            {showVerification && renderVerificationBadge()}
          </HStack>
          
          <Heading size="md" mb={2} noOfLines={2}>
            {certificate.recipientName}
          </Heading>
          
          <Text fontSize="sm" color={secondaryColor} mb={4}>
            Issued on {issueDate}
          </Text>
          
          {showActions && (
            <HStack spacing={2} mt={4}>
              <Button 
                size="sm" 
                variant="outline" 
                leftIcon={<FiExternalLink />}
                onClick={onOpen}
              >
                View
              </Button>
              <Button 
                size="sm" 
                colorScheme="blue" 
                variant="ghost"
                leftIcon={<FiDownload />}
                onClick={handleDownloadPDF}
                isLoading={isDownloading}
                loadingText="Downloading..."
              >
                PDF
              </Button>
            </HStack>
          )}
        </Box>
        
        {/* Full View Modal */}
        <Modal isOpen={isOpen} onClose={onModalClose} size="xl" isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <Text>Certificate</Text>
                {showVerification && renderVerificationBadge()}
              </HStack>
              <Text fontSize="sm" fontWeight="normal" color={secondaryColor} mt={1}>
                {certificate.courseName}
              </Text>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <CertificateViewer 
                certificateId={certificateId} 
                variant="full"
                showHeader={false}
                showFooter={false}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
    );
  }
  
  // Render full certificate
  return (
    <Box 
      className="certificate-container"
      bg="white"
      borderRadius={variant === 'full' ? 'md' : 'none'}
      borderWidth={variant === 'full' ? '1px' : '0'}
      borderColor={borderColor}
      width={width || '100%'}
      height={height || 'auto'}
      position="relative"
      overflow="hidden"
      boxShadow={variant === 'full' ? 'lg' : 'none'}
    >
      {/* Certificate Design */}
      <Box 
        p={variant === 'minimal' ? 6 : { base: 6, md: 10 }}
        borderWidth="2px"
        borderColor="gold"
        minH={variant === 'minimal' ? 'auto' : '500px'}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        position="relative"
        bg="white"
      >
        {/* Decorative Border */}
        <Box 
          position="absolute"
          top={4}
          left={4}
          right={4}
          bottom={4}
          borderWidth="1px"
          borderColor="gold"
          pointerEvents="none"
        />
        
        {/* Watermark */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          opacity={0.05}
          zIndex={0}
          pointerEvents="none"
        >
          <Image 
            src="/images/logo-watermark.png" 
            alt="Watermark"
            maxH="80%"
            maxW="80%"
            mx="auto"
          />
        </Box>
        
        {/* Certificate Content */}
        <Box position="relative" zIndex={1}>
          {/* Header */}
          {showHeader && (
            <Box textAlign="center" mb={8}>
              <Image 
                src="/images/logo.png" 
                alt="Logo" 
                h="60px" 
                mb={4} 
                mx="auto"
                display="inline-block"
              />
              <Text 
                fontSize={variant === 'minimal' ? 'sm' : 'md'} 
                color={secondaryColor}
                letterSpacing="wider"
                textTransform="uppercase"
                mb={1}
              >
                Certificate of Completion
              </Text>
              <Divider borderColor="gold" w="100px" mx="auto" mb={4} />
              <Text 
                fontSize={variant === 'minimal' ? 'sm' : 'md'} 
                color={secondaryColor}
                maxW="600px"
                mx="auto"
              >
                This is to certify that
              </Text>
            </Box>
          )}
          
          {/* Recipient Name */}
          <Heading 
            as="h1" 
            size={variant === 'minimal' ? 'xl' : '2xl'}
            textAlign="center"
            mb={6}
            color={primaryColor}
            fontWeight="bold"
            lineHeight="1.2"
            className="recipient-name"
          >
            {certificate.recipientName}
          </Heading>
          
          {/* Course Details */}
          <Text 
            fontSize={variant === 'minimal' ? 'md' : 'lg'} 
            textAlign="center"
            mb={6}
            px={4}
          >
            has successfully completed the course
          </Text>
          
          <Heading 
            as="h2" 
            size={variant === 'minimal' ? 'lg' : 'xl'}
            textAlign="center"
            mb={6}
            color={primaryColor}
            fontWeight="semibold"
            px={4}
          >
            {certificate.courseName}
          </Heading>
          
          {/* Additional Details */}
          <VStack spacing={1} mb={8}>
            <Text fontSize={variant === 'minimal' ? 'sm' : 'md'} textAlign="center">
              with a grade of <strong>{certificate.grade || 'Pass'}</strong>
            </Text>
            
            {certificate.completionDate && (
              <Text fontSize={variant === 'minimal' ? 'sm' : 'md'} textAlign="center">
                Completed on {format(new Date(certificate.completionDate), 'MMMM d, yyyy')}
              </Text>
            )}
            
            {expiryDate && (
              <Text fontSize={variant === 'minimal' ? 'sm' : 'md'} textAlign="center">
                Valid until {expiryDate}
              </Text>
            )}
            
            {certificate.credits && (
              <Text fontSize={variant === 'minimal' ? 'sm' : 'md'} textAlign="center">
                Awarded {certificate.credits} {certificate.credits === 1 ? 'credit' : 'credits'}
              </Text>
            )}
          </VStack>
          
          {/* Signatures */}
          <Flex 
            justify="space-between" 
            mt={8} 
            flexWrap="wrap"
            gap={4}
          >
            <Box flex={1} minW="120px" textAlign="center">
              <Divider borderColor="gray.300" mb={4} />
              <Text fontWeight="medium">Issued By</Text>
              <Text fontSize="sm" color={secondaryColor}>
                {certificate.issuedBy || 'Learning Platform'}
              </Text>
              <Text fontSize="xs" color={secondaryColor} mt={1}>
                {issueDate}
              </Text>
            </Box>
            
            {certificate.instructorName && (
              <Box flex={1} minW="120px" textAlign="center">
                <Divider borderColor="gray.300" mb={4} />
                <Text fontWeight="medium">Instructor</Text>
                <Text fontSize="sm" color={secondaryColor}>
                  {certificate.instructorName}
                </Text>
              </Box>
            )}
            
            <Box flex={1} minW="120px" textAlign="center">
              <Divider borderColor="gray.300" mb={4} />
              <Text fontWeight="medium">Certificate ID</Text>
              <Text 
                fontSize="xs" 
                fontFamily="mono" 
                color={secondaryColor}
                wordBreak="break-all"
              >
                {certificate.verificationCode || certificate.id}
              </Text>
            </Box>
          </Flex>
          
          {/* Verification Section */}
          {showVerification && (
            <Box 
              mt={8} 
              pt={4} 
              borderTopWidth="1px" 
              borderTopColor={borderColor}
              textAlign="center"
            >
              <HStack justify="center" spacing={4} mb={2}>
                <Text fontSize="sm" color={secondaryColor}>
                  Verify this certificate at:
                </Text>
                <Link 
                  href={`/verify/${certificate.verificationCode}`}
                  color="blue.500"
                  isExternal
                  fontSize="sm"
                >
                  {window.location.host}/verify/{certificate.verificationCode}
                </Link>
                <Tooltip label={copied ? 'Copied!' : 'Copy verification link'} closeOnClick={false}>
                  <IconButton
                    aria-label="Copy verification link"
                    icon={copied ? <FiCheck /> : <FiCopy />}
                    size="xs"
                    variant="ghost"
                    onClick={copyVerificationLink}
                  />
                </Tooltip>
              </HStack>
              
              {verification && !verification.isValid && (
                <Text fontSize="xs" color="red.500" mt={1}>
                  {verification.message || 'This certificate could not be verified.'}
                </Text>
              )}
            </Box>
          )}
          
          {/* Actions */}
          {showActions && (
            <Flex 
              justify="center" 
              mt={8} 
              gap={3}
              flexWrap="wrap"
            >
              <Button
                leftIcon={<FiDownload />}
                colorScheme="blue"
                size={variant === 'minimal' ? 'sm' : 'md'}
                onClick={handleDownloadPDF}
                isLoading={isDownloading}
                loadingText="Downloading..."
              >
                Download PDF
              </Button>
              
              <Button
                leftIcon={<FiPrinter />}
                variant="outline"
                size={variant === 'minimal' ? 'sm' : 'md'}
                onClick={handlePrint}
              >
                Print
              </Button>
              
              <Button
                leftIcon={<FiShare2 />}
                variant="outline"
                size={variant === 'minimal' ? 'sm' : 'md'}
                onClick={handleShare}
              >
                Share
              </Button>
              
              {showVerification && !verification && (
                <Button
                  leftIcon={isVerifying ? <Spinner size="sm" /> : undefined}
                  variant="ghost"
                  size={variant === 'minimal' ? 'sm' : 'md'}
                  onClick={handleVerify}
                  isLoading={isVerifying}
                  loadingText="Verifying..."
                >
                  Verify Certificate
                </Button>
              )}
            </Flex>
          )}
        </Box>
      </Box>
      
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .certificate-container,
          .certificate-container * {
            visibility: visible;
          }
          .certificate-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          .recipient-name {
            color: #1a365d !important; /* Dark blue for better print contrast */
          }
        }
      `}</style>
    </Box>
  );
};

export default CertificateViewer;
