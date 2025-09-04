import { 
  Box, Button, FormControl, FormLabel, HStack, Heading, 
  Input, Select, Textarea, VStack, useToast, 
  FormErrorMessage, useDisclosure, AlertDialog,
  AlertDialogOverlay, AlertDialogContent, AlertDialogHeader,
  AlertDialogBody, AlertDialogFooter, Spinner, Text
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FiArrowLeft, FiSave, FiTrash2 } from 'react-icons/fi';

interface Course {
  id?: string;
  title: string;
  description: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  price?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  thumbnailUrl?: string;
  updatedAt?: any;
  createdAt?: any;
}

const EditCourse = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course>({
    title: '',
    description: '',
    category: 'web',
    status: 'draft',
    price: 0,
    level: 'beginner',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        
        if (courseDoc.exists()) {
          const courseData = courseDoc.data() as Course;
          setCourse({
            ...courseData,
            id: courseDoc.id,
          });
        } else {
          throw new Error('Course not found');
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        toast({
          title: 'Error',
          description: 'Failed to load course data. ' + (error instanceof Error ? error.message : ''),
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top',
        });
        navigate('/admin/courses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, toast, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!course.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!course.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!course.category) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCourse(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!courseId) return;
    
    try {
      setIsSubmitting(true);
      
      await updateDoc(doc(db, 'courses', courseId), {
        ...course,
        updatedAt: serverTimestamp(),
      });
      
      toast({
        title: 'Success',
        description: 'Course updated successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      
      navigate('/admin/courses');
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update course. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!courseId) return;
    
    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'courses', courseId));
      
      toast({
        title: 'Success',
        description: 'Course deleted successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      
      navigate('/admin/courses');
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete course. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  if (isLoading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Loading course data...</Text>
      </Box>
    );
  }

  return (
    <Box p={4} maxW="container.lg" mx="auto">
      <Button
        as={RouterLink}
        to="/admin/courses"
        leftIcon={<FiArrowLeft />}
        variant="ghost"
        mb={6}
        size="sm"
      >
        Back to Courses
      </Button>
      
      <HStack justify="space-between" mb={6}>
        <Heading as="h1" size="xl">Edit Course</Heading>
        <Button
          colorScheme="red"
          variant="outline"
          leftIcon={<FiTrash2 />}
          onClick={onOpen}
          isDisabled={isSubmitting}
        >
          Delete Course
        </Button>
      </HStack>
      
      <Box as="form" onSubmit={handleSubmit} bg="white" p={6} borderRadius="md" boxShadow="sm">
        <VStack spacing={6} align="stretch">
          <FormControl isRequired isInvalid={!!errors.title}>
            <FormLabel>Course Title</FormLabel>
            <Input 
              name="title"
              placeholder="Enter course title" 
              value={course.title}
              onChange={handleChange}
            />
            <FormErrorMessage>{errors.title}</FormErrorMessage>
          </FormControl>
          
          <FormControl isRequired isInvalid={!!errors.description}>
            <FormLabel>Description</FormLabel>
            <Textarea 
              name="description"
              placeholder="Enter course description"
              value={course.description}
              onChange={handleChange}
              rows={5}
            />
            <FormErrorMessage>{errors.description}</FormErrorMessage>
          </FormControl>
          
          <HStack spacing={6} align="start">
            <FormControl isRequired isInvalid={!!errors.category} width="50%">
              <FormLabel>Category</FormLabel>
              <Select 
                name="category"
                placeholder="Select category"
                value={course.category}
                onChange={handleChange}
              >
                <option value="web">Web Development</option>
                <option value="mobile">Mobile Development</option>
                <option value="design">Design</option>
                <option value="business">Business</option>
                <option value="marketing">Marketing</option>
              </Select>
              <FormErrorMessage>{errors.category}</FormErrorMessage>
            </FormControl>
            
            <FormControl width="25%">
              <FormLabel>Level</FormLabel>
              <Select 
                name="level"
                value={course.level}
                onChange={handleChange}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </FormControl>
            
            <FormControl width="25%">
              <FormLabel>Price ($)</FormLabel>
              <Input 
                type="number"
                name="price"
                value={course.price}
                onChange={handleChange}
                min={0}
                step="0.01"
              />
            </FormControl>
          </HStack>
          
          <HStack spacing={6} align="start">
            <FormControl isRequired width="50%">
              <FormLabel>Status</FormLabel>
              <Select 
                name="status"
                value={course.status}
                onChange={handleChange}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </Select>
            </FormControl>
            
            <FormControl width="50%">
              <FormLabel>Thumbnail URL</FormLabel>
              <Input 
                name="thumbnailUrl"
                placeholder="https://example.com/thumbnail.jpg"
                value={course.thumbnailUrl || ''}
                onChange={handleChange}
              />
            </FormControl>
          </HStack>
          
          <HStack spacing={4} mt={8} justify="flex-end">
            <Button 
              as={RouterLink}
              to="/admin/courses"
              variant="outline"
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              colorScheme="blue"
              leftIcon={<FiSave />}
              isLoading={isSubmitting}
              loadingText="Saving..."
            >
              Save Changes
            </Button>
          </HStack>
        </VStack>
      </Box>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Course
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this course? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} isDisabled={isDeleting}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleDelete} 
                ml={3}
                isLoading={isDeleting}
                loadingText="Deleting..."
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default EditCourse;
