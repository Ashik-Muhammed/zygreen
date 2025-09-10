import { Box, Heading, Text, VStack, HStack, Icon, Button, useColorModeValue, SimpleGrid, Card, CardHeader, CardBody, CardFooter, Divider, Input, Textarea, FormControl, FormLabel, FormErrorMessage, useToast } from '@chakra-ui/react';
import { FiMail, FiPhone, FiSend } from 'react-icons/fi';
import { useState } from 'react';
import emailjs from '@emailjs/browser';

const SupportPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    const isValid = validateForm();
    if (!isValid) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const serviceId = 'service_70lxadc';
      const templateId = 'template_73ix028';
      const publicKey = 'F4YSUH49TJqWCzc-o';
      
      // Log the data being sent for debugging
      console.log('Sending email with data:', {
        serviceId,
        templateId,
        templateParams: {
          from_name: formData.name,
          from_email: formData.email,
          subject: formData.subject,
          message: formData.message,
          to_email: 'zygreenad@gmail.com',
        }
      });
      
      // Send email using EmailJS
      const response = await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: formData.name,
          from_email: formData.email,
          subject: formData.subject,
          message: formData.message,
          to_email: 'zygreenad@gmail.com',
        },
        publicKey
      );
      
      console.log('Email sent successfully:', response);
      
      toast({
        title: 'Message sent successfully!',
        description: 'We\'ve received your message and will get back to you soon.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
    } catch (error: any) {
      console.error('Error sending email:', {
        name: error?.name,
        message: error?.message,
        status: error?.status,
        text: error?.text,
        response: error?.response,
        stack: error?.stack
      });
      
      let errorMessage = 'Failed to send message. Please try again later or contact us directly at zygreenad@gmail.com';
      
      // More specific error messages based on the error status
      if (error?.status === 400) {
        errorMessage = 'Invalid request. Please check the form data and try again.';
      } else if (error?.status === 401) {
        errorMessage = 'Authentication failed. Please refresh the page and try again.';
      } else if (error?.status === 429) {
        errorMessage = 'Too many requests. Please try again later.';
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="xl" mb={2}>Support Center</Heading>
          <Text color="gray.500">We're here to help. Contact our support team for assistance.</Text>
        </Box>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mt={8}>
          {/* Contact Card */}
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardHeader>
              <HStack>
                <Icon as={FiPhone} boxSize={6} color="blue.500" />
                <Heading size="md">Call Us</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <Text>Speak with our support team directly.</Text>
              <Text mt={2} fontWeight="bold">+91 9567184287</Text>
              <Text fontSize="sm" color="gray.500">Monday - Friday, 9am - 5pm IST</Text>
            </CardBody>
            <CardFooter>
              <Button colorScheme="blue" variant="outline" size="sm">
                Call Now
              </Button>
            </CardFooter>
          </Card>
          
          {/* Email Card */}
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardHeader>
              <HStack>
                <Icon as={FiMail} boxSize={6} color="green.500" />
                <Heading size="md">Email Us</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <Text>Send us an email and we'll get back to you.</Text>
              <Text mt={2} fontWeight="bold">zygreenad@gmail.com</Text>
              <Text fontSize="sm" color="gray.500">Typically responds within 24 hours</Text>
            </CardBody>
            <CardFooter>
              <Button colorScheme="green" variant="outline" size="sm" as="a" href="mailto:support@zygreen.com">
                Send Email
              </Button>
            </CardFooter>
          </Card>
          
         
        </SimpleGrid>
        
        {/* Contact Form */}
        <Card mt={8} bg={cardBg} border="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Send us a Message</Heading>
            <Text mt={1} color="gray.500">Fill out the form below and we'll get back to you as soon as possible.</Text>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardBody>
              <VStack spacing={4}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                  <FormControl isInvalid={!!formErrors.name} isRequired>
                    <FormLabel>Your Name</FormLabel>
                    <Input 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      placeholder="John Doe"
                    />
                    <FormErrorMessage>{formErrors.name}</FormErrorMessage>
                  </FormControl>
                  <FormControl isInvalid={!!formErrors.email} isRequired>
                    <FormLabel>Email Address</FormLabel>
                    <Input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      placeholder="your@email.com"
                    />
                    <FormErrorMessage>{formErrors.email}</FormErrorMessage>
                  </FormControl>
                </SimpleGrid>
                
                <FormControl isInvalid={!!formErrors.subject} isRequired>
                  <FormLabel>Subject</FormLabel>
                  <Input 
                    name="subject" 
                    value={formData.subject} 
                    onChange={handleChange} 
                    placeholder="How can we help you?"
                  />
                  <FormErrorMessage>{formErrors.subject}</FormErrorMessage>
                </FormControl>
                
                <FormControl isInvalid={!!formErrors.message} isRequired>
                  <FormLabel>Message</FormLabel>
                  <Textarea 
                    name="message" 
                    value={formData.message} 
                    onChange={handleChange} 
                    placeholder="Please describe your issue in detail..."
                    rows={6}
                  />
                  <FormErrorMessage>{formErrors.message}</FormErrorMessage>
                </FormControl>
              </VStack>
            </CardBody>
            <Divider />
            <CardFooter justifyContent="flex-end">
              <Button 
                type="submit" 
                colorScheme="blue" 
                leftIcon={<FiSend />}
                isLoading={isSubmitting}
                loadingText="Sending..."
                isDisabled={!formData.name || !formData.email || !formData.subject || !formData.message}
              >
                Send Message
              </Button>
            </CardFooter>
          </form>
        </Card>
      </VStack>
    </Box>
  );
};

export default SupportPage;
