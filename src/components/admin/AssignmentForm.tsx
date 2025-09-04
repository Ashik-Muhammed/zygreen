import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  HStack,
  useToast,
  FormErrorMessage,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
  Text,
  Heading,
  useDisclosure,
  Select,
  FormHelperText,
  IconButton,
} from '@chakra-ui/react';
import { FiSave, FiX, FiUpload, FiTrash2 } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';
import { Assignment, SubmissionType } from '../../types/assignment';
import { createAssignment, updateAssignment, getAssignmentById } from '../../services/assignmentService';
import ConfirmationDialog from '../common/ConfirmationDialog';

interface AssignmentFormProps {
  isEdit?: boolean;
  initialData?: Partial<Assignment>;
}

const defaultValues: Partial<Assignment> = {
  title: '',
  description: '',
  courseId: '',
  instructions: '',
  attachments: [],
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  totalPoints: 100,
  isPublished: false,
  submissionType: 'file' as SubmissionType,
};

const AssignmentForm = ({ isEdit = false, initialData }: AssignmentFormProps) => {
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId?: string }>();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<Assignment>({
    defaultValues: {
      ...defaultValues,
      ...initialData,
      courseId: courseId || '',
    },
  });

  // Fetch assignment data if in edit mode
  useEffect(() => {
    const fetchAssignment = async () => {
      if (isEdit && assignmentId) {
        try {
          setLoading(true);
          const data = await getAssignmentById(assignmentId);
          if (data) {
            reset({
              ...data,
              dueDate: data.dueDate instanceof Date 
                ? data.dueDate.toISOString().split('T')[0] 
                : new Date(data.dueDate).toISOString().split('T')[0],
            });
          }
        } catch (error) {
          toast({
            title: 'Error loading assignment',
            description: 'Failed to load assignment data. Please try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          navigate(`/admin/courses/${courseId}/assignments`);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAssignment();
  }, [isEdit, assignmentId, courseId, reset, toast, navigate]);

  const handleFileUpload = async (file: File): Promise<{ name: string; url: string; type: string; id: string }> => {
    // In a real app, you would upload the file to a storage service
    // and return the download URL. For now, we'll just simulate it.
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: uuidv4(),
          name: file.name,
          url: URL.createObjectURL(file),
          type: file.type,
        });
      }, 1000);
    });
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setFileUploading(true);
      const uploadPromises = Array.from(files).map(file => handleFileUpload(file));
      const uploadedFiles = await Promise.all(uploadPromises);

      setValue('attachments', [...(watch('attachments') || []), ...uploadedFiles]);
      
      toast({
        title: 'Files uploaded',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Error uploading files',
        description: 'Failed to upload one or more files. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setFileUploading(false);
      // Reset the file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const removeAttachment = (id: string) => {
    const currentAttachments = watch('attachments') || [];
    const updatedAttachments = currentAttachments.filter(attachment => attachment.id !== id);
    setValue('attachments', updatedAttachments);
  };

  const onSubmit = async (data: Assignment) => {
    if (!courseId) return;

    try {
      setIsSubmitting(true);
      
      const assignmentData = {
        ...data,
        dueDate: new Date(data.dueDate),
      };

      if (isEdit && assignmentId) {
        await updateAssignment(assignmentId, assignmentData);
        toast({
          title: 'Assignment updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createAssignment({
          ...assignmentData,
          courseId,
        });
        toast({
          title: 'Assignment created',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      navigate(`/admin/courses/${courseId}/assignments`);
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast({
        title: 'Error',
        description: `Failed to ${isEdit ? 'update' : 'create'} assignment. Please try again.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (JSON.stringify(watch()) !== JSON.stringify({ ...defaultValues, courseId })) {
      onOpen();
    } else {
      navigate(`/admin/courses/${courseId}/assignments`);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Box p={6}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={6} align="stretch">
          <HStack justifyContent="space-between" alignItems="center">
            <Heading size="lg">{isEdit ? 'Edit Assignment' : 'Create New Assignment'}</Heading>
            <HStack>
              <Button
                leftIcon={<FiX />}
                variant="outline"
                onClick={handleCancel}
                isDisabled={isSubmitting || fileUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                leftIcon={<FiSave />}
                colorScheme="blue"
                isLoading={isSubmitting || fileUploading}
                loadingText={fileUploading ? 'Uploading...' : 'Saving...'}
              >
                {isEdit ? 'Update Assignment' : 'Create Assignment'}
              </Button>
            </HStack>
          </HStack>

          <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
            <VStack spacing={6} align="stretch">
              <FormControl isInvalid={!!errors.title} isRequired>
                <FormLabel>Assignment Title</FormLabel>
                <Input
                  placeholder="Enter assignment title"
                  {...register('title', { required: 'Title is required' })}
                />
                <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.description} isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Enter assignment description"
                  rows={3}
                  {...register('description', { required: 'Description is required' })}
                />
                <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.instructions} isRequired>
                <FormLabel>Instructions</FormLabel>
                <Textarea
                  placeholder="Enter detailed instructions for the assignment"
                  rows={5}
                  {...register('instructions', { required: 'Instructions are required' })}
                />
                <FormHelperText>
                  Provide clear instructions for students on how to complete and submit this assignment.
                </FormHelperText>
                <FormErrorMessage>{errors.instructions?.message}</FormErrorMessage>
              </FormControl>

              <HStack spacing={6} align="start">
                <FormControl isInvalid={!!errors.dueDate} isRequired width="250px">
                  <FormLabel>Due Date</FormLabel>
                  <Input
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
                    {...register('dueDate', { required: 'Due date is required' })}
                  />
                  <FormErrorMessage>{errors.dueDate?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.totalPoints} isRequired width="150px">
                  <FormLabel>Total Points</FormLabel>
                  <NumberInput min={0} defaultValue={100}>
                    <NumberInputField
                      {...register('totalPoints', {
                        valueAsNumber: true,
                        min: { value: 0, message: 'Points cannot be negative' },
                      })}
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormErrorMessage>{errors.totalPoints?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.submissionType} isRequired width="250px">
                  <FormLabel>Submission Type</FormLabel>
                  <Select
                    placeholder="Select submission type"
                    {...register('submissionType', { required: 'Submission type is required' })}
                  >
                    <option value="file">File Upload</option>
                    <option value="text">Text Entry</option>
                    <option value="both">File or Text</option>
                  </Select>
                  <FormErrorMessage>{errors.submissionType?.message}</FormErrorMessage>
                </FormControl>

                <FormControl display="flex" alignItems="center" mt={8}>
                  <Checkbox
                    id="isPublished"
                    {...register('isPublished')}
                    colorScheme="green"
                  >
                    <Text ml={2}>Publish this assignment</Text>
                  </Checkbox>
                </FormControl>
              </HStack>
            </VStack>
          </Box>

          <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
            <VStack spacing={4} align="stretch">
              <Box>
                <FormLabel>Attachments</FormLabel>
                <FormHelperText mb={4}>
                  Add any files that students will need to complete this assignment.
                </FormHelperText>
                
                <Input
                  type="file"
                  id="file-upload"
                  multiple
                  onChange={onFileChange}
                  display="none"
                />
                <Button
                  as="label"
                  htmlFor="file-upload"
                  leftIcon={<FiUpload />}
                  colorScheme="blue"
                  variant="outline"
                  cursor="pointer"
                  isLoading={fileUploading}
                  loadingText="Uploading..."
                >
                  Upload Files
                </Button>
              </Box>

              {watch('attachments')?.length > 0 && (
                <Box mt={4}>
                  <Text fontWeight="medium" mb={2}>
                    Attached Files ({watch('attachments')?.length})
                  </Text>
                  <VStack align="stretch" spacing={2}>
                    {watch('attachments')?.map((file) => (
                      <HStack
                        key={file.id}
                        p={3}
                        borderWidth="1px"
                        borderRadius="md"
                        justifyContent="space-between"
                      >
                        <Text isTruncated>{file.name}</Text>
                        <IconButton
                          aria-label="Remove file"
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => removeAttachment(file.id)}
                          isDisabled={fileUploading}
                        />
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}
            </VStack>
          </Box>
        </VStack>
      </form>

      <ConfirmationDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => navigate(`/admin/courses/${courseId}/assignments`)}
        title="Discard Changes"
        message="You have unsaved changes. Are you sure you want to leave?"
        confirmText="Discard"
        cancelText="Keep Editing"
      />
    </Box>
  );
};

export default AssignmentForm;
