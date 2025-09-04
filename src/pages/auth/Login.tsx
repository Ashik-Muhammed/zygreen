import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  InputGroup, 
  InputRightElement, 
  Stack, 
  Text, 
  Link, 
  useColorModeValue,
  Divider,
  Icon,
  useToast,
  FormErrorMessage,
  Flex,
  Heading,
  VStack
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  
  const { login, loginWithGoogle, loginWithGithub } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const { user } = await login(email, password);
      
      // Get user data to check role
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      // Show success toast
      toast({
        title: 'Login successful!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Redirect based on user role
      if (userData?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setErrors({
        general: error.message || 'Failed to log in. Please check your credentials and try again.'
      });
      toast({
        title: 'Login failed',
        description: error.message || 'Failed to log in. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setIsLoading(true);
      setErrors({});
      
      // Call the appropriate social login method
      const { user } = provider === 'google' 
        ? await loginWithGoogle() 
        : await loginWithGithub();
      
      // Get user data to check role
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      // Show success toast
      toast({
        title: 'Login successful!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Redirect based on user role
      if (userData?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (error: any) {
      console.error(`${provider} login error:`, error);
      setErrors({
        general: error.message || `Failed to log in with ${provider}. Please try again.`
      });
      toast({
        title: 'Login failed',
        description: error.message || `Failed to log in with ${provider}. Please try again.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={useColorModeValue('gray.50', 'gray.900')}
      p={4}
    >
      <Box
        w="100%"
        maxW="md"
        p={8}
        bg={useColorModeValue('white', 'gray.800')}
        rounded="xl"
        shadow="lg"
      >
        <Box textAlign="center" mb={8}>
          <Heading as="h1" size="xl" mb={2} color="blue.500">
            Welcome Back
          </Heading>
          <Text color={useColorModeValue('gray.600', 'gray.400')}>
            Sign in to your account to continue
          </Text>
        </Box>

        {errors.general && (
          <Box 
            mb={4} 
            p={3} 
            bg="red.50" 
            color="red.700" 
            rounded="md"
            fontSize="sm"
          >
            {errors.general}
          </Box>
        )}

        <Stack spacing={4}>
          <Button
            variant="outline"
            leftIcon={<Icon as={FaGoogle} />}
            onClick={() => handleSocialLogin('google')}
            isDisabled={isLoading}
          >
            Continue with Google
          </Button>
          <Button
            variant="outline"
            leftIcon={<Icon as={FaGithub} />}
            onClick={() => handleSocialLogin('github')}
            isDisabled={isLoading}
          >
            Continue with GitHub
          </Button>

          <Flex align="center" my={4}>
            <Divider />
            <Text px={3} color={useColorModeValue('gray.500', 'gray.400')} fontSize="sm">
              OR
            </Text>
            <Divider />
          </Flex>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl id="email" isInvalid={!!errors.email}>
                <FormLabel>Email address</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <FormControl id="password" isInvalid={!!errors.password}>
                <Flex justify="space-between" mb={1}>
                  <FormLabel mb={0}>Password</FormLabel>
                  <Link
                    as={RouterLink}
                    to="/forgot-password"
                    color="blue.500"
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    Forgot password?
                  </Link>
                </Flex>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                  <InputRightElement>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      _hover={{ bg: 'transparent' }}
                      _active={{ bg: 'transparent' }}
                    >
                      {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="100%"
                mt={4}
                isLoading={isLoading}
                loadingText="Signing in..."
              >
                Sign In
              </Button>
            </VStack>
          </form>

          <Text textAlign="center" mt={4}>
            Don't have an account?{' '}
            <Link as={RouterLink} to="/signup" color="blue.500" fontWeight="medium">
              Sign up
            </Link>
          </Text>
        </Stack>
      </Box>
    </Box>
  );
};

export default Login;
