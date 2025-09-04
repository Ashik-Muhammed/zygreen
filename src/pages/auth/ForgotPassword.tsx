import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  VStack, 
  Heading, 
  Text, 
  useToast, 
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Link,
  Container,
  Flex
} from '@chakra-ui/react';
import { ArrowBackIcon, EmailIcon } from '@chakra-ui/icons';
import { useAuth } from '../../contexts/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { resetPassword } = useAuth();
  const toast = useToast();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate email
    if (!email) {
      setError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      setIsLoading(true);
      await resetPassword(email);
      
      setMessage('Password reset email sent!');
      
      toast({
        title: 'Email sent',
        description: 'Check your inbox for password reset instructions',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
      
      // Clear the form
      setEmail('');
    } catch (err: any) {
      console.error('Password reset error:', err);
      const errorMessage = err.message || 'Failed to reset password. Please try again.';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg={useColorModeValue('gray.50', 'gray.900')}
      p={4}
    >
      <Container maxW="md">
        <Box
          bg={useColorModeValue('white', 'gray.800')}
          p={8}
          rounded="xl"
          shadow="lg"
          borderWidth="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
        >
          <Box textAlign="center" mb={8}>
            <Box display="inline-flex" p={3} bg="blue.100" rounded="full" mb={4}>
              <EmailIcon w={6} h={6} color="blue.500" />
            </Box>
            <Heading as="h1" size="xl" mb={2}>
              Forgot Password?
            </Heading>
            <Text color={useColorModeValue('gray.600', 'gray.400')}>
              Enter your email and we'll send you a link to reset your password
            </Text>
          </Box>

          {error && (
            <Alert status="error" mb={6} rounded="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Box>
            </Alert>
          )}

          {message ? (
            <Alert status="success" mb={6} rounded="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Check your email</AlertTitle>
                <AlertDescription>
                  We've sent a password reset link to your email address.
                </AlertDescription>
              </Box>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl id="email" isRequired>
                  <FormLabel>Email address</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    size="lg"
                    focusBorderColor="blue.500"
                    isDisabled={isLoading}
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="100%"
                  mt={4}
                  isLoading={isLoading}
                  loadingText="Sending reset link..."
                  leftIcon={<EmailIcon />}
                >
                  Send Reset Link
                </Button>
              </VStack>
            </form>
          )}

          <Flex mt={6} justify="center">
            <Button
              as={RouterLink}
              to="/login"
              variant="link"
              colorScheme="blue"
              leftIcon={<ArrowBackIcon />}
            >
              Back to login
            </Button>
          </Flex>
        </Box>
        
        <Text mt={6} textAlign="center" color={useColorModeValue('gray.600', 'gray.400')}>
          Don't have an account?{' '}
          <Link as={RouterLink} to="/signup" color="blue.500" fontWeight="medium">
            Sign up
          </Link>
        </Text>
      </Container>
    </Flex>
  );
};

export default ForgotPassword;
