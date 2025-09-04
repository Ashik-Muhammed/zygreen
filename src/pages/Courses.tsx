import { Box, Button, Container, Flex, Heading, Input, InputGroup, InputLeftElement, Select, SimpleGrid, Text, useDisclosure, useToast } from '@chakra-ui/react';
import { FiSearch, FiFilter, FiLoader } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseCard from '../components/courses/CourseCard';
import CourseFilterModal from '../components/courses/CourseFilterModal';
import { getAllDocuments } from '../services/apiService';
import { Course } from '../types';

const Courses = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const coursesData = await getAllDocuments('courses');
        setCourses(coursesData as Course[]);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
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

    fetchCourses();
  }, [toast]);

  const filteredCourses = courses.filter(course => 
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortBy === 'popular') return (b.enrolledStudents || 0) - (a.enrolledStudents || 0);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
    return 0;
  });

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="50vh">
        <FiLoader 
          size={48} 
          style={{
            animation: 'spin 1s linear infinite',
            display: 'inline-block'
          }} 
        />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={12}>
        <Text color="red.500" fontSize="xl">{error}</Text>
      </Box>
    );
  }

  return (
    <Box py={12}>
      <Container maxW="container.xl">
        <Box textAlign="center" mb={12}>
          <Text color="blue.500" fontWeight="semibold" mb={2}>COURSES</Text>
          <Heading as="h1" size="2xl" mb={4}>
            Explore Our Courses
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="2xl" mx="auto">
            Browse through our extensive collection of courses and start learning today.
          </Text>
        </Box>

        {/* Search and Filter Bar */}
        <Flex direction={{ base: 'column', md: 'row' }} gap={4} mb={8}>
          <InputGroup maxW="md">
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="white"
            />
          </InputGroup>
          
          <Flex gap={2}>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              maxW="200px"
              bg="white"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </Select>
            
            <Button leftIcon={<FiFilter />} onClick={onOpen}>
              Filters
            </Button>
          </Flex>
        </Flex>

        {/* Course Grid */}
        {sortedCourses.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
            {sortedCourses.map((course) => (
              <Box 
                key={course.id} 
                onClick={() => navigate(`/courses/${course.id}`)}
                cursor="pointer"
                _hover={{ transform: 'translateY(-4px)', transition: 'all 0.2s' }}
              >
                <CourseCard course={course} />
              </Box>
            ))}
          </SimpleGrid>
        ) : (
          <Box textAlign="center" py={12}>
            <Text fontSize="xl" color="gray.500">
              {searchQuery ? 'No courses found matching your search. Try different keywords.' : 'No courses available at the moment.'}
            </Text>
          </Box>
        )}
      </Container>

      {/* Filter Modal */}
      <CourseFilterModal isOpen={isOpen} onClose={onClose} />
    </Box>
  );
};

export default Courses;
