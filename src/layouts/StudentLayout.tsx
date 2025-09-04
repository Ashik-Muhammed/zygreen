import { Box, Container, Flex, useDisclosure, useColorModeValue, Text, Avatar, Menu, MenuButton, MenuList, MenuItem, IconButton, Spinner, Center, Button } from '@chakra-ui/react';
import { Outlet, Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiBook, FiAward, FiUser, FiMenu, FiX, FiChevronDown, FiLogOut, FiSettings } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

const StudentLayout = () => {
  const { currentUser, firebaseUser, logout, loading: authLoading } = useAuth();
  const { isOpen, onToggle } = useDisclosure();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      navigate('/login', { replace: true });
    }
  }, [firebaseUser, authLoading, navigate]);

  // Show loading state
  if (authLoading || !firebaseUser) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }
  
  const bg = useColorModeValue('white', 'gray.800');
  const sidebarBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.600', 'blue.200');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const navItems = [
    { icon: FiHome, label: 'Dashboard', path: '/student/dashboard' },
    { icon: FiBook, label: 'My Courses', path: '/student/courses' },
    { icon: FiAward, label: 'Certificates', path: '/student/certificates' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== '/student/dashboard' && location.pathname.startsWith(path));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" display="flex" flexDirection={{ base: 'column', md: 'row' }}>
      {/* Mobile Header */}
      <Box
        as="header"
        display={{ base: 'flex', md: 'none' }}
        alignItems="center"
        justifyContent="space-between"
        p={4}
        bg={bg}
        borderBottom="1px"
        borderColor={borderColor}
        position="sticky"
        top={0}
        zIndex="sticky"
      >
        <Text fontWeight="bold" fontSize="xl" color="blue.500">
          Zygreen
        </Text>
        <IconButton
          aria-label="Toggle menu"
          icon={isOpen ? <FiX /> : <FiMenu />}
          onClick={onToggle}
          variant="ghost"
        />
      </Box>

      {/* Sidebar */}
      <Box
        as="aside"
        width={{ base: '100%', md: '280px' }}
        height={{ base: isOpen ? 'auto' : '0', md: '100vh' }}
        overflowY={{ base: 'hidden', md: 'auto' }}
        bg={sidebarBg}
        borderRight={{ base: 'none', md: '1px' }}
        borderBottom={{ base: '1px', md: 'none' }}
        borderColor={borderColor}
        flexShrink={0}
        transition="all 0.3s"
        position={{ base: 'absolute', md: 'sticky' }}
        top={{ base: '64px', md: 0 }}
        left={0}
        zIndex="dropdown"
      >
        <Box p={6} display={{ base: 'none', md: 'block' }} borderBottom="1px" borderColor={borderColor}>
          <Text fontSize="xl" fontWeight="bold" color="blue.500">
            Zygreen
          </Text>
        </Box>

        {/* User Profile */}
        <Box p={4} borderBottom="1px" borderColor={borderColor}>
          <Flex alignItems="center">
            <Avatar 
              name={currentUser?.displayName || 'User'} 
              src={currentUser?.photoURL || ''} 
              size="md"
              mr={3}
            />
            <Box>
              <Text fontWeight="medium">{currentUser?.displayName || 'Student'}</Text>
              <Text fontSize="sm" color="gray.500">Student Account</Text>
            </Box>
          </Flex>
        </Box>

        {/* Navigation */}
        <Box p={2}>
          <Box as="nav" mt={2}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Box
                  key={item.path}
                  as={RouterLink}
                  to={item.path}
                  display="flex"
                  alignItems="center"
                  px={4}
                  py={3}
                  mb={1}
                  rounded="lg"
                  bg={active ? activeBg : 'transparent'}
                  color={active ? activeColor : 'inherit'}
                  _hover={{
                    textDecoration: 'none',
                    bg: active ? activeBg : hoverBg,
                  }}
                  transition="all 0.2s"
                >
                  <Icon style={{ marginRight: '12px' }} />
                  {item.label}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box as="main" flex="1" minH="100vh" display="flex" flexDirection="column">
        {/* Top Bar */}
        <Box 
          as="header" 
          display={{ base: 'none', md: 'flex' }}
          alignItems="center" 
          justifyContent="flex-end" 
          p={4} 
          bg={bg}
          borderBottom="1px"
          borderColor={borderColor}
        >
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              rightIcon={<FiChevronDown />}
              leftIcon={<Avatar size="sm" name={currentUser?.displayName || 'U'} src={currentUser?.photoURL || ''} />}
            >
              <Box textAlign="left" mr={2}>
                <Text fontSize="sm" fontWeight="medium">{currentUser?.displayName || 'User'}</Text>
                <Text fontSize="xs" color="gray.500">Student</Text>
              </Box>
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FiUser />} as={RouterLink} to="/student/profile">
                My Profile
              </MenuItem>
              <MenuItem icon={<FiSettings />} as={RouterLink} to="/student/settings">
                Settings
              </MenuItem>
              <MenuItem icon={<FiLogOut />} onClick={handleLogout} color="red.500">
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>

        {/* Page Content */}
        <Box flex="1" p={{ base: 4, md: 6 }}>
          <Container maxW="container.xl" p={0}>
            <Outlet />
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default StudentLayout;
