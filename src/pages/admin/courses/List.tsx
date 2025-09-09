import { Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, Badge, HStack, useToast, Spinner, Text } from '@chakra-ui/react';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { deleteCourse } from '../../../services/courseService';
import { db } from '../../../firebase';

interface Course {
  id: string;
  title: string;
  category: string;
  price: number;
  status: 'draft' | 'published' | 'archived';
  students?: number;
  createdAt?: any;
}

const ManageCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const toast = useToast();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      console.log('Fetching courses from Firestore...');
      const querySnapshot = await getDocs(collection(db, 'courses'));
      console.log('Query snapshot:', querySnapshot);
      console.log('Number of documents:', querySnapshot.size);
      
      const coursesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Document data:', doc.id, data);
        return {
          id: doc.id,
          ...data
        };
      }) as Course[];
      
      console.log('Processed courses:', coursesData);
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses. Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      console.error('No course ID provided for deletion');
      toast({
        title: 'Error',
        description: 'No course ID provided',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      console.log('Deletion cancelled by user');
      return;
    }

    try {
      console.log('Deleting course with ID:', id);
      setDeletingCourseId(id);
      
      // Use the course service to handle deletion and related data cleanup
      const result = await deleteCourse(id);
      
      if (result.success) {
        console.log('Course and all related data deleted successfully');
        
        // Update the UI optimistically
        setCourses(prevCourses => {
          const updatedCourses = prevCourses.filter(course => course.id !== id);
          console.log('Updated courses list:', updatedCourses.length, 'courses remaining');
          return updatedCourses;
        });
        
        toast({
          title: 'Success',
          description: result.message || 'Course deleted successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top',
        });
      } else {
        // Handle case where course was not found or deletion failed
        console.warn('Course deletion issue:', result.message);
        toast({
          title: 'Warning',
          description: result.message || 'There was an issue deleting the course',
          status: 'warning',
          duration: 5000,
          isClosable: true,
          position: 'top',
        });
        
        // Refresh the courses list to get the latest data
        fetchCourses();
      }
    } catch (error) {
      console.error('Unexpected error deleting course:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      toast({
        title: 'Error',
        description: `An unexpected error occurred: ${errorMessage}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      console.log('Deletion process completed');
      setDeletingCourseId(null);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <Box p={4}>
      <HStack justify="space-between" mb={6}>
        <Heading as="h1" size="xl">Manage Courses</Heading>
        <Button as={Link} to="/admin/courses/create" leftIcon={<FiPlus />} colorScheme="blue">
          Create Course
        </Button>
      </HStack>

      <Box bg="white" p={4} borderRadius="md" boxShadow="sm" overflowX="auto">
        {loading ? (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" />
            <Text mt={4}>Loading courses...</Text>
          </Box>
        ) : courses.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Text>No courses found. Create your first course to get started.</Text>
          </Box>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Students</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {courses.map((course) => (
                <Tr key={course.id} _hover={{ bg: 'gray.50' }}>
                  <Td fontWeight="medium">{course.title}</Td>
                  <Td textTransform="capitalize">{course.category}</Td>
                  <Td>${course.price?.toFixed(2) || '0.00'}</Td>
                  <Td>{course.students?.toLocaleString() || '0'}</Td>
                  <Td>
                    <Badge 
                      colorScheme={
                        course.status === 'published' ? 'green' : 
                        course.status === 'draft' ? 'yellow' : 'gray'
                      }
                      textTransform="capitalize"
                      px={2}
                      py={1}
                      borderRadius="full"
                    >
                      {course.status}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2} justify="flex-end">
                      <Button
                        as={Link}
                        to={`/admin/courses/${course.id}/edit`}
                        leftIcon={<FiEdit2 />}
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                      >
                        Edit
                      </Button>
                      <Button
                        leftIcon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleDelete(course.id);
                        }}
                        isLoading={deletingCourseId === course.id}
                        loadingText="Deleting..."
                        disabled={!!deletingCourseId}
                      >
                        Delete
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>
    </Box>
  );
};

export default ManageCourses;
