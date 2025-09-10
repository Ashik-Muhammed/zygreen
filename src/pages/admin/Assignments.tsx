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
import { FiPlus, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import { Assignment } from '../../types/assignment';
import { getAssignmentsByCourse, deleteAssignment, publishAssignment } from '../../services/assignmentService';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';

const Assignments = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchAssignments = async () => {
    if (!courseId) return;
    
    try {
      setLoading(true);
      const data = await getAssignmentsByCourse(courseId);
      setAssignments(data);
    } catch (error) {
      toast({
        title: 'Error fetching assignments',
        description: 'Failed to load assignments. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [courseId]);

  const handleDelete = async () => {
    if (!assignmentToDelete || !courseId) return;
    
    try {
      await deleteAssignment(assignmentToDelete);
      await fetchAssignments();
      toast({
        title: 'Assignment deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error deleting assignment',
        description: 'Failed to delete the assignment. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setAssignmentToDelete(null);
      onClose();
    }
  };

  const handlePublishToggle = async (assignmentId: string, currentStatus: boolean) => {
    try {
      await publishAssignment(assignmentId, !currentStatus);
      await fetchAssignments();
      toast({
        title: `Assignment ${!currentStatus ? 'published' : 'unpublished'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error updating assignment status',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return <div>Loading assignments...</div>;
  }

  return (
    <Box p={6}>
      <HStack justifyContent="space-between" mb={6}>
        <Heading size="lg">Assignments</Heading>
        <Button
          as={Link}
          to={`/admin/courses/${courseId}/assignments/new`}
          leftIcon={<FiPlus />}
          colorScheme="blue"
        >
          Create Assignment
        </Button>
      </HStack>

      <Box bg="white" borderRadius="md" boxShadow="sm" overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Title</Th>
              <Th>Due Date</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Points</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {assignments.length > 0 ? (
              assignments.map((assignment) => (
                <Tr key={assignment.id}>
                  <Td fontWeight="medium">{assignment.title}</Td>
                  <Td>{new Date(assignment.dueDate).toLocaleDateString()}</Td>
                  <Td textTransform="capitalize">{assignment.submissionType}</Td>
                  <Td>
                    <Badge colorScheme={assignment.isPublished ? 'green' : 'gray'}>
                      {assignment.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </Td>
                  <Td>{assignment.totalPoints}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        as={Link}
                        to={`/admin/courses/${courseId}/assignments/${assignment.id}`}
                        icon={<FiEye />}
                        size="sm"
                        aria-label="View assignment"
                      />
                      <IconButton
                        as={Link}
                        to={`/admin/courses/${courseId}/assignments/${assignment.id}/edit`}
                        icon={<FiEdit2 />}
                        size="sm"
                        colorScheme="blue"
                        aria-label="Edit assignment"
                      />
                      <IconButton
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        aria-label="Delete assignment"
                        onClick={() => {
                          setAssignmentToDelete(assignment.id!);
                          onOpen();
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme={assignment.isPublished ? 'orange' : 'green'}
                        onClick={() => handlePublishToggle(assignment.id!, assignment.isPublished)}
                      >
                        {assignment.isPublished ? 'Unpublish' : 'Publish'}
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={6} textAlign="center" py={8}>
                  No assignments found. Create your first assignment to get started.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      <ConfirmationDialog
        isOpen={isOpen}
        onClose={() => {
          setAssignmentToDelete(null);
          onClose();
        }}
        onConfirm={handleDelete}
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </Box>
  );
};

export default Assignments;
