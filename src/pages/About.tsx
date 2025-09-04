import { Box, Container, Heading, Text, VStack, HStack, SimpleGrid, Image, useBreakpointValue } from '@chakra-ui/react';
import { FiBook, FiUsers, FiAward, FiGlobe } from 'react-icons/fi';

const About = () => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  const stats = [
    { icon: FiUsers, number: '10,000+', label: 'Students Enrolled' },
    { icon: FiBook, number: '100+', label: 'Courses Available' },
    { icon: FiAward, number: '98%', label: 'Success Rate' },
    { icon: FiGlobe, number: '50+', label: 'Countries' },
  ];

  const team = [
    {
      name: 'John Doe',
      role: 'Founder & CEO',
      image: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    {
      name: 'Jane Smith',
      role: 'Lead Instructor',
      image: 'https://randomuser.me/api/portraits/women/1.jpg',
    },
    {
      name: 'Alex Johnson',
      role: 'Course Designer',
      image: 'https://randomuser.me/api/portraits/men/2.jpg',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box bgGradient="linear(to-r, green.50, white)" py={20}>
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center" maxW="3xl" mx="auto">
            <Text color="green.500" fontWeight="semibold">ABOUT US</Text>
            <Heading as="h1" size="2xl" mb={4}>
              Empowering the next generation of learners
            </Heading>
            <Text fontSize="xl" color="gray.600">
              At Zygreen, we believe that education should be accessible, engaging, and transformative. 
              Our mission is to provide high-quality learning experiences to students around the world.
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box py={16} bg="white">
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={8} textAlign="center">
            {stats.map((stat, index) => (
              <Box key={index}>
                <Box 
                  as={stat.icon} 
                  size={isMobile ? '2.5rem' : '3rem'} 
                  color="green.500" 
                  mx="auto"
                  mb={4}
                />
                <Text fontSize={isMobile ? '2xl' : '3xl'} fontWeight="bold" mb={2}>
                  {stat.number}
                </Text>
                <Text color="gray.600">{stat.label}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Our Story */}
      <Box py={16} bg="gray.50">
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={12} alignItems="center">
            <Box>
              <Image
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80"
                alt="Our team working together"
                borderRadius="lg"
                boxShadow="lg"
              />
            </Box>
            <Box>
              <Text color="green.500" fontWeight="semibold" mb={4}>OUR STORY</Text>
              <Heading as="h2" size="xl" mb={6}>
                From a small idea to a global learning platform
              </Heading>
              <Text color="gray.600" mb={6}>
                Founded in 2020, Zygreen started as a small team of educators and technologists 
                passionate about making quality education accessible to everyone. What began as 
                a few online courses has grown into a comprehensive learning platform serving 
                thousands of students worldwide.
              </Text>
              <Text color="gray.600">
                We're committed to providing the best learning experience through expert-led courses, 
                interactive content, and a supportive community. Our team works tirelessly to ensure 
                that every student has the tools they need to succeed in their learning journey.
              </Text>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Team Section */}
      <Box py={16} bg="white">
        <Container maxW="container.xl">
          <VStack spacing={2} textAlign="center" mb={12}>
            <Text color="green.500" fontWeight="semibold">OUR TEAM</Text>
            <Heading as="h2" size="xl">Meet the people behind Zygreen</Heading>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            {team.map((member, index) => (
              <Box 
                key={index} 
                textAlign="center"
                p={6}
                borderRadius="lg"
                _hover={{
                  boxShadow: 'lg',
                  transform: 'translateY(-5px)',
                  transition: 'all 0.3s',
                }}
              >
                <Box
                  w={isMobile ? '200px' : '250px'}
                  h={isMobile ? '200px' : '250px'}
                  mx="auto"
                  mb={6}
                  borderRadius="full"
                  overflow="hidden"
                  borderWidth={4}
                  borderColor="green.100"
                >
                  <Image
                    src={member.image}
                    alt={member.name}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                  />
                </Box>
                <Text fontSize="xl" fontWeight="bold">{member.name}</Text>
                <Text color="green.500" mb={4}>{member.role}</Text>
                <HStack spacing={4} justify="center">
                  {['twitter', 'linkedin', 'github'].map((social) => (
                    <Box
                      key={social}
                      as="a"
                      href={`https://${social}.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                      p={2}
                      borderRadius="full"
                      bg="gray.100"
                      color="gray.600"
                      _hover={{
                        bg: 'green.500',
                        color: 'white',
                        transform: 'translateY(-2px)',
                      }}
                      transition="all 0.3s"
                    >
                      <Box as="span" className={`fa fa-${social}`} />
                    </Box>
                  ))}
                </HStack>
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={20} bgGradient="linear(to-r, green.50, white)">
        <Container maxW="container.md" textAlign="center">
          <Heading as="h2" size="xl" mb={6}>
            Ready to start learning?
          </Heading>
          <Text fontSize="xl" color="gray.600" mb={8}>
            Join thousands of students who are already advancing their careers with our courses.
          </Text>
          <HStack spacing={4} justify="center">
            <Box
              as="a"
              href="/signup"
              bg="green.500"
              color="white"
              px={8}
              py={3}
              borderRadius="md"
              fontWeight="bold"
              _hover={{
                bg: 'green.600',
                transform: 'translateY(-2px)',
                boxShadow: 'md',
              }}
              transition="all 0.3s"
            >
              Get Started for Free
            </Box>
            <Box
              as="a"
              href="/courses"
              borderWidth={2}
              borderColor="green.500"
              color="green.500"
              px={8}
              py={3}
              borderRadius="md"
              fontWeight="bold"
              _hover={{
                bg: 'green.50',
                transform: 'translateY(-2px)',
                boxShadow: 'md',
              }}
              transition="all 0.3s"
            >
              Browse Courses
            </Box>
          </HStack>
        </Container>
      </Box>
    </Box>
  );
};

export default About;
