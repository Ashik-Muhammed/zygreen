import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  useToast,
  Image,
  Box,
  Text,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { v4 as uuidv4 } from 'uuid';

export interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

const ProductForm: React.FC<ProductFormProps> = ({ isOpen, onClose, product }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'book',
    stock: 0,
    imageUrl: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || 0,
        category: product.category || 'book',
        stock: product.stock || 0,
        imageUrl: product.imageUrl || '',
      });
      if (product.imageUrl) {
        setImagePreview(product.imageUrl);
      }
    } else {
      // Reset form when adding new product
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: 'book',
        stock: 0,
        imageUrl: '',
      });
      setImagePreview('');
      setImageFile(null);
    }
  }, [product, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value,
    }));
  };

  const handleNumberInputChange = (name: string, _: string, valueAsNumber: number) => {
    setFormData(prev => ({
      ...prev,
      [name]: valueAsNumber,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    if (!file) return '';
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const storageRef = ref(storage, `products/${fileName}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let imageUrl = formData.imageUrl;
      
      // Upload new image if selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const productData = {
        ...formData,
        imageUrl,
        updatedAt: serverTimestamp(),
      };

      if (product) {
        // Update existing product
        await setDoc(doc(db, 'products', product.id), productData, { merge: true });
        toast({
          title: 'Product updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new product
        const newProductRef = doc(collection(db, 'products'));
        await setDoc(newProductRef, {
          ...productData,
          createdAt: serverTimestamp(),
        });
        toast({
          title: 'Product created',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error saving product',
        description: 'There was an error saving the product. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>{product ? 'Edit Product' : 'Add New Product'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Product Name</FormLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Description</FormLabel>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter product description"
                rows={4}
              />
            </FormControl>

            <HStack w="100%" spacing={4}>
              <FormControl isRequired>
                <FormLabel>Price</FormLabel>
                <NumberInput
                  min={0}
                  precision={2}
                  value={formData.price}
                  onChange={(valueAsString, valueAsNumber) =>
                    handleNumberInputChange('price', valueAsString, valueAsNumber)
                  }
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Stock</FormLabel>
                <NumberInput
                  min={0}
                  value={formData.stock}
                  onChange={(valueAsString, valueAsNumber) =>
                    handleNumberInputChange('stock', valueAsString, valueAsNumber)
                  }
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Category</FormLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="book">Book</option>
                  <option value="kit">Kit</option>
                  <option value="course">Course</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel>Product Image</FormLabel>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                p={1}
              />
              {imagePreview && (
                <Box mt={2}>
                  <Text fontSize="sm" mb={1}>
                    Image Preview:
                  </Text>
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    maxH="200px"
                    objectFit="contain"
                  />
                </Box>
              )}
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose} mr={3}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            type="submit"
            isLoading={isUploading}
            loadingText={product ? 'Updating...' : 'Creating...'}
          >
            {product ? 'Update Product' : 'Create Product'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProductForm;
