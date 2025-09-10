import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  VStack,
  HStack,
  Icon,
  Progress,
  useColorModeValue,
  useToast,
  Image,
  IconButton,
  Tooltip,
  BoxProps,
  FormHelperText,
} from '@chakra-ui/react';
import { FiUpload, FiX, FiFile, FiImage, FiFileText, FiFilePlus } from 'react-icons/fi';
import { uploadFile, validateFile } from '../../../services/fileService';

export interface UploadedFile {
  file: File;
  url: string;
  type: string;
  name: string;
  preview?: string;
  progress?: number;
  error?: string;
  path?: string;
}

interface FileUploadProps extends Omit<BoxProps, 'onChange'> {
  value?: UploadedFile[];
  onChange?: (files: UploadedFile[]) => void;
  onUploadComplete?: (files: UploadedFile[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  uploadPath?: string;
  disabled?: boolean;
  showPreview?: boolean;
  label?: string;
  helperText?: string;
  isRequired?: boolean;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  value = [],
  onChange,
  onUploadComplete,
  accept = '*/*',
  multiple = false,
  maxFiles = 5,
  maxSizeMB = 10,
  uploadPath = 'uploads',
  disabled = false,
  showPreview = true,
  label,
  helperText,
  isRequired = false,
  error,
  ...boxProps
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const hoverBorderColor = useColorModeValue('blue.400', 'blue.300');
  const activeBorderColor = useColorModeValue('blue.500', 'blue.400');
  const bgColor = useColorModeValue('white', 'gray.700');
  const dragBgColor = useColorModeValue('blue.50', 'blue.900');
  
  // Initialize with external value if provided
  useEffect(() => {
    if (value && value.length > 0) {
      setFiles(value);
    }
  }, [value]);

  // Handle file selection
  const handleFileChange = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles || selectedFiles.length === 0) return;

      // Convert FileList to array and filter based on maxFiles
      const filesArray = Array.from(selectedFiles).slice(0, maxFiles - files.length);
      
      if (filesArray.length === 0) {
        toast({
          title: 'Maximum files reached',
          description: `You can only upload up to ${maxFiles} files.`,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Process each file
      const newFiles = filesArray.map((file) => {
        // Validate file
        const validation = validateFile(file, {
          allowedTypes: accept !== '*/*' ? accept.split(',') : undefined,
          maxSizeMB,
        });

        // Create preview for images
        let preview = '';
        if (file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file);
        }

        return {
          file,
          url: '',
          type: file.type || 'application/octet-stream',
          name: file.name,
          preview,
          error: validation.isValid ? undefined : validation.error,
        };
      });

      // Update state
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onChange?.(updatedFiles);

      // Auto-upload files if not in controlled mode
      if (!value) {
        handleUpload(newFiles);
      }
    },
    [files, maxFiles, accept, maxSizeMB, onChange, toast, value]
  );

  // Handle file upload
  const handleUpload = useCallback(
    async (filesToUpload: UploadedFile[] = files) => {
      if (filesToUpload.length === 0) return;

      setIsUploading(true);
      const uploadedFiles: UploadedFile[] = [];
      const errors: string[] = [];

      // Upload each file
      for (const fileObj of filesToUpload) {
        // Skip files with errors or already uploaded
        if (fileObj.error || fileObj.url) continue;

        try {
          // Update progress
          const fileIndex = files.findIndex((f) => f.file === fileObj.file);
          if (fileIndex === -1) continue;

          const onProgress = (progress: number) => {
            setFiles((prev) =>
              prev.map((f, i) =>
                i === fileIndex ? { ...f, progress } : f
              )
            );
          };

          // Upload the file
          const result = await uploadFile(
            fileObj.file,
            `${uploadPath}/${Date.now()}`,
            onProgress
          );

          if (result.success) {
            const uploadedFile: UploadedFile = {
              ...fileObj,
              url: result.url!,
              path: result.filePath,
              progress: 100,
            };
            uploadedFiles.push(uploadedFile);

            // Update the file in state
            setFiles((prev) =>
              prev.map((f, i) =>
                i === fileIndex ? uploadedFile : f
              )
            );
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } catch (error) {
          console.error('Error uploading file:', error);
          errors.push(`Failed to upload ${fileObj.file.name}`);
          
          // Update the file with error
          setFiles((prev) =>
            prev.map((f) =>
              f.file === fileObj.file
                ? { ...f, error: 'Upload failed', progress: 0 }
                : f
            )
          );
        }
      }

      setIsUploading(false);

      // Notify parent component
      if (uploadedFiles.length > 0) {
        const allFiles = [...files];
        const updatedFiles = allFiles.map((f) => {
          const uploaded = uploadedFiles.find((uf) => uf.file === f.file);
          return uploaded || f;
        });
        
        onChange?.(updatedFiles);
        onUploadComplete?.(uploadedFiles);
      }

      // Show error toast if any uploads failed
      if (errors.length > 0) {
        toast({
          title: `${errors.length} file(s) failed to upload`,
          description: errors.join('\n'),
          status: 'error',
          duration: 10000,
          isClosable: true,
        });
      } else if (uploadedFiles.length > 0) {
        toast({
          title: 'Upload complete',
          description: `${uploadedFiles.length} file(s) uploaded successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [files, onChange, onUploadComplete, toast, uploadPath]
  );

  // Handle file removal
  const handleRemove = useCallback(
    (index: number) => {
      // Clean up object URLs for previews
      if (files[index]?.preview) {
        URL.revokeObjectURL(files[index].preview!);
      }

      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
      onChange?.(newFiles);
    },
    [files, onChange]
  );

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      if (disabled) return;
      if (files.length >= maxFiles) {
        toast({
          title: 'Maximum files reached',
          description: `You can only upload up to ${maxFiles} files.`,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      handleFileChange(e.dataTransfer.files);
    },
    [disabled, files.length, handleFileChange, maxFiles, toast]
  );

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  // Get file icon based on type
  const getFileIcon = (file: UploadedFile) => {
    if (file.type.startsWith('image/')) return <Icon as={FiImage} />;
    if (file.type.includes('pdf')) return <Icon as={FiFileText} />;
    if (file.type.includes('word') || file.type.includes('document')) {
      return <Icon as={FiFileText} />;
    }
    return <Icon as={FiFile} />;
  };

  return (
    <Box {...boxProps}>
      {label && (
        <Text fontSize="sm" fontWeight="medium" mb={2}>
          {label}
          {isRequired && <Text as="span" color="red.500"> *</Text>}
        </Text>
      )}
      
      <Box
        border="2px dashed"
        borderColor={isDragging ? hoverBorderColor : borderColor}
        borderRadius="md"
        p={6}
        bg={isDragging ? dragBgColor : bgColor}
        transition="all 0.2s"
        _hover={!disabled ? { borderColor: hoverBorderColor } : {}}
        _active={{ borderColor: activeBorderColor }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        cursor={disabled ? 'not-allowed' : 'pointer'}
        opacity={disabled ? 0.7 : 1}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileChange(e.target.files)}
          disabled={disabled || isUploading || files.length >= maxFiles}
        />
        
        <VStack spacing={4} textAlign="center">
          <Icon as={FiUpload} boxSize={8} color={isDragging ? 'blue.500' : 'gray.400'} />
          
          <Box>
            <Text fontWeight="medium">
              {isDragging 
                ? 'Drop your files here' 
                : 'Drag & drop files here, or click to select files'}
            </Text>
            <Text fontSize="sm" color="gray.500" mt={1}>
              {`${accept === '*/*' ? 'Any file type' : `Supported formats: ${accept}`} • Max ${maxSizeMB}MB per file`}
            </Text>
            <Text fontSize="xs" color="gray.500" mt={2}>
              {`${files.length} of ${maxFiles} files selected`}
            </Text>
          </Box>
          
          <Button
            colorScheme="blue"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            isDisabled={disabled || isUploading || files.length >= maxFiles}
            leftIcon={<FiFilePlus />}
          >
            Select Files
          </Button>
          
          {value && value.length > 0 && !isUploading && (
            <Button
              colorScheme="blue"
              size="sm"
              onClick={() => handleUpload()}
              isDisabled={disabled || isUploading || files.every(f => f.url || f.error)}
              isLoading={isUploading}
              loadingText="Uploading..."
            >
              {files.some(f => f.url) ? 'Upload Changes' : 'Upload All'}
            </Button>
          )}
        </VStack>
      </Box>
      
      {helperText && !error && (
        <Text fontSize="xs" color="gray.500" mt={1}>
          {helperText}
        </Text>
      )}
      
      {error && (
        <Text fontSize="sm" color="red.500" mt={1}>
          {error}
        </Text>
      )}
      
      {/* File list */}
      {(files.length > 0 || isUploading) && (
        <Box mt={4}>
          <VStack spacing={2} align="stretch">
            {files.map((file, index) => (
              <Box
                key={`${file.name}-${index}`}
                borderWidth="1px"
                borderRadius="md"
                p={3}
                position="relative"
                borderColor={file.error ? 'red.200' : 'gray.200'}
                bg={file.error ? 'red.50' : 'white'}
              >
                <HStack spacing={3} align="center">
                  {showPreview && file.preview ? (
                    <Image
                      src={file.preview}
                      alt={file.name}
                      boxSize="50px"
                      objectFit="cover"
                      borderRadius="md"
                    />
                  ) : (
                    <Flex
                      boxSize="50px"
                      bg={file.error ? 'red.100' : 'gray.100'}
                      borderRadius="md"
                      align="center"
                      justify="center"
                      color={file.error ? 'red.500' : 'gray.500'}
                    >
                      {getFileIcon(file)}
                    </Flex>
                  )}
                  
                  <Box flex={1} minW={0}>
                    <HStack justify="space-between">
                      <Text 
                        fontSize="sm" 
                        fontWeight="medium" 
                        isTruncated
                        color={file.error ? 'red.700' : 'inherit'}
                      >
                        {file.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {(file.file.size / 1024 / 1024).toFixed(1)} MB
                      </Text>
                    </HStack>
                    
                    {file.progress !== undefined && file.progress > 0 && file.progress < 100 && (
                      <Progress 
                        value={file.progress} 
                        size="xs" 
                        colorScheme={file.error ? 'red' : 'blue'} 
                        mt={1}
                        borderRadius="full"
                      />
                    )}
                    
                    {file.error && (
                      <Text fontSize="xs" color="red.500" mt={1} isTruncated>
                        {file.error}
                      </Text>
                    )}
                    
                    {file.url && (
                      <Text fontSize="xs" color="green.600" mt={1} isTruncated>
                        Uploaded successfully
                      </Text>
                    )}
                  </Box>
                  
                  {!disabled && (
                    <IconButton
                      icon={<FiX />}
                      aria-label="Remove file"
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleRemove(index)}
                      isDisabled={isUploading}
                    />
                  )}
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
