import React from 'react';
import { Comment } from '../types';
import { formatDateTime } from '../utils';

interface TaskCommentProps {
  comment: Comment;
  onEdit?: (comment: Comment) => void;
  onDelete?: (commentId: string) => void;
  currentUserId?: string;
}

export const TaskComment: React.FC<TaskCommentProps> = ({
  comment,
  onEdit,
  onDelete,
  currentUserId,
}) => {
  const isAuthor = currentUserId && comment.authorId === currentUserId;
  
  return (
    <div className="border-b pb-4 last:border-b-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {comment.author?.avatar ? (
            <img 
              src={comment.author.avatar} 
              alt={comment.author.name} 
              className="w-8 h-8 rounded-full mr-2"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
              {comment.author?.name.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <p className="font-medium">{comment.author?.name}</p>
            <p className="text-xs text-gray-500">{formatDateTime(comment.createdAt)}</p>
          </div>
        </div>
        
        {isAuthor && (
          <div className="flex space-x-2">
            {onEdit && (
              <button 
                onClick={() => onEdit(comment)}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button 
                onClick={() => onDelete(comment.id)}
                className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
      <div className="whitespace-pre-line text-sm">{comment.content}</div>
    </div>
  );
};
