import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Textarea,
  Separator
} from '@renexus/ui-components';
import { formatDistanceToNow } from 'date-fns';
import { useCollaboration } from '../contexts/CollaborationContext';
import { useAuth } from '../../auth/hooks/useAuth';
import { Send, Reply, Edit, Trash2, X, Check } from 'lucide-react';
import { Comment, CommentReply } from '../types';

interface CommentThreadProps {
  comment: Comment;
  onReply: (commentId: string, content: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onEditReply: (commentId: string, replyId: string, content: string) => void;
  onDeleteReply: (commentId: string, replyId: string) => void;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  onReply,
  onEdit,
  onDelete,
  onEditReply,
  onDeleteReply
}) => {
  const { user } = useAuth();
  const { subscribeToChannel, sendMessage } = useCollaboration();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyContent, setEditReplyContent] = useState('');

  // Subscribe to real-time updates for this comment thread
  useEffect(() => {
    const unsubscribe = subscribeToChannel(`comment-${comment.id}`, (message) => {
      // Handle real-time updates to this comment thread
      console.log('Comment thread update:', message);
      // In a real implementation, you would update the local state based on the message
    });

    return unsubscribe;
  }, [comment.id, subscribeToChannel]);

  const handleReplySubmit = () => {
    if (!replyContent.trim()) return;
    
    onReply(comment.id, replyContent);
    setReplyContent('');
    setIsReplying(false);
    
    // Notify other users about the new reply
    sendMessage(`comment-${comment.id}`, {
      action: 'new-reply',
      commentId: comment.id,
      userId: user?.id
    });
  };

  const handleEditSubmit = () => {
    if (!editContent.trim()) return;
    
    onEdit(comment.id, editContent);
    setIsEditing(false);
    
    // Notify other users about the edit
    sendMessage(`comment-${comment.id}`, {
      action: 'edit-comment',
      commentId: comment.id,
      userId: user?.id
    });
  };

  const handleEditReplySubmit = (replyId: string) => {
    if (!editReplyContent.trim()) return;
    
    onEditReply(comment.id, replyId, editReplyContent);
    setEditingReplyId(null);
    
    // Notify other users about the reply edit
    sendMessage(`comment-${comment.id}`, {
      action: 'edit-reply',
      commentId: comment.id,
      replyId,
      userId: user?.id
    });
  };

  const startEditingReply = (reply: CommentReply) => {
    setEditingReplyId(reply.id);
    setEditReplyContent(reply.content);
  };

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex space-x-3">
          <Avatar className="h-8 w-8">
            {comment.author.avatar && (
              <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
            )}
            <AvatarFallback>
              {comment.author.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{comment.author.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              
              {user?.id === comment.author.id && !isEditing && (
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-red-500" 
                    onClick={() => onDelete(comment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            {isEditing ? (
              <div className="mt-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end mt-2 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleEditSubmit}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-1 prose prose-sm dark:prose-invert max-w-none">
                {comment.content}
              </div>
            )}
            
            {/* Replies section */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="flex space-x-3">
                    <Avatar className="h-6 w-6">
                      {reply.author.avatar && (
                        <AvatarImage src={reply.author.avatar} alt={reply.author.name} />
                      )}
                      <AvatarFallback>
                        {reply.author.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{reply.author.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            {formatDate(reply.createdAt)}
                          </span>
                        </div>
                        
                        {user?.id === reply.author.id && editingReplyId !== reply.id && (
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6" 
                              onClick={() => startEditingReply(reply)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-red-500" 
                              onClick={() => onDeleteReply(comment.id, reply.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {editingReplyId === reply.id ? (
                        <div className="mt-1">
                          <Textarea
                            value={editReplyContent}
                            onChange={(e) => setEditReplyContent(e.target.value)}
                            className="min-h-[60px]"
                          />
                          <div className="flex justify-end mt-2 space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setEditingReplyId(null)}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleEditReplySubmit(reply.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 prose prose-sm dark:prose-invert max-w-none">
                          {reply.content}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Reply form */}
            {!isReplying ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-3" 
                onClick={() => setIsReplying(true)}
              >
                <Reply className="h-4 w-4 mr-1" />
                Reply
              </Button>
            ) : (
              <div className="mt-3">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex justify-end mt-2 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setIsReplying(false);
                      setReplyContent('');
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleReplySubmit}
                    disabled={!replyContent.trim()}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
