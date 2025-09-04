import { Box, Container, Heading, Text, SimpleGrid, Card, CardBody, CardHeader, CardFooter, Button, VStack, HStack, useBreakpointValue } from '@chakra-ui/react';
import { FiCheck, FiX } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';

type Plan = {
  name: string;
  price: string;
  description: string;
  features: string[];
  notIncluded?: string[];
  isPopular?: boolean;
  buttonText: string;
  buttonVariant: string;
};

const Pricing = () => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  const plans: Plan[] = [
    {
      name: 'Basic',
      price: 'Free',
      description: 'Perfect for getting started with our platform',
      features: [
        'Access to free courses',
        'Community support',
        'Basic learning resources',
        'Email support',
      ],
      notIncluded: [
        'Certificate of completion',
        'Premium courses',
        '1-on-1 mentoring',
      ],
      buttonText: 'Get Started',
      buttonVariant: 'outline',
    },
    {
      name: 'Premium',
      price: 'Custom',
      description: 'For professionals',
      features: [
        'Access to all courses',
        'Team management',
        '1-on-1 mentoring',
        'Custom learning paths',
        'Dedicated account manager',
        'API access',
        'Certificate of completion',
        'Priority support',
      ],
      buttonText: 'Contact Sales',
      buttonVariant: 'outline',
    },
  ];

  return (
    <Box py={20}>
      <Container maxW="container.xl">
        <VStack spacing={6} textAlign="center" mb={16}>
          <Text color="green.500" fontWeight="semibold">PRICING</Text>
          <Heading as="h1" size="2xl" mb={4}>
            Simple, transparent pricing
          </Heading>
          <Text fontSize="xl" color="gray.600" maxW="2xl">
            Choose the perfect plan for your learning journey. No hidden fees, cancel anytime.
          </Text>
        </VStack>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} alignItems="stretch" maxW="2xl" mx="auto">
        {plans.map((plan) => (
          <Card 
            key={plan.name}
            borderWidth={plan.isPopular ? '2px' : '1px'}
            borderColor={plan.isPopular ? 'green.400' : 'gray.200'}
            position="relative"
            _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
            transition="all 0.3s"
          >
            {plan.isPopular && (
              <Box
                position="absolute"
                top={-3}
                left="50%"
                transform="translateX(-50%)"
                bg="green.500"
                color="white"
                px={4}
                py={1}
                borderRadius="full"
                fontSize="sm"
                fontWeight="bold"
              >
                Most Popular
              </Box>
            )}
            <CardHeader>
              <VStack spacing={2} align={isMobile ? 'center' : 'flex-start'}>
                <Heading size="lg">{plan.name}</Heading>
                <Box>
                  <Text as="span" fontSize="4xl" fontWeight="bold">
                    {plan.price}
                  </Text>
                  {plan.price !== 'Free' && plan.price !== 'Custom' && (
                    <Text as="span" color="gray.500">/month</Text>
                  )}
                </Box>
                <Text color="gray.600">{plan.description}</Text>
              </VStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {plan.features.map((feature) => (
                  <HStack key={feature} spacing={3}>
                    <Box color="green.500">
                      <FiCheck />
                    </Box>
                    <Text>{feature}</Text>
                  </HStack>
                ))}
                {plan.notIncluded?.map((item) => (
                  <HStack key={item} spacing={3} opacity={0.5}>
                    <Box color="red.400">
                      <FiX />
                    </Box>
                    <Text textDecoration="line-through">{item}</Text>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
            <CardFooter pt={0}>
              <Button
                as={RouterLink}
                to={plan.name === 'Enterprise' ? '/contact' : '/signup'}
                colorScheme={plan.isPopular ? 'green' : 'gray'}
                variant={plan.buttonVariant as any}
                size="lg"
                width="full"
              >
                {plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </SimpleGrid>

      <Box mt={16} textAlign="center">
        <Text color="gray.500" mb={4}>
          Need a custom plan for your team?
        </Text>
        <Button 
          as={RouterLink} 
          to="/contact" 
          colorScheme="green" 
          variant="outline"
          size="lg"
        >
          Contact Sales
        </Button>
      </Box>
    </Container>
  </Box>
  );
};

export default Pricing;
