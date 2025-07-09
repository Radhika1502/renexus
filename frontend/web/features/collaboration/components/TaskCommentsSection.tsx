import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@renexus/ui-components';
import { Send, MessageSquare } from 'lucide-react';
import { useComments } from '../hooks/useComments';
import { CommentThread } from './CommentThread';
import { MentionInput } from './MentionInput';
import { FileUploader } from './FileUploader';
import { Comment } from '../types';

interface TaskCommentsSectionProps {
  taskId: string;
  projectId?: string;
}

export const TaskCommentsSection: React.FC<TaskCommentsSectionProps> = ({
  taskId,
  projectId,
}) => {
  const [commentContent, setCommentContent] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  const [isAttaching, setIsAttaching] = useState(false);
  
  const {
    data: comments,
    isLoading,
    addComment,
    addReply,
    editComment,
    deleteComment,
    editReply,
    deleteReply,
  } = useComments('task', taskId);

  const handleCommentChange = (value: string, detectedMentions: string[]) => {
    setCommentContent(value);
    setMentions(detectedMentions);
  };

  const handleSubmitComment = async () => {
    if (!commentContent.trim()) return;
    
    try {
      await addComment({
        content: commentContent,
        resourceId: taskId,
        resourceType: 'task',
        mentions,
      });
      
      setCommentContent('');
      setMentions([]);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleReply = async (commentId: string, content: string) => {
    try {
      await addReply({
        content,
        commentId,
        mentions: [], // In a real app, you'd extract mentions from content
      });
    } catch (error) {
      console.error('Failed to add reply:', error);
    }
  };

  const handleEditComment = async (commentId: string, content: string) => {
    try {
      await editComment(commentId, {
        content,
        mentions: [], // In a real app, you'd extract mentions from content
      });
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleEditReply = async (commentId: string, replyId: string, content: string) => {
    try {
      await editReply(commentId, replyId, {
        content,
        mentions: [], // In a real app, you'd extract mentions from content
      });
    } catch (error) {
      console.error('Failed to edit reply:', error);
    }
  };

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    try {
      await deleteReply(commentId, replyId);
    } catch (error) {
      console.error('Failed to delete reply:', error);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Comments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="comments">
          <TabsList className="mb-4">
            <TabsTrigger value="comments">
              Comments ({comments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="attach">
              Attach Files
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="comments" className="space-y-4">
            <div className="space-y-2">
              <MentionInput
                value={commentContent}
                onChange={handleCommentChange}
                placeholder="Write a comment..."
                projectId={projectId}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitComment}
                  disabled={!commentContent.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Comment
                </Button>
              </div>
            </div>
            
            <div className="space-y-4 mt-6">
              {isLoading ? (
                <p className="text-center text-gray-500 py-4">Loading comments...</p>
              ) : comments && comments.length > 0 ? (
                comments.map((comment: Comment) => (
                  <CommentThread
                    key={comment.id}
                    comment={comment}
                    onReply={handleReply}
                    onEdit={handleEditComment}
                    onDelete={handleDeleteComment}
                    onEditReply={handleEditReply}
                    onDeleteReply={handleDeleteReply}
                  />
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p>No comments yet</p>
                  <p className="text-sm">Be the first to comment on this task</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="attach">
            <FileUploader
              resourceId={taskId}
              resourceType="task"
              onUploadComplete={() => {
                // Optionally switch back to comments tab after upload
              }}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
