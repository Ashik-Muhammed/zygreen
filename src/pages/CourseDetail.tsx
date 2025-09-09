import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { enrollInCourse } from '../services/courseService';
import { getDocumentById } from '../services/apiService';
import { 
  doc, 
  getDoc, 
  query, 
  collection, 
  where, 
  limit, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../firebase';

// UI Components
import { 
  Box, 
  Button, 
  Container, 
  Divider, 
  Grid,
  SimpleGrid,
  Heading, 
  HStack, 
  Icon, 
  Image, 
  Stack, 
  Tab, 
  TabList, 
  TabPanel, 
  TabPanels, 
  Tabs, 
  Tag, 
  Text, 
  VStack, 
  useToast, 
  Spinner,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  FiClock, 
  FiStar, 
  FiUsers, 
  FiCheckCircle, 
  FiPlay, 
  FiDownload, 
  FiArrowLeft
} from 'react-icons/fi';

interface Lecture {
  id: string;
  title: string;
  duration: string;
  preview?: boolean;
}

interface Week {
  week: number;
  title: string;
  lectures: Lecture[];
}

interface CourseWithInstructor {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  duration?: number | string;
  students?: number;
  rating?: number;
  ratingCount?: number;
  price?: number | string;
  discountPrice?: number | string;
  learningOutcomes?: string[];
  requirements?: string[];
  thumbnailUrl?: string;
  imageUrl?: string;
  instructor?: string;
  instructorAvatar?: string;
  whatYouWillLearn?: string[];
  sections?: any[];
  updatedAt?: any;
  [key: string]: any; // Allow additional properties
};

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Location state can be accessed if needed in the future
  const toast = useToast();
  const { currentUser } = useAuth();
  const [course, setCourse] = useState<CourseWithInstructor>({
    id: '',
    title: '',
    description: '',
    instructor: 'Instructor Name',
    instructorAvatar: '/images/avatar-placeholder.png',
    category: 'Uncategorized',
    level: 'beginner',
    duration: 0,
    enrolledStudents: 0,
    rating: 0,
    ratingCount: 0,
    price: 0,
    learningOutcomes: [],
    requirements: [],
    thumbnailUrl: '',
    imageUrl: '',
    isPublished: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: ''
  });
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);
  const [error] = useState<string | null>(null);
  const [curriculum] = useState<Week[]>([]);
  // Removed unused hooks

  useEffect(() => {
    const checkEnrollment = async () => {
      if (!currentUser || !id) {
        setIsCheckingEnrollment(false);
        return;
      }
      
      try {
        // First try to get the course by document ID
        let courseDoc = await getDoc(doc(db, 'courses', id));
        let courseDocumentId = id;
        
        // If not found by document ID, try to find by custom 'id' field
        if (!courseDoc.exists()) {
          const courseQuery = query(
            collection(db, 'courses'),
            where('id', '==', id),
            limit(1)
          );
          
          const querySnapshot = await getDocs(courseQuery);
          if (!querySnapshot.empty) {
            courseDoc = querySnapshot.docs[0];
            courseDocumentId = courseDoc.id;
          } else {
            console.error('Course not found');
            return;
          }
        }
        
        // Check in the course's enrollments subcollection
        const enrollmentRef = doc(db, 'courses', courseDocumentId, 'enrollments', currentUser.uid);
        const enrollmentDoc = await getDoc(enrollmentRef);
        
        // Check if the enrollment exists and has the correct studentId
        const isEnrolled = enrollmentDoc.exists() && 
                          enrollmentDoc.data()?.studentId === currentUser.uid;
        
        setIsEnrolled(isEnrolled);
        
        if (!isEnrolled) {
          console.log('No valid enrollment found for this course');
        } else {
          console.log('User is enrolled in this course');
        }
      } catch (error) {
        console.error('Error checking enrollment:', error);
      } finally {
        setIsCheckingEnrollment(false);
      }
    };

    const fetchCourse = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // First try to get the course by document ID
        let courseDoc = await getDoc(doc(db, 'courses', id));
        let courseData: any = null;
        
        // If not found by document ID, try to find by custom 'id' field
        if (!courseDoc.exists()) {
          const courseQuery = query(
            collection(db, 'courses'),
            where('id', '==', id),
            limit(1)
          );
          
          const querySnapshot = await getDocs(courseQuery);
          if (!querySnapshot.empty) {
            courseDoc = querySnapshot.docs[0];
            courseData = { id: courseDoc.id, ...courseDoc.data() };
          }
        } else {
          courseData = { id: courseDoc.id, ...courseDoc.data() };
        }
        
        if (courseData) {
          setCourse(courseData as CourseWithInstructor);
          // Check enrollment status after course is loaded
          if (currentUser) {
            await checkEnrollment();
          }
        } else {
          toast({
            title: 'Error',
            description: 'Course not found',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          navigate('/courses');
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        toast({
          title: 'Error',
          description: 'Failed to load course',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        navigate('/courses');
      } finally {
        setIsLoading(false);
        setIsCheckingEnrollment(false);
      }
    };

    fetchCourse();
  }, [id, navigate, toast, currentUser]);

  const handleEnroll = async () => {
    try {
      if (!currentUser) {
        navigate('/login', { state: { from: `/courses/${id}` } });
        return;
      }
      
      if (!id) {
        throw new Error('No course ID available');
      }
      
      setIsLoading(true);
      
      try {
        await enrollInCourse(currentUser.uid, id);
        setIsEnrolled(true);
        
        toast({
          title: 'Enrollment Successful',
          description: 'You have successfully enrolled in this course!',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } catch (error: any) {
        if (error.message === 'You are already enrolled in this course') {
          setIsEnrolled(true);
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to enroll in course. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Start learning function will be implemented when the learning interface is ready

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="60vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={20}>
        <Text fontSize="xl" color="red.500" mb={4}>
          {error || 'Course not found'}
        </Text>
        <Button
          as={RouterLink}
          to="/courses"
          leftIcon={<FiArrowLeft />}
          colorScheme="blue"
          variant="outline"
        >
          Back to Courses
        </Button>
      </Box>
    );
  }

  // Add safe default values for course data
  const safeCourse: CourseWithInstructor = {
    title: 'Loading...',
    description: '',
    category: 'Uncategorized',
    level: 'beginner',
    rating: 0,
    ratingCount: 0,
    students: 0,
    duration: 0,
    price: 0,
    learningOutcomes: [],
    requirements: [],
    thumbnailUrl: '',
    imageUrl: '',
    instructor: 'Instructor',
    instructorAvatar: '',
    ...(course || {}) // Safely spread course data if it exists
  };
  
  // Helper function to safely convert to number with type safety
  const toNumber = (value: unknown, defaultValue = 0): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? defaultValue : num;
    }
    return defaultValue;
  };
  
  // Convert string numbers to numbers for calculations with explicit defaults
  const coursePrice = toNumber(safeCourse.price, 0);
  const discountPrice = toNumber(safeCourse.discountPrice, coursePrice);
  const courseRating = toNumber(safeCourse.rating, 0);
  const courseStudents = toNumber(safeCourse.students, 0);
  const courseDuration = toNumber(safeCourse.duration, 0);
  
  // Ensure rating count is always a number
  const ratingCount = toNumber(safeCourse.ratingCount, 0);
  
  // Safely get level with fallback
  // Safely get level with fallback to 'beginner'
  const courseLevel: 'beginner' | 'intermediate' | 'advanced' = 
    (safeCourse.level && ['beginner', 'intermediate', 'advanced'].includes(safeCourse.level) 
      ? safeCourse.level 
      : 'beginner') as 'beginner' | 'intermediate' | 'advanced';

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="50vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error || !course) {
    return (
      <Box textAlign="center" py={10} px={6}>
        <Heading as="h2" size="xl" mt={6} mb={2}>
          Course Not Found
        </Heading>
        <Text color={'gray.500'} mb={6}>
          The course you're looking for doesn't exist or has been removed.
        </Text>
        <Button colorScheme="blue" onClick={() => navigate('/courses')}>
          Browse Courses
        </Button>
      </Box>
    );
  }

  return (
    <Box py={12}>
      <Container maxW="container.xl">
        {/* Course Header */}
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8} mb={12}>
          <Box>
            <Tag colorScheme="blue" mb={4}>{safeCourse.category || 'Uncategorized'}</Tag>
            <Heading as="h1" size="2xl" mb={4}>
              {safeCourse.title}
            </Heading>
            <Text fontSize="lg" color="gray.600" mb={6} whiteSpace="pre-line">
              {safeCourse.description || 'No description available.'}
            </Text>
            
            <HStack spacing={6} mb={6} flexWrap="wrap">
              <HStack>
                <Icon as={FiStar} color="yellow.400" />
                <Text>{courseRating.toFixed(1)} ({ratingCount.toLocaleString()} reviews)</Text>
              </HStack>
              <HStack>
                <Icon as={FiUsers} />
                <Text>{courseStudents.toLocaleString()} students</Text>
              </HStack>
              <HStack>
                <Icon as={FiClock} />
                <Text>{courseDuration} hours</Text>
              </HStack>
              <Tag colorScheme={
                courseLevel === 'beginner' 
                  ? 'green' 
                  : courseLevel === 'intermediate' 
                    ? 'yellow' 
                    : 'red'
              }>
                {courseLevel.charAt(0).toUpperCase() + courseLevel.slice(1)}
              </Tag>
            </HStack>
            
            <HStack spacing={4} mb={8}>
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {courseRating.toFixed(1)}
                <Text as="span" fontSize="md" color="gray.500">/5.0</Text>
              </Text>
              <Text color="gray.500">({ratingCount} ratings)</Text>
            </HStack>
          </Box>
          
          {/* Enroll Card */}
          <Box 
            borderWidth="1px" 
            borderRadius="lg" 
            p={6} 
            h="fit-content"
            boxShadow="md"
          >
            {safeCourse.thumbnailUrl || safeCourse.imageUrl ? (
              <Image 
                src={safeCourse.thumbnailUrl || safeCourse.imageUrl} 
                alt={safeCourse.title} 
                borderRadius="lg"
                objectFit="cover"
                w="100%"
                h="auto"
              />
            ) : (
              <Box 
                bg="gray.100" 
                h="300px" 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
                borderRadius="lg"
              >
                <Text color="gray.500">No preview available</Text>
              </Box>
            )}
            
            <VStack align="stretch" spacing={4} p={6} bg={useColorModeValue('gray.50', 'gray.800')} borderRadius="lg" borderWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.700')} position="sticky" top="6">
              <Text fontSize="2xl" fontWeight="bold">
                {coursePrice > 0 ? (
                  <>
                    ${discountPrice < coursePrice 
                      ? discountPrice.toFixed(2)
                      : coursePrice.toFixed(2)}
                    {discountPrice < coursePrice && (
                      <Text as="span" ml={2} fontSize="lg" color="gray.500" textDecoration="line-through">
                        ${coursePrice.toFixed(2)}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text color="green.600">Free</Text>
                )}
              </Text>
              
              {isEnrolled ? (
                <Button
                  as={RouterLink}
                  to={`/learn/${id}`}
                  colorScheme="green"
                  size="lg"
                  w="100%"
                >
                  Start Learning
                </Button>
              ) : (
                <Button
                  colorScheme="blue"
                  size="lg"
                  w="100%"
                  onClick={handleEnroll}
                  isLoading={isLoading || isCheckingEnrollment}
                  loadingText={isCheckingEnrollment ? 'Checking...' : 'Enrolling...'}
                >
                  Enroll Now
                </Button>
              )}
              
              <Text fontSize="sm" color="gray.500" textAlign="center">
                30-Day Money-Back Guarantee
              </Text>
              
              <Divider />
              
              <VStack spacing={3} align="start" w="100%">
                <HStack>
                  <Icon as={FiClock} color="gray.500" />
                  <Text>Lifetime access</Text>
                </HStack>
                <HStack>
                  <Icon as={FiDownload} color="gray.500" />
                  <Text>Downloadable resources</Text>
                </HStack>
                <HStack>
                  <Icon as={FiCheckCircle} color="gray.500" />
                  <Text>Certificate of completion</Text>
                </HStack>
              </VStack>
              
              {discountPrice < coursePrice && (
                <Text fontSize="sm" color="green.500" textAlign="center" mt={2}>
                  Save ${(coursePrice - discountPrice).toFixed(2)} with this special offer!
                </Text>
              )}
            </VStack>
          </Box>
        </Grid>
        
        {/* Course Tabs */}
        <Tabs 
          variant="enclosed" 
          colorScheme="blue"
          index={activeTab}
          onChange={(index) => setActiveTab(index)}
          mb={12}
        >
          <TabList>
            <Tab>Overview</Tab>
            <Tab>Curriculum</Tab>
            <Tab>Instructor</Tab>
            <Tab>Reviews</Tab>
          </TabList>
          
          <TabPanels py={6}>
            {/* Overview Tab */}
            <TabPanel px={0}>
              <Box mb={8}>
                <Heading as="h3" size="lg" mb={4}>What You'll Learn</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={8}>
                  {(safeCourse.learningOutcomes || safeCourse.whatYouWillLearn || ['No learning outcomes provided']).map((item: string, index: number) => (
                    <HStack key={index} align="flex-start">
                      <Icon as={FiCheckCircle} color="green.500" mt={1} />
                      <Text>{item}</Text>
                    </HStack>
                  ))}
                </SimpleGrid>
                
                <Heading as="h3" size="lg" mb={4}>Requirements</Heading>
                <VStack align="stretch" spacing={2} mb={8}>
                  {(safeCourse.requirements?.length ? safeCourse.requirements : ['No requirements specified']).map((req: string, index: number) => (
                    <HStack key={index}>
                      <Text as="span" color="blue.500">•</Text>
                      <Text>{req}</Text>
                    </HStack>
                  ))}
                </VStack>
                
                <Heading as="h3" size="lg" mb={4}>Description</Heading>
                <Text mb={8} whiteSpace="pre-line">
                  {safeCourse.description}\n\n
This comprehensive course will take you from the basics of React to advanced concepts like state management with Redux, authentication, and deployment. You'll build real-world applications and learn best practices from an industry expert.

By the end of this course, you'll be able to build complex, scalable React applications with confidence.
                </Text>
              </Box>
            </TabPanel>
            
            {/* Curriculum Tab */}
            <TabPanel px={0}>
              <Box>
                <Heading size="md" mb={6}>Course Content</Heading>
                {curriculum.length > 0 ? (
                  curriculum.map((week, index) => (
                    <Box key={index} mb={8}>
                      <Heading size="sm" mb={4}>
                        {week.week}: {week.title}
                      </Heading>
                      <Box borderWidth="1px" borderRadius="md" overflow="hidden">
                        {week.lectures.map((lecture, idx) => (
                          <HStack
                            key={lecture.id}
                            p={4}
                            borderBottomWidth={idx < week.lectures.length - 1 ? '1px' : '0'}
                            borderColor="gray.100"
                            _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                            cursor="pointer"
                          >
                            <Icon as={FiPlay} color="blue.500" mr={3} />
                            <Box flex={1}>
                              <Text fontWeight="medium">{lecture.title}</Text>
                              <HStack spacing={2} mt={1} color="gray.500">
                                <Text fontSize="sm">{lecture.duration}</Text>
                                {lecture.preview && (
                                  <Tag size="sm" colorScheme="blue" variant="subtle">
                                    Preview
                                  </Tag>
                                )}
                              </HStack>
                            </Box>
                          </HStack>
                        ))}
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Text color="gray.500">No curriculum available for this course yet.</Text>
                )}
              </Box>
            </TabPanel>
            
            {/* Instructor Tab */}
            <TabPanel px={0}>
              <Stack direction={{ base: 'column', md: 'row' }} spacing={8}>
                <Box flexShrink={0}>
                  <Image 
                    src={safeCourse.instructorAvatar || '/images/avatar-placeholder.png'} 
                    alt={safeCourse.instructor || 'Instructor'}
                    borderRadius="full"
                    boxSize="150px"
                    objectFit="cover"
                    mx={{ base: 'auto', md: 0 }}
                    mb={{ base: 4, md: 0 }}
                  />
                </Box>
                <Box>
                  <Heading as="h3" size="lg" mb={4}>
                    About the Instructor: {safeCourse.instructor || 'Instructor Name'}
                  </Heading>
                  <Text mb={4} color="gray.600">
                    {safeCourse.instructor} is a Senior Instructor with over 10 years of experience in {safeCourse.category || 'web development'}. 
                    Specializing in modern technologies, they have helped thousands of students 
                    master new skills through comprehensive courses and hands-on projects.
                  </Text>
                  <HStack spacing={4} mb={4}>
                    <HStack>
                      <Text fontWeight="bold">4.8</Text>
                      <Icon as={FiStar} color="yellow.400" />
                    </HStack>
                    <Text>•</Text>
                    <Text>{ratingCount.toLocaleString()} reviews</Text>
                  </HStack>
                  <Button colorScheme="blue" variant="outline">
                    View All Courses
                  </Button>
                </Box>
              </Stack>
            </TabPanel>

            {/* Reviews Tab */}
            <TabPanel px={0}>
              <VStack align="stretch" spacing={8}>
                <Box textAlign="center" py={4}>
                  <Heading as="h4" size="md" mb={2}>
                    <Text>{safeCourse.instructor || 'Instructor Name'}</Text>
                  </Heading>
                  <HStack spacing={4} color="gray.500" mb={4} flexWrap="wrap">
                    <HStack>
                      <Icon as={FiClock} />
                      <Text>{courseDuration} hours</Text>
                    </HStack>
                    <HStack>
                      <Icon as={FiUsers} />
                      <Text>{courseStudents.toLocaleString()} students</Text>
                    </HStack>
                    <HStack>
                      <Icon as={FiStar} color="yellow.400" />
                      <Text>{courseRating.toFixed(1)} ({ratingCount.toLocaleString()})</Text>
                    </HStack>
                  </HStack>
                </Box>
                
                {/* Review Filters */}
                <HStack spacing={4} mb={6} flexWrap="wrap">
                  <Button size="sm" variant="outline">All</Button>
                  <Button size="sm" variant="outline">5 Star (1,045)</Button>
                  <Button size="sm" variant="outline">4 Star (156)</Button>
                  <Button size="sm" variant="outline">3 Star (32)</Button>
                  <Button size="sm" variant="outline">2 Star (8)</Button>
                  <Button size="sm" variant="outline">1 Star (4)</Button>
                </HStack>
                
                {/* Reviews List */}
                <VStack align="stretch" spacing={6}>
                  {[1, 2, 3].map((review) => (
                    <Box key={review} borderBottomWidth="1px" pb={6} _last={{ border: 'none' }}>
                      <HStack mb={2}>
                        <Box w="40px" h="40px" bg="gray.200" borderRadius="full" />
                        <Box>
                          <Text fontWeight="medium">Student {review}</Text>
                          <HStack>
                            {[...Array(5)].map((_, i) => (
                              <Icon 
                                key={i} 
                                as={FiStar} 
                                color={i < 5 ? "yellow.400" : "gray.300"} 
                                boxSize={4}
                              />
                            ))}
                          </HStack>
                        </Box>
                      </HStack>
                      <Text color="gray.600" mb={4}>
                        This course was amazing! I learned so much about React and Redux. The instructor explains everything clearly and provides great examples.
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {courseRating ? `${Math.round((courseRating / 5) * 100)}%` : '0%'} of students would recommend this course
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        2 months ago • Was this review helpful? 
                        <Button variant="link" size="sm" ml={2} colorScheme="blue">Yes</Button> • 
                        <Button variant="link" size="sm" colorScheme="blue">No</Button>
                      </Text>
                    </Box>
                  ))}
                </VStack>
                
                <Button variant="outline" size="lg" mx="auto" display="block" mt={4}>
                  Load More Reviews
                </Button>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        {/* Related Courses */}
        <Box>
          <Heading as="h2" size="xl" mb={6}>You May Also Like</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {/* Add related courses here */}
          </SimpleGrid>
        </Box>
      </Container>
    </Box>
  );
};

export default CourseDetail;
