import { useState, useEffect } from 'react';
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
  useDisclosure, 
  IconButton, 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem,
  useToast
} from '@chakra-ui/react';
import { AddIcon, ChevronDownIcon, EditIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Assignment, Quiz, Activity, AssignmentStatus } from '../../../types/assignment';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';

const AssignmentsList = () => {
  const [assignments, setAssignments] = useState<(Assignment | Quiz | Activity)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      const q = query(collection(db, 'assignments'));
      const querySnapshot = await getDocs(q);
      const assignmentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (Assignment | Quiz | Activity)[];
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignments',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'assignments', id));
      setAssignments(assignments.filter(assignment => assignment.id !== id));
      toast({
        title: 'Success',
        description: 'Assignment deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete assignment',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    onClose();
  };

  const getStatusColor = (status: AssignmentStatus) => {
    switch (status) {
      case 'published':
        return 'green';
      case 'draft':
        return 'yellow';
      case 'graded':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'quiz':
        return 'Quiz';
      case 'activity':
        return 'Activity';
      default:
        return 'Assignment';
    }
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Assignments & Quizzes</Heading>
        <Menu>
          <MenuButton as={Button} colorScheme="blue" leftIcon={<AddIcon />}>
            Create New
            <ChevronDownIcon />
          </MenuButton>
          <MenuList>
            <MenuItem as={RouterLink} to="/admin/assignments/new" icon={<EditIcon />}>
              New Assignment
            </MenuItem>
            <MenuItem as={RouterLink} to="/admin/quizzes/new" icon={<EditIcon />}>
              New Quiz
            </MenuItem>
            <MenuItem as={RouterLink} to="/admin/activities/new" icon={<EditIcon />}>
              New Activity
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>

      <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Title</Th>
              <Th>Type</Th>
              <Th>Course</Th>
              <Th>Due Date</Th>
              <Th>Status</Th>
              <Th>Points</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={7} textAlign="center">Loading...</Td>
              </Tr>
            ) : assignments.length === 0 ? (
              <Tr>
                <Td colSpan={7} textAlign="center">No assignments found</Td>
              </Tr>
            ) : (
              assignments.map((assignment) => (
                <Tr key={assignment.id} _hover={{ bg: 'gray.50' }}>
                  <Td fontWeight="medium">
                    <Box as={RouterLink} to={`/admin/assignments/${assignment.id}`} color="blue.500" _hover={{ textDecoration: 'underline' }}>
                      {assignment.title}
                    </Box>
                  </Td>
                  <Td>
                    <Badge colorScheme="blue">
                      {getTypeLabel(assignment.submissionType)}
                    </Badge>
                  </Td>
                  <Td>{assignment.courseId}</Td>
                  <Td>{new Date(assignment.dueDate).toLocaleDateString()}</Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(assignment.status)}>
                      {assignment.status}
                    </Badge>
                  </Td>
                  <Td>{assignment.totalPoints}</Td>
                  <Td>
                    <Flex>
                      <IconButton
                        as={RouterLink}
                        to={`/admin/assignments/${assignment.id}`}
                        icon={<ViewIcon />}
                        aria-label="View assignment"
                        size="sm"
                        mr={2}
                        variant="ghost"
                      />
                      <IconButton
                        as={RouterLink}
                        to={`/admin/assignments/${assignment.id}/edit`}
                        icon={<EditIcon />}
                        aria-label="Edit assignment"
                        size="sm"
                        mr={2}
                        variant="ghost"
                        colorScheme="blue"
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        aria-label="Delete assignment"
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => {
                          setAssignmentToDelete(assignment.id!);
                          onOpen();
                        }}
                      />
                    </Flex>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      <ConfirmationDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => assignmentToDelete && handleDelete(assignmentToDelete)}
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment? This action cannot be undone."
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        confirmButtonColor="red"
      />
    </Box>
  );
};

export default AssignmentsList;
