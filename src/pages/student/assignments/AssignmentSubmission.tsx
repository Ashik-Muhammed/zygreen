import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  VStack, 
  HStack, 
  Text, 
  Heading, 
  Divider, 
  useToast,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  Progress,
  CircularProgress,
  CircularProgressLabel,
  useColorModeValue,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { CheckCircleIcon, TimeIcon, WarningIcon, DownloadIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { doc, getDoc, setDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Assignment, Quiz, Activity, Submission } from '../../../../types/assignment';
import RichTextEditor from '../../../components/editor/RichTextEditor';
import FileUpload from '../../../components/common/FileUpload';
import CountdownTimer from '../../../components/common/CountdownTimer';

const AssignmentSubmission = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [assignment, setAssignment] = useState<Assignment | Quiz | Activity | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answer, setAnswer] = useState('');
  const [files, setFiles] = useState<Array<{ file: File; url: string; type: string; name: string }>>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch assignment
        const assignmentDoc = await getDoc(doc(db, 'assignments', assignmentId!));
        if (!assignmentDoc.exists()) {
          throw new Error('Assignment not found');
        }
        
        const assignmentData = { 
          id: assignmentDoc.id, 
          ...assignmentDoc.data() 
        } as Assignment | Quiz | Activity;
        
        setAssignment(assignmentData);
        
        // Check if assignment is available
        const now = new Date();
        const availableFrom = assignmentData.availableFrom 
          ? new Date(assignmentData.availableFrom as string) 
          : null;
          
        const availableUntil = assignmentData.availableUntil 
          ? new Date(assignmentData.availableUntil as string) 
          : null;
          
        if (availableFrom && now < availableFrom) {
          setSubmissionError('This assignment is not available yet.');
          setIsLoading(false);
          return;
        }
        
        if (availableUntil && now > availableUntil) {
          setSubmissionError('The due date for this assignment has passed.');
          setIsLoading(false);
          return;
        }
        
        // Check for existing submission
        // TODO: Replace 'currentUserId' with actual user ID from auth context
        const submissionQuery = query(
          collection(db, 'submissions'),
          where('assignmentId', '==', assignmentId),
          where('userId', '==', 'currentUserId')
        );
        
        const submissionSnapshot = await getDocs(submissionQuery);
        if (!submissionSnapshot.empty) {
          const subData = submissionSnapshot.docs[0].data() as Submission;
          setSubmission({
            ...subData,
            id: submissionSnapshot.docs[0].id,
            submittedAt: subData.submittedAt?.toDate(),
            gradedAt: subData.gradedAt?.toDate(),
          });
          setAnswer(subData.text || '');
        }
        
        // Set up timer if it's a timed quiz
        if ('timeLimit' in assignmentData && assignmentData.timeLimit) {
          const startTime = now.getTime();
          const endTime = startTime + (assignmentData.timeLimit * 60 * 1000);
          setTimeRemaining(Math.max(0, endTime - startTime));
          
          const timer = setInterval(() => {
            const remaining = Math.max(0, endTime - new Date().getTime());
            setTimeRemaining(remaining);
            
            if (remaining <= 0) {
              clearInterval(timer);
              setIsTimeUp(true);
              handleAutoSubmit();
            }
          }, 1000);
          
          return () => clearInterval(timer);
        }
      } catch (error) {
        console.error('Error loading assignment:', error);
        toast({
          title: 'Error',
          description: 'Failed to load assignment',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [assignmentId, toast]);
  
  const handleFileChange = (newFiles: Array<{ file: File; url: string; type: string; name: string }>) => {
    setFiles(newFiles);
  };
  
  const handleAutoSubmit = async () => {
    if (isTimeUp) {
      toast({
        title: 'Time\'s up!',
        description: 'Your answers have been auto-submitted.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    }
    
    await handleSubmit();
  };
  
  const handleSubmit = async () => {
    if (!assignment) return;
    
    try {
      setIsSubmitting(true);
      
      const submissionData: Omit<Submission, 'id'> = {
        assignmentId: assignment.id!,
        courseId: assignment.courseId,
        userId: 'currentUserId', // Replace with actual user ID from auth context
        text: answer,
        files: files.map(f => ({
          id: Math.random().toString(36).substr(2, 9),
          name: f.name,
          url: f.url,
          type: f.type,
        })),
        submittedAt: serverTimestamp() as unknown as Timestamp,
        status: isTimeUp ? 'late' : 'submitted',
        totalPoints: assignment.totalPoints,
        attemptNumber: submission ? submission.attemptNumber + 1 : 1,
        timeSpent: timeRemaining ? (assignment.timeLimit! * 60) - Math.floor(timeRemaining / 1000) : 0,
      };
      
      // Upload files first (if any)
      // TODO: Implement file upload logic to storage
      
      // Save submission to Firestore
      if (submission) {
        // Update existing submission
        await setDoc(doc(db, 'submissions', submission.id!), submissionData, { merge: true });
      } else {
        // Create new submission
        const docRef = doc(collection(db, 'submissions'));
        await setDoc(docRef, { ...submissionData, id: docRef.id });
      }
      
      toast({
        title: 'Success',
        description: isTimeUp 
          ? 'Your answers have been auto-submitted.'
          : submission
          ? 'Your submission has been updated.'
          : 'Your submission has been received!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh submission data
      const submissionDoc = await getDoc(doc(db, 'submissions', submission?.id || docRef.id));
      setSubmission({
        ...submissionDoc.data() as Submission,
        id: submissionDoc.id,
      });
      
      // Navigate to submissions page or show success message
      if (isTimeUp) {
        navigate(`/courses/${assignment.courseId}`);
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit assignment. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderQuizQuestions = () => {
    if (!assignment || !('questions' in assignment)) return null;
    
    return (
      <VStack spacing={6} align="stretch">
        {assignment.questions.map((question, index) => (
          <Box 
            key={question.id} 
            p={4} 
            borderWidth={1} 
            borderRadius="md" 
            bg={cardBg}
            borderColor={borderColor}
          >
            <Text fontWeight="medium" mb={4}>
              Question {index + 1}: {question.question}
              <Badge ml={2} colorScheme="blue">
                {question.points} point{question.points !== 1 ? 's' : ''}
              </Badge>
            </Text>
            
            {question.questionType === 'multiple_choice' && (
              <VStack align="stretch" spacing={2}>
                {question.options?.map((option, i) => (
                  <HStack key={i} spacing={3}>
                    <input 
                      type="radio" 
                      id={`q${index}-o${i}`}
                      name={`question-${index}`}
                      value={option}
                      // TODO: Handle answer selection
                    />
                    <label htmlFor={`q${index}-o${i}`}>{option}</label>
                  </HStack>
                ))}
              </VStack>
            )}
            
            {question.questionType === 'true_false' && (
              <VStack align="stretch" spacing={2}>
                {['True', 'False'].map((option, i) => (
                  <HStack key={i} spacing={3}>
                    <input 
                      type="radio" 
                      id={`q${index}-tf${i}`}
                      name={`question-${index}`}
                      value={option}
                      // TODO: Handle answer selection
                    />
                    <label htmlFor={`q${index}-tf${i}`}>{option}</label>
                  </HStack>
                ))}
              </VStack>
            )}
            
            {['short_answer', 'essay'].includes(question.questionType) && (
              <Textarea
                placeholder={`Type your ${question.questionType === 'short_answer' ? 'short' : 'detailed'} answer here...`}
                rows={question.questionType === 'essay' ? 6 : 2}
                // TODO: Handle answer input
              />
            )}
            
            {question.questionType === 'file_upload' && (
              <FileUpload
                accept="*"
                maxFiles={1}
                onFilesChange={(files) => {
                  // TODO: Handle file upload for this question
                }}
              />
            )}
          </Box>
        ))}
      </VStack>
    );
  };
  
  if (isLoading) {
    return (
      <Box p={6} textAlign="center">
        <CircularProgress isIndeterminate color="blue.500" />
        <Text mt={4}>Loading assignment...</Text>
      </Box>
    );
  }
  
  if (!assignment) {
    return (
      <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" p={8}>
        <AlertIcon boxSize="40px" mr={0} mb={4} />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          Assignment Not Found
        </AlertTitle>
        <AlertDescription maxW="md">
          The assignment you're looking for doesn't exist or you don't have permission to view it.
        </AlertDescription>
        <Button mt={4} colorScheme="blue" onClick={() => navigate('/courses')}>
          Back to Courses
        </Button>
      </Alert>
    );
  }
  
  if (submissionError) {
    return (
      <Alert status="warning" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" p={8}>
        <AlertIcon boxSize="40px" mr={0} mb={4} />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          {submissionError.includes('not available yet') ? 'Not Available Yet' : 'Submission Closed'}
        </AlertTitle>
        <AlertDescription maxW="md">
          {submissionError}
        </AlertDescription>
        <Button mt={4} colorScheme="blue" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Alert>
    );
  }
  
  const isQuiz = 'questions' in assignment;
  const isActivity = 'isGroupActivity' in assignment;
  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'graded' || submission?.status === 'late';
  const isGraded = submission?.status === 'graded';
  
  return (
    <Box p={6} maxW="1200px" mx="auto">
      {/* Header with assignment info */}
      <VStack spacing={4} align="stretch" mb={8}>
        <HStack justify="space-between" flexWrap="wrap" gap={4}>
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="sm" color="gray.500">
              {isQuiz ? 'Quiz' : isActivity ? 'Activity' : 'Assignment'}
            </Text>
            <Heading size="lg">{assignment.title}</Heading>
          </VStack>
          
          {timeRemaining > 0 && (
            <Box textAlign="center">
              <Text fontSize="sm" color="gray.500" mb={1}>Time Remaining</Text>
              <Box 
                p={3} 
                bg={timeRemaining < 300000 ? 'red.100' : 'blue.50'} // Red if less than 5 minutes
                borderRadius="md"
                borderWidth={1}
                borderColor={timeRemaining < 300000 ? 'red.200' : 'blue.100'}
                minW="120px"
              >
                <CountdownTimer 
                  timeRemaining={timeRemaining} 
                  onComplete={() => setIsTimeUp(true)} 
                />
              </Box>
            </Box>
          )}
          
          {isSubmitted && (
            <Box 
              p={3} 
              bg={isGraded ? 'green.50' : 'blue.50'}
              borderRadius="md"
              borderWidth={1}
              borderColor={isGraded ? 'green.200' : 'blue.100'}
              minW="160px"
            >
              <Text fontSize="sm" color="gray.600" mb={1}>
                {isGraded ? 'Status' : 'Submission Status'}
              </Text>
              <HStack>
                <Box
                  w="10px"
                  h="10px"
                  borderRadius="full"
                  bg={isGraded ? 'green.500' : 'blue.500'}
                />
                <Text fontWeight="medium" color={isGraded ? 'green.700' : 'blue.700'}>
                  {isGraded ? 'Graded' : 'Submitted'}
                </Text>
                {isGraded && submission?.score !== undefined && (
                  <Badge 
                    colorScheme={submission.score >= (assignment.passingScore || 0) ? 'green' : 'red'}
                    ml={2}
                  >
                    {submission.score}/{assignment.totalPoints}
                  </Badge>
                )}
              </HStack>
            </Box>
          )}
        </HStack>
        
        <Divider my={2} />
        
        <HStack spacing={4} fontSize="sm" color="gray.600" flexWrap="wrap">
          <HStack>
            <Text fontWeight="medium">Due:</Text>
            <Text>{new Date(assignment.dueDate as string).toLocaleString()}</Text>
          </HStack>
          <Text>•</Text>
          <HStack>
            <Text fontWeight="medium">Points:</Text>
            <Text>{assignment.totalPoints}</Text>
          </HStack>
          {isQuiz && (
            <>
              <Text>•</Text>
              <HStack>
                <Text fontWeight="medium">Time Limit:</Text>
                <Text>{(assignment as Quiz).timeLimit} minutes</Text>
              </HStack>
              <Text>•</Text>
              <HStack>
                <Text fontWeight="medium">Attempts:</Text>
                <Text>1 of {(assignment as Quiz).attemptsAllowed || 'Unlimited'}</Text>
              </HStack>
            </>
          )}
        </HStack>
      </VStack>
      
      {/* Instructions */}
      {assignment.instructions && (
        <Box 
          p={4} 
          mb={6} 
          bg="blue.50" 
          borderRadius="md" 
          borderLeft="4px solid" 
          borderColor="blue.400"
        >
          <Text fontWeight="medium" mb={2} color="blue.800">Instructions</Text>
          <Box 
            dangerouslySetInnerHTML={{ __html: assignment.instructions }}
            className="prose max-w-none"
          />
        </Box>
      )}
      
      {/* Submission status */}
      {isSubmitted && (
        <Alert 
          status={isGraded ? 'success' : 'info'} 
          variant="subtle" 
          mb={6}
          borderRadius="md"
        >
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>
              {isGraded 
                ? submission.score! >= (assignment.passingScore || 0)
                  ? 'Congratulations! You passed!'
                  : 'Submission Graded'
                : 'Submission Received'}
            </AlertTitle>
            <AlertDescription>
              {isGraded ? (
                <>
                  You scored {submission.score} out of {assignment.totalPoints} points. 
                  {submission.feedback && (
                    <Box mt={2}>
                      <Text fontWeight="medium">Instructor Feedback:</Text>
                      <Box 
                        dangerouslySetInnerHTML={{ __html: submission.feedback }}
                        className="prose max-w-none mt-1"
                      />
                    </Box>
                  )}
                </>
              ) : (
                'Your submission is being reviewed by the instructor.'
              )}
            </AlertDescription>
          </Box>
          
          {isGraded && submission.score! >= (assignment.passingScore || 0) && (
            <Button 
              colorScheme="green" 
              variant="outline" 
              size="sm"
              rightIcon={<ExternalLinkIcon />}
              onClick={() => {
                // TODO: Navigate to certificate if available
                toast({
                  title: 'Certificate Available',
                  description: 'View your certificate in the Certificates section.',
                  status: 'info',
                  duration: 5000,
                  isClosable: true,
                });
              }}
            >
              View Certificate
            </Button>
          )}
        </Alert>
      )}
      
      {/* Submission form */}
      {!isSubmitted || submission.status === 'draft' ? (
        <Box 
          p={6} 
          bg={cardBg} 
          borderRadius="lg" 
          borderWidth={1} 
          borderColor={borderColor}
          boxShadow="sm"
        >
          {isQuiz ? (
            renderQuizQuestions()
          ) : (
            <VStack spacing={6} align="stretch">
              <FormControl>
                <FormLabel>Your {isActivity ? 'Activity' : 'Assignment'}</FormLabel>
                <RichTextEditor
                  value={answer}
                  onChange={setAnswer}
                  placeholder={`Type your ${isActivity ? 'activity' : 'assignment'} here...`}
                  isReadOnly={isSubmitted}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>
                  {isActivity ? 'Supporting Files' : 'Attachments'}
                  <Text as="span" color="gray.500" fontWeight="normal" ml={2}>
                    (Optional)
                  </Text>
                </FormLabel>
                <FileUpload
                  accept="*"
                  maxFiles={5}
                  onFilesChange={handleFileChange}
                  isDisabled={isSubmitted}
                />
                <Text fontSize="sm" color="gray.500" mt={2}>
                  {isActivity 
                    ? 'Upload any files that support your activity submission.'
                    : 'Upload any additional files required for your assignment.'}
                </Text>
              </FormControl>
              
              <HStack justify="flex-end" spacing={4} mt={8}>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Save as draft
                    toast({
                      title: 'Draft Saved',
                      description: 'Your work has been saved as a draft.',
                      status: 'info',
                      duration: 3000,
                      isClosable: true,
                    });
                  }}
                  isLoading={isSubmitting}
                >
                  Save Draft
                </Button>
                
                <Button 
                  colorScheme="blue" 
                  onClick={onOpen}
                  isLoading={isSubmitting}
                  isDisabled={!answer.trim() && files.length === 0}
                >
                  {submission ? 'Update Submission' : 'Submit'}
                </Button>
              </HStack>
            </VStack>
          )}
        </Box>
      ) : (
        // View submission
        <Box 
          p={6} 
          bg={cardBg} 
          borderRadius="lg" 
          borderWidth={1} 
          borderColor={borderColor}
          boxShadow="sm"
        >
          <VStack spacing={6} align="stretch">
            <Box>
              <Text fontWeight="medium" mb={2}>Your Submission</Text>
              <Box 
                p={4} 
                borderWidth={1} 
                borderRadius="md" 
                bg="gray.50"
                borderColor={borderColor}
              >
                {submission.text ? (
                  <div dangerouslySetInnerHTML={{ __html: submission.text }} />
                ) : (
                  <Text color="gray.500">No text submission</Text>
                )}
              </Box>
            </Box>
            
            {submission.files && submission.files.length > 0 && (
              <Box>
                <Text fontWeight="medium" mb={2}>Attached Files</Text>
                <VStack align="stretch" spacing={2}>
                  {submission.files.map((file, index) => (
                    <HStack 
                      key={index} 
                      p={3} 
                      borderWidth={1} 
                      borderRadius="md" 
                      bg="white"
                      borderColor={borderColor}
                      justify="space-between"
                    >
                      <HStack>
                        <Box w="40px" h="40px" bg="blue.50" display="flex" alignItems="center" justifyContent="center" borderRadius="md">
                          <DownloadIcon color="blue.500" />
                        </Box>
                        <Box>
                          <Text fontWeight="medium" isTruncated maxW="300px">
                            {file.name}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            {file.type}
                          </Text>
                        </Box>
                      </HStack>
                      <IconButton
                        icon={<ExternalLinkIcon />}
                        aria-label="View file"
                        variant="ghost"
                        as="a"
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}
            
            {!isGraded && (
              <Alert status="info" variant="left-accent" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="medium">Your submission is being reviewed</Text>
                  <Text fontSize="sm">
                    You'll receive a notification and email when your {isQuiz ? 'quiz' : 'assignment'} has been graded.
                  </Text>
                </Box>
              </Alert>
            )}
            
            {isGraded && submission.feedback && (
              <Box mt={4}>
                <Text fontWeight="medium" mb={2}>Instructor Feedback</Text>
                <Box 
                  p={4} 
                  borderWidth={1} 
                  borderRadius="md" 
                  bg="blue.50"
                  borderColor="blue.100"
                >
                  <div dangerouslySetInnerHTML={{ __html: submission.feedback }} />
                </Box>
              </Box>
            )}
          </VStack>
        </Box>
      )}
      
      {/* Submission confirmation modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Submit {isQuiz ? 'Quiz' : isActivity ? 'Activity' : 'Assignment'}?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                {isQuiz 
                  ? 'Are you sure you want to submit your quiz? You will not be able to make changes after submission.'
                  : 'Are you sure you want to submit your ' + (isActivity ? 'activity' : 'assignment') + '?'}
              </Text>
              
              {isQuiz && timeRemaining > 0 && (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="medium">Time Remaining: </Text>
                    <Text>
                      {Math.floor(timeRemaining / 60000)} minutes and {Math.floor((timeRemaining % 60000) / 1000)} seconds
                    </Text>
                  </Box>
                </Alert>
              )}
              
              {(!answer.trim() && files.length === 0) && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  You haven't provided any {isQuiz ? 'answers' : 'submission content'} yet. Are you sure you want to submit?
                </Alert>
              )}
              
              {files.length > 0 && (
                <Box>
                  <Text fontWeight="medium" mb={2}>Files to be submitted:</Text>
                  <VStack align="stretch" spacing={2} maxH="200px" overflowY="auto" p={2} borderWidth={1} borderRadius="md" borderColor={borderColor}>
                    {files.map((file, index) => (
                      <HStack key={index} justify="space-between" p={2} _hover={{ bg: 'gray.50' }} borderRadius="md">
                        <Text fontSize="sm" isTruncated maxW="80%">{file.name}</Text>
                        <Text fontSize="xs" color="gray.500">{file.type}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose} isDisabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={() => {
                onClose();
                handleSubmit();
              }}
              isLoading={isSubmitting}
              loadingText="Submitting..."
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AssignmentSubmission;
