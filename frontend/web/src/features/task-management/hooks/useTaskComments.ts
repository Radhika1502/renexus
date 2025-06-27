import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Comment } from '../types';
import { api } from '../../../utils/api';

/**
 * Hook for fetching and managing task comments
 */
export const useTaskComments = (taskId: string) => {
  const queryClient = useQueryClient();
  
  // Fetch comments for a task
  const commentsQuery = useQuery<Comment[], Error>(
    ['taskComments', taskId],
    async () => {
      const response = await api.get(`/tasks/${taskId}/comments`);
      return response.data;
    },
    {
      enabled: !!taskId,
      staleTime: 1 * 60 * 1000, // 1 minute
    }
  );

  // Add a new comment
  const addCommentMutation = useMutation<Comment, Error, { content: string }>(
    async ({ content }) => {
      const response = await api.post(`/tasks/${taskId}/comments`, { content });
      return response.data;
    },
    {
      onSuccess: (newComment) => {
        // Update the comments cache with the new comment
        const previousComments = queryClient.getQueryData<Comment[]>(['taskComments', taskId]) || [];
        queryClient.setQueryData(['taskComments', taskId], [...previousComments, newComment]);
      },
    }
  );

  // Update an existing comment
  const updateCommentMutation = useMutation<Comment, Error, { commentId: string; content: string }>(
    async ({ commentId, content }) => {
      const response = await api.patch(`/tasks/${taskId}/comments/${commentId}`, { content });
      return response.data;
    },
    {
      onSuccess: (updatedComment) => {
        // Update the specific comment in the cache
        const previousComments = queryClient.getQueryData<Comment[]>(['taskComments', taskId]) || [];
        const updatedComments = previousComments.map(comment => 
          comment.id === updatedComment.id ? updatedComment : comment
        );
        queryClient.setQueryData(['taskComments', taskId], updatedComments);
      },
    }
  );

  // Delete a comment
  const deleteCommentMutation = useMutation<void, Error, string>(
    async (commentId) => {
      await api.delete(`/tasks/${taskId}/comments/${commentId}`);
    },
    {
      onSuccess: (_, commentId) => {
        // Remove the deleted comment from the cache
        const previousComments = queryClient.getQueryData<Comment[]>(['taskComments', taskId]) || [];
        const filteredComments = previousComments.filter(comment => comment.id !== commentId);
        queryClient.setQueryData(['taskComments', taskId], filteredComments);
      },
    }
  );

  // Helper function to add a comment
  const addComment = async (content: string) => {
    await addCommentMutation.mutateAsync({ content });
  };

  // Helper function to update a comment
  const updateComment = async (commentId: string, content: string) => {
    await updateCommentMutation.mutateAsync({ commentId, content });
  };

  // Helper function to delete a comment
  const deleteComment = async (commentId: string) => {
    await deleteCommentMutation.mutateAsync(commentId);
  };

  return {
    comments: commentsQuery.data || [],
    isLoading: commentsQuery.isLoading,
    isError: commentsQuery.isError,
    error: commentsQuery.error,
    refetch: commentsQuery.refetch,
    addComment,
    updateComment,
    deleteComment,
    isAddingComment: addCommentMutation.isLoading,
    isUpdatingComment: updateCommentMutation.isLoading,
    isDeletingComment: deleteCommentMutation.isLoading,
  };
};
