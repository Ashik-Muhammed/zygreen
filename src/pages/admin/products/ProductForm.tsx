import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Product } from '../../../types/product';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  HStack,
  useToast,
  Checkbox,
  Image,
  Text,
  IconButton,
} from '@chakra-ui/react';
import { FiUpload, FiX } from 'react-icons/fi';

interface ProductFormProps {
  isEdit?: boolean;
}

export const ProductForm = ({ isEdit = false }: ProductFormProps) => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  // Image upload state will be implemented when storage is set up
  
  const [product, setProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    price: '',
    description: '',
    features: [],
    image: '',
    category: 'Digital Products',
    isNew: false,
    isPopular: false,
    status: 'active',
  });
  const [currentFeature, setCurrentFeature] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      fetchProduct();
    }
  }, [isEdit, id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'products', id!);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<Product, 'id'>;
        setProduct({
          ...data,
          features: data.features || [],
        });
      } else {
        toast({
          title: 'Error',
          description: 'Product not found',
          status: 'error',
        });
        navigate('/admin/products');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch product',
        status: 'error',
      });
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        ...product,
        updatedAt: serverTimestamp(),
      };

      if (isEdit && id) {
        await setDoc(doc(db, 'products', id), productData, { merge: true });
        toast({
          title: 'Success',
          description: 'Product updated successfully',
          status: 'success',
        });
      } else {
        await setDoc(doc(collection(db, 'products')), {
          ...productData,
          createdAt: serverTimestamp(),
        });
        toast({
          title: 'Success',
          description: 'Product created successfully',
          status: 'success',
        });
      }
      
      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error',
        description: 'Failed to save product',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real app, you would upload the file to Firebase Storage here
    // For now, we'll just create a local URL for the image
    const imageUrl = URL.createObjectURL(file);
    setProduct({ ...product, image: imageUrl });
  };

  const addFeature = () => {
    if (currentFeature.trim()) {
      setProduct({
        ...product,
        features: [...product.features, currentFeature.trim()],
      });
      setCurrentFeature('');
    }
  };

  const removeFeature = (index: number) => {
    const newFeatures = [...product.features];
    newFeatures.splice(index, 1);
    setProduct({ ...product, features: newFeatures });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Box p={4}>
      <Text fontSize="2xl" fontWeight="bold" mb={6}>
        {isEdit ? 'Edit Product' : 'Add New Product'}
      </Text>

      <form onSubmit={handleSubmit}>
        <VStack spacing={6}>
          <FormControl isRequired>
            <FormLabel>Product Name</FormLabel>
            <Input
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
              placeholder="Enter product name"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Price</FormLabel>
            <Input
              type="text"
              value={product.price}
              onChange={(e) => setProduct({ ...product, price: e.target.value })}
              placeholder="Enter price"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Description</FormLabel>
            <Textarea
              value={product.description}
              onChange={(e) => setProduct({ ...product, description: e.target.value })}
              placeholder="Enter product description"
              rows={4}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Category</FormLabel>
            <Select
              value={product.category}
              onChange={(e) => setProduct({ ...product, category: e.target.value })}
            >
              <option value="Digital Products">Digital Products</option>
              <option value="Services">Services</option>
              <option value="Licenses">Licenses</option>
              <option value="Others">Others</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Status</FormLabel>
            <Select
              value={product.status}
              onChange={(e) => setProduct({ ...product, status: e.target.value as any })}
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Product Image</FormLabel>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              display="none"
              id="image-upload"
            />
            <Box
              border="2px dashed"
              borderColor="gray.300"
              p={4}
              textAlign="center"
              borderRadius="md"
              cursor="pointer"
              _hover={{ borderColor: 'blue.500' }}
            >
              <label htmlFor="image-upload" style={{ cursor: 'pointer' }}>
                {product.image ? (
                  <Box>
                    <Image src={product.image} alt="Preview" maxH="200px" mx="auto" mb={2} />
                    <Button leftIcon={<FiUpload />} size="sm" variant="outline">
                      Change Image
                    </Button>
                  </Box>
                ) : (
                  <Box p={8}>
                    <FiUpload size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                    <Text>Click to upload an image</Text>
                    <Text fontSize="sm" color="gray.500">Recommended size: 800x600px</Text>
                  </Box>
                )}
              </label>
            </Box>
          </FormControl>

          <FormControl>
            <FormLabel>Features</FormLabel>
            <HStack>
              <Input
                value={currentFeature}
                onChange={(e) => setCurrentFeature(e.target.value)}
                placeholder="Add a feature"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              />
              <Button onClick={addFeature} type="button">
                Add
              </Button>
            </HStack>
            <VStack align="start" mt={2} spacing={2}>
              {product.features.map((feature, index) => (
                <HStack key={index} bg="gray.50" p={2} borderRadius="md" w="100%">
                  <Text flex={1}>{feature}</Text>
                  <IconButton
                    icon={<FiX />}
                    size="sm"
                    variant="ghost"
                    aria-label="Remove feature"
                    onClick={() => removeFeature(index)}
                  />
                </HStack>
              ))}
            </VStack>
          </FormControl>

          <HStack spacing={4} w="100%" pt={4} borderTopWidth={1}>
            <Checkbox
              isChecked={product.isNew}
              onChange={(e) => setProduct({ ...product, isNew: e.target.checked })}
            >
              Mark as New
            </Checkbox>
            <Checkbox
              isChecked={product.isPopular}
              onChange={(e) => setProduct({ ...product, isPopular: e.target.checked })}
            >
              Mark as Popular
            </Checkbox>
          </HStack>

          <HStack spacing={4} justifyContent="flex-end" w="100%" pt={4}>
            <Button variant="outline" onClick={() => navigate('/admin/products')}>
              Cancel
            </Button>
            <Button colorScheme="blue" type="submit" isLoading={loading}>
              {isEdit ? 'Update Product' : 'Create Product'}
            </Button>
          </HStack>
        </VStack>
      </form>
    </Box>
  );
};

export default ProductForm;
