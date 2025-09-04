import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';

const CoursePlayer = () => {
  const { courseId } = useParams<{ courseId: string }>();
  
  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Heading as="h1" size="xl">
          Course Player
        </Heading>
        <Text>Currently viewing course: {courseId}</Text>
        {/* Add video player and course content here */}
      </VStack>
    </Box>
  );
};

export default CoursePlayer;
