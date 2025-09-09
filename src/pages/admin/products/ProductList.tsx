import { useState, useEffect, useRef } from 'react';
import { Box, Button, Table, Thead, Tbody, Tr, Th, Td, Image, Badge, IconButton, useDisclosure, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useToast, Flex, Text } from '@chakra-ui/react';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Product } from '../../../types/product';

export const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Product[];
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({ title: 'Error', description: 'Failed to fetch products', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteDoc(doc(db, 'products', productToDelete));
      setProducts(products.filter(p => p.id !== productToDelete));
      toast({ title: 'Success', description: 'Product deleted', status: 'success' });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({ title: 'Error', description: 'Failed to delete product', status: 'error' });
    } finally {
      setProductToDelete(null);
      onClose();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Box p={4}>
      <Flex justify="space-between" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">Products</Text>
        <Button as={RouterLink} to="/admin/products/new" colorScheme="blue" leftIcon={<FiPlus />}>
          Add Product
        </Button>
      </Flex>

      <Box bg="white" rounded="lg" shadow="sm" p={4} overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Image</Th>
              <Th>Name</Th>
              <Th>Price</Th>
              <Th>Category</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {products.map((product) => (
              <Tr key={product.id}>
                <Td><Image src={product.image} alt={product.name} boxSize="50px" objectFit="cover" /></Td>
                <Td>{product.name}</Td>
                <Td>{product.price}</Td>
                <Td>{product.category}</Td>
                <Td>
                  <Badge colorScheme={product.status === 'active' ? 'green' : 'gray'}>
                    {product.status || 'active'}
                  </Badge>
                </Td>
                <Td>
                  <IconButton
                    as={RouterLink}
                    to={`/admin/products/edit/${product.id}`}
                    aria-label="Edit product"
                    icon={<FiEdit2 />}
                    size="sm"
                    mr={2}
                  />
                  <IconButton
                    aria-label="Delete product"
                    icon={<FiTrash2 />}
                    size="sm"
                    colorScheme="red"
                    onClick={() => {
                      setProductToDelete(product.id);
                      onOpen();
                    }}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Delete Product</AlertDialogHeader>
            <AlertDialogBody>Are you sure you want to delete this product?</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>Cancel</Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>Delete</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ProductList;
