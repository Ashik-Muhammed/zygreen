import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  filePath?: string;
}

/**
 * Upload a file to Firebase Storage
 * @param file The file to upload
 * @param path The storage path (e.g., 'assignments/submissions')
 * @param onProgress Optional progress callback
 */
export const uploadFile = (
  file: File, 
  path: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a unique filename to prevent overwrites
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}/${timestamp}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          // Track upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error('Upload failed:', error);
          reject({
            success: false,
            error: error.message || 'Upload failed',
          });
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              success: true,
              url: downloadURL,
              filePath: fileName,
            });
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject({
              success: false,
              error: 'Failed to get download URL',
            });
          }
        }
      );
    } catch (error) {
      console.error('Error uploading file:', error);
      reject({
        success: false,
        error: 'An error occurred during upload',
      });
    }
  });
};

/**
 * Delete a file from Firebase Storage
 * @param filePath The full path to the file in storage
 */
export const deleteFile = async (filePath: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file',
    };
  }
};

/**
 * Get the download URL for a file
 * @param filePath The full path to the file in storage
 */
export const getFileUrl = async (filePath: string): Promise<string> => {
  try {
    const fileRef = ref(storage, filePath);
    return await getDownloadURL(fileRef);
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw new Error('Failed to get file URL');
  }
};

/**
 * Get file type from file name or URL
 */
export const getFileType = (fileName: string): string => {
  if (!fileName) return 'file';
  
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Image types
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  if (imageTypes.includes(extension)) return 'image';
  
  // Document types
  const documentTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
  if (documentTypes.includes(extension)) return 'document';
  
  // Spreadsheet types
  const spreadsheetTypes = ['xls', 'xlsx', 'csv', 'ods'];
  if (spreadsheetTypes.includes(extension)) return 'spreadsheet';
  
  // Presentation types
  const presentationTypes = ['ppt', 'pptx', 'odp'];
  if (presentationTypes.includes(extension)) return 'presentation';
  
  // Archive types
  const archiveTypes = ['zip', 'rar', '7z', 'tar', 'gz'];
  if (archiveTypes.includes(extension)) return 'archive';
  
  // Code types
  const codeTypes = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'json', 'xml'];
  if (codeTypes.includes(extension)) return 'code';
  
  // Default to 'file' if type not recognized
  return 'file';
};

/**
 * Format file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate file before upload
 */
export const validateFile = (
  file: File, 
  options: {
    allowedTypes?: string[];
    maxSizeMB?: number;
  } = {}
): { isValid: boolean; error?: string } => {
  const { allowedTypes, maxSizeMB = 10 } = options;
  
  // Check file type
  if (allowedTypes && allowedTypes.length > 0) {
    const fileType = file.type || getFileType(file.name);
    const isAllowed = allowedTypes.some(type => {
      if (type.startsWith('.')) {
        // Check file extension
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      // Check MIME type
      return fileType.toLowerCase().includes(type.toLowerCase());
    });
    
    if (!isAllowed) {
      return {
        isValid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File is too large. Maximum size: ${maxSizeMB}MB`,
    };
  }
  
  return { isValid: true };
};
