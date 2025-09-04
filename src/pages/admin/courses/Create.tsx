import { Box, Button, Checkbox, FormControl, FormHelperText, FormLabel, HStack, Heading, Input, Select, Stack, Tag, TagCloseButton, TagLabel, Text, Textarea, VStack, useToast, Wrap } from '@chakra-ui/react';
import { useState, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { FiUpload, FiX } from 'react-icons/fi';

// Function to generate a simple 4-letter-1-digit ID
const generateSimpleId = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  let result = '';
  // Add 4 random letters
  for (let i = 0; i < 4; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  // Add 1 random digit
  result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  
  return result;
};

// Function to check if ID is unique in Firestore
const isIdUnique = async (id: string): Promise<boolean> => {
  const q = query(collection(db, 'courses'), where('id', '==', id));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
};

interface Section {
  id: string;
  title: string;
  order: number;
  lessons: any[]; // Define proper type for lessons
}

const languages = [
  'English', 'Hindi', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Other'
];

const CreateCourse = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: '', // Will be set after creation
    title: '',
    subtitle: '',
    description: '',
    category: '',
    tags: [] as string[],
    tagInput: '',
    thumbnailUrl: '',
    promoVideoUrl: '',
    isFree: false,
    price: 0,
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    language: 'English',
    status: 'draft' as 'draft' | 'published' | 'archived',
    sections: [] as Section[]
  });
  const { currentUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formData.tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(formData.tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, prev.tagInput.trim()],
          tagInput: ''
        }));
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'video') => {
    // TODO: Implement file upload logic
    // For now, we'll just set a placeholder
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload the file to storage and get the URL
      const field = type === 'thumbnail' ? 'thumbnailUrl' : 'promoVideoUrl';
      setFormData(prev => ({
        ...prev,
        [field]: URL.createObjectURL(file) // Temporary URL for preview
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a course',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Generate a unique ID
      let courseId = '';
      let isUnique = false;
      
      // Keep generating until we get a unique ID (should be very quick)
      while (!isUnique) {
        courseId = generateSimpleId();
        isUnique = await isIdUnique(courseId);
      }

      // Create a new object with the generated ID and without the tagInput field
      const { tagInput, ...courseData } = {
        ...formData,
        id: courseId, // Add the generated ID
        price: formData.isFree ? 0 : Number(formData.price),
        tags: formData.tags,
        instructorId: currentUser.uid,
        students: 0,
        // Server will set these timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add the document to Firestore
      await addDoc(collection(db, 'courses'), courseData);
      
      // Update the form with the generated ID
      setFormData(prev => ({ ...prev, id: courseId }));
      
      toast({
        title: 'Course created',
        description: `Course ID: ${courseId}`,
        status: 'success',
        duration: 8000,
        isClosable: true,
      });
      
      // Navigate to edit page to add course content
      navigate(`/admin/courses/edit/${courseId}`);
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: 'Error',
        description: 'Failed to create course. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box p={4}>
      <Heading as="h1" size="xl" mb={6}>
        Create New Course
      </Heading>
      
      <Box as="form" onSubmit={handleSubmit} bg="white" p={6} borderRadius="md" boxShadow="sm">
        <VStack spacing={6} align="stretch">
          {/* Basic Information */}
          <Box borderWidth="1px" borderRadius="lg" p={4}>
            <Heading size="md" mb={4}>Basic Information</Heading>
            
            <FormControl isRequired mb={4}>
              <FormLabel>Course Title</FormLabel>
              <Input 
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Complete Web Development Bootcamp"
                required
              />
            </FormControl>
            
            <FormControl isRequired mb={4}>
              <FormLabel>Subtitle</FormLabel>
              <Input 
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                placeholder="A brief description of what students will learn"
                required
              />
            </FormControl>
            
            <FormControl isRequired mb={4}>
              <FormLabel>Description</FormLabel>
              <Textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed course description" 
                rows={4}
                required
              />
            </FormControl>
            
            <FormControl isRequired mb={4}>
              <FormLabel>Category</FormLabel>
              <Input
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., Web Development, Data Science"
                required
              />
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Tags/Keywords</FormLabel>
              <Input
                name="tagInput"
                value={formData.tagInput}
                onChange={handleChange}
                onKeyDown={handleTagKeyDown}
                placeholder="Type and press Enter to add tags"
              />
              <Wrap mt={2} spacing={2}>
                {formData.tags.map((tag) => (
                  <Tag key={tag} size="md" variant="subtle" colorScheme="blue">
                    <TagLabel>{tag}</TagLabel>
                    <TagCloseButton onClick={() => removeTag(tag)} />
                  </Tag>
                ))}
              </Wrap>
            </FormControl>
          </Box>
          
          {/* Media */}
          <Box borderWidth="1px" borderRadius="lg" p={4}>
            <Heading size="md" mb={4}>Media</Heading>
            
            <FormControl isRequired mb={4}>
              <FormLabel>Thumbnail Image</FormLabel>
              <Box 
                borderWidth="1px" 
                borderRadius="md" 
                p={4} 
                textAlign="center"
                cursor="pointer"
                position="relative"
                _hover={{ bg: 'gray.50' }}
              >
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="thumbnail-upload"
                  onChange={(e) => handleFileUpload(e, 'thumbnail')}
                />
                <label htmlFor="thumbnail-upload">
                  {formData.thumbnailUrl ? (
                    <img 
                      src={formData.thumbnailUrl} 
                      alt="Thumbnail preview" 
                      style={{ maxWidth: '100%', maxHeight: '200px', margin: '0 auto' }}
                    />
                  ) : (
                    <Box>
                      <FiUpload size={24} style={{ margin: '0 auto 8px' }} />
                      <Text>Click to upload thumbnail (16:9 recommended)</Text>
                    </Box>
                  )}
                </label>
              </Box>
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Promo Video (Optional)</FormLabel>
              <Box 
                borderWidth="1px" 
                borderRadius="md" 
                p={4} 
                textAlign="center"
                cursor="pointer"
                _hover={{ bg: 'gray.50' }}
              >
                <input
                  type="file"
                  accept="video/*"
                  style={{ display: 'none' }}
                  id="video-upload"
                  onChange={(e) => handleFileUpload(e, 'video')}
                />
                <label htmlFor="video-upload" style={{ cursor: 'pointer' }}>
                  {formData.promoVideoUrl ? (
                    <Box>
                      <video 
                        src={formData.promoVideoUrl} 
                        controls 
                        style={{ maxWidth: '100%', maxHeight: '200px', margin: '0 auto' }}
                      />
                      <Button mt={2} size="sm" leftIcon={<FiX />} onClick={(e) => {
                        e.stopPropagation();
                        setFormData(prev => ({ ...prev, promoVideoUrl: '' }));
                      }}>
                        Remove Video
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <FiUpload size={24} style={{ margin: '0 auto 8px' }} />
                      <Text>Click to upload promo video</Text>
                    </Box>
                  )}
                </label>
              </Box>
            </FormControl>
          </Box>
          
          {/* Course Settings */}
          <Box borderWidth="1px" borderRadius="lg" p={4}>
            <Heading size="md" mb={4}>Course Settings</Heading>
            
            <FormControl mb={4} isReadOnly>
              <FormLabel>Course ID</FormLabel>
              <Input 
                placeholder="Will be generated after creation" 
                value={formData.id || 'N/A'}
                readOnly
                bg="gray.50"
              />
              <FormHelperText>Auto-generated unique identifier for this course</FormHelperText>
            </FormControl>
            
            <Stack direction={['column', 'row']} spacing={4} mb={4}>
              <FormControl isRequired flex={1}>
                <FormLabel>Language</FormLabel>
                <Select 
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl isRequired flex={1}>
                <FormLabel>Level</FormLabel>
                <Select 
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
              </FormControl>
            </Stack>
            
            <FormControl mb={4}>
              <Checkbox 
                name="isFree" 
                isChecked={formData.isFree}
                onChange={handleChange}
              >
                This course is free
              </Checkbox>
            </FormControl>
            
            {!formData.isFree && (
              <FormControl isRequired mb={4}>
                <FormLabel>Price (INR)</FormLabel>
                <Input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Enter course price"
                  disabled={formData.isFree}
                />
              </FormControl>
            )}
            
            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select 
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </Select>
            </FormControl>
          </Box>
          
          <HStack spacing={4} justify="flex-end" mt={8}>
            <Button variant="outline" onClick={() => navigate('/admin/courses')}>
              Cancel
            </Button>
            <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>
              Create Course
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
};

export default CreateCourse;
