import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@renexus/ui-components';
import { Download, History, ExternalLink, Eye, Edit, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDocumentVersions } from '../hooks/useDocumentVersions';
import { formatDistanceToNow } from 'date-fns';
import { DocumentVersion, FileAttachment } from '../types';
import { CollaborativeEditor } from './CollaborativeEditor';

interface DocumentPreviewProps {
  file: FileAttachment;
  onEdit?: () => void;
  readOnly?: boolean;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  file,
  onEdit,
  readOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'versions'>('preview');
  const [selectedVersion, setSelectedVersion] = useState<string>('latest');
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [compareVersion, setCompareVersion] = useState<DocumentVersion | null>(null);
  
  const { 
    data: versions, 
    isLoading: isLoadingVersions,
    restoreVersion,
  } = useDocumentVersions(file.id);

  const latestVersion = versions?.[0];
  const selectedVersionData = selectedVersion === 'latest' 
    ? latestVersion 
    : versions?.find(v => v.id === selectedVersion) || latestVersion;

  // Determine file type for preview
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';
  const isText = file.type === 'text/plain';
  const isDocument = file.type.includes('document') || file.type.includes('msword') || file.type.includes('officedocument');
  const isSpreadsheet = file.type.includes('sheet') || file.type.includes('excel');
  const isPresentation = file.type.includes('presentation') || file.type.includes('powerpoint');
  const isPreviewable = isImage || isPdf || isText || isDocument;

  // Format date
  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Handle version restore
  const handleRestoreVersion = async (versionId: string) => {
    try {
      await restoreVersion(versionId);
      setSelectedVersion('latest');
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
  };

  // Render version comparison dialog
  const renderComparisonDialog = () => {
    if (!compareVersion || !latestVersion) return null;
    
    return (
      <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Compare Versions</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded p-4">
              <h3 className="text-sm font-medium mb-2">
                Version {compareVersion.version} ({formatDate(compareVersion.createdAt)})
              </h3>
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: compareVersion.content }} />
              </div>
            </div>
            
            <div className="border rounded p-4">
              <h3 className="text-sm font-medium mb-2">
                Latest Version ({formatDate(latestVersion.createdAt)})
              </h3>
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: latestVersion.content }} />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsVersionDialogOpen(false)}
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                handleRestoreVersion(compareVersion.id);
                setIsVersionDialogOpen(false);
              }}
            >
              Restore This Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Render file preview based on type
  const renderPreview = () => {
    if (isImage) {
      return (
        <div className="flex justify-center p-4">
          <img 
            src={file.url} 
            alt={file.name} 
            className="max-h-[500px] object-contain"
          />
        </div>
      );
    } else if (isPdf) {
      return (
        <div className="h-[600px]">
          <iframe 
            src={`${file.url}#view=FitH`} 
            className="w-full h-full border-0"
            title={file.name}
          />
        </div>
      );
    } else if (isDocument || isText) {
      return (
        <div className="p-4">
          <CollaborativeEditor 
            documentId={file.id}
            documentTitle={file.name}
            readOnly={readOnly}
          />
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center p-12">
          <FileText className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Preview not available</h3>
          <p className="text-gray-500 text-center mb-4">
            This file type cannot be previewed directly.
          </p>
          <Button asChild>
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" />
              Download File
            </a>
          </Button>
        </div>
      );
    }
  };

  // Render versions tab
  const renderVersionsTab = () => {
    if (isLoadingVersions) {
      return (
        <div className="flex justify-center items-center p-12">
          <p>Loading versions...</p>
        </div>
      );
    }

    if (!versions || versions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12">
          <History className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No versions available</h3>
          <p className="text-gray-500 text-center">
            This document doesn't have any version history yet.
          </p>
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="space-y-4">
          {versions.map((version, index) => (
            <Card key={version.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">
                      {index === 0 ? 'Current Version' : `Version ${version.version}`}
                    </h3>
                    <div className="text-sm text-gray-500 space-y-1 mt-1">
                      <p>Updated {formatDate(version.createdAt)}</p>
                      <p>By {version.createdBy.name}</p>
                      {version.comment && (
                        <p className="italic">"{version.comment}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setCompareVersion(version);
                        setIsVersionDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Compare
                    </Button>
                    {index > 0 && (
                      <Button 
                        size="sm"
                        onClick={() => handleRestoreVersion(version.id)}
                      >
                        <History className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{file.name}</CardTitle>
          <div className="flex space-x-2">
            {!readOnly && onEdit && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              asChild
            >
              <a href={file.url} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-1" />
                Download
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'preview' | 'versions')}>
        <div className="px-4 pt-2 border-b">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="versions">
              Version History
              {versions && versions.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">
                  {versions.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="preview" className="m-0">
          {isDocument && versions && versions.length > 0 && (
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 border-b">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  disabled={selectedVersion === 'latest' || !versions.find(v => v.id === selectedVersion)?.version || versions.find(v => v.id === selectedVersion)?.version === 1}
                  onClick={() => {
                    if (selectedVersion === 'latest') return;
                    const currentIndex = versions.findIndex(v => v.id === selectedVersion);
                    if (currentIndex < versions.length - 1) {
                      setSelectedVersion(versions[currentIndex + 1].id);
                    }
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Select 
                  value={selectedVersion} 
                  onValueChange={setSelectedVersion}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest Version</SelectItem>
                    {versions.map((version, index) => (
                      <SelectItem key={version.id} value={version.id}>
                        {index === 0 ? 'Current Version' : `Version ${version.version}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  disabled={selectedVersion === 'latest' || versions.findIndex(v => v.id === selectedVersion) === 0}
                  onClick={() => {
                    if (selectedVersion === 'latest') return;
                    const currentIndex = versions.findIndex(v => v.id === selectedVersion);
                    if (currentIndex > 0) {
                      setSelectedVersion(versions[currentIndex - 1].id);
                    }
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {selectedVersion !== 'latest' && (
                <Button 
                  size="sm"
                  onClick={() => handleRestoreVersion(selectedVersion)}
                >
                  <History className="h-4 w-4 mr-1" />
                  Restore This Version
                </Button>
              )}
            </div>
          )}
          
          {renderPreview()}
        </TabsContent>
        
        <TabsContent value="versions" className="m-0">
          {renderVersionsTab()}
        </TabsContent>
      </Tabs>
      
      <CardFooter className="bg-gray-50 dark:bg-gray-800/50 py-2 px-4 text-sm text-gray-500">
        <div className="flex items-center justify-between w-full">
          <span>
            Uploaded by {file.uploadedBy.name} • {formatDate(file.createdAt)}
          </span>
          <span>
            {(file.size / 1024).toFixed(1)} KB
          </span>
        </div>
      </CardFooter>
      
      {renderComparisonDialog()}
    </Card>
  );
};
