import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
  IconButton,
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
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { FiSave, FiX } from 'react-icons/fi';
import { Quiz } from '../../types/quiz';
import { createQuiz, updateQuiz, getQuizById } from '../../services/quizService';
import ConfirmationDialog from '../common/ConfirmationDialog';

interface QuizFormProps {
  isEdit?: boolean;
  initialData?: Partial<Quiz>;
}

const defaultValues: Partial<Quiz> = {
  title: '',
  description: '',
  courseId: '',
  questions: [
    {
      id: crypto.randomUUID(),
      question: '',
      options: ['', ''],
      correctAnswer: 0,
      points: 1,
    },
  ],
  timeLimit: 30,
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  totalPoints: 0,
  isPublished: false,
};

const QuizForm = ({ isEdit = false, initialData }: QuizFormProps) => {
  const { courseId, quizId } = useParams<{ courseId: string; quizId?: string }>();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<Quiz>({
    defaultValues: {
      ...defaultValues,
      ...initialData,
      courseId: courseId || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  });

  // Fetch quiz data if in edit mode
  useEffect(() => {
    const fetchQuiz = async () => {
      if (isEdit && quizId) {
        try {
          setLoading(true);
          const data = await getQuizById(quizId);
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
            title: 'Error loading quiz',
            description: 'Failed to load quiz data. Please try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          navigate(`/admin/courses/${courseId}/quizzes`);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchQuiz();
  }, [isEdit, quizId, courseId, reset, toast, navigate]);

  // Calculate total points whenever questions change
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name?.startsWith('questions')) {
        const total = value.questions?.reduce(
          (sum, q) => sum + (q?.points || 0),
          0
        ) || 0;
        setValue('totalPoints', total);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  const onSubmit = async (data: Quiz) => {
    if (!courseId) return;

    try {
      setIsSubmitting(true);
      
      const quizData = {
        ...data,
        dueDate: new Date(data.dueDate),
      };

      if (isEdit && quizId) {
        await updateQuiz(quizId, quizData);
        toast({
          title: 'Quiz updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createQuiz({
          ...quizData,
          courseId,
        });
        toast({
          title: 'Quiz created',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      navigate(`/admin/courses/${courseId}/quizzes`);
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast({
        title: 'Error',
        description: `Failed to ${isEdit ? 'update' : 'create'} quiz. Please try again.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addQuestion = () => {
    append({
      id: crypto.randomUUID(),
      question: '',
      options: ['', ''],
      correctAnswer: 0,
      points: 1,
    });
  };

  const addOption = (questionIndex: number) => {
    const questions = [...(watch('questions') || [])];
    questions[questionIndex].options.push('');
    setValue('questions', questions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const questions = [...(watch('questions') || [])];
    if (questions[questionIndex].options.length > 2) {
      questions[questionIndex].options.splice(optionIndex, 1);
      // Adjust correct answer if needed
      if (questions[questionIndex].correctAnswer >= optionIndex) {
        questions[questionIndex].correctAnswer = Math.max(0, questions[questionIndex].correctAnswer - 1);
      }
      setValue('questions', questions);
    }
  };

  const handleCancel = () => {
    if (JSON.stringify(watch()) !== JSON.stringify({ ...defaultValues, courseId })) {
      onOpen();
    } else {
      navigate(`/admin/courses/${courseId}/quizzes`);
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
            <Heading size="lg">{isEdit ? 'Edit Quiz' : 'Create New Quiz'}</Heading>
            <HStack>
              <Button
                leftIcon={<FiX />}
                variant="outline"
                onClick={handleCancel}
                isDisabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                leftIcon={<FiSave />}
                colorScheme="blue"
                isLoading={isSubmitting}
                loadingText="Saving..."
              >
                {isEdit ? 'Update Quiz' : 'Create Quiz'}
              </Button>
            </HStack>
          </HStack>

          <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
            <VStack spacing={6} align="stretch">
              <FormControl isInvalid={!!errors.title} isRequired>
                <FormLabel>Quiz Title</FormLabel>
                <Input
                  placeholder="Enter quiz title"
                  {...register('title', { required: 'Title is required' })}
                />
                <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.description} isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Enter quiz description"
                  rows={3}
                  {...register('description', { required: 'Description is required' })}
                />
                <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
              </FormControl>

              <HStack spacing={6}>
                <FormControl isInvalid={!!errors.timeLimit} isRequired width="200px">
                  <FormLabel>Time Limit (minutes)</FormLabel>
                  <NumberInput min={1} max={240} defaultValue={30}>
                    <NumberInputField
                      {...register('timeLimit', {
                        required: 'Time limit is required',
                        min: { value: 1, message: 'Minimum 1 minute' },
                        max: { value: 240, message: 'Maximum 240 minutes' },
                      })}
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormErrorMessage>{errors.timeLimit?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.dueDate} isRequired width="250px">
                  <FormLabel>Due Date</FormLabel>
                  <Input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    {...register('dueDate', { required: 'Due date is required' })}
                  />
                  <FormErrorMessage>{errors.dueDate?.message}</FormErrorMessage>
                </FormControl>

                <FormControl display="flex" alignItems="center" mt={8}>
                  <Checkbox
                    id="isPublished"
                    {...register('isPublished')}
                    colorScheme="green"
                  >
                    <Text ml={2}>Publish this quiz</Text>
                  </Checkbox>
                </FormControl>
              </HStack>
            </VStack>
          </Box>

          <Box>
            <HStack justifyContent="space-between" mb={4}>
              <Heading size="md">Questions</Heading>
              <Text color="gray.500">
                Total Points: {watch('totalPoints') || 0}
              </Text>
            </HStack>

            {fields.map((question, qIndex) => (
              <Box
                key={question.id}
                bg="white"
                p={6}
                borderRadius="md"
                boxShadow="sm"
                mb={6}
                position="relative"
              >
                {fields.length > 1 && (
                  <IconButton
                    aria-label="Delete question"
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    position="absolute"
                    top={2}
                    right={2}
                    onClick={() => remove(qIndex)}
                  />
                )}

                <VStack spacing={4} align="stretch">
                  <FormControl isInvalid={!!errors.questions?.[qIndex]?.question} isRequired>
                    <FormLabel>Question {qIndex + 1}</FormLabel>
                    <Input
                      placeholder="Enter question text"
                      {...register(`questions.${qIndex}.question` as const, {
                        required: 'Question text is required',
                      })}
                    />
                    <FormErrorMessage>
                      {errors.questions?.[qIndex]?.question?.message}
                    </FormErrorMessage>
                  </FormControl>

                  <Box>
                    <FormLabel>Options</FormLabel>
                    <VStack spacing={3} align="stretch">
                      {watch(`questions.${qIndex}.options`)?.map((_, oIndex) => (
                        <HStack key={oIndex}>
                            <Controller
                              name={`questions.${qIndex}.correctAnswer`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <input
                                  type="radio"
                                  checked={field.value === oIndex}
                                  onChange={() => field.onChange(oIndex)}
                                />
                              )}
                            />
                          <Input
                            placeholder={`Option ${oIndex + 1}`}
                            {...register(`questions.${qIndex}.options.${oIndex}` as const, {
                              required: 'Option cannot be empty',
                            })}
                          />
                          {watch(`questions.${qIndex}.options`).length > 2 && (
                            <IconButton
                              aria-label="Remove option"
                              icon={<DeleteIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => removeOption(qIndex, oIndex)}
                            />
                          )}
                        </HStack>
                      ))}
                    </VStack>

                    <Button
                      mt={2}
                      size="sm"
                      leftIcon={<AddIcon />}
                      variant="outline"
                      onClick={() => addOption(qIndex)}
                    >
                      Add Option
                    </Button>
                  </Box>

                  <FormControl isInvalid={!!errors.questions?.[qIndex]?.points} width="150px">
                    <FormLabel>Points</FormLabel>
                    <NumberInput min={0} defaultValue={1}>
                      <NumberInputField
                        {...register(`questions.${qIndex}.points` as const, {
                          valueAsNumber: true,
                          min: { value: 0, message: 'Points cannot be negative' },
                        })}
                      />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormErrorMessage>
                      {errors.questions?.[qIndex]?.points?.message}
                    </FormErrorMessage>
                  </FormControl>
                </VStack>
              </Box>
            ))}

            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              variant="outline"
              onClick={addQuestion}
              width="100%"
              mt={4}
            >
              Add Question
            </Button>
          </Box>
        </VStack>
      </form>

      <ConfirmationDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => navigate(`/admin/courses/${courseId}/quizzes`)}
        title="Discard Changes"
        message="You have unsaved changes. Are you sure you want to leave?"
        confirmText="Discard"
        cancelText="Keep Editing"
      />
    </Box>
  );
};

export default QuizForm;
