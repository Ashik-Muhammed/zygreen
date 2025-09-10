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
  subtitle?: string;
  description?: string;
  category?: string;
  status: 'draft' | 'published' | 'archived';
  price?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  thumbnailUrl?: string;
  tags?: string[];
  students?: number;
  instructorId?: string;
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
    subtitle: '',
    description: '',
    category: 'web',
    status: 'draft',
    price: 0,
    level: 'beginner',
    tags: [],
    students: 0
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
          const courseData = courseDoc.data();
          setCourse({
            id: courseDoc.id,
            title: courseData.title || '',
            subtitle: courseData.subtitle || '',
            description: courseData.description || '',
            category: courseData.category || 'web',
            status: courseData.status || 'draft',
            price: courseData.price || 0,
            level: courseData.level || 'beginner',
            thumbnailUrl: courseData.thumbnailUrl || '',
            tags: courseData.tags || [],
            students: courseData.students || 0,
            instructorId: courseData.instructorId,
            updatedAt: courseData.updatedAt,
            createdAt: courseData.createdAt
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
    
    if (!course.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!course.description?.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!course.category) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setCourse(prev => ({
      ...prev,
      [name]: type === 'number' 
        ? parseFloat(value) || 0 
        : type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
    setCourse(prev => ({
      ...prev,
      tags
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !courseId) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepare the course data for Firestore
      const courseData: Partial<Course> = {
        title: course.title.trim(),
        subtitle: course.subtitle?.trim(),
        description: course.description?.trim(),
        category: course.category,
        status: course.status,
        price: course.price || 0,
        level: course.level || 'beginner',
        tags: course.tags || [],
        thumbnailUrl: course.thumbnailUrl,
        updatedAt: serverTimestamp(),
        // Preserve these fields if they exist
        ...(course.instructorId && { instructorId: course.instructorId }),
        ...(course.students !== undefined && { students: course.students }),
        ...(course.createdAt && { createdAt: course.createdAt })
      };
      
      await updateDoc(doc(db, 'courses', courseId), courseData);
      
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
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Loading course data...</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Button
        as={RouterLink}
        to="/admin/courses"
        leftIcon={<FiArrowLeft />}
        variant="ghost"
        mb={6}
      >
        Back to Courses
      </Button>

      <Box bg="white" p={6} rounded="lg" shadow="md">
        <Heading size="lg" mb={6}>Edit Course</Heading>
        
        <form onSubmit={handleSubmit}>
          <VStack spacing={6}>
            <FormControl isInvalid={!!errors.title} isRequired>
              <FormLabel>Title</FormLabel>
              <Input
                name="title"
                value={course.title || ''}
                onChange={handleChange}
                placeholder="Course title"
              />
              <FormErrorMessage>{errors.title}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Subtitle</FormLabel>
              <Input
                name="subtitle"
                value={course.subtitle || ''}
                onChange={handleChange}
                placeholder="Brief course description"
              />
            </FormControl>

            <FormControl isInvalid={!!errors.description} isRequired>
              <FormLabel>Description</FormLabel>
              <Textarea
                name="description"
                value={course.description || ''}
                onChange={handleChange}
                placeholder="Detailed course description"
                rows={5}
              />
              <FormErrorMessage>{errors.description}</FormErrorMessage>
            </FormControl>

            <HStack width="100%" spacing={6}>
              <FormControl isInvalid={!!errors.category} isRequired>
                <FormLabel>Category</FormLabel>
                <Select
                  name="category"
                  value={course.category || ''}
                  onChange={handleChange}
                  placeholder="Select category"
                >
                  <option value="web">Web Development</option>
                  <option value="mobile">Mobile Development</option>
                  <option value="design">Design</option>
                  <option value="business">Business</option>
                  <option value="marketing">Marketing</option>
                  <option value="data">Data Science</option>
                </Select>
                <FormErrorMessage>{errors.category}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Level</FormLabel>
                <Select
                  name="level"
                  value={course.level || 'beginner'}
                  onChange={handleChange}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  name="status"
                  value={course.status || 'draft'}
                  onChange={handleChange}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </Select>
              </FormControl>
            </HStack>

            <HStack width="100%" spacing={6}>
              <FormControl>
                <FormLabel>Price ($)</FormLabel>
                <Input
                  type="number"
                  name="price"
                  value={course.price || 0}
                  onChange={handleChange}
                  min={0}
                  step="0.01"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Students</FormLabel>
                <Input
                  type="number"
                  name="students"
                  value={course.students || 0}
                  onChange={handleChange}
                  min={0}
                />
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel>Tags (comma-separated)</FormLabel>
              <Input
                name="tags"
                value={course.tags?.join(', ') || ''}
                onChange={handleTagsChange}
                placeholder="e.g., react, javascript, web"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Thumbnail URL</FormLabel>
              <Input
                name="thumbnailUrl"
                value={course.thumbnailUrl || ''}
                onChange={handleChange}
                placeholder="https://example.com/thumbnail.jpg"
              />
            </FormControl>

            <HStack width="100%" justifyContent="flex-end" spacing={4} pt={4}>
              <Button
                type="button"
                colorScheme="red"
                variant="outline"
                leftIcon={<FiTrash2 />}
                onClick={onOpen}
                isLoading={isDeleting}
              >
                Delete Course
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
        </form>
      </Box>

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
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3} isLoading={isDeleting}>
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
