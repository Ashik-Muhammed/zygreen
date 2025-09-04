import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Heading, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  Badge, 
  useDisclosure, 
  IconButton, 
  useToast,
  HStack
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiClock } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import { Quiz } from '../../types/quiz';
import { getQuizzesByCourse, deleteQuiz, publishQuiz } from '../../services/quizService';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';

const Quizzes = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchQuizzes = async () => {
    if (!courseId) return;
    
    try {
      setLoading(true);
      const data = await getQuizzesByCourse(courseId);
      setQuizzes(data);
    } catch (error) {
      toast({
        title: 'Error fetching quizzes',
        description: 'Failed to load quizzes. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [courseId]);

  const handleDelete = async () => {
    if (!quizToDelete || !courseId) return;
    
    try {
      await deleteQuiz(quizToDelete);
      await fetchQuizzes();
      toast({
        title: 'Quiz deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error deleting quiz',
        description: 'Failed to delete the quiz. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setQuizToDelete(null);
      onClose();
    }
  };

  const handlePublishToggle = async (quizId: string, currentStatus: boolean) => {
    try {
      await publishQuiz(quizId, !currentStatus);
      await fetchQuizzes();
      toast({
        title: `Quiz ${!currentStatus ? 'published' : 'unpublished'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error updating quiz status',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return <div>Loading quizzes...</div>;
  }

  return (
    <Box p={6}>
      <HStack justifyContent="space-between" mb={6}>
        <Heading size="lg">Quizzes</Heading>
        <Button
          as={Link}
          to={`/admin/courses/${courseId}/quizzes/new`}
          leftIcon={<FiPlus />}
          colorScheme="blue"
        >
          Create Quiz
        </Button>
      </HStack>

      <Box bg="white" borderRadius="md" boxShadow="sm" overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Title</Th>
              <Th>Questions</Th>
              <Th>Time Limit</Th>
              <Th>Due Date</Th>
              <Th>Status</Th>
              <Th>Points</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {quizzes.length > 0 ? (
              quizzes.map((quiz) => (
                <Tr key={quiz.id}>
                  <Td fontWeight="medium">{quiz.title}</Td>
                  <Td>{quiz.questions.length} questions</Td>
                  <Td>
                    <HStack>
                      <FiClock />
                      <span>{quiz.timeLimit} min</span>
                    </HStack>
                  </Td>
                  <Td>{new Date(quiz.dueDate).toLocaleDateString()}</Td>
                  <Td>
                    <Badge colorScheme={quiz.isPublished ? 'green' : 'gray'}>
                      {quiz.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </Td>
                  <Td>{quiz.totalPoints}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        as={Link}
                        to={`/admin/courses/${courseId}/quizzes/${quiz.id}`}
                        icon={<FiEye />}
                        size="sm"
                        aria-label="View quiz"
                      />
                      <IconButton
                        as={Link}
                        to={`/admin/courses/${courseId}/quizzes/${quiz.id}/edit`}
                        icon={<FiEdit2 />}
                        size="sm"
                        colorScheme="blue"
                        aria-label="Edit quiz"
                      />
                      <IconButton
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        aria-label="Delete quiz"
                        onClick={() => {
                          setQuizToDelete(quiz.id!);
                          onOpen();
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme={quiz.isPublished ? 'orange' : 'green'}
                        onClick={() => handlePublishToggle(quiz.id!, quiz.isPublished)}
                      >
                        {quiz.isPublished ? 'Unpublish' : 'Publish'}
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={7} textAlign="center" py={8}>
                  No quizzes found. Create your first quiz to get started.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      <ConfirmationDialog
        isOpen={isOpen}
        onClose={() => {
          setQuizToDelete(null);
          onClose();
        }}
        onConfirm={handleDelete}
        title="Delete Quiz"
        message="Are you sure you want to delete this quiz? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </Box>
  );
};

export default Quizzes;
