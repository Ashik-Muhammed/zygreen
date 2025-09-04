import { Box, Button, Flex, Grid, GridItem, Heading, SimpleGrid, Text, useColorModeValue, Table, Thead, Tbody, Tr, Th, Td, Badge, Avatar, Menu, MenuButton, MenuList, MenuItem, IconButton, HStack, VStack, Skeleton, useToast } from '@chakra-ui/react';
import { FiStar, FiUsers, FiBook, FiDollarSign, FiBarChart2, FiMoreVertical, FiArrowUp, FiArrowDown, FiEye, FiRefreshCw } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getDashboardStats } from '../../services/apiService';

interface Enrollment {
  id: string;
  student: string;
  email: string;
  course: string;
  date: string;
  status: 'active' | 'pending' | 'completed';
  avatar?: string;
}

interface Course {
  id: string;
  title: string;
  students: number;
  rating: number;
  status: 'published' | 'draft' | 'archived';
}

interface Activity {
  id: string;
  type: 'enrollment' | 'course_created' | 'course_updated' | 'user_registered' | 'certificate_issued';
  title: string;
  description: string;
  timestamp: Date;
  userName: string;
  metadata?: Record<string, any>;
}

interface DashboardData {
  totalStudents: number;
  totalCourses: number;
  totalRevenue: number;
  completionRate: number;
  recentActivities: Activity[];
  recentEnrollments: Enrollment[];
  recentCourses: Course[];
}

const AdminDashboard = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const [isLoading, setIsLoading] = useState(true);
  const [statsData, setStatsData] = useState<DashboardData>({
    totalStudents: 0,
    totalCourses: 0,
    totalRevenue: 0,
    completionRate: 0,
    recentActivities: [],
    recentEnrollments: [],
    recentCourses: []
  });
  const toast = useToast();

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await getDashboardStats();
      setStatsData({
        totalStudents: data.totalStudents || 0,
        totalCourses: data.totalCourses || 0,
        totalRevenue: data.totalRevenue || 0,
        completionRate: data.completionRate || 0,
        recentActivities: data.recentActivities || [],
        recentEnrollments: data.recentEnrollments || [],
        recentCourses: data.recentCourses || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = [
    { 
      label: 'Total Students', 
      value: statsData.totalStudents.toLocaleString(), 
      change: '+0%', 
      isPositive: true, 
      icon: FiUsers, 
      color: 'blue.500' 
    },
    { 
      label: 'Total Courses', 
      value: statsData.totalCourses.toString(), 
      change: '+0%', 
      isPositive: true, 
      icon: FiBook, 
      color: 'green.500' 
    },
    { 
      label: 'Total Revenue', 
      value: `$${statsData.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 
      change: '+0%', 
      isPositive: true, 
      icon: FiDollarSign, 
      color: 'purple.500' 
    },
    { 
      label: 'Completion Rate', 
      value: `${statsData.completionRate}%`, 
      change: '+0%', 
      isPositive: true, 
      icon: FiBarChart2, 
      color: 'orange.500' 
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading as="h1" size="xl" mb={2}>Dashboard</Heading>
          <Text color="gray.600">
            {isLoading ? (
              <Skeleton height="20px" width="300px" />
            ) : (
              `Welcome back, Admin! Here's what's happening with your platform. Last updated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`
            )}
          </Text>
        </Box>
        <Button 
          colorScheme="blue" 
          leftIcon={<FiRefreshCw />}
          onClick={fetchDashboardData}
          isLoading={isLoading}
        >
          Refresh Data
        </Button>
      </Flex>

      {/* Stats Grid */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6} mb={8}>
        {stats.map((stat, index) => (
          <Skeleton key={index} isLoaded={!isLoading} borderRadius="lg">
            <Box 
              bg={cardBg}
              p={6}
              borderRadius="lg"
              border="1px"
              borderColor={borderColor}
              boxShadow="sm"
              h="100%"
            >
              <HStack spacing={4} align="center">
                <Box
                  p={3}
                  bg={`${stat.color}20`}
                  color={stat.color}
                  borderRadius="full"
                >
                  <stat.icon size={24} />
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">{stat.label}</Text>
                  <HStack spacing={2} align="baseline">
                    <Text fontSize="2xl" fontWeight="bold">{stat.value}</Text>
                    <HStack
                      as="span"
                      color={stat.isPositive ? 'green.500' : 'red.500'}
                      fontSize="sm"
                      fontWeight="medium"
                    >
                      {stat.isPositive ? <FiArrowUp /> : <FiArrowDown />}
                      <span>{stat.change}</span>
                    </HStack>
                  </HStack>
                </Box>
              </HStack>
            </Box>
          </Skeleton>
        ))}
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6} mb={8}>
        {/* Left Column */}
        <GridItem>
          {/* Recent Enrollments */}
          <Box bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor} overflow="hidden" mb={6}>
            <Box p={6} borderBottom="1px" borderColor={borderColor}>
              <HStack justify="space-between" align="center">
              <Heading size="md">Recent Enrollments</Heading>
              <Button 
                size="sm" 
                variant="outline" 
                leftIcon={<FiRefreshCw size={14} />}
                onClick={fetchDashboardData}
                isLoading={isLoading}
                isDisabled={isLoading}
              >
                Refresh
              </Button>
            </HStack>
          </Box>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Student</Th>
                  <Th>Course</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {isLoading ? (
                  // Loading skeleton for enrollments
                  Array(3).fill(0).map((_, i) => (
                    <Tr key={`skeleton-${i}`}>
                      <Td><Skeleton height="40px" /></Td>
                      <Td><Skeleton height="20px" /></Td>
                      <Td><Skeleton height="20px" /></Td>
                      <Td><Skeleton height="20px" width="80px" /></Td>
                      <Td><Skeleton height="20px" width="40px" /></Td>
                    </Tr>
                  ))
                ) : statsData.recentEnrollments && statsData.recentEnrollments.length > 0 ? (
                  statsData.recentEnrollments.slice(0, 5).map((enrollment) => (
                    <Tr 
                      key={enrollment.id}
                      _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                      cursor="pointer"
                      onClick={() => {
                        // Navigate to enrollment details
                        // navigate(`/admin/enrollments/${enrollment.id}`);
                      }}
                    >
                      <Td>
                        <HStack>
                          <Avatar 
                            name={enrollment.student} 
                            size="sm" 
                            src={enrollment.avatar} 
                            bg={useColorModeValue('gray.200', 'gray.600')}
                          />
                          <Box>
                            <Text fontWeight="medium" isTruncated maxW="200px">
                              {enrollment.student}
                            </Text>
                            <Text fontSize="sm" color="gray.500" isTruncated maxW="200px">
                              {enrollment.email || 'No email'}
                            </Text>
                          </Box>
                        </HStack>
                      </Td>
                      <Td>
                        <Text isTruncated maxW="200px">
                          {enrollment.course}
                        </Text>
                      </Td>
                      <Td>
                        <Text whiteSpace="nowrap" fontSize="sm">
                          {enrollment.date}
                        </Text>
                      </Td>
                      <Td>
                        <Badge 
                          colorScheme={
                            enrollment.status === 'completed' ? 'green' : 
                            enrollment.status === 'active' ? 'blue' : 'yellow'
                          }
                            px={2}
                            py={1}
                            borderRadius="full"
                            textTransform="capitalize"
                            fontSize="xs"
                          >
                            {enrollment.status}
                          </Badge>
                        </Td>
                        <Td>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              aria-label="Options"
                              icon={<FiMoreVertical />}
                              variant="ghost"
                              size="sm"
                            />
                            <MenuList>
                              <MenuItem icon={<FiEye />}>
                                View Details
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={5} textAlign="center" py={6} color="gray.500">
                        No recent enrollments found
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
            <Box p={4} textAlign="center" borderTop="1px" borderColor={borderColor}>
              <Button variant="link" colorScheme="blue" as={RouterLink} to="/admin/enrollments">
                View All Enrollments
              </Button>
            </Box>
          </Box>
         </GridItem> 
          
        {/* Right Column */}
        <GridItem>
          <Box 
            bg={cardBg} 
            borderRadius="lg" 
            p={6} 
            borderWidth="1px" 
            borderColor={borderColor}
            height="100%"
          >
            <HStack justify="space-between" mb={6}>
              <Heading size="md">Recent Activities</Heading>
              <Button 
                size="sm" 
                variant="ghost" 
                leftIcon={<FiRefreshCw />}
                onClick={fetchDashboardData}
                isLoading={isLoading}
              >
                Refresh
              </Button>
            </HStack>
            <VStack align="stretch" spacing={4}>
              {isLoading ? (
                // Loading skeleton for activities
                Array(5).fill(0).map((_, i) => (
                  <Box key={`activity-skeleton-${i}`} p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                    <Skeleton height="16px" width="60%" mb={2} />
                    <Skeleton height="14px" width="40%" />
                  </Box>
                ))
              ) : statsData.recentActivities && statsData.recentActivities.length > 0 ? (
                statsData.recentActivities.map((activity) => (
                  <Box 
                    key={activity.id}
                    p={4} 
                    bg={useColorModeValue('gray.50', 'gray.700')} 
                    borderRadius="md"
                    borderLeftWidth="3px"
                    borderLeftColor={
                      activity.type === 'enrollment' ? 'blue.500' :
                      activity.type === 'course_created' ? 'green.500' :
                      activity.type === 'certificate_issued' ? 'purple.500' : 'gray.500'
                    }
                  >
                    <HStack justify="space-between" mb={1}>
                      <Text fontWeight="medium">{activity.title}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.500">
                      {activity.description}
                    </Text>
                    {activity.userName && (
                      <HStack mt={2}>
                        <Avatar 
                          name={activity.userName} 
                          size="xs"
                          bg={useColorModeValue('gray.200', 'gray.600')}
                        />
                        <Text fontSize="xs" color="gray.500">
                          {activity.userName}
                        </Text>
                      </HStack>
                    )}
                  </Box>
                ))
              ) : (
                <Box textAlign="center" py={6} color="gray.500">
                  No recent activities found
                </Box>
              )}
            </VStack>
          </Box>
        </GridItem>
      </Grid>

      {/* Recent Courses */}
      <Skeleton isLoaded={!isLoading} borderRadius="lg" h="100%">
        <Box bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor} h="100%">
          <Box p={6} borderBottom="1px" borderColor={borderColor}>
            <Heading size="md">Recent Courses</Heading>
          </Box>
          <Box p={6}>
        {statsData.recentCourses.length ? (
          <VStack spacing={4} align="stretch">
            {statsData.recentCourses.slice(0, 3).map((course) => (
              <Box
                key={course.id}
                p={4}
                border="1px"
                borderColor={borderColor}
                borderRadius="lg"
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'md',
                  transition: 'all 0.2s',
                }}
                as={RouterLink}
                to={`/admin/courses/${course.id}`}
              >
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="medium" isTruncated>{course.title || 'Untitled Course'}</Text>
                  <Badge
                    colorScheme={
                      course.status === 'published' ? 'green' :
                      course.status === 'draft' ? 'yellow' : 'gray'
                    }
                    textTransform="capitalize"
                    fontSize="xs"
                    px={2}
                    py={0.5}
                    borderRadius="full"
                  >
                    {course.status}
                  </Badge>
                </HStack>
                <HStack spacing={4} color="gray.500" fontSize="sm">
                  <HStack>
                    <FiUsers size={14} />
                    <span>{course.students.toLocaleString()}</span>
                  </HStack>
                  <HStack>
                    <FiStar size={14} />
                    <span>{course.rating.toFixed(1)}</span>
                  </HStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        ) : (
          <Text textAlign="center" color="gray.500">
            No recent courses found.
          </Text>
        )}
      </Box>
      <Box p={4} textAlign="center" borderTop="1px" borderColor={borderColor}>
        <Button variant="link" colorScheme="blue" as={RouterLink} to="/admin/courses">
          View All Courses
        </Button>
      </Box>
    </Box>
  </Skeleton>

      {/* Quick Actions */}
      <Box p={4}>
        <Box
          p={6}
          bg={cardBg}
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
          boxShadow="sm"
          mb={8}
        >
          <Heading as="h2" size="md" mb={6}>Quick Actions</Heading>
          
          <SimpleGrid columns={2} spacing={3}>
            <Button as={RouterLink} to="/admin/courses/create" size="sm" colorScheme="blue">
              Create Course
            </Button>
            <Button as={RouterLink} to="/admin/users" size="sm" variant="outline">
              Manage Users
            </Button>
            <Button as={RouterLink} to="/admin/settings" size="sm" variant="outline">
              Settings
            </Button>
            <Button as={RouterLink} to="/admin/support" size="sm" variant="outline">
              Support
            </Button>
          </SimpleGrid>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
