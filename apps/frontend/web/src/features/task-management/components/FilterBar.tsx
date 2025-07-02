import React, { useState } from 'react';
import { 
  Button,
  Select,
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@renexus/ui-components';
import { 
  Filter, 
  X, 
  ChevronDown, 
  Calendar,
  SlidersHorizontal
} from 'lucide-react';
import { TaskFilters } from '../types';
import { AdvancedFilterOptions  } from "../../../shared/types/savedViews";
import { useUsers } from '../../users/hooks/useUsers';
import { useLabels } from '../hooks/useLabels';
import { SavedViewSelector } from './SavedViewSelector';
import { useSavedViews } from '../hooks/useSavedViews';
import { DateRangePicker } from '@renexus/ui-components';

interface FilterBarProps {
  filters: TaskFilters;
  onFilterChange: (filters: TaskFilters) => void;
  projectId?: string;
  onOpenAdvancedFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  projectId,
  onOpenAdvancedFilters
}) => {
  const { users } = useUsers();
  const { labels } = useLabels();
  const { 
    views, 
    currentViewId, 
    setCurrentViewId, 
    createSavedView, 
    updateSavedView, 
    deleteSavedView, 
    setDefaultView,
    isLoading
  } = useSavedViews(projectId);

  const handleStatusChange = (value: string[]) => {
    onFilterChange({ ...filters, status: value });
  };

  const handlePriorityChange = (value: string[]) => {
    onFilterChange({ ...filters, priority: value });
  };

  const handleAssigneeChange = (value: string[]) => {
    onFilterChange({ ...filters, assigneeIds: value });
  };

  const handleLabelChange = (value: string[]) => {
    onFilterChange({ ...filters, labels: value });
  };

  const handleDueDateChange = (value: { start?: string; end?: string }) => {
    onFilterChange({ 
      ...filters, 
      dueDateStart: value.start,
      dueDateEnd: value.end
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      projectId: projectId,
      status: ['todo', 'inProgress', 'review']
    });
  };

  const handleSelectView = (viewId: string) => {
    const selectedView = views.find(view => view.id === viewId);
    if (selectedView) {
      setCurrentViewId(viewId);
      onFilterChange(selectedView.filters);
    }
  };

  const handleSaveNewView = (name: string, description: string, isGlobal: boolean) => {
    createSavedView.mutate({
      name,
      description,
      filters,
      isGlobal,
      projectId
    });
  };

  const handleUpdateView = (id: string, name: string, description: string, isGlobal: boolean) => {
    updateSavedView.mutate({
      id,
      name,
      description,
      isGlobal
    });
  };

  const handleDeleteView = (id: string) => {
    deleteSavedView.mutate(id);
  };

  const handleSetDefaultView = (id: string) => {
    setDefaultView.mutate(id);
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status && filters.status.length > 0 && 
        !(filters.status.length === 3 && 
          filters.status.includes('todo') && 
          filters.status.includes('inProgress') && 
          filters.status.includes('review'))) {
      count++;
    }
    if (filters.priority && filters.priority.length > 0) count++;
    if (filters.assigneeIds && filters.assigneeIds.length > 0) count++;
    if (filters.labels && filters.labels.length > 0) count++;
    if (filters.dueDateStart || filters.dueDateEnd) count++;
    return count;
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <SavedViewSelector
          views={views}
          currentViewId={currentViewId}
          filters={filters}
          onSelectView={handleSelectView}
          onSaveNewView={handleSaveNewView}
          onUpdateView={handleUpdateView}
          onDeleteView={handleDeleteView}
          onSetDefaultView={handleSetDefaultView}
          isLoading={isLoading}
        />
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onOpenAdvancedFilters}
            className="flex items-center"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
          
          {getActiveFilterCount() > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleClearFilters}
              className="flex items-center text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center">
              Status
              {filters.status && filters.status.length > 0 && (
                <Badge className="ml-2 bg-primary text-white" variant="secondary">
                  {filters.status.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2">
            <Select
              isMulti
              value={filters.status || []}
              onChange={handleStatusChange}
              options={[
                { value: 'todo', label: 'To Do' },
                { value: 'inProgress', label: 'In Progress' },
                { value: 'review', label: 'Review' },
                { value: 'done', label: 'Done' },
                { value: 'backlog', label: 'Backlog' }
              ]}
              placeholder="Select status"
            />
          </PopoverContent>
        </Popover>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center">
              Priority
              {filters.priority && filters.priority.length > 0 && (
                <Badge className="ml-2 bg-primary text-white" variant="secondary">
                  {filters.priority.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2">
            <Select
              isMulti
              value={filters.priority || []}
              onChange={handlePriorityChange}
              options={[
                { value: 'highest', label: 'Highest' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
                { value: 'lowest', label: 'Lowest' }
              ]}
              placeholder="Select priority"
            />
          </PopoverContent>
        </Popover>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center">
              Assignee
              {filters.assigneeIds && filters.assigneeIds.length > 0 && (
                <Badge className="ml-2 bg-primary text-white" variant="secondary">
                  {filters.assigneeIds.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-2">
            <Select
              isMulti
              value={filters.assigneeIds || []}
              onChange={handleAssigneeChange}
              options={users?.map(user => ({
                value: user.id,
                label: user.name
              })) || []}
              placeholder="Select assignee"
            />
          </PopoverContent>
        </Popover>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center">
              Labels
              {filters.labels && filters.labels.length > 0 && (
                <Badge className="ml-2 bg-primary text-white" variant="secondary">
                  {filters.labels.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-2">
            <Select
              isMulti
              value={filters.labels || []}
              onChange={handleLabelChange}
              options={labels?.map(label => ({
                value: label.name,
                label: label.name
              })) || []}
              placeholder="Select labels"
            />
          </PopoverContent>
        </Popover>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Due Date
              {(filters.dueDateStart || filters.dueDateEnd) && (
                <Badge className="ml-2 bg-primary text-white" variant="secondary">
                  1
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-2">
            <DateRangePicker
              value={{
                start: filters.dueDateStart,
                end: filters.dueDateEnd
              }}
              onChange={handleDueDateChange}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

