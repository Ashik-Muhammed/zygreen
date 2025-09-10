import { Box, Button, Flex, Grid, GridItem, Heading, SimpleGrid, Text, useColorModeValue, Table, Thead, Tbody, Tr, Th, Td, Badge, Avatar, Menu, MenuButton, MenuList, MenuItem, IconButton, HStack, VStack, Skeleton, useToast, Tabs, TabList, TabPanels, Tab, TabPanel, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Input, Select, Icon, Tag } from '@chakra-ui/react';
import { FiStar, FiUsers, FiBook, FiDollarSign, FiBarChart2, FiMoreVertical, FiArrowUp, FiArrowDown, FiEye, FiEyeOff, FiRefreshCw, FiUserPlus, FiEdit2, FiTrash2, FiPlus, FiHome, FiActivity } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { 
  getDashboardStats, 
  User, 
  getAllUsers, 
  getAllCourses
} from '../../services/apiService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

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

type ActivityType = 'enrollment_created' | 'course_created' | 'course_updated' | 'user_registered' | 'certificate_issued' | 'course_completed' | string;

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  formattedDescription?: string;
  timestamp: Date;
  userId: string;
  userName: string;
  metadata?: {
    courseId?: string;
    courseTitle?: string;
    [key: string]: any;
  };
}

// Extend the base Course interface with additional dashboard-specific fields
interface DashboardCourse {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  thumbnail?: string;  // Changed from thumbnailUrl to thumbnail
  thumbnailUrl?: string; // Keep for backward compatibility
  category?: string;
  enrolledStudents?: number; // Changed from studentsCount
  studentsCount?: number; // Keep for backward compatibility
  rating?: number;
  lastUpdated: Date;
  createdAt: Date;
  slug?: string;
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
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [tabIndex, setTabIndex] = useState(0);

  // Helper function to get color based on activity type
  const getActivityColor = (type: string): string => {
    switch(type) {
      case 'enrollment_created':
        return 'green';
      case 'course_completed':
        return 'blue';
      case 'certificate_issued':
        return 'purple';
      case 'user_registered':
        return 'orange';
      case 'course_created':
        return 'teal';
      default:
        return 'gray';
    }
  };

  // Format activity description based on type
  const formatActivityDescription = (activity: any) => {
    switch(activity.type) {
      case 'enrollment_created':
        return `${activity.userName || 'A user'} enrolled in ${activity.metadata?.courseTitle || 'a course'}`;
      case 'course_completed':
        return `${activity.userName || 'A user'} completed ${activity.metadata?.courseTitle || 'a course'}`;
      case 'certificate_issued':
        return `Certificate issued to ${activity.userName || 'a user'} for ${activity.metadata?.courseTitle || 'a course'}`;
      case 'user_registered':
        return `${activity.userName || 'A new user'} registered`;
      case 'course_created':
        return `New course created: ${activity.metadata?.courseTitle || 'Untitled Course'}`;
      default:
        return activity.description || 'Activity occurred';
    }
  };

  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [courseError, setCourseError] = useState<string | null>(null);
  
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
      
      // Transform activities to include formatted descriptions
      const activitiesWithFormattedDescriptions = data.recentActivities.map(activity => ({
        ...activity,
        formattedDescription: formatActivityDescription(activity)
      }));
      
      setStatsData({
        ...data,
        recentActivities: activitiesWithFormattedDescriptions
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard data',
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
    if (tabIndex === 1) { // Users tab
      fetchUsers();
    } else if (tabIndex === 2) { // Courses tab
      fetchCourses();
    }
  }, [tabIndex]);

  useEffect(() => {
    const results = users.filter(user => 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(results);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const userList = await getAllUsers();
      
      // Sort users by last login time (most recent first)
      const sortedUsers = [...userList].sort((a, b) => {
        const timeA = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
        const timeB = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
        return timeB - timeA;
      });
      
      setUsers(sortedUsers);
      setFilteredUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    onOpen();
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    
    try {
      // Update user in Firestore
      await updateDoc(doc(db, 'users', selectedUser.id), {
        displayName: selectedUser.displayName || '',
        role: selectedUser.role || 'user',
        updatedAt: new Date()
      });
      
      toast({
        title: 'User updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onClose();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        // Instead of deleting, we'll mark the user as inactive
        await updateDoc(doc(db, 'users', userId), {
          isActive: false,
          updatedAt: new Date()
        });
        
        toast({
          title: 'User deactivated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        await fetchUsers();
      } catch (error) {
        console.error('Error deactivating user:', error);
        toast({
          title: 'Error',
          description: 'Failed to deactivate user. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };
  
  const handleToggleUserStatus = async (user: User) => {
    try {
      await updateDoc(doc(db, 'users', user.id), {
        isActive: !user.isActive,
        updatedAt: new Date()
      });
      
      toast({
        title: `User ${!user.isActive ? 'activated' : 'deactivated'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      await fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

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

  const handleTabChange = (index: number) => {
    setTabIndex(index);
    // Load data when switching tabs
    if (index === 1 && users.length === 0) {
      fetchUsers();
    } else if (index === 2 && courses.length === 0) {
      fetchCourses();
    }
  };

  const fetchCourses = async () => {
    try {
      setIsLoadingCourses(true);
      setCourseError(null);
      const courseList = await getAllCourses();
      
      // Transform and sort courses by last updated date (newest first)
      const sortedCourses = courseList
        .map((course) => ({
          ...course,
          lastUpdated: course.updatedAt ? new Date(course.updatedAt as string | number | Date) : new Date()
        } as DashboardCourse))
        .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
      
      setCourses(sortedCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourseError('Failed to load courses. Please try again later.');
      toast({
        title: 'Error',
        description: 'Failed to load courses. Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingCourses(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading as="h1" size="xl" mb={2}>Dashboard</Heading>
        </Box>
        <HStack spacing={4}>
          <Button 
            as={RouterLink}
            to="/"
            leftIcon={<FiHome />}
            variant="outline"
            colorScheme="blue"
          >
            Back to Home
          </Button>
          <Button 
            leftIcon={<FiRefreshCw />} 
            onClick={() => {
              fetchDashboardData();
              fetchUsers();
            }}
            isLoading={isLoading || isLoadingUsers}
          >
            Refresh Data
          </Button>
        </HStack>
      </Flex>

      <Tabs variant="enclosed" colorScheme="blue" mt={6} index={tabIndex} onChange={handleTabChange}>
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Users ({users.length})</Tab>
          <Tab>Courses ({courses.length})</Tab>
        </TabList>

        <TabPanels>
          <TabPanel p={0} pt={6}>
            {/* Existing dashboard content */}

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
                            <Box>
                              <Text fontSize="sm" fontWeight="medium">
                                {activity.formattedDescription || activity.description}
                              </Text>
                              {activity.metadata?.courseTitle && (
                                <Text fontSize="xs" color="gray.500" mt={1}>
                                  Course: {activity.metadata.courseTitle}
                                </Text>
                              )}
                            </Box>
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
                              <Tag 
                                colorScheme={getActivityColor(activity.type)}
                                size="sm"
                                textTransform="capitalize"
                              >
                                {activity.type.replace(/_/g, ' ')}
                              </Tag>
                            </HStack>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Box 
                        p={6} 
                        borderWidth="1px" 
                        borderRadius="md" 
                        borderColor="gray.200"
                        textAlign="center"
                        bg="white"
                      >
                        <VStack spacing={4}>
                          <Icon as={FiActivity} boxSize={8} color="gray.400" />
                          <Text color="gray.600">No recent activities found</Text>
                          <Text fontSize="sm" color="gray.500">
                            Activities will appear here when users interact with the platform
                          </Text>
                          <Button 
                            leftIcon={<FiRefreshCw />} 
                            colorScheme="blue" 
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchDashboardData()}
                            isLoading={isLoading}
                          >
                            Refresh
                          </Button>
                        </VStack>
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
                  <Button as={RouterLink} to="/admin/support" size="sm" variant="outline">
                    Support
                  </Button>
                </SimpleGrid>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel p={0} pt={6}>
            <Box bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor} mb={6}>
              <Flex justify="space-between" align="center" mb={6}>
                <Heading size="md">User Management</Heading>
                <Button leftIcon={<FiUserPlus />} colorScheme="blue" size="sm">
                  Add User
                </Button>
              </Flex>
              
              <FormControl mb={6} maxW="md">
                <Input
                  placeholder="Search users by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </FormControl>

              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>User</Th>
                      <Th>Email</Th>
                      <Th>Role</Th>
                      <Th>Status</Th>
                      <Th>Joined</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {isLoadingUsers ? (
                      <Tr>
                        <Td colSpan={6} textAlign="center">
                          <Skeleton height="40px" />
                        </Td>
                      </Tr>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <Tr key={user.id}>
                          <Td>
                            <HStack>
                              <Avatar 
                                size="sm" 
                                name={user.displayName || user.email} 
                                src={user.photoURL} 
                                bg={useColorModeValue('gray.200', 'gray.600')}
                              />
                              <Box>
                                <Text fontWeight="medium">{user.displayName || 'No Name'}</Text>
                                <Text fontSize="sm" color="gray.500">ID: {user.id.substring(0, 6)}...</Text>
                              </Box>
                            </HStack>
                          </Td>
                          <Td>{user.email}</Td>
                          <Td>
                            <Badge colorScheme={user.role === 'admin' ? 'purple' : 'blue'}>
                              {user.role || 'user'}
                            </Badge>
                          </Td>
                          <Td>
                            <Menu>
                              <MenuButton 
                                as={Button} 
                                size="xs" 
                                variant="ghost"
                                colorScheme={user.isActive ? 'green' : 'red'}
                                rightIcon={<FiMoreVertical size={12} />}
                              >
                                <Badge colorScheme={user.isActive ? 'green' : 'red'}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </MenuButton>
                              <MenuList>
                                <MenuItem 
                                  icon={user.isActive ? <FiEyeOff /> : <FiEye />}
                                  onClick={() => handleToggleUserStatus(user)}
                                >
                                  {user.isActive ? 'Deactivate' : 'Activate'}
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </Td>
                          <Td>{user.createdAt ? format(user.createdAt, 'MMM d, yyyy') : 'N/A'}</Td>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                aria-label="Edit user"
                                icon={<FiEdit2 />}
                                size="sm"
                                onClick={() => handleEditUser(user)}
                              />
                              <IconButton
                                aria-label="Delete user"
                                icon={<FiTrash2 />}
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleDeleteUser(user.id)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))
                    ) : (
                      <Tr>
                        <Td colSpan={6} textAlign="center" py={10}>
                          <Text color="gray.500">No users found</Text>
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel p={0} pt={6}>
            <Box bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor} mb={6}>
              <Box p={6}>
                <Flex justify="space-between" align="center" mb={8}>
                  <HStack spacing={4}>
                    <Heading size="lg" fontWeight="bold">Dashboard</Heading>
                    <Button 
                      as={RouterLink} 
                      to="/" 
                      leftIcon={<FiHome />} 
                      variant="outline" 
                      size="sm"
                      colorScheme="blue"
                    >
                      Back to Home
                    </Button>
                  </HStack>
                  <Button leftIcon={<FiPlus />} colorScheme="blue" as={RouterLink} to="/admin/courses/create">
                    Create Course
                  </Button>
                </Flex>
              </Box>
              <Flex justify="space-between" align="center" mb={6}>
                <Heading size="md">Course Management</Heading>
              </Flex>
              
              {isLoadingCourses ? (
                <Box>
                  <Skeleton height="40px" my={2} />
                  <Skeleton height="40px" my={2} />
                  <Skeleton height="40px" my={2} />
                </Box>
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Course Title</Th>
                      <Th>Students</Th>
                      <Th>Status</Th>
                      <Th>Last Updated</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {courses.map((course) => (
                      <Tr 
                        key={course.id}
                        _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                        cursor="pointer"
                        onClick={() => {
                          // Navigate to course edit page
                          window.location.href = `/admin/courses/${course.id}/edit`;
                        }}
                      >
                        <Td fontWeight="medium">
                          <HStack>
                            {course.thumbnail && (
                              <Avatar 
                                src={course.thumbnail} 
                                name={course.title} 
                                size="sm" 
                                mr={2}
                              />
                            )}
                            <Box>
                              <Text>{course.title}</Text>
                              <Text fontSize="xs" color="gray.500">
                                {course.category || 'Uncategorized'}
                              </Text>
                            </Box>
                          </HStack>
                        </Td>
                        <Td>{course.enrolledStudents || course.studentsCount || 0}</Td>
                        <Td>
                          <Badge 
                            colorScheme={
                              course.status === 'published' ? 'green' : 
                              course.status === 'draft' ? 'yellow' : 'gray'
                            }
                            textTransform="capitalize"
                          >
                            {course.status || 'draft'}
                          </Badge>
                        </Td>
                        <Td>{format(course.lastUpdated, 'MMM d, yyyy')}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="Edit course"
                              icon={<FiEdit2 />}
                              size="sm"
                              as={RouterLink}
                              to={`/admin/courses/${course.id}/edit`}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <IconButton
                              aria-label="View course"
                              icon={<FiEye />}
                              size="sm"
                              variant="ghost"
                              as={RouterLink}
                              to={`/courses/${course.slug || course.id}`}
                              target="_blank"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                    {!isLoadingCourses && courses.length === 0 && (
                      <Tr>
                        <Td colSpan={5} textAlign="center" py={10}>
                          <VStack spacing={2}>
                            <Text color="gray.500">
                              {courseError || 'No courses found.'}
                            </Text>
                            {!courseError && (
                              <Button 
                                leftIcon={<FiPlus />} 
                                colorScheme="blue" 
                                variant="outline"
                                size="sm"
                                as={RouterLink}
                                to="/admin/courses/create"
                                mt={2}
                              >
                                Create Your First Course
                              </Button>
                            )}
                          </VStack>
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Edit User Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit User</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl mb={4}>
              <FormLabel>Name</FormLabel>
              <Input 
                placeholder="Full name" 
                value={selectedUser?.displayName || ''}
                onChange={(e) => selectedUser && setSelectedUser({...selectedUser, displayName: e.target.value})}
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Email</FormLabel>
              <Input 
                type="email" 
                placeholder="Email" 
                value={selectedUser?.email || ''}
                isReadOnly
              />
            </FormControl>
            <FormControl>
              <FormLabel>Role</FormLabel>
              <Select 
                value={selectedUser?.role || 'user'}
                onChange={(e) => selectedUser && setSelectedUser({...selectedUser, role: e.target.value})}
              >
                <option value="admin">Admin</option>
                <option value="instructor">Instructor</option>
                <option value="user">User</option>
              </Select>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveUser}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminDashboard;
