import React, { useState } from 'react';
import { Comment, User } from '../types';
import { Button } from '@renexus/ui-components';
import { MentionTextarea } from './MentionTextarea';
import { useTeamMembers } from '../hooks/useTeamMembers';

interface TaskCommentFormProps {
  taskId: string;
  projectId: string;
  comment?: Comment; // If provided, we're editing an existing comment
  onSubmit: (taskId: string, content: string, mentions: User[], commentId?: string) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export const TaskCommentForm: React.FC<TaskCommentFormProps> = ({
  taskId,
  projectId,
  comment,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [content, setContent] = useState(comment?.content || '');
  const [mentions, setMentions] = useState<User[]>(comment?.mentions || []);
  const isEditing = !!comment;
  const { data: teamMembers = [], isLoading: isLoadingTeamMembers } = useTeamMembers(projectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    try {
      await onSubmit(taskId, content, mentions, comment?.id);
      if (!isEditing) {
        setContent(''); // Clear the form after adding a new comment
        setMentions([]);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="mb-2">
        {isLoadingTeamMembers ? (
          <textarea
            className="w-full px-3 py-2 border rounded-md min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            placeholder="Loading team members..."
            disabled
          />
        ) : (
          <MentionTextarea
            value={content}
            onChange={(newValue, newMentions) => {
              setContent(newValue);
              setMentions(newMentions);
            }}
            placeholder={isEditing ? "Edit your comment..." : "Add a comment... (use @ to mention team members)"}
            teamMembers={teamMembers}
            className="min-h-[100px]"
          />
        )}
      </div>
      <div className="flex justify-end space-x-2">
        {isEditing && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          loading={isSubmitting}
        >
          {isEditing ? 'Update Comment' : 'Add Comment'}
        </Button>
      </div>
    </form>
  );
};
