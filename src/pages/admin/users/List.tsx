import { Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, Badge, IconButton, HStack, Text } from '@chakra-ui/react';
import { FiEdit2, FiTrash2, FiUserPlus } from 'react-icons/fi';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const ManageUsers = () => {
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  // Mock data - replace with actual data from API
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'instructor', status: 'active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'student', status: 'inactive' },
  ];

  const handleDelete = async (userId: number) => {
    try {
      setIsDeleting(userId);
      // TODO: Implement delete user API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Handle success
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'orange';
      case 'suspended':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Box p={4}>
      <HStack justify="space-between" mb={6}>
        <Heading as="h1" size="xl">Manage Users</Heading>
        <Button as={Link} to="/admin/users/create" leftIcon={<FiUserPlus />} colorScheme="blue">
          Add User
        </Button>
      </HStack>

      <Box bg="white" p={4} borderRadius="md" boxShadow="sm" overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <Tr key={user.id}>
                  <Td>{user.name}</Td>
                  <Td>{user.email}</Td>
                  <Td>
                    <Badge colorScheme={user.role === 'admin' ? 'purple' : user.role === 'instructor' ? 'blue' : 'gray'}>
                      {user.role}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        as={Link}
                        to={`/admin/users/edit/${user.id}`}
                        icon={<FiEdit2 />}
                        aria-label="Edit user"
                        size="sm"
                      />
                      <IconButton
                        icon={<FiTrash2 />}
                        aria-label="Delete user"
                        colorScheme="red"
                        variant="ghost"
                        size="sm"
                        isLoading={isDeleting === user.id}
                        onClick={() => handleDelete(user.id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={5} textAlign="center" py={6}>
                  <Text color="gray.500">No users found</Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default ManageUsers;
