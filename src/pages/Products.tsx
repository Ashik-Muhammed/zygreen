import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  SimpleGrid, 
  Card, 
  CardBody, 
  CardFooter, 
  Button, 
  VStack, 
  HStack, 
  Image, 
  Badge, 
  Skeleton, 
  useToast,
  useBreakpointValue
} from '@chakra-ui/react';
import { FiShoppingCart, FiTag } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types/product';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsRef = collection(db, 'products');
        const q = query(
          productsRef,
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];

        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: 'Error',
          description: 'Failed to load products',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [toast]);

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {[...Array(6)].map((_, i) => (
            <Card key={i} overflow="hidden">
              <Skeleton height="200px" />
              <CardBody>
                <Skeleton height="20px" mb={4} />
                <Skeleton height="16px" mb={2} />
                <Skeleton height="16px" width="80%" />
              </CardBody>
              <CardFooter>
                <Skeleton height="40px" width="100%" />
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    );
  }

  return (
    <Box bg="gray.50" minH="100vh" py={8}>
      <Container maxW="container.xl">
        <Box textAlign="center" mb={12}>
          <Badge colorScheme="blue" px={4} py={1} borderRadius="full" mb={4} fontSize="sm">
            Our Products
          </Badge>
          <Heading as="h1" size="2xl" mb={4}>
            Explore Our Solutions
          </Heading>
          <Text color="gray.600" maxW="2xl" mx="auto">
            Discover our range of educational products and services designed to help you succeed
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {products.map((product) => (
            <Card 
              key={product.id} 
              overflow="hidden" 
              borderWidth="1px"
              _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
              transition="all 0.2s"
            >
              <Box h="200px" overflow="hidden" position="relative">
                <Image
                  src={product.image}
                  alt={product.name}
                  w="100%"
                  h="100%"
                  objectFit="cover"
                  loading="lazy"
                />
                {product.isNew && (
                  <Badge 
                    colorScheme="green" 
                    position="absolute" 
                    top={2} 
                    right={2}
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    New
                  </Badge>
                )}
              </Box>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <HStack spacing={2}>
                    <Badge colorScheme="blue" px={2} py={0.5} borderRadius="md">
                      {product.category}
                    </Badge>
                    {product.isPopular && (
                      <Badge colorScheme="yellow" px={2} py={0.5} borderRadius="md">
                        Popular
                      </Badge>
                    )}
                  </HStack>
                  <Heading size="md" mt={2} noOfLines={1}>
                    {product.name}
                  </Heading>
                  <Text color="blue.600" fontSize="xl" fontWeight="bold">
                    {product.price}
                  </Text>
                  <Text color="gray.600" noOfLines={2}>
                    {product.description}
                  </Text>
                  <VStack align="start" spacing={1} w="100%" mt={2}>
                    {product.features.slice(0, 3).map((feature, i) => (
                      <HStack key={i} spacing={2}>
                        <Box color="green.500">
                          <FiTag size={14} />
                        </Box>
                        <Text fontSize="sm" color="gray.700" noOfLines={1}>
                          {feature}
                        </Text>
                      </HStack>
                    ))}
                    {product.features.length > 3 && (
                      <Text fontSize="sm" color="blue.500">
                        +{product.features.length - 3} more features
                      </Text>
                    )}
                  </VStack>
                </VStack>
              </CardBody>
              <CardFooter pt={0}>
                <Button
                  as={RouterLink}
                  to={`/contact?product=${encodeURIComponent(product.name)}`}
                  colorScheme="blue"
                  size={isMobile ? 'md' : 'lg'}
                  w="full"
                  leftIcon={<FiShoppingCart />}
                >
                  Enquire Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default Products;
