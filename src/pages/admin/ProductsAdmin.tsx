import { Box, Button, Table, Thead, Tbody, Tr, Th, Td, IconButton, useDisclosure, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, useToast } from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { useState, useRef, useEffect } from 'react';
import { collection, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import ProductForm from '../../components/admin/ProductForm';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  createdAt: Date;
}

const ProductsAdmin = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  // Fetch products
  useEffect(() => {
    const q = collection(db, 'products');
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      } as Product));
      setProducts(productsList);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    onOpen();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteDoc(doc(db, 'products', deleteId));
      toast({
        title: 'Product deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error deleting product',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    
    setDeleteId(null);
    onDeleteClose();
  };

  const handleAddNew = () => {
    setSelectedProduct(null);
    onOpen();
  };

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" mb={6}>
        <h1>Manage Products</h1>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleAddNew}>
          Add Product
        </Button>
      </Box>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Image</Th>
            <Th>Name</Th>
            <Th>Category</Th>
            <Th isNumeric>Price</Th>
            <Th>Stock</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {products.map((product) => (
            <Tr key={product.id}>
              <Td>
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  style={{ width: '50px', height: '50px', objectFit: 'cover' }} 
                />
              </Td>
              <Td>{product.name}</Td>
              <Td>{product.category}</Td>
              <Td isNumeric>${product.price.toFixed(2)}</Td>
              <Td>{product.stock}</Td>
              <Td>
                <IconButton
                  aria-label="Edit product"
                  icon={<EditIcon />}
                  size="sm"
                  mr={2}
                  onClick={() => handleEdit(product)}
                />
                <IconButton
                  aria-label="Delete product"
                  icon={<DeleteIcon />}
                  size="sm"
                  colorScheme="red"
                  onClick={() => {
                    setDeleteId(product.id);
                    onDeleteOpen();
                  }}
                />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <ProductForm isOpen={isOpen} onClose={onClose} product={selectedProduct} />

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Product
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ProductsAdmin;
