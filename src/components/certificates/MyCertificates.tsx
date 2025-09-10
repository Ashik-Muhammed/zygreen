import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  SimpleGrid,
  useDisclosure,
  useToast,
  Spinner,
  Badge,
  Divider,
  useColorModeValue,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Wrap,
  WrapItem,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from '@chakra-ui/react';
import { 
  FiSearch, 
  FiX, 
  FiAward, 
  FiDownload, 
  FiExternalLink, 
  FiFilter, 
  FiChevronDown,
  FiGrid,
  FiList,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiCopy,
  FiShare2,
  FiPrinter,
  FiPlus,
} from 'react-icons/fi';
import { format } from 'date-fns';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  getUserCertificates, 
  verifyCertificateByCode,
  downloadCertificatePDF,
  Certificate,
  CertificateVerification
} from '../../../services/certificateService';
import CertificateViewer from './CertificateViewer';
import CertificateEligibility from './CertificateEligibility';

const MyCertificates: React.FC = () => {
  const { currentUser } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('my-certificates');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<CertificateVerification | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [filter, setFilter] = useState<string>('all');
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const primaryColor = useColorModeValue('blue.600', 'blue.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const activeBg = useColorModeValue('gray.100', 'gray.600');
  
  // Fetch user's certificates
  useEffect(() => {
    const fetchCertificates = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        const userCertificates = await getUserCertificates(currentUser.uid);
        setCertificates(userCertificates);
        setFilteredCertificates(userCertificates);
      } catch (error) {
        console.error('Error fetching certificates:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your certificates. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCertificates();
  }, [currentUser, toast]);
  
  // Filter certificates based on search query and filter
  useEffect(() => {
    let result = [...certificates];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(cert => 
        cert.courseName.toLowerCase().includes(query) ||
        cert.recipientName.toLowerCase().includes(query) ||
        (cert.verificationCode && cert.verificationCode.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (filter === 'recent') {
      result.sort((a, b) => 
        new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
      );
    } else if (filter === 'expiring') {
      result = result.filter(cert => {
        if (!cert.expiryDate) return false;
        const expiryDate = cert.expiryDate.toDate ? 
          cert.expiryDate.toDate() : new Date(cert.expiryDate);
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
      });
    } else if (filter === 'expired') {
      result = result.filter(cert => {
        if (!cert.expiryDate) return false;
        const expiryDate = cert.expiryDate.toDate ? 
          cert.expiryDate.toDate() : new Date(cert.expiryDate);
        return expiryDate < new Date();
      });
    }
    
    setFilteredCertificates(result);
  }, [searchQuery, certificates, filter]);
  
  // Handle certificate verification
  const handleVerifyCertificate = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a verification code',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setIsVerifying(true);
      const result = await verifyCertificateByCode(verificationCode);
      setVerificationResult(result);
      
      if (!result.isValid) {
        toast({
          title: 'Verification Failed',
          description: result.message || 'This certificate could not be verified.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Verification Successful',
          description: 'This certificate is valid and belongs to the verified recipient.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error verifying certificate:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while verifying the certificate. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Handle certificate download
  const handleDownloadCertificate = async (certificate: Certificate) => {
    try {
      await downloadCertificatePDF(
        certificate.id, 
        `${certificate.courseName.replace(/\s+/g, '-').toLowerCase()}-certificate`
      );
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
  
  // Handle certificate share
  const handleShareCertificate = async (certificate: Certificate) => {
    try {
      const shareData = {
        title: `${certificate.courseName} Certificate`,
        text: `Check out my ${certificate.courseName} certificate!`,
        url: `${window.location.origin}/certificates/${certificate.id}`,
      };
      
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
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
  
  // Render certificate card (grid view)
  const renderCertificateCard = (certificate: Certificate) => {
    const issueDate = certificate.issuedAt.toDate 
      ? format(certificate.issuedAt.toDate(), 'MMM d, yyyy') 
      : format(new Date(certificate.issuedAt), 'MMM d, yyyy');
    
    const isExpired = certificate.expiryDate && (
      certificate.expiryDate.toDate 
        ? certificate.expiryDate.toDate() < new Date() 
        : new Date(certificate.expiryDate) < new Date()
    );
    
    const isExpiringSoon = !isExpired && certificate.expiryDate && (
      certificate.expiryDate.toDate
        ? (certificate.expiryDate.toDate().getTime() - new Date().getTime()) <= 30 * 24 * 60 * 60 * 1000
        : (new Date(certificate.expiryDate).getTime() - new Date().getTime()) <= 30 * 24 * 60 * 60 * 1000
    );
    
    return (
      <Box
        key={certificate.id}
        bg={cardBg}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={borderColor}
        overflow="hidden"
        transition="all 0.2s"
        _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
      >
        <Box p={5}>
          <HStack justify="space-between" mb={3} align="flex-start">
            <Box>
              <Text fontSize="sm" color="gray.500" mb={1}>
                {certificate.courseName}
              </Text>
              <Heading size="md" mb={2} noOfLines={2}>
                {certificate.recipientName}
              </Heading>
            </Box>
            
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Options"
                icon={<FiChevronDown />}
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
              />
              <MenuList>
                <MenuItem 
                  icon={<FiExternalLink />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCertificate(certificate);
                    onOpen();
                  }}
                >
                  View Certificate
                </MenuItem>
                <MenuItem 
                  icon={<FiDownload />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadCertificate(certificate);
                  }}
                >
                  Download PDF
                </MenuItem>
                <MenuItem 
                  icon={<FiShare2 />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShareCertificate(certificate);
                  }}
                >
                  Share
                </MenuItem>
                <MenuDivider />
                <MenuItem 
                  icon={<FiPrinter />}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.print();
                  }}
                >
                  Print
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
          
          <Text fontSize="sm" color="gray.600" mb={4} noOfLines={2}>
            Issued on {issueDate}
          </Text>
          
          <HStack justify="space-between" mt={4}>
            <Box>
              {isExpired ? (
                <Badge colorScheme="red" px={2} py={1} borderRadius="full">
                  Expired
                </Badge>
              ) : isExpiringSoon ? (
                <Badge colorScheme="orange" px={2} py={1} borderRadius="full">
                  Expiring Soon
                </Badge>
              ) : (
                <Badge colorScheme="green" px={2} py={1} borderRadius="full">
                  Valid
                </Badge>
              )}
            </Box>
            
            <Button 
              size="sm" 
              variant="outline" 
              colorScheme="blue"
              rightIcon={<FiExternalLink />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCertificate(certificate);
                onOpen();
              }}
            >
              View
            </Button>
          </HStack>
        </Box>
      </Box>
    );
  };
  
  // Render certificate row (list view)
  const renderCertificateRow = (certificate: Certificate) => {
    const issueDate = certificate.issuedAt.toDate 
      ? format(certificate.issuedAt.toDate(), 'MMM d, yyyy') 
      : format(new Date(certificate.issuedAt), 'MMM d, yyyy');
    
    const expiryDate = certificate.expiryDate ? (
      certificate.expiryDate.toDate 
        ? format(certificate.expiryDate.toDate(), 'MMM d, yyyy')
        : format(new Date(certificate.expiryDate), 'MMM d, yyyy')
    ) : 'No expiry';
    
    const isExpired = certificate.expiryDate && (
      certificate.expiryDate.toDate 
        ? certificate.expiryDate.toDate() < new Date() 
        : new Date(certificate.expiryDate) < new Date()
    );
    
    const isExpiringSoon = !isExpired && certificate.expiryDate && (
      certificate.expiryDate.toDate
        ? (certificate.expiryDate.toDate().getTime() - new Date().getTime()) <= 30 * 24 * 60 * 60 * 1000
        : (new Date(certificate.expiryDate).getTime() - new Date().getTime()) <= 30 * 24 * 60 * 60 * 1000
    );
    
    return (
      <Box
        key={certificate.id}
        bg={cardBg}
        borderRadius="md"
        borderWidth="1px"
        borderColor={borderColor}
        p={4}
        _hover={{ bg: hoverBg }}
        transition="all 0.2s"
      >
        <Flex align="center" justify="space-between">
          <HStack spacing={4} flex={1} minW={0}>
            <Box
              p={3}
              bg="blue.50"
              color="blue.600"
              borderRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <FiAward size={24} />
            </Box>
            
            <Box minW={0} flex={1}>
              <HStack spacing={2} mb={1}>
                <Text 
                  fontWeight="medium" 
                  fontSize="md" 
                  noOfLines={1}
                  title={certificate.courseName}
                >
                  {certificate.courseName}
                </Text>
                
                {isExpired ? (
                  <Badge colorScheme="red" fontSize="xs">Expired</Badge>
                ) : isExpiringSoon ? (
                  <Badge colorScheme="orange" fontSize="xs">Expiring Soon</Badge>
                ) : (
                  <Badge colorScheme="green" fontSize="xs">Valid</Badge>
                )}
              </HStack>
              
              <Text fontSize="sm" color="gray.600" mb={1} noOfLines={1}>
                {certificate.recipientName}
              </Text>
              
              <HStack spacing={4} fontSize="xs" color="gray.500">
                <Text>Issued: {issueDate}</Text>
                <Text>•</Text>
                <Text>Expires: {expiryDate}</Text>
                {certificate.verificationCode && (
                  <>
                    <Text>•</Text>
                    <Tooltip label="Click to copy verification code">
                      <Text 
                        fontFamily="mono" 
                        cursor="pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(certificate.verificationCode || '');
                          toast({
                            title: 'Copied!',
                            status: 'success',
                            duration: 2000,
                            isClosable: true,
                          });
                        }}
                      >
                        {certificate.verificationCode.substring(0, 6)}...
                      </Text>
                    </Tooltip>
                  </>
                )}
              </HStack>
            </Box>
          </HStack>
          
          <HStack spacing={2} ml={4} flexShrink={0}>
            <Tooltip label="View Certificate">
              <IconButton
                aria-label="View certificate"
                icon={<FiExternalLink />}
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedCertificate(certificate);
                  onOpen();
                }}
              />
            </Tooltip>
            
            <Tooltip label="Download PDF">
              <IconButton
                aria-label="Download certificate"
                icon={<FiDownload />}
                size="sm"
                variant="ghost"
                onClick={() => handleDownloadCertificate(certificate)}
              />
            </Tooltip>
            
            <Menu>
              <Tooltip label="More options">
                <MenuButton
                  as={IconButton}
                  aria-label="Options"
                  icon={<FiChevronDown />}
                  size="sm"
                  variant="ghost"
                />
              </Tooltip>
              <MenuList>
                <MenuItem 
                  icon={<FiShare2 />}
                  onClick={() => handleShareCertificate(certificate)}
                >
                  Share
                </MenuItem>
                <MenuItem 
                  icon={<FiCopy />}
                  onClick={() => {
                    navigator.clipboard.writeText(certificate.verificationCode || '');
                    toast({
                      title: 'Verification code copied!',
                      status: 'success',
                      duration: 2000,
                      isClosable: true,
                    });
                  }}
                >
                  Copy Verification Code
                </MenuItem>
                <MenuDivider />
                <MenuItem 
                  icon={<FiPrinter />}
                  onClick={() => window.print()}
                >
                  Print
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </Box>
    );
  };
  
  // Render verification result
  const renderVerificationResult = () => {
    if (!verificationResult) return null;
    
    if (verificationResult.isValid) {
      return (
        <Alert 
          status="success" 
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          borderRadius="md"
          py={8}
          mb={6}
        >
          <AlertIcon boxSize="40px" mr={0} mb={4} />
          <AlertTitle fontSize="lg" mb={1}>
            Certificate Verified Successfully!
          </AlertTitle>
          <AlertDescription maxW="md">
            This certificate is valid and belongs to {verificationResult.recipientName}.
          </AlertDescription>
          
          {verificationResult.certificate && (
            <Button 
              colorScheme="green" 
              mt={4}
              rightIcon={<FiExternalLink />}
              onClick={() => {
                setSelectedCertificate(verificationResult.certificate!);
                onOpen();
              }}
            >
              View Certificate
            </Button>
          )}
        </Alert>
      );
    }
    
    return (
      <Alert 
        status="error" 
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        borderRadius="md"
        py={8}
        mb={6}
      >
        <AlertIcon boxSize="40px" mr={0} mb={4} />
        <AlertTitle fontSize="lg" mb={1}>
          Verification Failed
        </AlertTitle>
        <AlertDescription maxW="md">
          {verificationResult.message || 'This certificate could not be verified.'}
        </AlertDescription>
      </Alert>
    );
  };
  
  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) return null;
    
    if (activeTab === 'my-certificates' && filteredCertificates.length === 0) {
      return (
        <Box 
          textAlign="center" 
          py={12} 
          px={4}
          bg={cardBg}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <Box 
            display="inline-flex" 
            p={4} 
            bg="blue.50" 
            color="blue.500" 
            borderRadius="full"
            mb={4}
          >
            <FiAward size={32} />
          </Box>
          <Heading size="md" mb={2}>
            No Certificates Found
          </Heading>
          <Text color="gray.600" mb={6} maxW="md" mx="auto">
            You haven't earned any certificates yet. Complete courses to earn certificates 
            that you can share with your network.
          </Text>
          <Button 
            colorScheme="blue" 
            leftIcon={<FiPlus />}
            onClick={() => setActiveTab('browse-courses')}
          >
            Browse Courses
          </Button>
        </Box>
      );
    }
    
    if (activeTab === 'verify' && !verificationResult) {
      return (
        <Box 
          textAlign="center" 
          py={12} 
          px={4}
          bg={cardBg}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <Box 
            display="inline-flex" 
            p={4} 
            bg="blue.50" 
            color="blue.500" 
            borderRadius="full"
            mb={4}
          >
            <FiCheckCircle size={32} />
          </Box>
          <Heading size="md" mb={2}>
            Verify a Certificate
          </Heading>
          <Text color="gray.600" mb={6} maxW="md" mx="auto">
            Enter the verification code from the certificate to verify its authenticity 
            and view the certificate details.
          </Text>
          
          <InputGroup maxW="md" mx="auto">
            <InputLeftElement pointerEvents="none">
              <FiAward color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Enter verification code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              pr="4.5rem"
            />
            <InputRightElement width="auto" mr={1}>
              <Button 
                size="sm" 
                colorScheme="blue"
                onClick={handleVerifyCertificate}
                isLoading={isVerifying}
                loadingText="Verifying..."
              >
                Verify
              </Button>
            </InputRightElement>
          </InputGroup>
          
          <Text mt={2} fontSize="sm" color="gray.500">
            The verification code can be found at the bottom of the certificate.
          </Text>
        </Box>
      );
    }
    
    return null;
  };
  
  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="lg" mb={2} display="flex" alignItems="center" gap={2}>
            <FiAward />
            My Certificates
          </Heading>
          <Text color="gray.600">
            View and manage your earned certificates, or verify a certificate's authenticity.
          </Text>
        </Box>
        
        <Tabs 
          variant="enclosed" 
          isFitted
          onChange={(index) => setActiveTab(index === 0 ? 'my-certificates' : 'verify')}
          defaultIndex={0}
        >
          <TabList>
            <Tab _selected={{ color: 'white', bg: primaryColor }}>
              <HStack spacing={2}>
                <FiAward />
                <span>My Certificates</span>
                {certificates.length > 0 && (
                  <Badge 
                    colorScheme="blue" 
                    variant="solid" 
                    borderRadius="full" 
                    px={2}
                    fontSize="0.7em"
                  >
                    {certificates.length}
                  </Badge>
                )}
              </HStack>
            </Tab>
            <Tab _selected={{ color: 'white', bg: primaryColor }}>
              <HStack spacing={2}>
                <FiCheckCircle />
                <span>Verify Certificate</span>
              </HStack>
            </Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel p={0} pt={6}>
              {activeTab === 'my-certificates' && (
                <Box>
                  <Flex justify="space-between" mb={6} flexWrap="wrap" gap={4}>
                    <InputGroup maxW="md">
                      <InputLeftElement pointerEvents="none">
                        <FiSearch color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Search certificates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        pr="4.5rem"
                      />
                      {searchQuery && (
                        <InputRightElement width="4.5rem">
                          <IconButton 
                            aria-label="Clear search" 
                            icon={<FiX />} 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setSearchQuery('')}
                          />
                        </InputRightElement>
                      )}
                    </InputGroup>
                    
                    <HStack spacing={2}>
                      <Menu>
                        <MenuButton 
                          as={Button} 
                          rightIcon={<FiChevronDown />} 
                          variant="outline"
                          leftIcon={<FiFilter size={16} />}
                        >
                          {filter === 'all' ? 'All Certificates' : 
                           filter === 'recent' ? 'Recently Issued' :
                           filter === 'expiring' ? 'Expiring Soon' : 'Expired'}
                        </MenuButton>
                        <MenuList>
                          <MenuItem 
                            onClick={() => setFilter('all')}
                            bg={filter === 'all' ? 'blue.50' : 'transparent'}
                          >
                            All Certificates
                          </MenuItem>
                          <MenuItem 
                            onClick={() => setFilter('recent')}
                            bg={filter === 'recent' ? 'blue.50' : 'transparent'}
                          >
                            Recently Issued
                          </MenuItem>
                          <MenuItem 
                            onClick={() => setFilter('expiring')}
                            bg={filter === 'expiring' ? 'blue.50' : 'transparent'}
                          >
                            Expiring Soon
                          </MenuItem>
                          <MenuItem 
                            onClick={() => setFilter('expired')}
                            bg={filter === 'expired' ? 'blue.50' : 'transparent'}
                          >
                            Expired
                          </MenuItem>
                        </MenuList>
                      </Menu>
                      
                      <Button 
                        variant="outline" 
                        px={3} 
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
                      >
                        {viewMode === 'grid' ? <FiList /> : <FiGrid />}
                      </Button>
                    </HStack>
                  </Flex>
                  
                  {isLoading ? (
                    <Flex justify="center" py={12}>
                      <Spinner size="xl" color={primaryColor} />
                    </Flex>
                  ) : filteredCertificates.length > 0 ? (
                    <Box>
                      {viewMode === 'grid' ? (
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                          {filteredCertificates.map(renderCertificateCard)}
                        </SimpleGrid>
                      ) : (
                        <VStack spacing={3} align="stretch">
                          {filteredCertificates.map(renderCertificateRow)}
                        </VStack>
                      )}
                      
                      <Text mt={4} textAlign="center" color="gray.500" fontSize="sm">
                        Showing {filteredCertificates.length} of {certificates.length} certificates
                      </Text>
                    </Box>
                  ) : (
                    renderEmptyState()
                  )}
                </Box>
              )}
            </TabPanel>
            
            <TabPanel p={0} pt={6}>
              {activeTab === 'verify' && (
                <Box>
                  {verificationResult ? (
                    <Box>
                      {renderVerificationResult()}
                      <Button 
                        variant="outline" 
                        leftIcon={<FiPlus />}
                        onClick={() => {
                          setVerificationResult(null);
                          setVerificationCode('');
                        }}
                      >
                        Verify Another Certificate
                      </Button>
                    </Box>
                  ) : (
                    renderEmptyState()
                  )}
                </Box>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
      
      {/* Certificate Viewer Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        size={selectedCertificate ? '6xl' : 'md'} 
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={0}>
            {selectedCertificate ? (
              <CertificateViewer 
                certificateId={selectedCertificate.id} 
                variant="full"
                showHeader={true}
                showFooter={true}
                showActions={true}
                showVerification={true}
              />
            ) : (
              <Flex justify="center" p={8}>
                <Spinner size="xl" />
              </Flex>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MyCertificates;
