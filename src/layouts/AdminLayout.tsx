import { Box, Container, Flex, useDisclosure, useColorModeValue, Button, useToast } from '@chakra-ui/react';
import { Outlet, Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiBook, FiUsers, FiSettings, FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const AdminLayout = () => {
  const { logout } = useAuth();
  const { isOpen, onToggle } = useDisclosure();
  const location = useLocation();
  const bg = useColorModeValue('white', 'gray.800');
  const sidebarBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.600', 'blue.200');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const navigate = useNavigate();
  const toast = useToast();
  const navItems = [
    { icon: FiHome, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: FiBook, label: 'Products', path: '/admin/products' },
    { icon: FiUsers, label: 'Users', path: '/admin/users' },
    { icon: FiSettings, label: 'Settings', path: '/admin/settings' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast({
        title: 'Logged out successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error logging out',
        description: 'There was an error logging out. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <Box minH="100vh" bg="gray.50" display="flex">
      {/* Mobile Nav Toggle */}
      <Box
        display={{ base: 'block', md: 'none' }}
        position="fixed"
        top={4}
        left={4}
        zIndex="banner"
      >
        <Box
          as="button"
          p={2}
          rounded="md"
          bg={bg}
          boxShadow="md"
          onClick={onToggle}
          aria-label="Toggle menu"
        >
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </Box>
      </Box>

      {/* Sidebar */}
      <Box
        as="aside"
        width={{ base: '250px', md: '280px' }}
        position={{ base: 'fixed', md: 'sticky' }}
        top={0}
        left={{ base: isOpen ? 0 : '-280px', md: 0 }}
        height="100vh"
        bg={sidebarBg}
        borderRight="1px"
        borderColor={borderColor}
        transition="all 0.3s"
        zIndex="overlay"
        overflowY="auto"
      >
        <Box p={4} borderBottom="1px" borderColor={borderColor}>
          <Box as={RouterLink} to="/admin/dashboard" display="flex" alignItems="center">
            <Box fontSize="xl" fontWeight="bold" color="blue.500">
              Zygreen Admin
            </Box>
          </Box>
        </Box>

        <Box p={4}>
          <Box as="nav" mt={6}>
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
                  mb={2}
                  rounded="md"
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

        <Box p={4} mt="auto" borderTop="1px" borderColor={borderColor}>
          <Box
            as="button"
            onClick={logout}
            display="flex"
            alignItems="center"
            width="100%"
            px={4}
            py={2}
            rounded="md"
            _hover={{
              bg: hoverBg,
            }}
          >
            <FiSettings style={{ marginRight: '12px' }} />
            Logout
          </Box>
          
          {/* Logout Button */}
          <Box mt={8} p={4} borderTop="1px" borderColor={borderColor}>
            <Button
              leftIcon={<FiLogOut />}
              colorScheme="red"
              variant="ghost"
              width="100%"
              justifyContent="flex-start"
              onClick={handleLogout}
              _hover={{
                bg: useColorModeValue('red.50', 'red.900'),
              }}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box
        as="main"
        flex="1"
        ml={{ base: 0, md: '280px' }}
        pt={{ base: '70px', md: 0 }}
      >
        <Container maxW="container.xl" py={8}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default AdminLayout;
