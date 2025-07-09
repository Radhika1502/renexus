import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Button,
  Progress,
  Card,
  CardContent,
  CardFooter,
} from '@renexus/ui-components';
import { Upload, X, File, FileText, Image, FileArchive, FilePlus2 } from 'lucide-react';
import { useFileUpload } from '../hooks/useFileUpload';
import { FileAttachment } from '../types';

interface FileUploaderProps {
  resourceId: string;
  resourceType: 'task' | 'project' | 'document' | 'comment';
  onUploadComplete?: (files: FileAttachment[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  resourceId,
  resourceType,
  onUploadComplete,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const { uploadFiles, isUploading, progress } = useFileUpload();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Limit the number of files
    const newFiles = [...files];
    for (const file of acceptedFiles) {
      if (newFiles.length < maxFiles) {
        newFiles.push(file);
      }
    }
    setFiles(newFiles);
  }, [files, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept: acceptedFileTypes ? acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>) : undefined,
  });

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    try {
      const uploadedFiles = await uploadFiles({
        files,
        resourceId,
        resourceType,
      });
      
      setFiles([]);
      
      if (onUploadComplete) {
        onUploadComplete(uploadedFiles);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  // Get file icon based on file type
  const getFileIcon = (file: File) => {
    const type = file.type;
    
    if (type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else if (type.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (type.includes('zip') || type.includes('rar') || type.includes('tar')) {
      return <FileArchive className="h-5 w-5 text-yellow-500" />;
    } else if (type.includes('word') || type.includes('doc')) {
      return <FileText className="h-5 w-5 text-blue-700" />;
    } else if (type.includes('excel') || type.includes('sheet')) {
      return <FileText className="h-5 w-5 text-green-700" />;
    } else if (type.includes('powerpoint') || type.includes('presentation')) {
      return <FileText className="h-5 w-5 text-orange-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag & drop files here, or click to select files'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Max {maxFiles} files, up to {formatFileSize(maxSize)} each
        </p>
      </div>

      {files.length > 0 && (
        <Card>
          <CardContent className="p-2">
            <ul className="divide-y">
              {files.map((file, index) => (
                <li key={index} className="py-2 px-1 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(file)}
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="flex justify-between p-2 pt-0">
            {isUploading ? (
              <div className="w-full">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center mt-1">
                  Uploading... {progress}%
                </p>
              </div>
            ) : (
              <div className="flex w-full justify-end">
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={files.length === 0}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload {files.length} {files.length === 1 ? 'file' : 'files'}
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
};
