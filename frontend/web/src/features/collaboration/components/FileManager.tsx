import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@renexus/ui-components';
import {
  File,
  FileText,
  Image,
  FileArchive,
  MoreVertical,
  Search,
  Plus,
  Download,
  Trash2,
  Share2,
  FolderPlus,
  Grid2X2,
  List,
  SlidersHorizontal,
} from 'lucide-react';
import { useFiles } from '../hooks/useFiles';
import { FileUploader } from './FileUploader';
import { DocumentPreview } from './DocumentPreview';
import { FileAttachment } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface FileManagerProps {
  resourceId: string;
  resourceType: 'task' | 'project';
  title?: string;
}

export const FileManager: React.FC<FileManagerProps> = ({
  resourceId,
  resourceType,
  title = 'Files',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<string | null>(null);
  
  const { data: files, isLoading, deleteFile, shareFile } = useFiles(resourceType, resourceId);

  // Filter and sort files
  const filteredFiles = files?.filter(file => {
    // Apply search filter
    const matchesSearch = searchQuery === '' || 
      file.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply type filter
    const matchesType = !filterType || 
      (filterType === 'image' && file.type.startsWith('image/')) ||
      (filterType === 'document' && (
        file.type.includes('document') || 
        file.type.includes('pdf') || 
        file.type.includes('text')
      )) ||
      (filterType === 'archive' && (
        file.type.includes('zip') || 
        file.type.includes('rar') || 
        file.type.includes('tar')
      ));
    
    return matchesSearch && matchesType;
  }) || [];

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'date') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === 'size') {
      comparison = a.size - b.size;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on file type
  const getFileIcon = (file: FileAttachment) => {
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

  // Handle file click
  const handleFileClick = (file: FileAttachment) => {
    setSelectedFile(file);
    setIsPreviewOpen(true);
  };

  // Handle file deletion
  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteFile(fileId);
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
        setIsPreviewOpen(false);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  // Handle file sharing
  const handleShareFile = async (fileId: string) => {
    try {
      const shareLink = await shareFile(fileId);
      // Copy to clipboard
      navigator.clipboard.writeText(shareLink);
      // Show toast notification (would be implemented in a real app)
      alert('Share link copied to clipboard');
    } catch (error) {
      console.error('Failed to share file:', error);
    }
  };

  // Render grid view
  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {sortedFiles.map((file) => (
        <Card 
          key={file.id} 
          className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleFileClick(file)}
        >
          <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            {file.type.startsWith('image/') && file.thumbnailUrl ? (
              <img 
                src={file.thumbnailUrl} 
                alt={file.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-4xl text-gray-400">
                {getFileIcon(file)}
              </div>
            )}
          </div>
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="truncate pr-2">
                <p className="font-medium text-sm truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href={file.url} download target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleShareFile(file.id);
                  }}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-red-600" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render list view
  const renderListView = () => (
    <div className="divide-y">
      {sortedFiles.map((file) => (
        <div 
          key={file.id}
          className="py-2 px-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
          onClick={() => handleFileClick(file)}
        >
          <div className="mr-3">
            {getFileIcon(file)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate" title={file.name}>
              {file.name}
            </p>
            <div className="flex text-xs text-gray-500">
              <span>{formatFileSize(file.size)}</span>
              <span className="mx-2">•</span>
              <span>{formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href={file.url} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleShareFile(file.id);
              }}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFile(file.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? (
                  <List className="h-4 w-4" />
                ) : (
                  <Grid2X2 className="h-4 w-4" />
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Upload
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search files..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filter & Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <p className="text-sm font-medium mb-2">File Type</p>
                  <div className="grid grid-cols-2 gap-1">
                    <Button 
                      variant={filterType === null ? "secondary" : "outline"} 
                      size="sm"
                      className="w-full"
                      onClick={() => setFilterType(null)}
                    >
                      All
                    </Button>
                    <Button 
                      variant={filterType === 'image' ? "secondary" : "outline"} 
                      size="sm"
                      className="w-full"
                      onClick={() => setFilterType('image')}
                    >
                      Images
                    </Button>
                    <Button 
                      variant={filterType === 'document' ? "secondary" : "outline"} 
                      size="sm"
                      className="w-full"
                      onClick={() => setFilterType('document')}
                    >
                      Documents
                    </Button>
                    <Button 
                      variant={filterType === 'archive' ? "secondary" : "outline"} 
                      size="sm"
                      className="w-full"
                      onClick={() => setFilterType('archive')}
                    >
                      Archives
                    </Button>
                  </div>
                  
                  <p className="text-sm font-medium mt-4 mb-2">Sort By</p>
                  <div className="grid grid-cols-3 gap-1">
                    <Button 
                      variant={sortBy === 'date' ? "secondary" : "outline"} 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSortBy('date');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                    <Button 
                      variant={sortBy === 'name' ? "secondary" : "outline"} 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSortBy('name');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                    <Button 
                      variant={sortBy === 'size' ? "secondary" : "outline"} 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSortBy('size');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Size {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-gray-500">Loading files...</p>
            </div>
          ) : sortedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-1">No files found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || filterType 
                  ? 'Try changing your search or filters' 
                  : 'Upload files to get started'}
              </p>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </div>
          ) : (
            viewMode === 'grid' ? renderGridView() : renderListView()
          )}
        </CardContent>
      </Card>
      
      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <FileUploader
            resourceId={resourceId}
            resourceType={resourceType}
            onUploadComplete={() => setIsUploadDialogOpen(false)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-4xl">
          {selectedFile && (
            <DocumentPreview
              file={selectedFile}
              onEdit={() => {
                setIsPreviewOpen(false);
                // Open edit mode in a real app
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
