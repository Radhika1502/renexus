import React, { useState } from 'react';
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Dialog,
  Select,
  DatePicker,
  Badge,
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
} from 'lucide-react';
import { useBulkOperations } from '../hooks/useBulkOperations';
import { BulkActionOption, BulkOperationType } from '../types/bulkOperations';
import { TaskPriority, TaskStatus } from '../types';
import { useUsers } from '../../users/hooks/useUsers';
import { useProjects } from '../../projects/hooks/useProjects';
import { useLabels } from '../hooks/useLabels';

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
  
  const { performBulkOperation, isPending } = useBulkOperations();
  const { data: users } = useUsers();
  const { data: projects } = useProjects();
  const { data: labels } = useLabels();
  
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
    performBulkOperation({
      taskIds: selectedTaskIds,
      operation,
      data,
    });
    
    // Reset state
    setCurrentAction(null);
    setActionData(null);
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
            <div className="flex flex-col">
              {bulkActions.map((action) => (
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
            </div>
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
