import { useState } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  HStack, 
  FormControl, 
  FormLabel, 
  Input, 
  Textarea, 
  Button, 
  useToast,
  Grid,
  GridItem,
  Icon
} from '@chakra-ui/react';
import { FiMail, FiPhone, FiMapPin, FiSend, FiCheckCircle } from 'react-icons/fi';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const toast = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Form submitted:', formData);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      toast({
        title: 'Message sent!',
        description: "We've received your message and will get back to you soon.",
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: 'There was an error sending your message. Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: FiMail,
      title: 'Email Us',
      description: 'info@zygreen.com',
      link: 'mailto:info@zygreen.com',
    },
    {
      icon: FiPhone,
      title: 'Call Us',
      description: '+1 (555) 123-4567',
      link: 'tel:+15551234567',
    },
    {
      icon: FiMapPin,
      title: 'Visit Us',
      description: '123 Learning St, Education City, 10001',
      link: 'https://maps.google.com',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box bgGradient="linear(to-r, green.50, white)" py={20}>
        <Container maxW="container.xl">
          <VStack spacing={4} textAlign="center">
            <Text color="green.500" fontWeight="semibold">GET IN TOUCH</Text>
            <Heading as="h1" size="2xl" mb={4}>
              We'd love to hear from you
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl">
              Have questions about our courses or need assistance? Fill out the form below or reach out to us directly.
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Contact Form & Info */}
      <Box py={16} bg="white">
        <Container maxW="container.xl">
          <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={12}>
            {/* Contact Form */}
            <GridItem>
              <Box 
                bg="white" 
                p={8} 
                borderRadius="lg" 
                boxShadow="lg"
                borderWidth="1px"
                borderColor="gray.100"
              >
                {isSubmitted ? (
                  <VStack spacing={6} textAlign="center" py={8}>
                    <Icon as={FiCheckCircle} w={16} h={16} color="green.500" />
                    <Heading as="h2" size="lg">Thank You!</Heading>
                    <Text color="gray.600">
                      Your message has been sent successfully. We'll get back to you soon!
                    </Text>
                    <Button 
                      colorScheme="green" 
                      onClick={() => setIsSubmitted(false)}
                      mt={4}
                    >
                      Send Another Message
                    </Button>
                  </VStack>
                ) : (
                  <>
                    <Heading as="h2" size="lg" mb={8}>
                      Send us a message
                    </Heading>
                    <form onSubmit={handleSubmit}>
                      <VStack spacing={6}>
                        <FormControl isRequired>
                          <FormLabel>Full Name</FormLabel>
                          <Input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            size="lg"
                          />
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel>Email Address</FormLabel>
                          <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            size="lg"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Subject</FormLabel>
                          <Input
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="How can we help you?"
                            size="lg"
                          />
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel>Your Message</FormLabel>
                          <Textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Type your message here..."
                            size="lg"
                            rows={6}
                          />
                        </FormControl>

                        <Button
                          type="submit"
                          colorScheme="green"
                          size="lg"
                          width="full"
                          isLoading={isSubmitting}
                          loadingText="Sending..."
                          rightIcon={<FiSend />}
                        >
                          Send Message
                        </Button>
                      </VStack>
                    </form>
                  </>
                )}
              </Box>
            </GridItem>

            {/* Contact Information */}
            <GridItem>
              <VStack spacing={8} align="stretch">
                <Box>
                  <Heading as="h2" size="lg" mb={6}>
                    Contact Information
                  </Heading>
                  <Text color="gray.600" mb={8}>
                    Have questions about our courses or need help getting started? 
                    Our team is here to help you with any questions you may have.
                  </Text>
                </Box>

                <VStack spacing={6} align="stretch">
                  {contactInfo.map((item, index) => (
                    <Box
                      key={index}
                      as="a"
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      p={6}
                      borderWidth="1px"
                      borderColor="gray.200"
                      borderRadius="lg"
                      _hover={{
                        borderColor: 'green.500',
                        transform: 'translateY(-3px)',
                        boxShadow: 'lg',
                      }}
                      transition="all 0.3s"
                    >
                      <HStack spacing={4}>
                        <Box
                          p={3}
                          bg="green.50"
                          borderRadius="full"
                          color="green.500"
                        >
                          <Icon as={item.icon} w={6} h={6} />
                        </Box>
                        <Box>
                          <Text fontWeight="bold" fontSize="lg">
                            {item.title}
                          </Text>
                          <Text color="gray.600">{item.description}</Text>
                        </Box>
                      </HStack>
                    </Box>
                  ))}
                </VStack>

                {/* Office Hours */}
                <Box mt={8} p={6} bg="gray.50" borderRadius="lg">
                  <Heading as="h3" size="md" mb={4}>
                    Office Hours
                  </Heading>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text>Monday - Friday</Text>
                      <Text fontWeight="medium">9:00 AM - 6:00 PM</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Saturday</Text>
                      <Text fontWeight="medium">10:00 AM - 4:00 PM</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Sunday</Text>
                      <Text fontWeight="medium">Closed</Text>
                    </HStack>
                  </VStack>
                </Box>
              </VStack>
            </GridItem>
          </Grid>
        </Container>
      </Box>

      {/* Map */}
      <Box h="400px" bg="gray.100">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.215209056548!2d-73.9878449240085!3d40.74844097139023!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9b30eac9f%3A0xaca05ca48ab785ac!2s350%205th%20Ave%2C%20New%20York%2C%20NY%2010118!5e0!3m2!1sen!2sus!4v1620000000000!5m2!1sen!2sus"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          title="Zygreen Office Location"
        ></iframe>
      </Box>
    </Box>
  );
};

export default Contact;
