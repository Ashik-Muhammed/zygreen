import { Button, Heading, VStack, Text, Box } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  return (
    <Box p={8} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading>Welcome to Zygreen</Heading>
          <Button colorScheme="red" onClick={handleLogout}>
            Log Out
          </Button>
        </Box>
        
        <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
          <Heading size="md">Your Profile</Heading>
          <Text mt={2}>Email: {currentUser?.email}</Text>
          {/* Add more user details here */}
        </Box>

        <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
          <Heading size="md">Your Courses</Heading>
          <Text mt={2}>No courses enrolled yet.</Text>
          {/* Courses list will go here */}
        </Box>
      </VStack>
    </Box>
  );
}
