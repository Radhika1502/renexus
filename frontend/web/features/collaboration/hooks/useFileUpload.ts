import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api/apiClient';
import { FileAttachment } from '../types';

interface UploadFilesParams {
  files: File[];
  resourceId: string;
  resourceType: 'task' | 'project' | 'document' | 'comment';
  onProgress?: (progress: number) => void;
}

export const useFileUpload = () => {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const { mutateAsync, isPending: isUploading } = useMutation({
    mutationFn: async ({
      files,
      resourceId,
      resourceType,
      onProgress,
    }: UploadFilesParams): Promise<FileAttachment[]> => {
      const formData = new FormData();
      
      // Append files to form data
      files.forEach(file => {
        formData.append('files', file);
      });
      
      // Append metadata
      formData.append('resourceId', resourceId);
      formData.append('resourceType', resourceType);
      
      // Upload files with progress tracking
      const response = await apiClient.post<{ files: FileAttachment[] }>(
        '/api/files/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setProgress(percentCompleted);
              if (onProgress) {
                onProgress(percentCompleted);
              }
            }
          },
        }
      );
      
      return response.data.files;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch files queries
      queryClient.invalidateQueries({
        queryKey: ['files', variables.resourceType, variables.resourceId],
      });
      
      // Reset progress
      setProgress(0);
    },
    onError: (error) => {
      console.error('File upload error:', error);
      setProgress(0);
    },
  });

  const uploadFiles = async (params: UploadFilesParams) => {
    return mutateAsync(params);
  };

  return {
    uploadFiles,
    isUploading,
    progress,
  };
};
