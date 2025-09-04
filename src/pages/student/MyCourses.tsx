import { Box, Heading, Text } from '@chakra-ui/react';

const MyCourses = () => {
  return (
    <Box p={4}>
      <Heading as="h1" size="xl" mb={6}>
        My Enrolled Courses
      </Heading>
      <Text>Your enrolled courses will appear here.</Text>
      {/* Add course list component here */}
    </Box>
  );
};

export default MyCourses;
