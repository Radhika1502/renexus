import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api/apiClient';
import { Comment, CreateCommentDto, CreateReplyDto, UpdateCommentDto } from '../types';
import { useCollaboration } from '../contexts/CollaborationContext';
import { useEffect } from 'react';

export const useComments = (resourceType: 'task' | 'project' | 'document', resourceId: string) => {
  const queryClient = useQueryClient();
  const { subscribeToChannel } = useCollaboration();

  // Subscribe to real-time updates for comments
  useEffect(() => {
    const unsubscribe = subscribeToChannel(`${resourceType}-${resourceId}-comments`, (message) => {
      if (message.action === 'new-comment' || message.action === 'update-comment' || 
          message.action === 'delete-comment' || message.action === 'new-reply' || 
          message.action === 'update-reply' || message.action === 'delete-reply') {
        // Invalidate and refetch comments on any change
        queryClient.invalidateQueries({
          queryKey: ['comments', resourceType, resourceId],
        });
      }
    });

    return unsubscribe;
  }, [resourceType, resourceId, subscribeToChannel, queryClient]);

  // Fetch comments
  const { data, isLoading, error } = useQuery<Comment[]>({
    queryKey: ['comments', resourceType, resourceId],
    queryFn: async () => {
      const response = await apiClient.get<{ comments: Comment[] }>(
        `/api/comments?resourceType=${resourceType}&resourceId=${resourceId}`
      );
      return response.data.comments;
    },
    enabled: !!resourceId,
  });

  // Add a new comment
  const { mutateAsync: addComment } = useMutation({
    mutationFn: async (commentData: CreateCommentDto) => {
      const response = await apiClient.post<{ comment: Comment }>(
        '/api/comments',
        commentData
      );
      return response.data.comment;
    },
    onSuccess: (newComment) => {
      queryClient.setQueryData<Comment[]>(
        ['comments', resourceType, resourceId],
        (oldComments) => {
          if (!oldComments) return [newComment];
          return [...oldComments, newComment];
        }
      );
    },
  });

  // Add a reply to a comment
  const { mutateAsync: addReply } = useMutation({
    mutationFn: async (replyData: CreateReplyDto) => {
      const response = await apiClient.post<{ comment: Comment }>(
        `/api/comments/${replyData.commentId}/replies`,
        replyData
      );
      return response.data.comment;
    },
    onSuccess: (updatedComment) => {
      queryClient.setQueryData<Comment[]>(
        ['comments', resourceType, resourceId],
        (oldComments) => {
          if (!oldComments) return [updatedComment];
          return oldComments.map(comment => 
            comment.id === updatedComment.id ? updatedComment : comment
          );
        }
      );
    },
  });

  // Edit a comment
  const { mutateAsync: editComment } = useMutation({
    mutationFn: async (commentId: string, updateData: UpdateCommentDto) => {
      const response = await apiClient.put<{ comment: Comment }>(
        `/api/comments/${commentId}`,
        updateData
      );
      return response.data.comment;
    },
    onMutate: async (commentId: string, updateData: UpdateCommentDto) => {
      // Optimistically update the comment
      queryClient.setQueryData<Comment[]>(
        ['comments', resourceType, resourceId],
        (oldComments) => {
          if (!oldComments) return [];
          return oldComments.map(comment => 
            comment.id === commentId 
              ? { ...comment, content: updateData.content, updatedAt: new Date().toISOString() } 
              : comment
          );
        }
      );
    },
    onSuccess: (updatedComment) => {
      queryClient.setQueryData<Comment[]>(
        ['comments', resourceType, resourceId],
        (oldComments) => {
          if (!oldComments) return [updatedComment];
          return oldComments.map(comment => 
            comment.id === updatedComment.id ? updatedComment : comment
          );
        }
      );
    },
  });

  // Delete a comment
  const { mutateAsync: deleteComment } = useMutation({
    mutationFn: async (commentId: string) => {
      await apiClient.delete(`/api/comments/${commentId}`);
      return commentId;
    },
    onSuccess: (deletedCommentId) => {
      queryClient.setQueryData<Comment[]>(
        ['comments', resourceType, resourceId],
        (oldComments) => {
          if (!oldComments) return [];
          return oldComments.filter(comment => comment.id !== deletedCommentId);
        }
      );
    },
  });

  // Edit a reply
  const { mutateAsync: editReply } = useMutation({
    mutationFn: async (commentId: string, replyId: string, updateData: UpdateCommentDto) => {
      const response = await apiClient.put<{ comment: Comment }>(
        `/api/comments/${commentId}/replies/${replyId}`,
        updateData
      );
      return response.data.comment;
    },
    onSuccess: (updatedComment) => {
      queryClient.setQueryData<Comment[]>(
        ['comments', resourceType, resourceId],
        (oldComments) => {
          if (!oldComments) return [updatedComment];
          return oldComments.map(comment => 
            comment.id === updatedComment.id ? updatedComment : comment
          );
        }
      );
    },
  });

  // Delete a reply
  const { mutateAsync: deleteReply } = useMutation({
    mutationFn: async (commentId: string, replyId: string) => {
      await apiClient.delete(`/api/comments/${commentId}/replies/${replyId}`);
      return { commentId, replyId };
    },
    onSuccess: ({ commentId, replyId }) => {
      queryClient.setQueryData<Comment[]>(
        ['comments', resourceType, resourceId],
        (oldComments) => {
          if (!oldComments) return [];
          return oldComments.map(comment => {
            if (comment.id !== commentId) return comment;
            
            return {
              ...comment,
              replies: comment.replies?.filter(reply => reply.id !== replyId) || []
            };
          });
        }
      );
    },
  });

  return {
    data,
    isLoading,
    error,
    addComment,
    addReply,
    editComment,
    deleteComment,
    editReply,
    deleteReply,
  };
};
