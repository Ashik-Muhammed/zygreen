import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  Textarea, 
  Select, 
  NumberInput, 
  NumberInputField, 
  NumberInputStepper, 
  NumberIncrementStepper, 
  NumberDecrementStepper, 
  Switch, 
  VStack, 
  HStack, 
  Heading, 
  useToast,
  FormHelperText,
  FormErrorMessage,
  useColorModeValue,
  Divider,
  Text,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, DragHandleIcon } from '@chakra-ui/icons';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Assignment, Quiz, Activity, QuizQuestion } from '../../../../types/assignment';
import RichTextEditor from '../../../../components/editor/RichTextEditor';
import FileUpload from '../../../../components/common/FileUpload';

interface AssignmentFormProps {
  type?: 'assignment' | 'quiz' | 'activity';
  isEdit?: boolean;
}

const AssignmentForm = ({ type = 'assignment', isEdit = false }: AssignmentFormProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<Assignment | Quiz | Activity>({
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      courseId: '',
      moduleId: '',
      attachments: [],
      dueDate: new Date().toISOString().split('T')[0],
      availableFrom: new Date().toISOString().split('T')[0],
      availableUntil: '',
      totalPoints: 100,
      passingScore: 70,
      isPublished: false,
      status: 'draft',
      submissionType: type as any,
      timeLimit: 60,
      attemptsAllowed: 1,
      showCorrectAnswers: false,
      requirePassword: false,
      ...(type === 'quiz' ? {
        questions: [],
        shuffleQuestions: false,
        shuffleAnswers: false,
        showQuestionPerPage: true,
        passingScore: 70,
      } : {}),
      ...(type === 'activity' ? {
        isGroupActivity: false,
        maxGroupSize: 3,
        submissionInstructions: '',
      } : {}),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: type === 'quiz' ? 'questions' : 'attachments',
  });

  useEffect(() => {
    if (isEdit && id) {
      const fetchAssignment = async () => {
        try {
          const docRef = doc(db, 'assignments', id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            reset({
              ...data,
              dueDate: data.dueDate?.toDate().toISOString().split('T')[0],
              availableFrom: data.availableFrom?.toDate().toISOString().split('T')[0],
              availableUntil: data.availableUntil?.toDate().toISOString().split('T')[0],
            });
          } else {
            toast({
              title: 'Error',
              description: 'Assignment not found',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
            navigate('/admin/assignments');
          }
        } catch (error) {
          console.error('Error fetching assignment:', error);
          toast({
            title: 'Error',
            description: 'Failed to load assignment',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          navigate('/admin/assignments');
        } finally {
          setIsLoading(false);
        }
      };

      fetchAssignment();
    }
  }, [id, isEdit, navigate, reset, toast]);

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const assignmentData = {
        ...data,
        updatedAt: serverTimestamp(),
        ...(!isEdit && {
          createdAt: serverTimestamp(),
          createdBy: 'currentUserId', // Replace with actual user ID from auth context
        }),
      };

      if (isEdit && id) {
        await setDoc(doc(db, 'assignments', id), assignmentData, { merge: true });
        toast({
          title: 'Success',
          description: 'Assignment updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        const docRef = doc(collection(db, 'assignments'));
        await setDoc(docRef, {
          ...assignmentData,
          id: docRef.id,
        });
        toast({
          title: 'Success',
          description: 'Assignment created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      navigate('/admin/assignments');
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to save assignment',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q${Date.now()}`,
      question: '',
      questionType: 'multiple_choice',
      options: ['', '', '', ''],
      points: 1,
    };
    append(newQuestion as any);
  };

  const renderQuestionForm = (question: QuizQuestion, index: number) => (
    <Box key={question.id} p={4} borderWidth={1} borderRadius="md" mb={4} bg={cardBg} borderColor={borderColor}>
      <HStack justify="space-between" mb={4}>
        <Text fontWeight="bold">Question {index + 1}</Text>
        <IconButton
          icon={<DeleteIcon />}
          aria-label="Delete question"
          size="sm"
          variant="ghost"
          colorScheme="red"
          onClick={() => remove(index)}
        />
      </HStack>
      
      <FormControl isInvalid={!!errors.questions?.[index]?.question} mb={4}>
        <FormLabel>Question Text</FormLabel>
        <Input
          {...register(`questions.${index}.question` as const, {
            required: 'Question text is required',
          })}
          placeholder="Enter question text"
        />
        <FormErrorMessage>{
          errors.questions?.[index]?.question?.message
        }</FormErrorMessage>
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Question Type</FormLabel>
        <Select
          {...register(`questions.${index}.questionType` as const)}
          defaultValue="multiple_choice"
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="true_false">True/False</option>
          <option value="short_answer">Short Answer</option>
          <option value="essay">Essay</option>
          <option value="file_upload">File Upload</option>
        </Select>
      </FormControl>

      {['multiple_choice', 'true_false'].includes(watch(`questions.${index}.questionType`)) && (
        <Box mb={4}>
          <FormLabel>Options</FormLabel>
          <VStack spacing={2} align="stretch">
            {watch(`questions.${index}.options`)?.map((_, optionIndex) => (
              <HStack key={optionIndex}>
                <Input
                  {...register(`questions.${index}.options.${optionIndex}` as const, {
                    required: 'Option cannot be empty',
                  })}
                  placeholder={`Option ${optionIndex + 1}`}
                />
                <IconButton
                  icon={<DeleteIcon />}
                  aria-label="Delete option"
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => {
                    const options = [...(watch(`questions.${index}.options`) || [])];
                    options.splice(optionIndex, 1);
                    setValue(`questions.${index}.options` as const, options);
                  }}
                />
              </HStack>
            ))}
            <Button
              leftIcon={<AddIcon />}
              size="sm"
              variant="outline"
              onClick={() => {
                const options = [...(watch(`questions.${index}.options`) || [])];
                setValue(`questions.${index}.options` as const, [...options, '']);
              }}
            >
              Add Option
            </Button>
          </VStack>
        </Box>
      )}

      <FormControl>
        <FormLabel>Points</FormLabel>
        <NumberInput min={0} defaultValue={1}>
          <NumberInputField
            {...register(`questions.${index}.points` as const, {
              valueAsNumber: true,
              min: { value: 0, message: 'Points must be at least 0' },
            })}
          />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>
    </Box>
  );

  if (isLoading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>
        {isEdit ? 'Edit' : 'Create New'} {type.charAt(0).toUpperCase() + type.slice(1)}
      </Heading>

      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={6} align="stretch">
          <Box bg={cardBg} p={6} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
            <FormControl isInvalid={!!errors.title} mb={4}>
              <FormLabel>Title</FormLabel>
              <Input
                {...register('title', { required: 'Title is required' })}
                placeholder="Enter title"
              />
              <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Description</FormLabel>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter description"
                  />
                )}
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Instructions</FormLabel>
              <Controller
                name="instructions"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter instructions for students"
                  />
                )}
              />
            </FormControl>

            <FormControl isInvalid={!!errors.courseId} mb={4}>
              <FormLabel>Course</FormLabel>
              <Select
                placeholder="Select course"
                {...register('courseId', { required: 'Course is required' })}
              >
                {/* TODO: Fetch and populate courses */}
                <option value="course1">Course 1</option>
                <option value="course2">Course 2</option>
              </Select>
              <FormErrorMessage>{errors.courseId?.message}</FormErrorMessage>
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Module (Optional)</FormLabel>
              <Select
                placeholder="Select module (optional)"
                {...register('moduleId')}
              >
                {/* TODO: Fetch and populate modules for selected course */}
                <option value="module1">Module 1</option>
                <option value="module2">Module 2</option>
              </Select>
            </FormControl>

            <HStack spacing={4}>
              <FormControl isInvalid={!!errors.availableFrom}>
                <FormLabel>Available From</FormLabel>
                <Input
                  type="date"
                  {...register('availableFrom', { required: 'Start date is required' })}
                />
                <FormErrorMessage>{errors.availableFrom?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.dueDate}>
                <FormLabel>Due Date</FormLabel>
                <Input
                  type="date"
                  {...register('dueDate', { required: 'Due date is required' })}
                />
                <FormErrorMessage>{errors.dueDate?.message}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Available Until (Optional)</FormLabel>
                <Input type="date" {...register('availableUntil')} />
              </FormControl>
            </HStack>
          </Box>

          {type === 'quiz' && (
            <Box bg={cardBg} p={6} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
              <Heading size="md" mb={4}>Quiz Settings</Heading>
              
              <HStack spacing={6} mb={6}>
                <FormControl>
                  <FormLabel>Time Limit (minutes)</FormLabel>
                  <NumberInput min={1} defaultValue={60}>
                    <NumberInputField {...register('timeLimit', { valueAsNumber: true })} />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Attempts Allowed</FormLabel>
                  <NumberInput min={1} defaultValue={1} max={10}>
                    <NumberInputField {...register('attemptsAllowed', { valueAsNumber: true })} />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Passing Score (%)</FormLabel>
                  <NumberInput min={0} max={100} defaultValue={70}>
                    <NumberInputField {...register('passingScore', { valueAsNumber: true })} />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </HStack>

              <HStack spacing={4} mb={6}>
                <FormControl display="flex" alignItems="center">
                  <Switch id="shuffle-questions" {...register('shuffleQuestions')} mr={2} />
                  <FormLabel htmlFor="shuffle-questions" mb={0}>
                    Shuffle Questions
                  </FormLabel>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <Switch id="shuffle-answers" {...register('shuffleAnswers')} mr={2} />
                  <FormLabel htmlFor="shuffle-answers" mb={0}>
                    Shuffle Answers
                  </FormLabel>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <Switch id="show-question-per-page" {...register('showQuestionPerPage')} defaultChecked mr={2} />
                  <FormLabel htmlFor="show-question-per-page" mb={0}>
                    Show One Question Per Page
                  </FormLabel>
                </FormControl>
              </HStack>

              <Divider my={6} />

              <Box>
                <HStack justify="space-between" mb={4}>
                  <Heading size="md">Questions</Heading>
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    onClick={addQuestion}
                  >
                    Add Question
                  </Button>
                </HStack>

                {fields.map((field, index) => renderQuestionForm(field as QuizQuestion, index))}

                {fields.length === 0 && (
                  <Box textAlign="center" py={8} borderWidth={2} borderStyle="dashed" borderRadius="md">
                    <Text color="gray.500" mb={4}>
                      No questions added yet
                    </Text>
                    <Button
                      leftIcon={<AddIcon />}
                      colorScheme="blue"
                      variant="outline"
                      onClick={addQuestion}
                    >
                      Add Your First Question
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {type === 'activity' && (
            <Box bg={cardBg} p={6} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
              <Heading size="md" mb={4}>Activity Settings</Heading>
              
              <FormControl display="flex" alignItems="center" mb={4}>
                <Switch id="group-activity" {...register('isGroupActivity')} mr={2} />
                <FormLabel htmlFor="group-activity" mb={0}>
                  Group Activity
                </FormLabel>
              </FormControl>

              {watch('isGroupActivity') && (
                <FormControl mb={4} maxW="200px">
                  <FormLabel>Maximum Group Size</FormLabel>
                  <NumberInput min={2} max={10} defaultValue={3}>
                    <NumberInputField {...register('maxGroupSize', { valueAsNumber: true })} />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              )}

              <FormControl mb={4}>
                <FormLabel>Submission Instructions</FormLabel>
                <Textarea
                  {...register('submissionInstructions')}
                  placeholder="Provide specific instructions for submission"
                  rows={4}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Attachments</FormLabel>
                <FileUpload
                  accept="*"
                  maxFiles={5}
                  onFilesChange={(files) => setValue('attachments', files)}
                />
                <FormHelperText>
                  Upload any files that students will need to complete this activity
                </FormHelperText>
              </FormControl>
            </Box>
          )}

          {type === 'assignment' && (
            <Box bg={cardBg} p={6} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
              <Heading size="md" mb={4}>Assignment Settings</Heading>
              
              <FormControl mb={4}>
                <FormLabel>Submission Type</FormLabel>
                <Select {...register('submissionType')}>
                  <option value="text">Text Entry</option>
                  <option value="file">File Upload</option>
                  <option value="both">Both Text and File</option>
                </Select>
              </FormControl>

              <FormControl mb={4}>
                <FormLabel>Total Points</FormLabel>
                <NumberInput min={0} defaultValue={100}>
                  <NumberInputField {...register('totalPoints', { valueAsNumber: true })} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl mb={4}>
                <FormLabel>Attachments</FormLabel>
                <FileUpload
                  accept="*"
                  maxFiles={5}
                  onFilesChange={(files) => setValue('attachments', files)}
                />
                <FormHelperText>
                  Upload any files that students will need to complete this assignment
                </FormHelperText>
              </FormControl>
            </Box>
          )}

          <Box bg={cardBg} p={6} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
            <Heading size="md" mb={4}>Publishing Options</Heading>
            
            <FormControl display="flex" alignItems="center" mb={4}>
              <Switch id="is-published" {...register('isPublished')} mr={2} />
              <FormLabel htmlFor="is-published" mb={0}>
                Publish {type}
              </FormLabel>
            </FormControl>

            <FormControl display="flex" alignItems="center" mb={4}>
              <Switch id="require-password" {...register('requirePassword')} mr={2} />
              <FormLabel htmlFor="require-password" mb={0}>
                Require Password
              </FormLabel>
            </Switch>

            {watch('requirePassword') && (
              <FormControl maxW="300px">
                <FormLabel>Password</FormLabel>
                <Input type="password" {...register('password')} />
              </FormControl>
            )}
          </Box>

          <HStack justify="flex-end" spacing={4} mt={6}>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/assignments')}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isSubmitting}
              loadingText={isEdit ? 'Updating...' : 'Creating...'}
            >
              {isEdit ? 'Update' : 'Create'} {type}
            </Button>
          </HStack>
        </VStack>
      </form>

      {/* Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Save Changes?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            You have unsaved changes. Are you sure you want to leave this page?
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={() => navigate('/admin/assignments')}>
              Leave Without Saving
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AssignmentForm;
