import { Box, Button, Flex, Heading, Table, Thead, Tbody, Tr, Th, Td, Badge, Avatar, HStack, Text, useColorModeValue, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Input, Select, useToast, IconButton, Menu, MenuButton, MenuList, MenuItem, Skeleton } from '@chakra-ui/react';
import { FiEdit2, FiTrash2, FiMoreVertical, FiEye, FiEyeOff, FiUserPlus } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { User, getAllUsers } from '../../services/apiService';

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const results = users.filter(user => 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(results);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const userList = await getAllUsers();
      const sortedUsers = [...userList].sort((a, b) => {
        const timeA = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
        const timeB = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
        return timeB - timeA;
      });
      setUsers(sortedUsers);
      setFilteredUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    onOpen();
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        displayName: selectedUser.displayName || '',
        role: selectedUser.role || 'user',
        updatedAt: new Date()
      });
      
      toast({
        title: 'User updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      await fetchUsers();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      await updateDoc(doc(db, 'users', user.id), {
        isActive: !user.isActive,
        updatedAt: new Date()
      });
      
      toast({
        title: `User ${!user.isActive ? 'activated' : 'deactivated'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      await fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">User Management</Heading>
        <Button leftIcon={<FiUserPlus />} colorScheme="blue">
          Add User
        </Button>
      </Flex>

      <Box bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor} mb={6}>
        <FormControl mb={6} maxW="md">
          <Input
            placeholder="Search users by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </FormControl>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>User</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Last Active</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoading ? (
                <Tr>
                  <Td colSpan={6} textAlign="center">
                    <Skeleton height="40px" />
                  </Td>
                </Tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <Tr key={user.id}>
                    <Td>
                      <HStack>
                        <Avatar 
                          size="sm" 
                          name={user.displayName || user.email} 
                          src={user.photoURL} 
                          bg={useColorModeValue('gray.200', 'gray.600')}
                        />
                        <Box>
                          <Text fontWeight="medium">{user.displayName || 'No Name'}</Text>
                          <Text fontSize="sm" color="gray.500">ID: {user.id.substring(0, 6)}...</Text>
                        </Box>
                      </HStack>
                    </Td>
                    <Td>{user.email}</Td>
                    <Td>
                      <Badge colorScheme={user.role === 'admin' ? 'purple' : 'blue'}>
                        {user.role || 'user'}
                      </Badge>
                    </Td>
                    <Td>
                      <Menu>
                        <MenuButton 
                          as={Button} 
                          size="xs" 
                          variant="ghost"
                          colorScheme={user.isActive ? 'green' : 'red'}
                          rightIcon={<FiMoreVertical size={12} />}
                        >
                          <Badge colorScheme={user.isActive ? 'green' : 'red'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </MenuButton>
                        <MenuList minW="150px">
                          <MenuItem 
                            icon={user.isActive ? <FiEyeOff /> : <FiEye />}
                            onClick={() => handleToggleUserStatus(user)}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                    <Td>
                      {user.lastLoginAt ? (
                        <Text>{format(new Date(user.lastLoginAt), 'MMM d, yyyy h:mm a')}</Text>
                      ) : (
                        <Text color="gray.500">Never</Text>
                      )}
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Edit user"
                          icon={<FiEdit2 />}
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        />
                        <IconButton
                          aria-label="Delete user"
                          icon={<FiTrash2 />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleToggleUserStatus(user)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={6} textAlign="center" py={10}>
                    <Text color="gray.500">No users found</Text>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      </Box>

      {/* Edit User Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit User</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl mb={4}>
              <FormLabel>Name</FormLabel>
              <Input 
                placeholder="Full name" 
                value={selectedUser?.displayName || ''}
                onChange={(e) => selectedUser && setSelectedUser({...selectedUser, displayName: e.target.value})}
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Email</FormLabel>
              <Input 
                type="email" 
                placeholder="Email" 
                value={selectedUser?.email || ''}
                isReadOnly
              />
            </FormControl>
            <FormControl>
              <FormLabel>Role</FormLabel>
              <Select 
                value={selectedUser?.role || 'user'}
                onChange={(e) => selectedUser && setSelectedUser({...selectedUser, role: e.target.value})}
              >
                <option value="admin">Admin</option>
                <option value="instructor">Instructor</option>
                <option value="user">User</option>
              </Select>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveUser}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Users;
