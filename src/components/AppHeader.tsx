import { Box, Flex, Button, useColorModeValue, Container, HStack, IconButton, useDisclosure, VStack, Link as ChakraLink, Icon, Image, Text } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiHome, FiBook, FiDollarSign, FiInfo, FiMail, FiLogIn, FiUserPlus, FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const AppHeader = () => {
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState<string>('student');

  useEffect(() => {
    const fetchUserRole = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || 'student');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
    };

    fetchUserRole();
  }, [currentUser]);
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isScrolled, setIsScrolled] = useState(false);
  const bg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', path: '/', icon: FiHome },
    { name: 'Courses', path: '/courses', icon: FiBook },
    { name: 'Pricing', path: '/pricing', icon: FiDollarSign },
    { name: 'About', path: '/about', icon: FiInfo },
    { name: 'Contact', path: '/contact', icon: FiMail },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box 
      as="header"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1000}
      bg={isScrolled ? bg : 'transparent'}
      borderBottom={isScrolled ? '1px' : 'none'}
      borderColor={borderColor}
      boxShadow={isScrolled ? 'sm' : 'none'}
      transition="all 0.2s"
    >
      <Container maxW="container.xl" px={4}>
        <Flex h={16} alignItems="center" justifyContent="space-between">
          {/* Logo and Mobile Menu Button */}
          <Flex alignItems="center">
            <IconButton
              size="md"
              icon={isOpen ? <FiX /> : <FiMenu />}
              aria-label="Open Menu"
              display={{ base: 'flex', md: 'none' }}
              onClick={isOpen ? onClose : onOpen}
              variant="ghost"
              mr={2}
            />
            <ChakraLink as={RouterLink} to="/" display="flex" alignItems="center" _hover={{ textDecoration: 'none' }}>
              <Image 
                src="/zygreen-logo.png" 
                alt="Zygreen Logo" 
                h="40px" 
                w="auto" 
                mr={2}
                onError={(e) => {
                  // Fallback to text if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const textFallback = target.nextSibling as HTMLElement;
                  if (textFallback) textFallback.style.display = 'block';
                }}
              />
              <Text fontSize="xl" fontWeight="bold" color="blue.500" display="none">
                Zygreen
              </Text>
              <Box ml={2} display={{ base: 'none', md: 'block' }}>
                <Text fontSize="xs" color="gray.500" lineHeight={1.2}>
                  Building sustainable and innovative products
                  <br />for the future generations
                </Text>
              </Box>
            </ChakraLink>
          </Flex>

          {/* Desktop Navigation */}
          <HStack spacing={8} display={{ base: 'none', md: 'flex' }}>
            {navItems.map((item) => (
              <ChakraLink
                key={item.path}
                as={RouterLink}
                to={item.path}
                px={3}
                py={2}
                fontSize="sm"
                fontWeight={isActive(item.path) ? 'semibold' : 'medium'}
                color={isActive(item.path) ? 'blue.500' : 'inherit'}
                _hover={{
                  textDecoration: 'none',
                  color: 'blue.500',
                }}
                onClick={scrollToTop}
              >
                {item.name}
              </ChakraLink>
            ))}
          </HStack>

          {/* Auth Buttons */}
          <HStack spacing={4}>
            {currentUser ? (
              <Button 
                as={RouterLink}
                to={userRole === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                colorScheme="blue"
                size="sm"
                variant="outline"
                leftIcon={<FiUser />}
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  as={RouterLink}
                  to="/login"
                  variant="ghost"
                  size="sm"
                  leftIcon={<FiLogIn />}
                >
                  Login
                </Button>
                <Button 
                  as={RouterLink}
                  to="/signup"
                  colorScheme="blue"
                  size="sm"
                  variant="solid"
                  leftIcon={<FiUserPlus />}
                >
                  Sign Up
                </Button>
              </>
            )}
            <IconButton
              display={{ base: 'flex', md: 'none' }}
              onClick={onOpen}
              icon={isOpen ? <FiX /> : <FiMenu />}
              variant="ghost"
              aria-label="Open Menu"
            />
          </HStack>
        </Flex>
      </Container>

      {/* Mobile Navigation */}
      {isOpen && (
        <Box pb={4} display={{ md: 'none' }} bg={bg} borderBottom="1px" borderColor={borderColor}>
          <VStack as="nav" spacing={1} px={4}>
            {navItems.map((item) => (
              <ChakraLink
                key={item.path}
                as={RouterLink}
                to={item.path}
                w="full"
                px={4}
                py={2}
                borderRadius="md"
                fontWeight={isActive(item.path) ? 'semibold' : 'normal'}
                color={isActive(item.path) ? 'blue.500' : 'inherit'}
                _hover={{
                  bg: useColorModeValue('gray.100', 'gray.700'),
                  textDecoration: 'none',
                }}
                onClick={() => {
                  onClose();
                  scrollToTop();
                }}
              >
                <HStack>
                  <Icon as={item.icon} />
                  <span>{item.name}</span>
                </HStack>
              </ChakraLink>
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default AppHeader;
