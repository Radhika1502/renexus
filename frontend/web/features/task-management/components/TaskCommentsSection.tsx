import React, { useState } from 'react';
import { useTaskComments } from '../hooks/useTaskComments';
import { TaskComment } from './TaskComment';
import { TaskCommentForm } from './TaskCommentForm';
import { Comment, User } from '../types';
import { MessageSquare } from 'lucide-react';
import { Skeleton } from '@renexus/ui-components';

interface TaskCommentsSectionProps {
  taskId: string;
  projectId: string;
  currentUserId?: string;
}

export const TaskCommentsSection: React.FC<TaskCommentsSectionProps> = ({
  taskId,
  projectId,
  currentUserId,
}) => {
  const { 
    comments, 
    isLoading, 
    isError, 
    refetch, 
    addComment, 
    updateComment, 
    deleteComment,
    isAddingComment,
    isUpdatingComment,
    projectMembers
  } = useTaskComments(taskId);
  
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [newComment, setNewComment] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState(0);

  const handleAddComment = async (taskId: string, content: string, mentions: User[]) => {
    await addComment(content, mentions);
  };

  const handleUpdateComment = async (taskId: string, content: string, mentions: User[], commentId?: string) => {
    if (commentId) {
      await updateComment(commentId, content, mentions);
      setEditingComment(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await deleteComment(commentId);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);
    
    // Detect '@' trigger for mentions
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1 && /\s@\w*$/.test(textBeforeCursor)) {
      setMentionQuery(textBeforeCursor.substring(atIndex + 1));
      setShowMentions(true);
      setMentionPosition(atIndex);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (user: User) => {
    if (!newComment) return;
    
    const commentBefore = newComment.substring(0, mentionPosition);
    const commentAfter = newComment.substring(mentionPosition + mentionQuery.length + 1);
    
    setNewComment(`${commentBefore}@${user.username} ${commentAfter}`);
    setShowMentions(false);
  };

  const handleSubmit = async () => {
    const mentions = newComment.match(/@\w+/g) || [];
    const mentionUsers = mentions.map(mention => {
      const username = mention.substring(1);
      return projectMembers.find(m => m.user.username === username)?.user;
    }).filter(Boolean);

    await handleAddComment(taskId, newComment, mentionUsers);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <MessageSquare className="h-5 w-5 mr-2" />
          <h3 className="text-lg font-medium">Comments</h3>
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <MessageSquare className="h-5 w-5 mr-2" />
          <h3 className="text-lg font-medium">Comments</h3>
        </div>
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md text-red-800 dark:text-red-200">
          <p>Failed to load comments. Please try again.</p>
          <button 
            onClick={() => refetch()}
            className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline mt-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <MessageSquare className="h-5 w-5 mr-2" />
        <h3 className="text-lg font-medium">Comments ({comments.length})</h3>
      </div>
      
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment: Comment) => (
            editingComment?.id === comment.id ? (
              <TaskCommentForm
                key={comment.id}
                taskId={taskId}
                projectId={projectId}
                comment={comment}
                onSubmit={handleUpdateComment}
                onCancel={handleCancelEdit}
                isSubmitting={isUpdatingComment}
              />
            ) : (
              <TaskComment
                key={comment.id}
                comment={comment}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                currentUserId={currentUserId}
              />
            )
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No comments yet</p>
        </div>
      )}
      
      <TaskCommentForm
        taskId={taskId}
        projectId={projectId}
        value={newComment}
        onChange={handleCommentChange}
        onSubmit={handleSubmit}
        isSubmitting={isAddingComment}
      />
      {showMentions && (
        <div className="absolute z-10 mt-1 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md border">
          {projectMembers
            .filter(member => 
              member.user.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
              member.user.name.toLowerCase().includes(mentionQuery.toLowerCase())
            )
            .map(member => (
              <div 
                key={member.user.id}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => handleMentionSelect(member.user)}
              >
                <div className="flex items-center">
                  <img 
                    src={member.user.avatarUrl} 
                    alt={member.user.name}
                    className="w-6 h-6 rounded-full mr-2"
                  />
                  <span>{member.user.name}</span>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
};
