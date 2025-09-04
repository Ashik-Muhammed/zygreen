import { Box, Heading, Text } from '@chakra-ui/react';

const MyCertificates = () => {
  return (
    <Box p={4}>
      <Heading as="h1" size="xl" mb={6}>
        My Certificates
      </Heading>
      <Text>Your earned certificates will appear here.</Text>
      {/* Add certificates list component here */}
    </Box>
  );
};

export default MyCertificates;
