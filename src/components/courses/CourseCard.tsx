import { Box, Button, Flex, HStack, Image, Tag, Text, useColorModeValue, Heading, Tooltip } from '@chakra-ui/react';
import { FiClock, FiStar } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { Course } from '../../types';

interface CourseCardProps {
  course: Course;
}

const CourseCard = ({ course }: CourseCardProps) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box 
      bg={cardBg}
      borderRadius="lg"
      overflow="hidden"
      borderWidth="1px"
      borderColor={borderColor}
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: 'lg',
        transition: 'all 0.2s',
      }}
    >
      <Box h="160px" bg="gray.200" overflow="hidden" position="relative">
        {course.thumbnailUrl || course.imageUrl ? (
          <Image 
            src={course.thumbnailUrl || course.imageUrl} 
            alt={course.title} 
            w="100%"
            h="100%"
            objectFit="cover"
            _hover={{
              transform: 'scale(1.05)',
              transition: 'transform 0.3s',
            }}
          />
        ) : (
          <Flex 
            w="100%" 
            h="100%" 
            bg="gray.300" 
            align="center" 
            justify="center"
            color="gray.500"
          >
            <Text>No image available</Text>
          </Flex>
        )}
      </Box>
      
      <Box p={5}>
        <Flex justify="space-between" mb={2}>
          <HStack spacing={2}>
            <Tag size="sm" colorScheme="blue" borderRadius="full">
              {course.category || 'Uncategorized'}
            </Tag>
            {course.id && (
              <Tooltip label="Course ID">
                <Tag size="sm" variant="outline" colorScheme="gray" borderRadius="full" fontFamily="mono">
                  {course.id}
                </Tag>
              </Tooltip>
            )}
          </HStack>
          <Tag 
            size="sm" 
            colorScheme={
              course.level === 'beginner' ? 'green' : 
              course.level === 'intermediate' ? 'yellow' : 'red'
            } 
            variant="subtle"
            borderRadius="full"
          >
            {course.level}
          </Tag>
        </Flex>
        
        <Heading as="h3" size="md" mb={2} noOfLines={2} minH="56px">
          {course.title}
        </Heading>
        
        <Text color="gray.600" fontSize="sm" mb={4} noOfLines={2} minH="40px">
          {course.description}
        </Text>
        
        <Flex align="center" color="gray.500" fontSize="sm" mb={4}>
          <HStack spacing={2} mr={4}>
            <FiStar color="#ECC94B" />
            <Text>{course.rating ? course.rating.toFixed(1) : 'N/A'}</Text>
            <Text>({course.enrolledStudents || 0})</Text>
          </HStack>
          <HStack spacing={2}>
            <FiClock />
            <Text>{course.duration} hours</Text>
          </HStack>
        </Flex>
        
        <Flex justify="space-between" align="center" pt={4} borderTopWidth="1px" borderColor={borderColor}>
          <Box>
            {course.price > 0 ? (
              course.discountPrice && course.discountPrice < course.price ? (
                <Flex align="baseline">
                  <Text fontSize="xl" fontWeight="bold" color="blue.600" mr={2}>
                    ${course.discountPrice.toFixed(2)}
                  </Text>
                  <Text as="s" fontSize="sm" color="gray.500">
                    ${course.price.toFixed(2)}
                  </Text>
                </Flex>
              ) : (
                <Text fontSize="xl" fontWeight="bold" color="blue.600">
                  ${course.price.toFixed(2)}
                </Text>
              )
            ) : (
              <Text fontSize="xl" fontWeight="bold" color="green.600">
                Free
              </Text>
            )}
          </Box>
          
          <Button 
            as={RouterLink} 
            to={`/courses/${course.id}`} 
            colorScheme="blue" 
            size="sm"
            variant="outline"
            onClick={(e) => e.stopPropagation()}
          >
            View Details
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default CourseCard;
