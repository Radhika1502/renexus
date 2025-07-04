import React, { useState, useEffect, useCallback } from 'react';
import { useCollaboration } from '../contexts/CollaborationContext';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@renexus/ui-components';
import { UserPresence } from './UserPresence';
import { Loader } from 'lucide-react';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { EditorContent, useEditor } from '@tiptap/react';

interface CollaborativeEditorProps {
  documentId: string;
  documentTitle: string;
  initialContent?: string;
  readOnly?: boolean;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  documentId,
  documentTitle,
  initialContent = '',
  readOnly = false
}) => {
  const { isConnected, updatePresence } = useCollaboration();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [ydoc] = useState(() => new Y.Doc());

  // Connect to the collaboration server
  useEffect(() => {
    if (!isConnected || !user) return;

    // Update presence
    updatePresence({
      type: 'document',
      id: documentId
    });

    // Connect to the Y.js WebSocket provider
    const wsProvider = new WebsocketProvider(
      `ws://${window.location.hostname}:3001`,
      `document-${documentId}`,
      ydoc
    );

    wsProvider.on('status', (event: { status: string }) => {
      if (event.status === 'connected') {
        setIsLoading(false);
      }
    });

    // Set awareness information
    wsProvider.awareness.setLocalStateField('user', {
      name: user.name,
      color: getRandomColor(),
      avatar: user.avatar
    });

    setProvider(wsProvider);

    return () => {
      wsProvider.disconnect();
    };
  }, [isConnected, documentId, user, ydoc, updatePresence]);

  // Generate a random color for user cursor
  const getRandomColor = useCallback(() => {
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', 
      '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
      '#009688', '#4caf50', '#8bc34a', '#cddc39',
      '#ffc107', '#ff9800', '#ff5722'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  // Initialize the editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Disable history as it's handled by Collaboration
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: provider?.awareness,
        user: user ? {
          name: user.name,
          color: getRandomColor(),
          avatar: user.avatar
        } : undefined,
      }),
    ],
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      // Handle content updates if needed
      console.log('Content updated');
    },
  }, [provider, user, readOnly]);

  // Update editor when provider changes
  useEffect(() => {
    if (editor && provider) {
      // Re-configure collaboration cursor when provider changes
      editor.extensionManager.extensions.forEach(extension => {
        if (extension.name === 'collaborationCursor') {
          extension.configure({
            provider: provider.awareness,
            user: user ? {
              name: user.name,
              color: getRandomColor(),
              avatar: user.avatar
            } : undefined,
          });
        }
      });
    }
  }, [editor, provider, user, getRandomColor]);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{documentTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500 dark:text-gray-400">
              Connecting to collaboration server...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{documentTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin h-8 w-8 text-primary mr-2" />
            <p>Loading document...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{documentTitle}</CardTitle>
        <UserPresence resourceType="document" resourceId={documentId} />
      </CardHeader>
      <CardContent>
        <div className={`border rounded-md p-4 min-h-[300px] ${readOnly ? 'bg-gray-50 dark:bg-gray-900' : ''}`}>
          {editor && <EditorContent editor={editor} />}
        </div>
        {readOnly && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            This document is in read-only mode.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
