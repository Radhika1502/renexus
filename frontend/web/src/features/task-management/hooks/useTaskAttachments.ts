import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../utils/api';

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  uploadedAt: string;
  url: string;
}

type ProgressCallback = (progress: number) => void;

/**
 * Hook for managing task attachments
 */
export const useTaskAttachments = (taskId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['taskAttachments', taskId];
  
  // Fetch attachments for a task
  const { data: attachments, isLoading, isError, error, refetch } = useQuery<Attachment[]>({
    queryKey,
    queryFn: async () => {
      const response = await api.get(`/tasks/${taskId}/attachments`);
      return response.data;
    },
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Upload attachment mutation
  const uploadMutation = useMutation<Attachment, Error, { file: File, onProgress?: ProgressCallback }>({
    mutationFn: async ({ file, onProgress }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      });
      
      return response.data;
    },
    onSuccess: (newAttachment) => {
      // Update the attachments cache with the new attachment
      queryClient.setQueryData<Attachment[]>(queryKey, (oldData = []) => {
        return [...oldData, newAttachment];
      });
      
      // Update the task data to reflect the new attachment count
      queryClient.setQueryData(['task', taskId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          attachments: (oldData.attachments || 0) + 1,
        };
      });
    },
  });

  // Delete attachment mutation
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (attachmentId: string) => {
      await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
    },
    onSuccess: (_, attachmentId) => {
      // Remove the deleted attachment from the cache
      queryClient.setQueryData<Attachment[]>(queryKey, (oldData = []) => {
        return oldData.filter(attachment => attachment.id !== attachmentId);
      });
      
      // Update the task data to reflect the new attachment count
      queryClient.setQueryData(['task', taskId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          attachments: Math.max((oldData.attachments || 0) - 1, 0),
        };
      });
    },
  });

  // Download attachment
  const downloadAttachment = async (attachmentId: string) => {
    try {
      const response = await api.get(`/tasks/${taskId}/attachments/${attachmentId}/download`, {
        responseType: 'blob',
      });
      
      // Get the filename from the Content-Disposition header or use a default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error downloading attachment:', error);
      throw error;
    }
  };

  // Helper function to upload an attachment
  const uploadAttachment = async (file: File, onProgress?: ProgressCallback) => {
    return uploadMutation.mutateAsync({ file, onProgress });
  };

  // Helper function to delete an attachment
  const deleteAttachment = async (attachmentId: string) => {
    return deleteMutation.mutateAsync(attachmentId);
  };

  return {
    attachments: attachments || [],
    isLoading,
    isError,
    error,
    refetch,
    uploadAttachment,
    downloadAttachment,
    deleteAttachment,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export default useTaskAttachments;
