import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Image,
  useBreakpointValue,
  Icon,
  HStack,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  FiArrowRight,
  FiBookOpen,
  FiUsers,
  FiAward,
  FiLoader,
} from 'react-icons/fi';
import { useEffect, useState, useRef } from 'react';
import { getFeaturedCourses, getDocumentById } from '../services/apiService';
import { Course } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { gsap } from 'gsap';

const Home = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set initial styles for animated elements
    gsap.set('.hero-cta', { y: 20, opacity: 0 });
    gsap.set(contentRef.current, { y: 50, opacity: 0 });
    gsap.set(imageRef.current, { x: 50, opacity: 0 });

    // Create a GSAP timeline
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Animation sequence
    tl.to(
      contentRef.current,
      { y: 0, opacity: 1, duration: 0.8 }
    )
    .to(
      imageRef.current,
      { x: 0, opacity: 1, duration: 0.8 },
      '-=0.4' // Overlap with previous animation
    )
    .to(
      '.hero-cta',
      { y: 0, opacity: 1, stagger: 0.2, duration: 0.5 },
      '-=0.3'
    );
  }, []);

  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState({
    students: 0,
    courses: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch featured courses
        const courses = await getFeaturedCourses();
        setFeaturedCourses(courses as Course[]);
        
        // Fetch site stats
        try {
          const statsData = await getDocumentById('siteContent', 'stats') as any;
          if (statsData) {
            setStats({
              students: Number(statsData.students) || 0,
              courses: Number(statsData.courses) || 0,
              successRate: Number(statsData.successRate) || 0
            });
          }
        } catch (error) {
          console.error('Error fetching stats:', error);
          // Set default stats if document doesn't exist
          setStats({
            students: 0,
            courses: 0,
            successRate: 0
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const features = [
    {
      icon: FiBookOpen,
      title: 'Interactive Courses',
      description: 'Engaging and interactive courses designed by industry experts to help you learn effectively.',
    },
    {
      icon: FiAward,
      title: 'Earn Certificates',
      description: 'Get recognized for your achievements with our verifiable certificates upon course completion.',
    },
    {
      icon: FiUsers,
      title: 'Learn with Peers',
      description: 'Join a community of learners, participate in discussions, and grow together.',
    },
  ];

  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
    };

    fetchUserRole();
  }, [currentUser]);

  // Loading spinner animation
  const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  `;
  const spinAnimation = `${spin} 1s linear infinite`;

  return (
    <Box>
      {/* Hero Section */}
      <Box ref={heroRef} bgGradient="linear(to-r, green.200, green.400)" color="white" py={20} overflow="hidden">
        <Container maxW="container.xl">
          <Flex direction={{ base: 'column', lg: 'row' }} align="center">
            <Box ref={contentRef} flex={1} mb={{ base: 10, lg: 0 }} pr={{ lg: 10 }}>
              <Text fontSize="lg" fontWeight="semibold" mb={2} color="white.100">
                WELCOME TO ZYGREEN
              </Text>
              <Heading as="h1" size="2xl" mb={6} lineHeight="1.2">
                Learn New Skills Online with Our Expert-Led Courses
              </Heading>
              <Text fontSize="xl" mb={8} color="green.100">
                Join thousands of students learning at their own pace with our high-quality video courses and hands-on projects.
              </Text>
              <HStack spacing={4}>
                {currentUser ? (
                  <Button
                    className="hero-cta"
                    as={RouterLink}
                    to={userRole === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                    colorScheme="whiteAlpha"
                    variant="solid"
                    size="lg"
                    rightIcon={<FiArrowRight />}
                    opacity={0}
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      className="hero-cta"
                      as={RouterLink}
                      to="/signup"
                      colorScheme="whiteAlpha"
                      variant="solid"
                      size="lg"
                    >
                      Get Started
                    </Button>
                    <Button
                      className="hero-cta"
                      as={RouterLink}
                      to="/courses"
                      variant="outline"
                      colorScheme="whiteAlpha"
                      size="lg"
                    >
                      Browse Courses
                    </Button>
                  </>
                )}
              </HStack>
            </Box>
            {!isMobile && (
              <Box ref={imageRef} flex={1} opacity={0}>
                <Box 
                  bg="blue.50" 
                  p={8} 
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="blue.100"
                  textAlign="center"
                >
                  <Text fontSize="2xl" fontWeight="bold" color="blue.800" mb={2}>
                    Welcome to Zygreen Learning
                  </Text>
                  <Text color="gray.600">
                    Start your learning journey today with our expert-led courses
                  </Text>
                </Box>
              </Box>
            )}
          </Flex>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={20}>
        <Container maxW="container.xl">
          <Box textAlign="center" maxW="3xl" mx="auto" mb={16}>
            <Text color="green.500" fontWeight="semibold" mb={4}>WHY CHOOSE US</Text>
            <Heading as="h2" size="xl" mb={6}>
              Start Learning and Grow Your Skills
            </Heading>
            <Text fontSize="lg" color="gray.600">
              We provide the best online courses with expert instructors and hands-on learning experience.
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            {features.map((feature, index) => (
              <Box
                key={index}
                p={6}
                borderWidth="1px"
                borderRadius="lg"
                bg="white"
                _hover={{
                  transform: 'translateY(-5px)',
                  boxShadow: 'xl',
                  transition: 'all 0.3s',
                }}
              >
                <Flex
                  w={12}
                  h={12}
                  bg="green.50"
                  color="green.500"
                  borderRadius="full"
                  align="center"
                  justify="center"
                  mb={4}
                >
                  <Icon as={feature.icon} boxSize={6} />
                </Flex>
                <Heading as="h3" size="md" mb={3}>
                  {feature.title}
                </Heading>
                <Text color="gray.600">
                  {feature.description}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Popular Courses Preview */}
      <Box bg="gray.50" py={20}>
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center" mb={12}>
            <Heading as="h2" size="xl">Featured Courses</Heading>
            <Text fontSize="lg" color="gray.600" maxW="2xl">
              Explore our most popular courses and start learning today
            </Text>
          </VStack>

          {loading ? (
            <Flex justify="center" align="center" minH="50vh">
              <FiLoader 
                size={48} 
                style={{
                  animation: spinAnimation,
                  display: 'inline-block'
                }} 
              />
            </Flex>
          ) : error ? (
            <Text color="red.500" textAlign="center">{error}</Text>
          ) : (
            <>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
                {featuredCourses.map((course) => (
                  <Box 
                    key={course.id}
                    borderWidth="1px" 
                    borderRadius="lg" 
                    overflow="hidden"
                    _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
                    transition="all 0.3s"
                  >
                    <Image 
                      src={course.imageUrl || 'https://via.placeholder.com/400x225'} 
                      alt={course.title} 
                      w="100%"
                      h="200px"
                      objectFit="cover"
                    />
                    <Box p={6}>
                      <Text fontSize="sm" color="green.500" fontWeight="bold" mb={2}>
                        {course.category || 'Course'}
                      </Text>
                      <Heading as="h3" size="md" mb={2} noOfLines={1}>
                        {course.title}
                      </Heading>
                      <Text color="gray.600" mb={4} noOfLines={2}>
                        {course.description || 'Learn something new with this course'}
                      </Text>
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="bold">
                          {course.price ? `$${course.price.toFixed(2)}` : 'Free'}
                        </Text>
                        <Button 
                          colorScheme="green" 
                          size="sm"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          {course.price ? 'Enroll Now' : 'Start Learning'}
                        </Button>
                      </Flex>
                    </Box>
                  </Box>
                ))}
              </SimpleGrid>

              <Box textAlign="center" mt={10}>
                <Button 
                  colorScheme="green" 
                  size="lg"
                  rightIcon={<FiArrowRight />}
                  onClick={() => navigate('/courses')}
                >
                  View All Courses
                </Button>
              </Box>
            </>
          )}
        </Container>
      </Box>

      {/* Stats Section */}
      <Box bg="gray.50" py={20}>
        <Container maxW="container.xl">
          {loading ? (
            <Flex justify="center" align="center" minH="200px">
              <Icon as={FiLoader} className="spin" fontSize="3xl" color="green.500" />
            </Flex>
          ) : error ? (
            <Text color="red.500" textAlign="center">{error}</Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} textAlign="center">
              <Box>
                <Heading size="2xl" color="green.500" mb={2}>
                  {stats.students.toLocaleString()}+
                </Heading>
                <Text fontSize="lg" color="gray.600">Students Enrolled</Text>
              </Box>
              <Box>
                <Heading size="2xl" color="green.500" mb={2}>
                  {stats.courses}+
                </Heading>
                <Text fontSize="lg" color="gray.600">Courses Available</Text>
              </Box>
              <Box>
                <Heading size="2xl" color="green.500" mb={2}>
                  {stats.successRate}%
                </Heading>
                <Text fontSize="lg" color="gray.600">Success Rate</Text>
              </Box>
            </SimpleGrid>
          )}
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={20}>
        <Container maxW="container.lg" textAlign="center">
          <Box
            bgGradient="linear(to-r, green.50, green.100)"
            p={12}
            borderRadius="xl"
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              top="-50px"
              right="-50px"
              w="200px"
              h="200px"
              bg="green.200"
              borderRadius="full"
              opacity="0.2"
            />
            <Box
              position="absolute"
              bottom="-80px"
              left="-80px"
              w="300px"
              h="300px"
              bg="green.300"
              borderRadius="full"
              opacity="0.1"
            />
            <Box position="relative" zIndex="1">
              <Heading as="h2" size="xl" mb={6}>
                Ready to start learning?
              </Heading>
              <Text fontSize="xl" mb={8} maxW="2xl" mx="auto" color="gray.700">
                Join thousands of students advancing their careers with our online courses.
              </Text>
              <Button
                as={RouterLink}
                to={currentUser ? (userRole === 'admin' ? '/admin/dashboard' : '/student/dashboard') : '/signup'}
                colorScheme="green"
                size="lg"
                rightIcon={<FiArrowRight />}
              >
                {currentUser ? 'Go to Dashboard' : 'Get Started for Free'}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
