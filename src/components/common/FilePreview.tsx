import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Icon,
  Image,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  HStack,
  VStack,
  Tooltip,
  useColorModeValue,
  Link,
  Spinner,
  Badge,
  IconButton,
} from '@chakra-ui/react';
import { 
  FiFile, 
  FiFileText, 
  FiImage, 
  FiDownload, 
  FiX, 
  FiExternalLink, 
  FiPlay,
  FiCode,
  FiFileMinus,
  FiFilePlus,
  FiFileTypePdf,
  FiFileTypeDoc,
  FiFileTypeXls,
  FiFileTypePpt,
  FiFileTypeZip,
} from 'react-icons/fi';
import { getFileType, formatFileSize } from '../../../services/fileService';

interface FilePreviewProps {
  file: {
    id?: string;
    name: string;
    url: string;
    type?: string;
    size?: number;
    path?: string;
    preview?: string;
  };
  onRemove?: (id?: string) => void;
  showActions?: boolean;
  showDownload?: boolean;
  showPreview?: boolean;
  showRemove?: boolean;
  size?: 'sm' | 'md' | 'lg';
  maxWidth?: string | number;
  minWidth?: string | number;
  maxHeight?: string | number;
  minHeight?: string | number;
  borderRadius?: string;
  bg?: string;
  borderColor?: string;
  p?: number | string;
  m?: number | string;
  my?: number | string;
  mx?: number | string;
  mt?: number | string;
  mb?: number | string;
  ml?: number | string;
  mr?: number | string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  errorBorderColor?: string;
  _hover?: any;
  _active?: any;
  _focus?: any;
  _disabled?: any;
  _invalid?: any;
  onClick?: (e: React.MouseEvent) => void;
  onDownload?: (file: any) => Promise<void>;
  onPreview?: (file: any) => Promise<void>;
  children?: React.ReactNode;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onRemove,
  showActions = true,
  showDownload = true,
  showPreview = true,
  showRemove = true,
  size = 'md',
  maxWidth,
  minWidth,
  maxHeight,
  minHeight,
  borderRadius = 'md',
  bg,
  borderColor,
  p,
  m,
  my,
  mx,
  mt,
  mb,
  ml,
  mr,
  isDisabled = false,
  isReadOnly = false,
  isInvalid = false,
  errorBorderColor,
  _hover,
  _active,
  _focus,
  _disabled,
  _invalid,
  onClick,
  onDownload,
  onPreview,
  children,
  ...rest
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>('');
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  const defaultBg = useColorModeValue('white', 'gray.700');
  const defaultBorderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBorderColor = useColorModeValue('blue.300', 'blue.500');
  const activeBorderColor = useColorModeValue('blue.400', 'blue.600');
  const focusBorderColor = useColorModeValue('blue.500', 'blue.400');
  const errorBorder = useColorModeValue('red.500', 'red.400');
  const disabledBg = useColorModeValue('gray.100', 'gray.800');
  const disabledColor = useColorModeValue('gray.400', 'gray.500');
  
  // Determine file type
  const fileType = file.type || getFileType(file.name);
  const isImage = fileType.startsWith('image/');
  const isPdf = fileType.includes('pdf');
  const isDocument = fileType.includes('document') || fileType.includes('word') || 
                    file.name.endsWith('.doc') || file.name.endsWith('.docx');
  const isSpreadsheet = fileType.includes('spreadsheet') || 
                       file.name.endsWith('.xls') || file.name.endsWith('.xlsx') || 
                       file.name.endsWith('.csv');
  const isPresentation = fileType.includes('presentation') || 
                        file.name.endsWith('.ppt') || file.name.endsWith('.pptx');
  const isVideo = fileType.startsWith('video/');
  const isAudio = fileType.startsWith('audio/');
  const isArchive = fileType.includes('zip') || fileType.includes('rar') || 
                   fileType.includes('7z') || fileType.includes('tar') || 
                   fileType.includes('gz');
  const isCode = fileType.includes('code') || 
                ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.json', '.xml']
                .some(ext => file.name.endsWith(ext));
  
  // Get appropriate icon based on file type
  const getFileIcon = () => {
    if (isImage) return <Icon as={FiImage} />;
    if (isPdf) return <Icon as={FiFileTypePdf} />;
    if (isDocument) return <Icon as={FiFileTypeDoc} />;
    if (isSpreadsheet) return <Icon as={FiFileTypeXls} />;
    if (isPresentation) return <Icon as={FiFileTypePpt} />;
    if (isVideo) return <Icon as={FiPlay} />;
    if (isAudio) return <Icon as={FiFile} />;
    if (isArchive) return <Icon as={FiFileTypeZip} />;
    if (isCode) return <Icon as={FiCode} />;
    return <Icon as={FiFileText} />;
  };
  
  // Handle file preview
  const handlePreview = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (onPreview) {
      await onPreview(file);
      return;
    }
    
    if (isImage) {
      setPreviewType('image');
      setPreviewUrl(file.url || file.preview || '');
      onOpen();
    } else if (isPdf) {
      // For PDFs, open in new tab
      window.open(file.url, '_blank');
    } else if (isVideo) {
      setPreviewType('video');
      setPreviewUrl(file.url || file.preview || '');
      onOpen();
    } else if (isAudio) {
      setPreviewType('audio');
      setPreviewUrl(file.url || file.preview || '');
      onOpen();
    } else {
      // For other file types, try to open in new tab
      window.open(file.url, '_blank');
    }
  };
  
  // Handle file download
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (onDownload) {
      setIsLoading(true);
      try {
        await onDownload(file);
      } catch (error) {
        console.error('Error downloading file:', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    // Default download behavior
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle file remove
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(file.id);
    }
  };
  
  // Handle container click
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
      return;
    }
    
    // Default behavior: open preview on click
    if (showPreview) {
      handlePreview(e);
    }
  };
  
  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && (previewUrl.startsWith('blob:') || previewUrl.startsWith('data:'))) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
  // Get size-based styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: { p: 2 },
          icon: { boxSize: 6 },
          fileName: { fontSize: 'xs' },
          fileSize: { fontSize: 'xs' },
          actionButton: { size: 'xs' },
        };
      case 'lg':
        return {
          container: { p: 4 },
          icon: { boxSize: 12 },
          fileName: { fontSize: 'md' },
          fileSize: { fontSize: 'sm' },
          actionButton: { size: 'md' },
        };
      default: // md
        return {
          container: { p: 3 },
          icon: { boxSize: 8 },
          fileName: { fontSize: 'sm' },
          fileSize: { fontSize: 'xs' },
          actionButton: { size: 'sm' },
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  
  return (
    <>
      <Box
        position="relative"
        borderWidth="1px"
        borderRadius={borderRadius}
        borderColor={isInvalid ? errorBorder : borderColor || defaultBorderColor}
        bg={isDisabled ? disabledBg : bg || defaultBg}
        p={p || sizeStyles.container.p}
        m={m}
        my={my}
        mx={mx}
        mt={mt}
        mb={mb}
        ml={ml}
        mr={mr}
        maxW={maxWidth}
        minW={minWidth}
        maxH={maxHeight}
        minH={minHeight}
        overflow="hidden"
        cursor={!isDisabled && !isReadOnly ? 'pointer' : 'default'}
        opacity={isDisabled ? 0.7 : 1}
        _hover={!isDisabled && !isReadOnly ? {
          borderColor: _hover?.borderColor || hoverBorderColor,
          boxShadow: 'sm',
          ..._hover
        } : _hover}
        _active={!isDisabled && !isReadOnly ? {
          borderColor: _active?.borderColor || activeBorderColor,
          ..._active
        } : _active}
        _focus={!isDisabled && !isReadOnly ? {
          borderColor: _focus?.borderColor || focusBorderColor,
          boxShadow: 'outline',
          ..._focus
        } : _focus}
        _disabled={{
          cursor: 'not-allowed',
          opacity: 0.7,
          ..._disabled
        }}
        _invalid={{
          borderColor: errorBorder,
          ..._invalid
        }}
        onClick={handleClick}
        {...rest}
      >
        <Flex align="center" justify="space-between">
          <HStack spacing={3} overflow="hidden">
            <Flex
              align="center"
              justify="center"
              borderRadius="md"
              bg={isDisabled ? 'gray.100' : 'blue.50'}
              color={isDisabled ? disabledColor : 'blue.500'}
              {...sizeStyles.icon}
              flexShrink={0}
            >
              {getFileIcon()}
            </Flex>
            
            <Box overflow="hidden">
              <Text
                fontWeight="medium"
                isTruncated
                color={isDisabled ? disabledColor : 'inherit'}
                {...sizeStyles.fileName}
              >
                {file.name}
              </Text>
              
              {(file.size || file.type) && (
                <HStack spacing={2} mt={1} color={isDisabled ? disabledColor : 'gray.500'}>                  
                  {file.size && (
                    <Text {...sizeStyles.fileSize}>
                      {formatFileSize(file.size)}
                    </Text>
                  )}
                  
                  {file.type && (
                    <>
                      <Text>•</Text>
                      <Badge 
                        variant="subtle" 
                        colorScheme="gray"
                        textTransform="none"
                        fontWeight="normal"
                        borderRadius="sm"
                      >
                        {file.type.split('/').pop()?.toUpperCase() || 'FILE'}
                      </Badge>
                    </>
                  )}
                </HStack>
              )}
            </Box>
          </HStack>
          
          {showActions && !isReadOnly && (
            <HStack spacing={1} ml={2} flexShrink={0}>
              {showPreview && (
                <Tooltip label="Preview" placement="top">
                  <IconButton
                    aria-label="Preview file"
                    icon={<FiExternalLink />}
                    variant="ghost"
                    size={sizeStyles.actionButton.size as any}
                    onClick={handlePreview}
                    isDisabled={isDisabled || isLoading}
                    _hover={{ bg: 'blue.50', color: 'blue.500' }}
                  />
                </Tooltip>
              )}
              
              {showDownload && (
                <Tooltip label="Download" placement="top">
                  <IconButton
                    aria-label="Download file"
                    icon={isLoading ? <Spinner size="sm" /> : <FiDownload />}
                    variant="ghost"
                    size={sizeStyles.actionButton.size as any}
                    onClick={handleDownload}
                    isDisabled={isDisabled || isLoading}
                    _hover={{ bg: 'green.50', color: 'green.500' }}
                  />
                </Tooltip>
              )}
              
              {showRemove && onRemove && (
                <Tooltip label="Remove" placement="top">
                  <IconButton
                    aria-label="Remove file"
                    icon={<FiX />}
                    variant="ghost"
                    size={sizeStyles.actionButton.size as any}
                    onClick={handleRemove}
                    isDisabled={isDisabled || isLoading}
                    _hover={{ bg: 'red.50', color: 'red.500' }}
                  />
                </Tooltip>
              )}
            </HStack>
          )}
        </Flex>
        
        {children}
      </Box>
      
      {/* Preview Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="full" isCentered>
        <ModalOverlay />
        <ModalContent m={4} maxW="90vw" maxH="90vh" bg="transparent" boxShadow="none">
          <Flex justify="flex-end" mb={2}>
            <Button 
              onClick={onClose} 
              size="sm" 
              variant="solid" 
              colorScheme="gray" 
              rightIcon={<FiX />}
            >
              Close
            </Button>
          </Flex>
          
          <ModalBody 
            p={0} 
            bg="white" 
            borderRadius="md" 
            overflow="hidden"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {previewType === 'image' && previewUrl && (
              <Box 
                as="img" 
                src={previewUrl} 
                alt={file.name}
                maxW="100%"
                maxH="80vh"
                objectFit="contain"
                onLoad={() => setIsImageLoaded(true)}
                style={{ display: isImageLoaded ? 'block' : 'none' }}
              />
            )}
            
            {previewType === 'video' && previewUrl && (
              <Box as="video" controls width="100%" maxH="80vh">
                <source src={previewUrl} type={file.type} />
                Your browser does not support the video tag.
              </Box>
            )}
            
            {previewType === 'audio' && previewUrl && (
              <Box width="100%" p={8} bg="gray.50" borderRadius="md">
                <VStack spacing={4} align="center">
                  <Icon as={FiFile} boxSize={12} color="blue.500" />
                  <Text fontWeight="medium">{file.name}</Text>
                  <Box as="audio" controls width="100%">
                    <source src={previewUrl} type={file.type} />
                    Your browser does not support the audio element.
                  </Box>
                </VStack>
              </Box>
            )}
            
            {!previewType && previewUrl && (
              <VStack spacing={4} p={8} textAlign="center">
                <Icon as={FiFile} boxSize={12} color="gray.400" />
                <Text fontWeight="medium">Preview not available</Text>
                <Text color="gray.500" fontSize="sm">
                  This file type cannot be previewed. Please download the file to view it.
                </Text>
                <Button 
                  colorScheme="blue" 
                  leftIcon={<FiDownload />}
                  onClick={handleDownload}
                  isLoading={isLoading}
                >
                  Download File
                </Button>
              </VStack>
            )}
            
            {!isImageLoaded && previewType === 'image' && (
              <Flex 
                align="center" 
                justify="center" 
                width="100%" 
                height="300px"
                bg="gray.100"
                borderRadius="md"
              >
                <Spinner size="xl" color="blue.500" />
              </Flex>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default FilePreview;
