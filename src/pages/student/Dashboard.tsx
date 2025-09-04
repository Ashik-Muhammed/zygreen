import { Box, Button, Flex, Grid, GridItem, Heading, SimpleGrid, Stat, StatLabel, StatNumber, Text, useColorModeValue, Skeleton, Alert, AlertIcon } from '@chakra-ui/react';
import { FiBookOpen, FiAward, FiClock, FiCalendar, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import useStudentDashboard from '../../hooks/useStudentDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';

// Debug: Log environment variables
console.log('Firebase Config:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '***' : 'missing',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'default',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'default'
});

// Skeleton component for loading state
const DeadlineCardSkeleton = () => (
  <Box p={4} bg="white" borderRadius="md" borderWidth="1px" mb={3}>
    <Skeleton height="20px" width="60%" mb={2} />
    <Skeleton height="16px" width="80%" mb={3} />
    <Skeleton height="12px" width="40%" />
  </Box>
);

// Empty state component
const EmptyState = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <Box textAlign="center" py={8} px={4} bg="gray.50" borderRadius="md">
    <Box as={Icon} size="24px" color="gray.400" mb={3} display="inline-block" />
    <Text fontWeight="medium" mb={1}>{title}</Text>
    <Text color="gray.500" fontSize="sm">{description}</Text>
  </Box>
);

// Deadline card component
const DeadlineCard = ({ deadline }: { deadline: any }) => (
  <Box p={4} bg="white" borderRadius="md" borderWidth="1px" mb={3}>
    <Text fontWeight="medium" mb={1}>{deadline.title}</Text>
    <Text color="gray.500" fontSize="sm" mb={2}>{deadline.course}</Text>
    <Text fontSize="xs" color={deadline.daysLeft <= 1 ? 'red.500' : 'gray.500'}>
      Due {deadline.daysLeft <= 1 ? 'today' : `in ${deadline.daysLeft} days`}
    </Text>
  </Box>
);

const StudentDashboard = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const { currentUser } = useAuth();
  const {
    stats,
    recentCourses = [],
    upcomingDeadlines = [],
    loading,
    error,
    userName,
    refresh
  } = useStudentDashboard();

  // Debug logging
  useEffect(() => {
    console.log('Current User:', currentUser);
    console.log('Dashboard loading:', loading);
    console.log('Dashboard error:', error);
  }, [currentUser, loading, error]);
  
  // Log state for debugging
  useEffect(() => {
    console.log('Dashboard state:', {
      loading,
      error,
      userName,
      stats,
      recentCoursesCount: recentCourses?.length,
      upcomingDeadlinesCount: upcomingDeadlines?.length
    });
  }, [loading, error, userName, stats, recentCourses, upcomingDeadlines]);

  // Stats data for the dashboard cards
  const statsData = [
    { label: 'Enrolled Courses', value: stats?.enrolledCourses || 0, icon: FiBookOpen, color: 'blue.500' },
    { label: 'Completed Courses', value: stats?.completedCourses || 0, icon: FiAward, color: 'green.500' },
    { label: 'Hours Spent', value: stats?.hoursSpent || 0, icon: FiClock, color: 'purple.500' },
    { label: 'Learning Streak', value: stats?.learningStreak || 0, icon: FiCalendar, color: 'orange.500' },
  ];

  if (loading) {
    return (
      <Box p={4}>
        <Skeleton height="40px" mb={6} />
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height="100px" borderRadius="md" />
          ))}
        </SimpleGrid>
        <Skeleton height="300px" mb={6} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Failed to load dashboard data</Text>
            <Text fontSize="sm" mt={1}>{error}</Text>
          </Box>
        </Alert>
        <Button 
          colorScheme="blue" 
          onClick={() => refresh()}
          isLoading={loading}
          leftIcon={<FiCheckCircle />}
        >
          Try Again
        </Button>
        
        <Box mt={6} p={4} bg="gray.50" borderRadius="md">
          <Text fontWeight="medium" mb={2}>Troubleshooting steps:</Text>
          <Text fontSize="sm" mb={2}>1. Check your internet connection</Text>
          <Text fontSize="sm" mb={2}>2. Make sure you're logged in</Text>
          <Text fontSize="sm">3. If the problem persists, contact support</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Box mb={8}>
        <Heading as="h1" size="xl" mb={2}>
          Welcome back, {userName || 'Student'}!
        </Heading>
        <Text color="gray.600">Here's what's happening with your learning today.</Text>
      </Box>

      {/* Stats Grid */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6} mb={8}>
        {loading ? (
          // Loading skeleton for stats
          Array(4).fill(0).map((_, index) => (
            <Skeleton key={index} height="110px" borderRadius="lg" />
          ))
        ) : (
          statsData.map((stat, index) => (
          <Box 
            key={index}
            bg={cardBg}
            p={6}
            borderRadius="lg"
            border="1px"
            borderColor={borderColor}
            boxShadow="sm"
          >
            <Stat>
              <Flex>
                <Box
                  p={2}
                  bg={`${stat.color}10`}
                  color={stat.color}
                  borderRadius="full"
                  mr={4}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <stat.icon size={20} />
                </Box>
                <Box>
                  <StatLabel color="gray.500" fontSize="sm">
                    {stat.label}
                  </StatLabel>
                  <StatNumber fontSize="2xl">{stat.value}</StatNumber>
                </Box>
              </Flex>
            </Stat>
          </Box>
          ))
        )}
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        {/* Left Column */}
        <GridItem>
          {/* Continue Learning */}
          <Box 
            bg={cardBg}
            p={6}
            borderRadius="lg"
            border="1px"
            borderColor={borderColor}
            boxShadow="sm"
            mb={6}
          >
            <Flex justify="space-between" align="center" mb={6}>
              <Heading as="h2" size="md">Continue Learning</Heading>
              <Button 
                as={RouterLink} 
                to="/student/courses" 
                variant="ghost" 
                rightIcon={<FiArrowRight />}
                colorScheme="blue"
                isDisabled={loading || !recentCourses?.length}
              >
                View All
              </Button>
            </Flex>

            {loading ? (
              // Loading skeleton for recent courses
              <Box>
                {[1, 2].map((i) => (
                  <Skeleton key={i} height="100px" mb={4} borderRadius="md" />
                ))}
              </Box>
            ) : recentCourses && recentCourses.length > 0 ? (
              <SimpleGrid columns={1} spacing={4}>
                {recentCourses.map((course) => (
                  <Box 
                    key={course.id}
                    p={4}
                    border="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    _hover={{
                      borderColor: 'blue.300',
                      boxShadow: 'sm',
                      cursor: 'pointer'
                    }}
                    as={RouterLink}
                    to={`/student/courses/${course.id}/learn`}
                  >
                    <Flex direction="column">
                      <Text fontSize="lg" fontWeight="medium" mb={1}>
                        {course.title}
                      </Text>
                        <Box h="6px" bg="gray.100" borderRadius="full" overflow="hidden" mb={2} mt={2}>
                        <Box 
                          h="100%" 
                          bg="blue.500" 
                          borderRadius="full" 
                          width={`${course.progress}%`}
                        />
                      </Box>
                      <Text fontSize="sm" color="gray.500" noOfLines={1} mb={1}>
                        Next: {course.nextLesson}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Last accessed: {course.lastAccessed}
                      </Text>
                    </Flex>
                  </Box>
                ))}
              </SimpleGrid>
            ) : (
              <Box textAlign="center" py={8}>
                <Text color="gray.500" mb={4}>You haven't started any courses yet.</Text>
                <Button as={RouterLink} to="/courses" colorScheme="blue">
                  Browse Courses
                </Button>
              </Box>
            )}
          </Box>

          {/* Recommended Courses */}
          <Box 
            bg={cardBg}
            p={6}
            borderRadius="lg"
            border="1px"
            borderColor={borderColor}
            boxShadow="sm"
          >
            <Flex justify="space-between" align="center" mb={6}>
              <Heading as="h2" size="md">Recommended For You</Heading>
              <Button 
                as={RouterLink} 
                to="/courses" 
                variant="ghost" 
                colorScheme="blue" 
                size="sm"
                rightIcon={<FiArrowRight />}
              >
                View All
              </Button>
            </Flex>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {[1, 2].map((item) => (
                <Box 
                  key={item}
                  border="1px"
                  borderColor={borderColor}
                  borderRadius="md"
                  overflow="hidden"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'md',
                    transition: 'all 0.2s',
                  }}
                  as={RouterLink}
                  to="/courses/1"
                >
                  <Box h="120px" bg="gray.200" />
                  <Box p={4}>
                    <Text fontWeight="medium" mb={1}>Course Title {item}</Text>
                    <Text fontSize="sm" color="gray.500" noOfLines={2} mb={2}>
                      Brief description of the course content and what you'll learn.
                    </Text>
                    <Text fontSize="sm" color="blue.500" fontWeight="medium">
                      Start Learning
                    </Text>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
            
            {/* Upcoming Deadlines Section */}
            <Box mt={8}>
              <Heading as="h3" size="sm" mb={4}>Upcoming Deadlines</Heading>
              {loading ? (
                Array(3).fill(0).map((_, i) => <DeadlineCardSkeleton key={i} />)
              ) : upcomingDeadlines && upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map(deadline => (
                  <DeadlineCard key={deadline.id} deadline={deadline} />
                ))
              ) : (
                <EmptyState 
                  icon={FiCheckCircle}
                  title="No upcoming deadlines"
                  description="You're all caught up!"
                />
              )}
            </Box>
          </Box>
        </GridItem>
        
        {/* Right Column */}
        <GridItem>
          {/* Learning Goals Section */}
          <Box 
            bg={cardBg} 
            p={6} 
            borderRadius="lg" 
            boxShadow="sm"
            mb={6}
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Heading as="h2" size="md" mb={6}>Learning Goals</Heading>
            <Box mb={4}>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="sm" fontWeight="medium">Weekly Learning Target</Text>
                <Text fontSize="sm" color="gray.500">3/5 hours</Text>
              </Flex>
              <Box h="8px" bg="gray.100" borderRadius="full" overflow="hidden">
                <Box h="100%" bg="green.500" borderRadius="full" width="60%" />
              </Box>
            </Box>

            <Box mb={4}>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="sm" fontWeight="medium">Course Completion</Text>
                <Text fontSize="sm" color="gray.500">40%</Text>
              </Flex>
              <Box h="8px" bg="gray.100" borderRadius="full" overflow="hidden">
                <Box h="100%" bg="blue.500" borderRadius="full" width="40%" />
              </Box>
            </Box>

            <Button size="sm" w="full" mt={4} variant="outline" colorScheme="blue">
              Set New Goals
            </Button>
          </Box>

          {/* Quick Actions */}
          <Box 
            bg={cardBg}
            p={6}
            borderRadius="lg"
            border="1px"
            borderColor={borderColor}
            boxShadow="sm"
          >
            <Heading as="h2" size="md" mb={6}>Quick Actions</Heading>
            
            <SimpleGrid columns={2} spacing={3}>
              <Button 
                as={RouterLink} 
                to="/student/certificates" 
                variant="outline" 
                size="sm"
                leftIcon={<FiAward />}
              >
                Certificates
              </Button>
              <Button 
                as={RouterLink} 
                to="/student/profile" 
                variant="outline" 
                size="sm"
                leftIcon={<FiBookOpen />}
              >
                My Profile
              </Button>
              <Button 
                as={RouterLink} 
                to="/student/settings" 
                variant="outline" 
                size="sm"
                leftIcon={<FiCalendar />}
              >
                Schedule
              </Button>
              <Button 
                as={RouterLink} 
                to="/student/help" 
                variant="outline" 
                size="sm"
                leftIcon={<FiClock />}
              >
                Help Center
              </Button>
            </SimpleGrid>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default StudentDashboard;
