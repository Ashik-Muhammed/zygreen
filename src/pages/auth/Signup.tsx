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
  VStack,
  Checkbox,
  HStack,
  Tooltip
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, InfoOutlineIcon } from '@chakra-ui/icons';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ 
    email?: string; 
    password?: string; 
    confirmPassword?: string;
    fullName?: string;
    terms?: string;
    general?: string; 
  }>({});
  
  const { signup, loginWithGoogle, loginWithGithub } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Name is too short';
    }
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Must include uppercase, lowercase, and number';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
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
      await signup(email, password, fullName);
      toast({
        title: 'Account created!',
        description: 'Your account has been successfully created.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/student/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      setErrors({
        general: error.message || 'Failed to create an account. Please try again.'
      });
      toast({
        title: 'Signup failed',
        description: error.message || 'Failed to create an account. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (provider: 'google' | 'github') => {
    try {
      setIsLoading(true);
      setErrors({});
      
      if (provider === 'google') {
        await loginWithGoogle();
      } else if (provider === 'github') {
        await loginWithGithub();
      }
      
      toast({
        title: 'Account created!',
        description: 'Your account has been successfully created.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      navigate('/student/dashboard');
    } catch (error: any) {
      console.error(`${provider} signup error:`, error);
      setErrors({
        general: error.message || `Failed to sign up with ${provider}. Please try again.`
      });
      toast({
        title: 'Signup failed',
        description: error.message || `Failed to sign up with ${provider}. Please try again.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRequirements = [
    { text: 'At least 8 characters', valid: password.length >= 8 },
    { text: 'Contains a number', valid: /\d/.test(password) },
    { text: 'Contains uppercase letter', valid: /[A-Z]/.test(password) },
    { text: 'Contains lowercase letter', valid: /[a-z]/.test(password) },
  ];

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
            Create an Account
          </Heading>
          <Text color={useColorModeValue('gray.600', 'gray.400')}>
            Join thousands of learners today
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
            onClick={() => handleSocialSignup('google')}
            isDisabled={isLoading}
          >
            Continue with Google
          </Button>
          <Button
            variant="outline"
            leftIcon={<Icon as={FaGithub} />}
            onClick={() => handleSocialSignup('github')}
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
              <FormControl id="fullName" isInvalid={!!errors.fullName}>
                <FormLabel>Full Name</FormLabel>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
                <FormErrorMessage>{errors.fullName}</FormErrorMessage>
              </FormControl>

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
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
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
                
                {password && (
                  <Box mt={2} fontSize="sm" color="gray.600">
                    <Text mb={1} fontWeight="medium">Password must contain:</Text>
                    <VStack align="start" spacing={1}>
                      {passwordRequirements.map((req, index) => (
                        <HStack key={index} spacing={2}>
                          <Box
                            as="span"
                            color={req.valid ? 'green.500' : 'gray.400'}
                            fontSize="xs"
                          >
                            {req.valid ? '✓' : '•'}
                          </Box>
                          <Text 
                            as="span" 
                            fontSize="xs" 
                            color={req.valid ? 'green.500' : 'gray.600'}
                          >
                            {req.text}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}
              </FormControl>

              <FormControl id="confirmPassword" isInvalid={!!errors.confirmPassword}>
                <FormLabel>Confirm Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                  />
                  <InputRightElement>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      _hover={{ bg: 'transparent' }}
                      _active={{ bg: 'transparent' }}
                    >
                      {showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.terms}>
                <HStack align="flex-start">
                  <Checkbox 
                    isChecked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    mt={1}
                  />
                  <Box>
                    <Text fontSize="sm">
                      I agree to the{' '}
                      <Link as={RouterLink} to="/terms" color="blue.500">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link as={RouterLink} to="/privacy" color="blue.500">
                        Privacy Policy
                      </Link>
                    </Text>
                    {errors.terms && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {errors.terms}
                      </Text>
                    )}
                  </Box>
                </HStack>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="100%"
                mt={2}
                isLoading={isLoading}
                loadingText="Creating account..."
              >
                Create Account
              </Button>
            </VStack>
          </form>

          <Text textAlign="center" mt={4}>
            Already have an account?{' '}
            <Link as={RouterLink} to="/login" color="blue.500" fontWeight="medium">
              Sign in
            </Link>
          </Text>
        </Stack>
      </Box>
    </Box>
  );
};

export default Signup;
