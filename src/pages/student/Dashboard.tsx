import { Box, Button, Flex, Grid, GridItem, Heading, SimpleGrid, Stat, StatLabel, StatNumber, Text, useColorModeValue, Skeleton, Alert, AlertIcon } from '@chakra-ui/react';
import { FiBookOpen, FiAward, FiClock, FiCalendar, FiArrowRight, FiCheckCircle, FiBarChart2, FiHelpCircle } from 'react-icons/fi';
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

// Enhanced Deadline card component with visual indicators
const DeadlineCard = ({ deadline }: { deadline: any }) => {
  // Calculate days remaining and determine urgency
  const dueDate = new Date(deadline.dueDate);
  const today = new Date();
  const timeDiff = dueDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  let status = 'normal';
  let statusColor = 'gray';
  
  if (daysRemaining < 0) {
    status = 'Overdue';
    statusColor = 'red';
  } else if (daysRemaining === 0) {
    status = 'Due Today';
    statusColor = 'orange';
  } else if (daysRemaining === 1) {
    status = 'Tomorrow';
    statusColor = 'orange';
  } else if (daysRemaining <= 3) {
    status = `In ${daysRemaining} days`;
    statusColor = 'yellow';
  } else {
    status = `In ${daysRemaining} days`;
    statusColor = 'green';
  }
  
  const isUrgent = ['red', 'orange'].includes(statusColor);
  
  return (
    <Box 
      p={4}
      mb={3}
      borderRadius="lg"
      border="1px"
      borderLeft={isUrgent ? `4px solid` : '1px'}
      borderLeftColor={isUrgent ? `${statusColor}.500` : 'transparent'}
      borderColor={isUrgent ? `${statusColor}.100` : 'gray.100'}
      bg={isUrgent ? `${statusColor}.50` : 'white'}
      transition="all 0.2s ease"
      _hover={{
        transform: 'translateX(2px)',
        boxShadow: 'sm',
        borderColor: isUrgent ? `${statusColor}.200` : 'gray.200'
      }}
    >
      <Flex justify="space-between" align="flex-start">
        <Box flex={1} minW={0}>
          <Flex align="center" mb={1}>
            <Box
              w="8px"
              h="8px"
              borderRadius="full"
              bg={`${statusColor}.500`}
              mr={2}
              flexShrink={0}
            />
            <Text 
              fontSize="xs" 
              fontWeight="semibold" 
              color={`${statusColor}.600`}
              textTransform="uppercase"
              letterSpacing="wide"
            >
              {status}
            </Text>
          </Flex>
          <Text 
            fontWeight="medium" 
            noOfLines={1}
            mb={1}
            color={isUrgent ? 'gray.800' : 'gray.700'}
          >
            {deadline.title}
          </Text>
          <Text fontSize="sm" color="gray.500" noOfLines={1}>
            {deadline.courseName || 'No course specified'}
          </Text>
        </Box>
        <Box textAlign="right" ml={3} flexShrink={0}>
          <Text 
            fontSize="xs" 
            color="gray.500"
            whiteSpace="nowrap"
          >
            {dueDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
          <Text 
            fontSize="xs" 
            color="gray.400"
            whiteSpace="nowrap"
          >
            {dueDate.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true
            })}
          </Text>
        </Box>
      </Flex>
      
      {/* Progress bar for assignments with progress */}
      {typeof deadline.progress !== 'undefined' && (
        <Box mt={3}>
          <Flex justify="space-between" mb={1}>
            <Text fontSize="xs" color="gray.500">
              Progress
            </Text>
            <Text fontSize="xs" color="gray.500">
              {Math.round(deadline.progress)}%
            </Text>
          </Flex>
          <Box 
            h="4px" 
            bg="gray.100" 
            borderRadius="full" 
            overflow="hidden"
          >
            <Box 
              h="100%" 
              bgGradient={`linear(to-r, ${statusColor}.400, ${statusColor}.600)`}
              borderRadius="full"
              width={`${deadline.progress}%`}
              transition="all 0.5s ease"
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

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

  // Stats data for the dashboard cards with improved structure
  const statsData = [
    { 
      label: 'Enrolled Courses', 
      value: stats?.enrolledCourses || 0, 
      icon: FiBookOpen, 
      color: 'blue',
      description: 'Active courses you\'re enrolled in',
      trend: stats?.enrolledCourses > 0 ? 'up' : 'none'
    },
    { 
      label: 'Completed', 
      value: stats?.completedCourses || 0, 
      icon: FiAward, 
      color: 'green',
      description: 'Courses completed successfully',
      trend: stats?.completedCourses > 0 ? 'up' : 'none'
    },
    { 
      label: 'Hours Spent', 
      value: `${stats?.hoursSpent || 0}h`, 
      icon: FiClock, 
      color: 'purple',
      description: 'Total learning time',
      trend: stats?.hoursSpent > 0 ? 'up' : 'none'
    },
    { 
      label: 'Learning Streak', 
      value: stats?.learningStreak || 0, 
      icon: FiCalendar, 
      color: 'orange',
      description: 'Consecutive days of learning',
      trend: stats?.learningStreak > 0 ? 'up' : 'none',
      unit: 'days'
    },
  ];
  
  // Calculate completion percentage
  const completionPercentage = stats?.enrolledCourses 
    ? Math.round((stats.completedCourses / stats.enrolledCourses) * 100) 
    : 0;

  if (loading) {
    return (
      <Box p={4}>
        <Skeleton height="40px" mb={6} />
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height="140px" borderRadius="xl" />
          ))}
        </SimpleGrid>
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

      {/* Enhanced Stats Grid */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6} mb={8}>
        {loading ? (
          Array(4).fill(0).map((_, index) => (
            <Skeleton key={index} height="140px" borderRadius="xl" />
          ))
        ) : (
          statsData.map((stat, index) => (
            <Box 
              key={index}
              bg={cardBg}
              p={6}
              borderRadius="xl"
              border="1px"
              borderColor={borderColor}
              boxShadow="sm"
              position="relative"
              overflow="hidden"
              transition="all 0.3s ease"
              _hover={{
                transform: 'translateY(-4px)',
                boxShadow: 'lg',
                '& .stat-icon': {
                  transform: 'scale(1.1)'
                }
              }}
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                bg: `${stat.color}.500`,
                opacity: 0.8
              }}
            >
              <Stat>
                <Flex align="center">
                  <Box
                    className="stat-icon"
                    p={3}
                    bg={`${stat.color}.50`}
                    color={`${stat.color}.600`}
                    borderRadius="xl"
                    mr={4}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    transition="all 0.3s ease"
                    boxShadow="md"
                  >
                    <stat.icon size={22} />
                  </Box>
                  <Box>
                    <StatLabel color="gray.500" fontSize="sm" fontWeight="medium">
                      {stat.label}
                    </StatLabel>
                    <StatNumber fontSize="2xl" fontWeight="bold" mb={1}>
                      {stat.value}
                      {stat.unit && (
                        <Text as="span" fontSize="md" color="gray.500" ml={1}>
                          {stat.unit}
                        </Text>
                      )}
                    </StatNumber>
                    <Text fontSize="xs" color="gray.500">
                      {stat.description}
                    </Text>
                  </Box>
                </Flex>
              </Stat>
            </Box>
          ))
        )}
      </SimpleGrid>
      
      {/* Progress Overview */}
      <Box 
        bg={cardBg}
        p={6}
        borderRadius="xl"
        border="1px"
        borderColor={borderColor}
        boxShadow="sm"
        mb={8}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Box>
            <Text fontSize="lg" fontWeight="semibold">Learning Progress</Text>
            <Text fontSize="sm" color="gray.500">Your overall course completion</Text>
          </Box>
          <Text fontSize="lg" fontWeight="bold" color="blue.500">
            {completionPercentage}%
          </Text>
        </Flex>
        <Box 
          h="8px" 
          bg="gray.100" 
          borderRadius="full" 
          overflow="hidden"
          mb={2}
        >
          <Box 
            h="100%" 
            bgGradient="linear(to-r, blue.400, blue.600)" 
            borderRadius="full"
            width={`${completionPercentage}%`}
            transition="all 0.5s ease"
          />
        </Box>
        <Flex justify="space-between" fontSize="xs" color="gray.500">
          <Text>0%</Text>
          <Text>50%</Text>
          <Text>100%</Text>
        </Flex>
      </Box>

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        {/* Left Column */}
        <GridItem>
          {/* Enhanced Continue Learning Section */}
          <Box 
            bg={cardBg}
            p={6}
            borderRadius="xl"
            border="1px"
            borderColor={borderColor}
            boxShadow="sm"
            mb={6}
          >
            <Flex justify="space-between" align="center" mb={6}>
              <Box>
                <Heading as="h2" size="lg" mb={1}>Continue Learning</Heading>
                <Text color="gray.500" fontSize="sm">Pick up where you left off</Text>
              </Box>
              <Button 
                as={RouterLink} 
                to="/student/courses" 
                variant="ghost" 
                size="sm"
                colorScheme="blue"
                rightIcon={<FiArrowRight />}
                isDisabled={loading || !recentCourses?.length}
              >
                View All
              </Button>
            </Flex>

            {loading ? (
              // Loading skeleton for recent courses
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {[1, 2].map((i) => (
                  <Skeleton key={i} height="180px" borderRadius="xl" />
                ))}
              </SimpleGrid>
            ) : recentCourses && recentCourses.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {recentCourses.map((course) => {
                  const progress = Math.min(100, Math.max(0, course.progress || 0));
                  const courseColor = 'blue'; // You can make this dynamic based on course data
                  
                  return (
                    <Box 
                      key={course.id}
                      p={5}
                      border="1px"
                      borderColor="gray.100"
                      borderRadius="xl"
                      bg="white"
                      transition="all 0.3s ease"
                      _hover={{
                        transform: 'translateY(-2px)',
                        boxShadow: 'lg',
                        borderColor: `${courseColor}.200`
                      }}
                      as={RouterLink}
                      to={`/student/courses/${course.id}/learn`}
                      textDecoration="none"
                    >
                      <Flex mb={3} align="center">
                        <Box 
                          w="48px" 
                          h="48px" 
                          bg={`${courseColor}.50`} 
                          borderRadius="lg"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          mr={3}
                          flexShrink={0}
                        >
                          <FiBookOpen size={22} color={`var(--chakra-colors-${courseColor}-500)`} />
                        </Box>
                        <Box flex={1} minW={0}>
                          <Text 
                            fontWeight="semibold" 
                            noOfLines={1} 
                            mb={1}
                            color="gray.800"
                          >
                            {course.title}
                          </Text>
                          <Text 
                            fontSize="sm" 
                            color="gray.500" 
                            noOfLines={1}
                          >
                            {course.instructor || 'Instructor'}
                          </Text>
                        </Box>
                      </Flex>
                      
                      {/* Progress Bar */}
                      <Box mb={4}>
                        <Flex justify="space-between" mb={1}>
                          <Text fontSize="xs" fontWeight="medium" color="gray.600">
                            Progress
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {progress}%
                          </Text>
                        </Flex>
                        <Box 
                          h="6px" 
                          bg="gray.100" 
                          borderRadius="full" 
                          overflow="hidden"
                        >
                          <Box 
                            h="100%" 
                            bgGradient={`linear(to-r, ${courseColor}.400, ${courseColor}.600)`}
                            borderRadius="full"
                            width={`${progress}%`}
                            transition="all 0.5s ease"
                          />
                        </Box>
                      </Box>
                      
                      <Flex justify="space-between" align="center" mt={4}>
                        <Box>
                          <Text fontSize="xs" color="gray.600" fontWeight="medium">
                            Next: 
                            <Text as="span" fontWeight="normal" color="gray.500" ml={1}>
                              {course.nextLesson || 'Not specified'}
                            </Text>
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            Last accessed: {course.lastAccessed || 'Never'}
                          </Text>
                        </Box>
                        <Button 
                          size="sm"
                          colorScheme={courseColor}
                          variant={progress >= 100 ? 'outline' : 'solid'}
                          rightIcon={progress >= 100 ? <FiAward /> : <FiArrowRight />}
                          onClick={(e) => e.preventDefault()}
                        >
                          {progress >= 100 ? 'View Certificate' : 'Continue'}
                        </Button>
                      </Flex>
                    </Box>
                  );
                })}
              </SimpleGrid>
            ) : (
              <Box 
                textAlign="center" 
                py={10} 
                px={4} 
                bg="gray.50" 
                borderRadius="xl"
                border="1px dashed"
                borderColor="gray.200"
              >
                <Box 
                  as={FiBookOpen} 
                  size="32px" 
                  color="blue.400" 
                  mb={3} 
                  display="inline-block"
                />
                <Text fontWeight="medium" mb={1} fontSize="lg">No active courses</Text>
                <Text color="gray.500" mb={4} maxW="md" mx="auto">
                  You haven't started any courses yet. Explore our catalog and begin your learning journey!
                </Text>
                <Button 
                  as={RouterLink}
                  to="/courses"
                  colorScheme="blue"
                  size="sm"
                >
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
            
            {/* Enhanced Upcoming Deadlines Section */}
            <Box mt={8}>
              <Flex justify="space-between" align="center" mb={4}>
                <Box>
                  <Heading as="h3" size="md" mb={1}>Upcoming Deadlines</Heading>
                  <Text color="gray.500" fontSize="sm">Stay on top of your assignments</Text>
                </Box>
                {upcomingDeadlines?.length > 0 && (
                  <Button 
                    as={RouterLink}
                    to="/student/assignments"
                    variant="ghost"
                    size="xs"
                    colorScheme="blue"
                    rightIcon={<FiArrowRight size={14} />}
                  >
                    View All
                  </Button>
                )}
              </Flex>
              
              {loading ? (
                // Enhanced loading skeleton
                <Box>
                  {[1, 2, 3].map((i) => (
                    <Skeleton 
                      key={i} 
                      height="100px" 
                      mb={3} 
                      borderRadius="lg" 
                      startColor="gray.50" 
                      endColor="gray.100"
                    />
                  ))}
                </Box>
              ) : upcomingDeadlines && upcomingDeadlines.length > 0 ? (
                <Box>
                  {upcomingDeadlines.slice(0, 5).map(deadline => (
                    <DeadlineCard key={deadline.id} deadline={deadline} />
                  ))}
                  
                  {upcomingDeadlines.length > 5 && (
                    <Button 
                      as={RouterLink}
                      to="/student/assignments"
                      size="sm"
                      variant="ghost"
                      colorScheme="blue"
                      w="full"
                      mt={2}
                    >
                      View All Deadlines ({upcomingDeadlines.length - 5} more)
                    </Button>
                  )}
                </Box>
              ) : (
                <Box 
                  textAlign="center" 
                  py={8} 
                  px={4} 
                  bg="gray.50" 
                  borderRadius="xl"
                  border="1px dashed"
                  borderColor="gray.200"
                >
                  <Box 
                    as={FiCheckCircle} 
                    size="32px" 
                    color="green.400" 
                    mb={3} 
                    display="inline-block"
                  />
                  <Text fontWeight="medium" mb={1} fontSize="lg">All caught up!</Text>
                  <Text color="gray.500" mb={4} maxW="md" mx="auto">
                    You don't have any upcoming deadlines. Enjoy your free time!
                  </Text>
                  <Button 
                    as={RouterLink}
                    to="/student/courses"
                    colorScheme="green"
                    size="sm"
                    variant="outline"
                  >
                    Explore Courses
                  </Button>
                </Box>
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

          {/* Enhanced Quick Actions */}
          <Box 
            bg={cardBg}
            p={6}
            borderRadius="xl"
            border="1px"
            borderColor={borderColor}
            boxShadow="sm"
          >
            <Flex justify="space-between" align="center" mb={6}>
              <Box>
                <Heading as="h2" size="lg" mb={1}>Quick Actions</Heading>
                <Text color="gray.500" fontSize="sm">Frequently used actions</Text>
              </Box>
            </Flex>
            
            <SimpleGrid columns={2} spacing={3}>
              {/* Continue Learning Action */}
              <Button 
                as={RouterLink}
                to="/student/courses"
                variant="outline" 
                height="auto"
                p={3}
                textAlign="left"
                borderColor="gray.200"
                _hover={{
                  borderColor: 'blue.300',
                  bg: 'blue.50',
                  transform: 'translateY(-2px)',
                  boxShadow: 'sm'
                }}
                transition="all 0.2s"
              >
                <Box flex={1}>
                  <Box 
                    w="40px" 
                    h="40px" 
                    bg="blue.100" 
                    borderRadius="lg" 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center"
                    mb={2}
                    color="blue.600"
                  >
                    <FiBookOpen size={20} />
                  </Box>
                  <Text fontWeight="medium" fontSize="sm">Continue Learning</Text>
                  <Text fontSize="xs" color="gray.500" noOfLines={2}>
                    Pick up where you left off
                  </Text>
                </Box>
              </Button>
              
              {/* Certificates Action */}
              <Button 
                as={RouterLink}
                to="/student/certificates"
                variant="outline" 
                height="auto"
                p={3}
                textAlign="left"
                borderColor="gray.200"
                _hover={{
                  borderColor: 'green.300',
                  bg: 'green.50',
                  transform: 'translateY(-2px)',
                  boxShadow: 'sm'
                }}
                transition="all 0.2s"
              >
                <Box flex={1}>
                  <Box 
                    w="40px" 
                    h="40px" 
                    bg="green.100" 
                    borderRadius="lg" 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center"
                    mb={2}
                    color="green.600"
                  >
                    <FiAward size={20} />
                  </Box>
                  <Text fontWeight="medium" fontSize="sm">My Certificates</Text>
                  <Text fontSize="xs" color="gray.500" noOfLines={2}>
                    View and download your certificates
                  </Text>
                </Box>
              </Button>
              
              {/* Assignments Action */}
              <Button 
                as={RouterLink}
                to="/student/assignments"
                variant="outline" 
                height="auto"
                p={3}
                textAlign="left"
                borderColor="gray.200"
                _hover={{
                  borderColor: 'purple.300',
                  bg: 'purple.50',
                  transform: 'translateY(-2px)',
                  boxShadow: 'sm'
                }}
                transition="all 0.2s"
              >
                <Box flex={1}>
                  <Box 
                    w="40px" 
                    h="40px" 
                    bg="purple.100" 
                    borderRadius="lg" 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center"
                    mb={2}
                    color="purple.600"
                  >
                    <FiCalendar size={20} />
                  </Box>
                  <Text fontWeight="medium" fontSize="sm">My Assignments</Text>
                  <Text fontSize="xs" color="gray.500" noOfLines={2}>
                    View and submit assignments
                  </Text>
                </Box>
              </Button>
              
              {/* Progress Action */}
              <Button 
                as={RouterLink}
                to="/student/progress"
                variant="outline" 
                height="auto"
                p={3}
                textAlign="left"
                borderColor="gray.200"
                _hover={{
                  borderColor: 'orange.300',
                  bg: 'orange.50',
                  transform: 'translateY(-2px)',
                  boxShadow: 'sm'
                }}
                transition="all 0.2s"
              >
                <Box flex={1}>
                  <Box 
                    w="40px" 
                    h="40px" 
                    bg="orange.100" 
                    borderRadius="lg" 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center"
                    mb={2}
                    color="orange.600"
                  >
                    <FiBarChart2 size={20} />
                  </Box>
                  <Text fontWeight="medium" fontSize="sm">My Progress</Text>
                  <Text fontSize="xs" color="gray.500" noOfLines={2}>
                    Track your learning journey
                  </Text>
                </Box>
              </Button>
              
              {/* Help & Support Action */}
              <Button 
                as={RouterLink}
                to="/support"
                variant="outline" 
                height="auto"
                p={3}
                textAlign="left"
                borderColor="gray.200"
                _hover={{
                  borderColor: 'red.300',
                  bg: 'red.50',
                  transform: 'translateY(-2px)',
                  boxShadow: 'sm'
                }}
                transition="all 0.2s"
                gridColumn={{ base: '1 / -1', md: 'auto' }}
              >
                <Box flex={1}>
                  <Box 
                    w="40px" 
                    h="40px" 
                    bg="red.100" 
                    borderRadius="lg" 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center"
                    mb={2}
                    color="red.600"
                  >
                    <FiHelpCircle size={20} />
                  </Box>
                  <Text fontWeight="medium" fontSize="sm">Help & Support</Text>
                  <Text fontSize="xs" color="gray.500" noOfLines={2}>
                    Get help with any issues
                  </Text>
                </Box>
              </Button>
            </SimpleGrid>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default StudentDashboard;
