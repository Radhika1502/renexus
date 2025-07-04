import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  Checkbox,
  Input,
  DateRangePicker
} from '@renexus/ui-components';
import {
  Filter,
  X,
  Save,
  Calendar,
  Clock,
  User,
  MessageSquare,
  Paperclip,
  CheckSquare,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { AdvancedFilterOptions  } from "../../../shared/types/savedViews";
import { useUsers } from '../../users/hooks/useUsers';
import { useLabels } from '../hooks/useLabels';

interface AdvancedFiltersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilters: AdvancedFilterOptions;
  onApplyFilters: (filters: AdvancedFilterOptions) => void;
  onSaveView: () => void;
}

export const AdvancedFiltersDialog: React.FC<AdvancedFiltersDialogProps> = ({
  isOpen,
  onClose,
  initialFilters,
  onApplyFilters,
  onSaveView
}) => {
  const [filters, setFilters] = useState<AdvancedFilterOptions>(initialFilters);
  const [activeTab, setActiveTab] = useState('basic');
  const { users } = useUsers();
  const { labels } = useLabels();

  // Reset filters when dialog opens with new initialFilters
  useEffect(() => {
    if (isOpen) {
      setFilters(initialFilters);
    }
  }, [isOpen, initialFilters]);

  const handleFilterChange = <K extends keyof AdvancedFilterOptions>(
    key: K,
    value: AdvancedFilterOptions[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      status: ['todo', 'inProgress', 'review'],
      sortBy: 'updatedAt',
      sortDirection: 'desc'
    });
  };

  const handleSaveView = () => {
    onSaveView();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Advanced Filters
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={handleSaveView}>
                <Save className="h-4 w-4 mr-2" />
                Save View
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basic">Basic Filters</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Filters</TabsTrigger>
            <TabsTrigger value="sorting">Sorting & Grouping</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select
                  placeholder="Select status"
                  isMulti
                  value={filters.status || []}
                  options={[
                    { value: 'todo', label: 'To Do' },
                    { value: 'inProgress', label: 'In Progress' },
                    { value: 'review', label: 'Review' },
                    { value: 'done', label: 'Done' },
                    { value: 'backlog', label: 'Backlog' }
                  ]}
                  onChange={(value) => handleFilterChange('status', value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <Select
                  placeholder="Select priority"
                  isMulti
                  value={filters.priority || []}
                  options={[
                    { value: 'highest', label: 'Highest' },
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' },
                    { value: 'lowest', label: 'Lowest' }
                  ]}
                  onChange={(value) => handleFilterChange('priority', value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Assignee</label>
                <Select
                  placeholder="Select assignee"
                  isMulti
                  value={filters.assigneeIds || []}
                  options={users?.map(user => ({
                    value: user.id,
                    label: user.name
                  })) || []}
                  onChange={(value) => handleFilterChange('assigneeIds', value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Labels</label>
                <Select
                  placeholder="Select labels"
                  isMulti
                  value={filters.labels || []}
                  options={labels?.map(label => ({
                    value: label.name,
                    label: label.name
                  })) || []}
                  onChange={(value) => handleFilterChange('labels', value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Due Date Range</label>
              <DateRangePicker
                value={{
                  start: filters.dueDateRange?.start,
                  end: filters.dueDateRange?.end
                }}
                onChange={(value) => handleFilterChange('dueDateRange', value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <div className="flex items-center border rounded-md px-3 py-2">
                <Input
                  placeholder="Search tasks..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date Filters
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Created Date</label>
                    <DateRangePicker
                      value={{
                        start: filters.createdDateRange?.start,
                        end: filters.createdDateRange?.end
                      }}
                      onChange={(value) => handleFilterChange('createdDateRange', value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Updated Date</label>
                    <DateRangePicker
                      value={{
                        start: filters.updatedDateRange?.start,
                        end: filters.updatedDateRange?.end
                      }}
                      onChange={(value) => handleFilterChange('updatedDateRange', value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Completed Date</label>
                    <DateRangePicker
                      value={{
                        start: filters.completedDateRange?.start,
                        end: filters.completedDateRange?.end
                      }}
                      onChange={(value) => handleFilterChange('completedDateRange', value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  People Filters
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Created By</label>
                    <Select
                      placeholder="Select users"
                      isMulti
                      value={filters.createdBy || []}
                      options={users?.map(user => ({
                        value: user.id,
                        label: user.name
                      })) || []}
                      onChange={(value) => handleFilterChange('createdBy', value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Watched By</label>
                    <Select
                      placeholder="Select users"
                      isMulti
                      value={filters.watchedBy || []}
                      options={users?.map(user => ({
                        value: user.id,
                        label: user.name
                      })) || []}
                      onChange={(value) => handleFilterChange('watchedBy', value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Content Filters
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasAttachments"
                      checked={filters.hasAttachments || false}
                      onCheckedChange={(checked) => 
                        handleFilterChange('hasAttachments', checked === true)
                      }
                    />
                    <label htmlFor="hasAttachments" className="text-sm cursor-pointer">
                      <Paperclip className="h-4 w-4 inline mr-1" />
                      Has attachments
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasComments"
                      checked={filters.hasComments || false}
                      onCheckedChange={(checked) => 
                        handleFilterChange('hasComments', checked === true)
                      }
                    />
                    <label htmlFor="hasComments" className="text-sm cursor-pointer">
                      <MessageSquare className="h-4 w-4 inline mr-1" />
                      Has comments
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasSubtasks"
                      checked={filters.hasSubtasks || false}
                      onCheckedChange={(checked) => 
                        handleFilterChange('hasSubtasks', checked === true)
                      }
                    />
                    <label htmlFor="hasSubtasks" className="text-sm cursor-pointer">
                      <CheckSquare className="h-4 w-4 inline mr-1" />
                      Has subtasks
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Time Tracking
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Min Hours</label>
                    <Input
                      type="number"
                      min="0"
                      value={filters.timeTracked?.min || ''}
                      onChange={(e) => handleFilterChange('timeTracked', {
                        ...filters.timeTracked,
                        min: e.target.value ? Number(e.target.value) : undefined
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Max Hours</label>
                    <Input
                      type="number"
                      min="0"
                      value={filters.timeTracked?.max || ''}
                      onChange={(e) => handleFilterChange('timeTracked', {
                        ...filters.timeTracked,
                        max: e.target.value ? Number(e.target.value) : undefined
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sorting" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sort By</label>
              <div className="flex items-center space-x-2">
                <Select
                  value={filters.sortBy || 'updatedAt'}
                  onChange={(value) => handleFilterChange('sortBy', value)}
                  options={[
                    { value: 'createdAt', label: 'Created Date' },
                    { value: 'updatedAt', label: 'Updated Date' },
                    { value: 'dueDate', label: 'Due Date' },
                    { value: 'priority', label: 'Priority' },
                    { value: 'status', label: 'Status' },
                    { value: 'title', label: 'Title' }
                  ]}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange(
                    'sortDirection', 
                    filters.sortDirection === 'asc' ? 'desc' : 'asc'
                  )}
                >
                  {filters.sortDirection === 'asc' ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Group By</label>
              <Select
                value={filters.groupBy || 'none'}
                onChange={(value) => handleFilterChange('groupBy', value)}
                options={[
                  { value: 'none', label: 'No Grouping' },
                  { value: 'status', label: 'Status' },
                  { value: 'priority', label: 'Priority' },
                  { value: 'assignee', label: 'Assignee' },
                  { value: 'label', label: 'Label' },
                  { value: 'project', label: 'Project' }
                ]}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

