import React, { useState, useRef } from 'react';
import { Task } from '../types';
import { useTaskAttachments } from '../hooks/useTaskAttachments';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@renexus/ui-components';
import {
  Paperclip,
  File,
  FileText,
  Image,
  FileArchive,
  Download,
  Trash2,
  MoreVertical,
  Upload,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface TaskAttachmentsProps {
  task: Task;
}

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

export const TaskAttachments: React.FC<TaskAttachmentsProps> = ({ task }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  
  const {
    attachments,
    isLoading,
    isError,
    uploadAttachment,
    downloadAttachment,
    deleteAttachment,
    isUploading,
    isDeleting,
  } = useTaskAttachments(task.id);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Process files for upload
  const handleFiles = async (files: File[]) => {
    // Create a new object to track upload progress
    const newProgress: Record<string, number> = {};
    files.forEach(file => {
      newProgress[file.name] = 0;
    });
    setUploadProgress(newProgress);
    
    // Upload each file
    for (const file of files) {
      try {
        await uploadAttachment(file, (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: progress
          }));
        });
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
      }
    }
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file download
  const handleDownload = async (attachment: Attachment) => {
    try {
      await downloadAttachment(attachment.id);
    } catch (error) {
      console.error(`Error downloading ${attachment.fileName}:`, error);
    }
  };

  // Handle file deletion
  const handleDelete = async (attachmentId: string) => {
    if (window.confirm('Are you sure you want to delete this attachment?')) {
      try {
        await deleteAttachment(attachmentId);
      } catch (error) {
        console.error('Error deleting attachment:', error);
      }
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get appropriate icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-6 w-6 text-blue-500" />;
    } else if (fileType.startsWith('text/')) {
      return <FileText className="h-6 w-6 text-yellow-500" />;
    } else if (fileType.includes('zip') || fileType.includes('compressed')) {
      return <FileArchive className="h-6 w-6 text-purple-500" />;
    } else {
      return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl flex items-center">
          <Paperclip className="mr-2 h-5 w-5" />
          Attachments
        </CardTitle>
        <Button
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </Button>
      </CardHeader>
      <CardContent>
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          multiple
        />
        
        {/* Drag and drop area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-700'
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <Paperclip className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Drag and drop files here, or{' '}
            <button
              type="button"
              className="text-blue-500 hover:text-blue-700 font-medium"
              onClick={() => fileInputRef.current?.click()}
            >
              browse
            </button>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Max file size: 10MB
          </p>
        </div>
        
        {/* Upload progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mb-4 space-y-2">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="flex items-center text-sm">
                <div className="w-full mr-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium">{fileName}</span>
                    <span className="text-xs">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              </div>
            ))}
          </div>
        )}
        
        {/* Error state */}
        {isError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-600 dark:text-red-400">
                Failed to load attachments. Please try again later.
              </p>
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}
        
        {/* Empty state */}
        {!isLoading && attachments && attachments.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Paperclip className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No attachments yet</p>
            <p className="text-sm mt-1">
              Upload files to share them with the team
            </p>
          </div>
        )}
        
        {/* Attachments list */}
        {!isLoading && attachments && attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(attachment.fileType)}
                  <div>
                    <p className="font-medium text-sm">{attachment.fileName}</p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                      <span>{formatFileSize(attachment.fileSize)}</span>
                      <span>•</span>
                      <span>
                        Added {formatDate(attachment.uploadedAt)} by{' '}
                        {attachment.uploadedBy.name}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(attachment)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownload(attachment)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(attachment.id)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskAttachments;
