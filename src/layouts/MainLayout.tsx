import { 
  Box, 
  Container,
  IconButton,
  useColorModeValue
} from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import { FiArrowUp } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import AppHeader from '../components/AppHeader';

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = () => {
  const [showScroll, setShowScroll] = useState(false);
  const bg = useColorModeValue('white', 'gray.900');

  // Show scroll-to-top button when user scrolls down
  useEffect(() => {
    const checkScroll = () => {
      if (!showScroll && window.pageYOffset > 300) {
        setShowScroll(true);
      } else if (showScroll && window.pageYOffset <= 300) {
        setShowScroll(false);
      }
    };

    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, [showScroll]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg={bg}>
      <AppHeader />

      {/* Main Content with padding for fixed header */}
      <Box as="main" flex="1" pt={16}>
        <Outlet />
      </Box>

      {/* Scroll to top button */}
      {showScroll && (
        <IconButton
          aria-label="Scroll to top"
          icon={<FiArrowUp />}
          position="fixed"
          bottom={8}
          right={8}
          size="lg"
          colorScheme="blue"
          borderRadius="full"
          boxShadow="lg"
          onClick={scrollToTop}
          zIndex={999}
        />
      )}

      {/* Footer */}
      <Box as="footer" py={6} bg={useColorModeValue('gray.50', 'gray.800')}>
        <Container maxW="container.xl">
          <Box textAlign="center">
            &copy; {new Date().getFullYear()} Zygreen. All rights reserved.
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;
