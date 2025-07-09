import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api/apiClient';
import { FileAttachment } from '../types';

export const useFiles = (resourceType: 'task' | 'project' | 'document' | 'comment', resourceId: string) => {
  const queryClient = useQueryClient();

  // Fetch files
  const { data, isLoading, error } = useQuery<FileAttachment[]>({
    queryKey: ['files', resourceType, resourceId],
    queryFn: async () => {
      const response = await apiClient.get<{ files: FileAttachment[] }>(
        `/api/files?resourceType=${resourceType}&resourceId=${resourceId}`
      );
      return response.data.files;
    },
    enabled: !!resourceId,
  });

  // Delete file
  const { mutateAsync: deleteFile } = useMutation({
    mutationFn: async (fileId: string) => {
      await apiClient.delete(`/api/files/${fileId}`);
      return fileId;
    },
    onSuccess: (deletedFileId) => {
      queryClient.setQueryData<FileAttachment[]>(
        ['files', resourceType, resourceId],
        (oldFiles) => {
          if (!oldFiles) return [];
          return oldFiles.filter(file => file.id !== deletedFileId);
        }
      );
    },
  });

  // Share file
  const { mutateAsync: shareFile } = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await apiClient.post<{ shareUrl: string }>(
        `/api/files/${fileId}/share`
      );
      return response.data.shareUrl;
    },
  });

  // Update file
  const { mutateAsync: updateFile } = useMutation({
    mutationFn: async ({ fileId, data }: { fileId: string; data: Partial<FileAttachment> }) => {
      const response = await apiClient.patch<{ file: FileAttachment }>(
        `/api/files/${fileId}`,
        data
      );
      return response.data.file;
    },
    onSuccess: (updatedFile) => {
      queryClient.setQueryData<FileAttachment[]>(
        ['files', resourceType, resourceId],
        (oldFiles) => {
          if (!oldFiles) return [updatedFile];
          return oldFiles.map(file => 
            file.id === updatedFile.id ? updatedFile : file
          );
        }
      );
    },
  });

  // Download file
  const downloadFile = (fileId: string, fileName: string) => {
    window.open(`/api/files/${fileId}/download`, '_blank');
  };

  return {
    data,
    isLoading,
    error,
    deleteFile,
    shareFile,
    updateFile,
    downloadFile,
  };
};
