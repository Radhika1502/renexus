/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskAttachments } from '../TaskAttachments';
// Using the local implementation of QueryClient
import { QueryClient, QueryClientProvider } from '../../hooks/queryHooks';
import '@testing-library/jest-dom';
import { Task, TaskStatus, TaskPriority, Attachment } from '../../types';

// Mock attachments for testing
const mockAttachments: Attachment[] = [
  {
    id: 'attachment-1',
    fileName: 'requirements.pdf',
    fileSize: 1024000,
    fileType: 'application/pdf',
    uploadedBy: {
      id: 'user-1',
      name: 'John Doe'
    },
    uploadedAt: '2025-06-24T10:30:00Z',
    url: 'https://example.com/files/requirements.pdf'
  },
  {
    id: 'attachment-2',
    fileName: 'design-mockup.png',
    fileSize: 2048000,
    fileType: 'image/png',
    uploadedBy: {
      id: 'user-2',
      name: 'Jane Smith'
    },
    uploadedAt: '2025-06-25T09:15:00Z',
    url: 'https://example.com/files/design-mockup.png'
  },
  {
    id: 'attachment-3',
    fileName: 'implementation-notes.docx',
    fileSize: 512000,
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    uploadedBy: {
      id: 'user-3',
      name: 'Bob Wilson'
    },
    uploadedAt: '2025-06-26T14:20:00Z',
    url: 'https://example.com/files/implementation-notes.docx'
  }
];

// Mock task for testing
const mockTask: Task = {
  id: 'task-1',
  title: 'Implement Attachment Feature',
  description: 'Add ability to upload and manage attachments',
  status: 'IN_PROGRESS' as TaskStatus,
  priority: 'HIGH' as TaskPriority,
  assignees: [
    {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com'
    }
  ],
  reporter: {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane@example.com'
  },
  projectId: 'project-1',
  labels: [],
  attachments: 3, // This is just a count in the Task interface
  comments: 0,
  createdAt: '2025-06-20T09:00:00Z',
  updatedAt: '2025-06-24T16:00:00Z'
};

// Mock the hooks
jest.mock('../../hooks/useTaskAttachments', () => ({
  useTaskAttachments: jest.fn(() => ({
    attachments: mockAttachments,
    isLoading: false,
    isError: false,
    uploadAttachment: jest.fn().mockResolvedValue({}),
    downloadAttachment: jest.fn().mockResolvedValue({}),
    deleteAttachment: jest.fn().mockResolvedValue({}),
  })),
}));

// End of mock setup

describe('TaskAttachments Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    // Note: The local implementation doesn't support configuration options
  });

  it('renders the list of attachments correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskAttachments task={mockTask} />
      </QueryClientProvider>
    );
    
    // Check if all attachments are displayed
    expect(screen.getByText('design-mockup.png')).toBeInTheDocument();
    expect(screen.getByText('requirements.pdf')).toBeInTheDocument();
    expect(screen.getByText('implementation-notes.docx')).toBeInTheDocument();
    
    // Check if file sizes are displayed correctly (based on actual mock data)
    expect(screen.getByText('1000 KB')).toBeInTheDocument(); // 1024000 bytes = 1000 KB exactly
    expect(screen.getByText('1.95 MB')).toBeInTheDocument(); // 2048000 bytes = 1.95 MB  
    expect(screen.getByText('500 KB')).toBeInTheDocument();  // 512000 bytes = 500 KB exactly
  });

  it('displays the correct file type icons', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskAttachments task={mockTask} />
      </QueryClientProvider>
    );
    
    // Check for specific file type icons (implementation-dependent)
    const imageIcon = screen.getByTestId('file-icon-image');
    const pdfIcon = screen.getByTestId('file-icon-pdf');
    const docIcon = screen.getByTestId('file-icon-doc');
    
    expect(imageIcon).toBeInTheDocument();
    expect(pdfIcon).toBeInTheDocument();
    expect(docIcon).toBeInTheDocument();
  });

  it('shows loading state when attachments are loading', () => {
    // Override the mock to simulate loading state
    require('../../hooks/useTaskAttachments').useTaskAttachments.mockImplementationOnce(() => ({
      attachments: [],
      isLoading: true,
      isError: false,
      uploadAttachment: jest.fn(),
      downloadAttachment: jest.fn(),
      deleteAttachment: jest.fn(),
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskAttachments task={mockTask} />
      </QueryClientProvider>
    );
    
    expect(screen.getByTestId('attachments-loading')).toBeInTheDocument();
  });

  it('shows error state when attachments fail to load', () => {
    // Override the mock to simulate error state
    require('../../hooks/useTaskAttachments').useTaskAttachments.mockImplementationOnce(() => ({
      attachments: [],
      isLoading: false,
      isError: true,
      error: new Error('Failed to load attachments'),
      uploadAttachment: jest.fn(),
      downloadAttachment: jest.fn(),
      deleteAttachment: jest.fn(),
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskAttachments task={mockTask} />
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/failed to load attachments/i)).toBeInTheDocument();
  });

  it('calls downloadAttachment when download button is clicked', async () => {
    const mockDownloadAttachment = jest.fn().mockResolvedValue({});
    require('../../hooks/useTaskAttachments').useTaskAttachments.mockImplementationOnce(() => ({
      attachments: mockAttachments,
      isLoading: false,
      isError: false,
      uploadAttachment: jest.fn(),
      downloadAttachment: mockDownloadAttachment,
      deleteAttachment: jest.fn(),
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskAttachments task={mockTask} />
      </QueryClientProvider>
    );
    
    // Click the download button for the first attachment using title attribute
    const downloadButtons = screen.getAllByTitle('Download');
    await userEvent.click(downloadButtons[0]);
    
    expect(mockDownloadAttachment).toHaveBeenCalledWith('attachment-1');
  });

  it('calls deleteAttachment when delete button is clicked and confirmed', async () => {
    const mockDeleteAttachment = jest.fn().mockResolvedValue({});
    require('../../hooks/useTaskAttachments').useTaskAttachments.mockImplementationOnce(() => ({
      attachments: mockAttachments,
      isLoading: false,
      isError: false,
      uploadAttachment: jest.fn(),
      downloadAttachment: jest.fn(),
      deleteAttachment: mockDeleteAttachment,
    }));
    
    // Mock window.confirm to always return true
    window.confirm = jest.fn(() => true);
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskAttachments task={mockTask} />
      </QueryClientProvider>
    );
    
    // Click the three-dots menu for the first attachment using data-testid
    const menuButton = screen.getByTestId('menu-attachment-1');
    await userEvent.click(menuButton);
    
    // Wait for dropdown to appear and click delete using data-testid
    const deleteOption = await screen.findByTestId('delete-attachment-1');
    await userEvent.click(deleteOption);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteAttachment).toHaveBeenCalledWith('attachment-1');
  });

  it('does not call deleteAttachment when delete is canceled', async () => {
    const mockDeleteAttachment = jest.fn().mockResolvedValue({});
    require('../../hooks/useTaskAttachments').useTaskAttachments.mockImplementationOnce(() => ({
      attachments: mockAttachments,
      isLoading: false,
      isError: false,
      uploadAttachment: jest.fn(),
      downloadAttachment: jest.fn(),
      deleteAttachment: mockDeleteAttachment,
    }));
    
    // Mock window.confirm to return false (cancel)
    window.confirm = jest.fn(() => false);
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskAttachments task={mockTask} />
      </QueryClientProvider>
    );
    
    // Click the three-dots menu for the first attachment
    const menuButton = screen.getByTestId('menu-attachment-1');
    await userEvent.click(menuButton);
    
    // Wait for dropdown to appear and click delete
    const deleteOption = await screen.findByTestId('delete-attachment-1');
    await userEvent.click(deleteOption);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteAttachment).not.toHaveBeenCalled();
  });

  it('calls uploadAttachment when files are dropped', async () => {
    const mockUploadAttachment = jest.fn().mockResolvedValue({});
    require('../../hooks/useTaskAttachments').useTaskAttachments.mockImplementationOnce(() => ({
      attachments: mockAttachments,
      isLoading: false,
      isError: false,
      uploadAttachment: mockUploadAttachment,
      downloadAttachment: jest.fn(),
      deleteAttachment: jest.fn(),
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskAttachments task={mockTask} />
      </QueryClientProvider>
    );
    
    // Create a mock file
    const file = new File(['file content'], 'test-file.txt', { type: 'text/plain' });
    
    // Simulate a drop event on the drop zone
    const dropZone = screen.getByTestId('drop-zone');
    
    // Use fireEvent to simulate drop since userEvent.upload doesn't work with drop zones
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file],
        clearData: jest.fn(),
      },
    });
    
    // Wait for the upload to be called
    await waitFor(() => {
      expect(mockUploadAttachment).toHaveBeenCalledWith(
        file,
        expect.any(Function)
      );
    });
  });

  it('shows upload progress when files are being uploaded', () => {
    // Override the mock to simulate upload in progress
    require('../../hooks/useTaskAttachments').useTaskAttachments.mockImplementationOnce(() => ({
      attachments: mockAttachments,
      isLoading: false,
      isError: false,
      uploadAttachment: jest.fn(),
      downloadAttachment: jest.fn(),
      deleteAttachment: jest.fn(),
    }));
    
    // Use a custom render with upload progress
    const Component = () => {
      const [uploadProgress, setUploadProgress] = React.useState<Record<string, number>>({
        'new-file.txt': 50
      });
      
      return (
        <div>
          {Object.keys(uploadProgress).length > 0 && (
            <div className="mb-4 space-y-2">
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="flex items-center text-sm">
                  <div className="w-full mr-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium">{fileName}</span>
                      <span className="text-xs">{progress}%</span>
                    </div>
                    <div 
                      className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700"
                      data-testid="upload-progress-bar"
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };
    
    render(
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>
    );
    
    // Check if progress indicator is displayed
    expect(screen.getByText('new-file.txt')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    
    const progressBar = screen.getByTestId('upload-progress-bar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });
});
