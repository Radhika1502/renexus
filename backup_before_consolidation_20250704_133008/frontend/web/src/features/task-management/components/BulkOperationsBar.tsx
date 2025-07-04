import React, { useState, useEffect } from 'react';
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Dialog,
  Select,
  DatePicker,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Switch,
  Textarea,
  Tooltip,
} from '../../../components/ui';
import {
  CheckSquare,
  X,
  ChevronDown,
  Trash2,
  Archive,
  Tag,
  Calendar,
  Flag,
  Users,
  FolderMove,
  AlertTriangle,
  CopyIcon,
  ClipboardList,
  Clock,
  FileDown,
} from 'lucide-react';
import { useBulkOperations } from '../hooks/useBulkOperations';
import { BulkActionOption, BulkOperationType  } from "../../../shared/types/bulkOperations";
import { TaskPriority, TaskStatus } from '../types';
import { useUsers } from '../../users/hooks/useUsers';
import { useProjects } from '../../projects/hooks/useProjects';
import { useLabels } from '../hooks/useLabels';
import { useWorkflows } from '../hooks/useWorkflows';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { exportToCSV, exportToExcel } from '../utils/exportUtils';
import { DuplicateTasksSelector } from './bulk-selectors/DuplicateTasksSelector';
import { ExportTasksSelector } from './bulk-selectors/ExportTasksSelector';
import { WorkflowSelector } from './bulk-selectors/WorkflowSelector';
import { ScheduleTasksSelector } from './bulk-selectors/ScheduleTasksSelector';

interface BulkOperationsBarProps {
  selectedTaskIds: string[];
  onClearSelection: () => void;
  onExitSelectMode: () => void;
}

export const BulkOperationsBar: React.FC<BulkOperationsBarProps> = ({
  selectedTaskIds,
  onClearSelection,
  onExitSelectMode,
}) => {
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<BulkActionOption | null>(null);
  const [actionData, setActionData] = useState<any>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [operationHistory, setOperationHistory] = useState<Array<{id: string, operation: string, count: number, timestamp: Date}>>([]);
  const [isExporting, setIsExporting] = useState(false);
  
  const { performBulkOperation, isPending } = useBulkOperations();
  const [lastOperationResult, setLastOperationResult] = useState<{success: boolean, operation: string, affectedCount: number} | null>(null);
  const { data: workflows } = useWorkflows();
  const { isOnline, saveToCache } = useOfflineSync();
  const { data: users } = useUsers();
  const { data: projects } = useProjects();
  const { data: labels } = useLabels();
  
  // Track operation history when bulk operations complete
  const trackOperationHistory = (operation: string, count: number) => {
    setOperationHistory(prev => [
      {
        id: Date.now().toString(),
        operation,
        count,
        timestamp: new Date()
      },
      ...prev.slice(0, 9) // Keep last 10 operations
    ]);
    
    setLastOperationResult({
      success: true,
      operation,
      affectedCount: count
    });
  };

  // Define available bulk actions
  const bulkActions: BulkActionOption[] = [
    {
      id: 'update-status',
      label: 'Update Status',
      icon: <CheckSquare className="h-4 w-4" />,
      requiresData: true,
      dataComponent: ({ onDataSelect, onCancel }) => (
        <StatusSelector onSelect={onDataSelect} onCancel={onCancel} />
      ),
    },
    {
      id: 'update-priority',
      label: 'Update Priority',
      icon: <Flag className="h-4 w-4" />,
      requiresData: true,
      dataComponent: ({ onDataSelect, onCancel }) => (
        <PrioritySelector onSelect={onDataSelect} onCancel={onCancel} />
      ),
    },
    {
      id: 'update-assignee',
      label: 'Assign To',
      icon: <Users className="h-4 w-4" />,
      requiresData: true,
      dataComponent: ({ onDataSelect, onCancel }) => (
        <AssigneeSelector 
          users={users || []} 
          onSelect={onDataSelect} 
          onCancel={onCancel} 
        />
      ),
    },
    {
      id: 'update-dueDate',
      label: 'Set Due Date',
      icon: <Calendar className="h-4 w-4" />,
      requiresData: true,
      dataComponent: ({ onDataSelect, onCancel }) => (
        <DueDateSelector onSelect={onDataSelect} onCancel={onCancel} />
      ),
    },
    {
      id: 'add-label',
      label: 'Add Label',
      icon: <Tag className="h-4 w-4" />,
      requiresData: true,
      dataComponent: ({ onDataSelect, onCancel }) => (
        <LabelSelector 
          labels={labels || []} 
          onSelect={onDataSelect} 
          onCancel={onCancel}
          mode="add"
        />
      ),
    },
    {
      id: 'remove-label',
      label: 'Remove Label',
      icon: <Tag className="h-4 w-4" />,
      requiresData: true,
      dataComponent: ({ onDataSelect, onCancel }) => (
        <LabelSelector 
          labels={labels || []} 
          onSelect={onDataSelect} 
          onCancel={onCancel}
          mode="remove"
        />
      ),
    },
    {
      id: 'move-project',
      label: 'Move to Project',
      icon: <FolderMove className="h-4 w-4" />,
      requiresData: true,
      dataComponent: ({ onDataSelect, onCancel }) => (
        <ProjectSelector 
          projects={projects || []} 
          onSelect={onDataSelect} 
          onCancel={onCancel} 
        />
      ),
    },
    {
      id: 'archive',
      label: 'Archive Tasks',
      icon: <Archive className="h-4 w-4" />,
      confirmationMessage: `Are you sure you want to archive ${selectedTaskIds.length} tasks?`,
      isDangerous: false,
    },
    {
      id: 'delete',
      label: 'Delete Tasks',
      icon: <Trash2 className="h-4 w-4" />,
      confirmationMessage: `Are you sure you want to delete ${selectedTaskIds.length} tasks? This action cannot be undone.`,
      isDangerous: true,
    },
    {
      id: 'duplicate',
      label: 'Duplicate Tasks',
      icon: <CopyIcon className="h-4 w-4" />,
      requiresData: true,
      dataComponent: ({ onDataSelect, onCancel }) => (
        <DuplicateTasksSelector onSelect={onDataSelect} onCancel={onCancel} />
      ),
    },
    {
      id: 'export',
      label: 'Export Tasks',
      icon: <FileDown className="h-4 w-4" />,
      requiresData: true,
      dataComponent: ({ onDataSelect, onCancel }) => (
        <ExportTasksSelector onSelect={onDataSelect} onCancel={onCancel} />
      ),
    },
    {
      id: 'apply-workflow',
      label: 'Apply Workflow',
      icon: <FolderMove className="h-4 w-4" />,
      requiresData: true,
      dataComponent: ({ onDataSelect, onCancel }) => (
        <WorkflowSelector 
          workflows={workflows || []} 
          onSelect={onDataSelect} 
          onCancel={onCancel} 
        />
      ),
    },
    {
      id: 'schedule',
      label: 'Schedule Tasks',
      icon: <Clock className="h-4 w-4" />,
      requiresData: true,
      dataComponent: ({ onDataSelect, onCancel }) => (
        <ScheduleTasksSelector onSelect={onDataSelect} onCancel={onCancel} />
      ),
    },
  ];

  const handleActionClick = (action: BulkActionOption) => {
    setCurrentAction(action);
    
    if (action.requiresData) {
      setIsActionDialogOpen(true);
    } else if (action.confirmationMessage) {
      if (window.confirm(action.confirmationMessage)) {
        executeBulkOperation(action.id);
      }
    } else {
      executeBulkOperation(action.id);
    }
  };

  const handleDataSelect = (data: any) => {
    if (!currentAction) return;
    
    setActionData(data);
    setIsActionDialogOpen(false);
    executeBulkOperation(currentAction.id, data);
  };

  const executeBulkOperation = (operation: BulkOperationType, data?: any) => {
    // Handle special operations
    if (operation === 'export') {
      handleExportTasks(data);
      return;
    }
    
    // For regular operations, use the bulk operations API
    performBulkOperation({
      taskIds: selectedTaskIds,
      operation,
      data,
    });
    
    // Track the operation in history
    trackOperationHistory(operation, selectedTaskIds.length);
    
    // Save operation to offline cache if we're offline
    if (!isOnline) {
      saveToCache('bulkOperations', {
        taskIds: selectedTaskIds,
        operation,
        data,
        timestamp: new Date().toISOString()
      });
    }
    
    // Reset state
    setCurrentAction(null);
    setActionData(null);
  };

  // Handle exporting tasks
  const handleExportTasks = (data: { format: 'csv' | 'excel' | 'pdf' }) => {
    setIsExporting(true);
    
    // In a real implementation, we would fetch the full task data here
    // For now, we'll just simulate exporting the IDs
    const tasksToExport = selectedTaskIds.map(id => ({ id }));
    
    try {
      if (data.format === 'csv') {
        exportToCSV(tasksToExport, 'tasks-export');
      } else if (data.format === 'excel') {
        exportToExcel(tasksToExport, 'tasks-export');
      }
      // PDF export would be handled similarly
    } catch (error) {
      console.error('Error exporting tasks:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-10 p-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-sm">
          {selectedTaskIds.length} selected
        </Badge>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearSelection}
          disabled={isPending}
        >
          Clear selection
        </Button>
        
        <Tooltip content={`${isOnline ? 'Online' : 'Offline'} Mode`}>
          <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-amber-500'}`}></div>
        </Tooltip>
      </div>
      
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              disabled={selectedTaskIds.length === 0 || isPending}
            >
              Actions <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0">
            <Tabs defaultValue="basic">
              <TabsList className="w-full">
                <TabsTrigger value="basic" className="flex-1">Basic</TabsTrigger>
                <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="flex flex-col">
                {bulkActions.slice(0, 9).map((action) => (
                  <Button
                    key={action.id}
                    variant="ghost"
                    size="sm"
                    className={`justify-start ${action.isDangerous ? 'text-red-500 hover:text-red-600' : ''}`}
                    onClick={() => handleActionClick(action)}
                    disabled={isPending}
                  >
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                  </Button>
                ))}
              </TabsContent>
              
              <TabsContent value="advanced" className="flex flex-col">
                {bulkActions.slice(9).map((action) => (
                  <Button
                    key={action.id}
                    variant="ghost"
                    size="sm"
                    className="justify-start"
                    onClick={() => handleActionClick(action)}
                    disabled={isPending}
                  >
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                  </Button>
                ))}
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              disabled={operationHistory.length === 0}
            >
              <ClipboardList className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2">
            <h3 className="font-medium mb-2">Recent Operations</h3>
            {operationHistory.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                {operationHistory.map(op => (
                  <div key={op.id} className="text-sm py-1 border-b last:border-0">
                    <div className="flex justify-between">
                      <span className="font-medium">{op.operation}</span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(op.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {op.count} tasks affected
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No recent operations</div>
            )}
          </PopoverContent>
        </Popover>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onExitSelectMode}
          disabled={isPending}
        >
          <X className="h-4 w-4 mr-1" /> Exit
        </Button>
      </div>
      
      {/* Action Data Dialog */}
      <Dialog
        open={isActionDialogOpen}
        onOpenChange={setIsActionDialogOpen}
        title={currentAction?.label || 'Select Options'}
      >
        {currentAction?.dataComponent && React.createElement(currentAction.dataComponent, {
          onDataSelect: handleDataSelect,
          onCancel: () => setIsActionDialogOpen(false),
        })}
      </Dialog>
      
      {/* Loading indicator for exports */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-md shadow-lg flex items-center gap-2">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
            <span>Exporting tasks...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Data selector components for different bulk actions

interface SelectorProps {
  onSelect: (data: any) => void;
  onCancel: () => void;
}

const StatusSelector: React.FC<SelectorProps> = ({ onSelect, onCancel }) => {
  const statuses: { value: TaskStatus; label: string }[] = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'todo', label: 'To Do' },
    { value: 'inProgress', label: 'In Progress' },
    { value: 'review', label: 'Review' },
    { value: 'done', label: 'Done' },
  ];
  
  return (
    <div className="p-4 space-y-4">
      <p className="text-sm text-gray-500">Select a status to apply to all selected tasks.</p>
      
      <Select
        options={statuses}
        onChange={(value) => onSelect({ status: value })}
        placeholder="Select status"
        autoFocus
      />
      
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSelect({ status: 'todo' })}>Apply</Button>
      </div>
    </div>
  );
};

const PrioritySelector: React.FC<SelectorProps> = ({ onSelect, onCancel }) => {
  const priorities: { value: TaskPriority; label: string }[] = [
    { value: 'highest', label: 'Highest' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
    { value: 'lowest', label: 'Lowest' },
  ];
  
  return (
    <div className="p-4 space-y-4">
      <p className="text-sm text-gray-500">Select a priority to apply to all selected tasks.</p>
      
      <Select
        options={priorities}
        onChange={(value) => onSelect({ priority: value })}
        placeholder="Select priority"
        autoFocus
      />
      
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSelect({ priority: 'medium' })}>Apply</Button>
      </div>
    </div>
  );
};

interface AssigneeSelectorProps extends SelectorProps {
  users: any[];
}

const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({ users, onSelect, onCancel }) => {
  const userOptions = users.map(user => ({
    value: user.id,
    label: user.name,
  }));
  
  return (
    <div className="p-4 space-y-4">
      <p className="text-sm text-gray-500">Select a user to assign all selected tasks to.</p>
      
      <Select
        options={userOptions}
        onChange={(value) => onSelect({ assigneeId: value })}
        placeholder="Select assignee"
        autoFocus
      />
      
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSelect({ assigneeId: null })}>Unassign All</Button>
      </div>
    </div>
  );
};

const DueDateSelector: React.FC<SelectorProps> = ({ onSelect, onCancel }) => {
  const [date, setDate] = useState<Date | null>(null);
  
  return (
    <div className="p-4 space-y-4">
      <p className="text-sm text-gray-500">Select a due date to apply to all selected tasks.</p>
      
      <DatePicker
        selected={date}
        onSelect={setDate}
        placeholder="Select due date"
      />
      
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button 
          onClick={() => onSelect({ dueDate: date ? date.toISOString() : null })}
          disabled={!date}
        >
          Apply
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onSelect({ dueDate: null })}
        >
          Clear Due Date
        </Button>
      </div>
    </div>
  );
};

interface LabelSelectorProps extends SelectorProps {
  labels: any[];
  mode: 'add' | 'remove';
}

const LabelSelector: React.FC<LabelSelectorProps> = ({ labels, onSelect, onCancel, mode }) => {
  const labelOptions = labels.map(label => ({
    value: label.id,
    label: label.name,
  }));
  
  return (
    <div className="p-4 space-y-4">
      <p className="text-sm text-gray-500">
        Select a label to {mode === 'add' ? 'add to' : 'remove from'} all selected tasks.
      </p>
      
      <Select
        options={labelOptions}
        onChange={(value) => onSelect({ label: value })}
        placeholder="Select label"
        autoFocus
      />
      
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSelect({ label: labelOptions[0]?.value })}>
          {mode === 'add' ? 'Add Label' : 'Remove Label'}
        </Button>
      </div>
    </div>
  );
};

interface ProjectSelectorProps extends SelectorProps {
  projects: any[];
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({ projects, onSelect, onCancel }) => {
  const projectOptions = projects.map(project => ({
    value: project.id,
    label: project.name,
  }));
  
  return (
    <div className="p-4 space-y-4">
      <p className="text-sm text-gray-500">Select a project to move all selected tasks to.</p>
      
      <Select
        options={projectOptions}
        onChange={(value) => onSelect({ projectId: value })}
        placeholder="Select project"
        autoFocus
      />
      
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button 
          onClick={() => onSelect({ projectId: projectOptions[0]?.value })}
          disabled={projectOptions.length === 0}
        >
          Move Tasks
        </Button>
      </div>
    </div>
  );
};

