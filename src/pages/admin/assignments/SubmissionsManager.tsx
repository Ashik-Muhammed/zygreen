import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Flex, 
  Heading, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  Badge, 
  Text, 
  Avatar, 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem,
  useDisclosure,
  useToast,
  VStack,
  HStack,
  Divider,
  IconButton,
  Tooltip,
  Select,
  Textarea,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { 
  CheckIcon, 
  TimeIcon, 
  ViewIcon, 
  DownloadIcon, 
  ChevronDownIcon, 
  ExternalLinkIcon,
  CheckCircleIcon,
  WarningIcon,
  StarIcon
} from '@chakra-ui/icons';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Submission, EvaluationResult, Assignment } from '../../../../types/assignment';
import RichTextEditor from '../../../../components/editor/RichTextEditor';
import FilePreview from '../../../../components/common/FilePreview';

const SubmissionsManager = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGrading, setIsGrading] = useState(false);
  const [evaluation, setEvaluation] = useState<Partial<EvaluationResult>>({
    score: 0,
    feedback: '',
    isPassing: false,
    certificateEligible: false,
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch assignment
        const assignmentDoc = await getDoc(doc(db, 'assignments', assignmentId!));
        if (assignmentDoc.exists()) {
          setAssignment({ id: assignmentDoc.id, ...assignmentDoc.data() } as Assignment);
        }
        
        // Fetch submissions
        const q = query(
          collection(db, 'submissions'),
          where('assignmentId', '==', assignmentId)
        );
        
        const querySnapshot = await getDocs(q);
        const submissionsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          submittedAt: doc.data().submittedAt?.toDate(),
          gradedAt: doc.data().gradedAt?.toDate(),
        })) as Submission[];
        
        setSubmissions(submissionsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load submissions',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (assignmentId) {
      fetchData();
    }
  }, [assignmentId, toast]);

  const handleGradeSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setEvaluation({
      score: submission.score || 0,
      feedback: submission.feedback || '',
      isPassing: (submission.score || 0) >= (assignment?.passingScore || 0),
      certificateEligible: submission.status === 'graded' && (submission.score || 0) >= (assignment?.passingScore || 0)
    });
    onOpen();
  };

  const handleSubmitGrade = async () => {
    if (!selectedSubmission || !assignment) return;
    
    try {
      setIsGrading(true);
      
      const submissionRef = doc(db, 'submissions', selectedSubmission.id!);
      const evaluationData: Partial<Submission> = {
        score: evaluation.score,
        feedback: evaluation.feedback,
        status: 'graded',
        gradedAt: new Date(),
        gradedBy: 'currentUserId', // Replace with actual user ID from auth context
      };
      
      await updateDoc(submissionRef, evaluationData);
      
      // Update submissions list
      setSubmissions(submissions.map(sub => 
        sub.id === selectedSubmission.id 
          ? { ...sub, ...evaluationData } 
          : sub
      ));
      
      // Check if certificate should be awarded
      if (evaluation.certificateEligible) {
        await checkAndAwardCertificate(selectedSubmission.userId, assignment.courseId);
      }
      
      toast({
        title: 'Success',
        description: 'Submission graded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      console.error('Error grading submission:', error);
      toast({
        title: 'Error',
        description: 'Failed to grade submission',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGrading(false);
    }
  };

  const checkAndAwardCertificate = async (userId: string, courseId: string) => {
    try {
      // Check if all required assignments are completed
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('courseId', '==', courseId),
        where('isPublished', '==', true)
      );
      
      const submissionsQuery = query(
        collection(db, 'submissions'),
        where('userId', '==', userId),
        where('courseId', '==', courseId),
        where('status', '==', 'graded')
      );
      
      const [assignmentsSnapshot, submissionsSnapshot] = await Promise.all([
        getDocs(assignmentsQuery),
        getDocs(submissionsQuery)
      ]);
      
      const totalAssignments = assignmentsSnapshot.size;
      const completedSubmissions = submissionsSnapshot.size;
      
      if (totalAssignments > 0 && completedSubmissions >= totalAssignments) {
        // All assignments are completed, award certificate
        const certificateRef = doc(collection(db, 'certificates'));
        await setDoc(certificateRef, {
          userId,
          courseId,
          issuedAt: new Date(),
          status: 'awarded',
          certificateId: `CERT-${Date.now()}`,
          metadata: {
            completionDate: new Date(),
            expirationDate: null, // or set an expiration date if needed
          },
        });
        
        // Notify user
        // TODO: Implement notification system
      }
    } catch (error) {
      console.error('Error awarding certificate:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'graded':
        return <Badge colorScheme="green">Graded</Badge>;
      case 'submitted':
        return <Badge colorScheme="blue">Submitted</Badge>;
      case 'late':
        return <Badge colorScheme="orange">Late</Badge>;
      case 'missing':
        return <Badge colorScheme="red">Missing</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return <Box>Loading submissions...</Box>;
  }

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="flex-start" spacing={1}>
          <Heading size="lg">
            {assignment?.title || 'Submissions'}
          </Heading>
          <Text color="gray.500">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
          </Text>
        </VStack>
        
        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />} colorScheme="blue">
            Export
          </MenuButton>
          <MenuList>
            <MenuItem icon={<DownloadIcon />}>Export as CSV</MenuItem>
            <MenuItem icon={<DownloadIcon />}>Export as Excel</MenuItem>
            <MenuItem icon={<DownloadIcon />}>Export as PDF</MenuItem>
          </MenuList>
        </Menu>
      </Flex>

      <Box bg={cardBg} borderRadius="lg" boxShadow="sm" overflow="hidden" mb={6}>
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Student</Th>
              <Th>Status</Th>
              <Th>Submitted</Th>
              <Th>Score</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {submissions.length === 0 ? (
              <Tr>
                <Td colSpan={5} textAlign="center" py={8}>
                  <VStack spacing={2}>
                    <TimeIcon boxSize={8} color="gray.400" />
                    <Text>No submissions yet</Text>
                    <Text fontSize="sm" color="gray.500">
                      Students' submissions will appear here once they submit their work.
                    </Text>
                  </VStack>
                </Td>
              </Tr>
            ) : (
              submissions.map((submission) => (
                <Tr key={submission.id} _hover={{ bg: 'gray.50' }}>
                  <Td>
                    <HStack>
                      <Avatar size="sm" name={submission.userId} />
                      <Box>
                        <Text fontWeight="medium">
                          {submission.userId} {/* Replace with actual user name */}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {submission.userId}@example.com
                        </Text>
                      </Box>
                    </HStack>
                  </Td>
                  <Td>{getStatusBadge(submission.status)}</Td>
                  <Td>
                    {submission.submittedAt?.toLocaleString()}
                    {submission.status === 'late' && (
                      <Text fontSize="xs" color="red.500">
                        Late submission
                      </Text>
                    )}
                  </Td>
                  <Td>
                    {submission.status === 'graded' ? (
                      <HStack>
                        <Text fontWeight="bold">
                          {submission.score} / {submission.totalPoints}
                        </Text>
                        {submission.score && submission.totalPoints && (
                          <Badge 
                            colorScheme={submission.score >= (assignment?.passingScore || 0) ? 'green' : 'red'}
                          >
                            {Math.round((submission.score / submission.totalPoints) * 100)}%
                          </Badge>
                        )}
                      </HStack>
                    ) : (
                      <Text color="gray.500">-</Text>
                    )}
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Tooltip label="View submission">
                        <IconButton
                          icon={<ViewIcon />}
                          aria-label="View submission"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleGradeSubmission(submission)}
                        />
                      </Tooltip>
                      
                      {submission.files?.length > 0 && (
                        <Tooltip label="Download files">
                          <IconButton
                            icon={<DownloadIcon />}
                            aria-label="Download files"
                            size="sm"
                            variant="ghost"
                            as="a"
                            href={submission.files[0].url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        </Tooltip>
                      )}
                      
                      <Button
                        size="sm"
                        colorScheme={submission.status === 'graded' ? 'gray' : 'blue'}
                        variant={submission.status === 'graded' ? 'outline' : 'solid'}
                        onClick={() => handleGradeSubmission(submission)}
                        leftIcon={submission.status === 'graded' ? <CheckCircleIcon /> : <StarIcon />}
                      >
                        {submission.status === 'graded' ? 'Update Grade' : 'Grade'}
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Grade Submission Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Grade Submission</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedSubmission && assignment && (
              <VStack spacing={6} align="stretch">
                <Box>
                  <Text fontWeight="medium" mb={2}>Student: {selectedSubmission.userId}</Text>
                  <Text fontSize="sm" color="gray.500">
                    Submitted: {selectedSubmission.submittedAt?.toLocaleString()}
                  </Text>
                  {selectedSubmission.status === 'late' && (
                    <Text fontSize="sm" color="red.500">
                      Late submission
                    </Text>
                  )}
                </Box>

                {selectedSubmission.text && (
                  <Box>
                    <Text fontWeight="medium" mb={2}>Text Submission:</Text>
                    <Box 
                      p={4} 
                      borderWidth={1} 
                      borderRadius="md" 
                      borderColor={borderColor}
                      bg={cardBg}
                    >
                      {selectedSubmission.text}
                    </Box>
                  </Box>
                )}

                {selectedSubmission.files && selectedSubmission.files.length > 0 && (
                  <Box>
                    <Text fontWeight="medium" mb={2}>Submitted Files:</Text>
                    <VStack spacing={2} align="stretch">
                      {selectedSubmission.files.map((file, index) => (
                        <FilePreview key={index} file={file} />
                      ))}
                    </VStack>
                  </Box>
                )}

                <Divider my={2} />

                <FormControl>
                  <FormLabel>Score</FormLabel>
                  <HStack>
                    <NumberInput 
                      min={0} 
                      max={assignment.totalPoints} 
                      value={evaluation.score}
                      onChange={(value) => setEvaluation(prev => ({
                        ...prev,
                        score: Number(value),
                        isPassing: Number(value) >= (assignment.passingScore || 0)
                      }))}
                      flex={1}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <Text> / {assignment.totalPoints} points</Text>
                  </HStack>
                  <FormHelperText>
                    Passing score: {assignment.passingScore || 0} points
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel>Feedback</FormLabel>
                  <Textarea
                    value={evaluation.feedback}
                    onChange={(e) => setEvaluation(prev => ({
                      ...prev,
                      feedback: e.target.value
                    }))}
                    placeholder="Provide feedback to the student"
                    rows={6}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <Checkbox
                    isChecked={evaluation.certificateEligible}
                    onChange={(e) => setEvaluation(prev => ({
                      ...prev,
                      certificateEligible: e.target.checked,
                      isPassing: e.target.checked 
                        ? true 
                        : (evaluation.score || 0) >= (assignment.passingScore || 0)
                    }))}
                    colorScheme="green"
                    mr={2}
                    isDisabled={!evaluation.isPassing}
                  />
                  <FormLabel mb={0} color={!evaluation.isPassing ? 'gray.500' : 'inherit'}>
                    Eligible for certificate
                  </FormLabel>
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose} isDisabled={isGrading}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleSubmitGrade}
              isLoading={isGrading}
              loadingText="Saving..."
              leftIcon={<CheckIcon />}
            >
              Save Grade
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SubmissionsManager;
