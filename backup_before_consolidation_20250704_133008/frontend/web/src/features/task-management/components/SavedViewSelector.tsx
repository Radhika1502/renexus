import React, { useState } from 'react';
import { 
  Button, 
  Popover, 
  PopoverTrigger, 
  PopoverContent,
  Input,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@renexus/ui-components';
import { 
  BookmarkPlus, 
  Check, 
  ChevronDown, 
  Edit, 
  MoreVertical, 
  Save, 
  Star, 
  Trash2 
} from 'lucide-react';
import { SavedView  } from "../../../shared/types/savedViews";
import { TaskFilters } from '../types';

interface SavedViewSelectorProps {
  views: SavedView[];
  currentViewId?: string;
  filters: TaskFilters;
  onSelectView: (viewId: string) => void;
  onSaveNewView: (name: string, description: string, isGlobal: boolean) => void;
  onUpdateView: (id: string, name: string, description: string, isGlobal: boolean) => void;
  onDeleteView: (id: string) => void;
  onSetDefaultView: (id: string) => void;
  isLoading?: boolean;
}

export const SavedViewSelector: React.FC<SavedViewSelectorProps> = ({
  views,
  currentViewId,
  filters,
  onSelectView,
  onSaveNewView,
  onUpdateView,
  onDeleteView,
  onSetDefaultView,
  isLoading = false
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [newViewDescription, setNewViewDescription] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);
  const [editingView, setEditingView] = useState<SavedView | null>(null);

  const currentView = views.find(view => view.id === currentViewId);
  
  const handleSaveNewView = () => {
    if (newViewName.trim()) {
      onSaveNewView(newViewName.trim(), newViewDescription.trim(), isGlobal);
      setNewViewName('');
      setNewViewDescription('');
      setIsGlobal(false);
      setIsCreateDialogOpen(false);
    }
  };

  const handleEditView = (view: SavedView) => {
    setEditingView(view);
    setNewViewName(view.name);
    setNewViewDescription(view.description || '');
    setIsGlobal(view.isGlobal || false);
    setIsEditDialogOpen(true);
  };

  const handleUpdateView = () => {
    if (editingView && newViewName.trim()) {
      onUpdateView(
        editingView.id,
        newViewName.trim(),
        newViewDescription.trim(),
        isGlobal
      );
      setEditingView(null);
      setNewViewName('');
      setNewViewDescription('');
      setIsGlobal(false);
      setIsEditDialogOpen(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center justify-between min-w-[200px]"
            disabled={isLoading}
          >
            <span className="flex items-center">
              {currentView?.icon && (
                <span className="mr-2">{currentView.icon}</span>
              )}
              {currentView?.name || "All Tasks"}
              {currentView?.isDefault && (
                <Star className="ml-1 h-3 w-3 text-yellow-500" />
              )}
            </span>
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="max-h-[400px] overflow-y-auto">
            {views.length > 0 ? (
              <div className="py-1">
                {views.map((view) => (
                  <div 
                    key={view.id}
                    className={`
                      flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800
                      ${currentViewId === view.id ? 'bg-gray-100 dark:bg-gray-800' : ''}
                    `}
                    onClick={() => onSelectView(view.id)}
                  >
                    <div className="flex items-center">
                      {view.icon && <span className="mr-2">{view.icon}</span>}
                      <span>{view.name}</span>
                      {view.isDefault && (
                        <Star className="ml-1 h-3 w-3 text-yellow-500" />
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleEditView(view);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {!view.isDefault && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onSetDefaultView(view.id);
                          }}>
                            <Star className="h-4 w-4 mr-2" />
                            Set as Default
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600 dark:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteView(view.id);
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
            ) : (
              <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                No saved views yet
              </div>
            )}
          </div>
          <div className="border-t p-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Save Current View
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save View</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="view-name">
                View Name
              </label>
              <Input
                id="view-name"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="My Custom View"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="view-description">
                Description (Optional)
              </label>
              <Textarea
                id="view-description"
                value={newViewDescription}
                onChange={(e) => setNewViewDescription(e.target.value)}
                placeholder="Describe what this view shows"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-global"
                checked={isGlobal}
                onChange={(e) => setIsGlobal(e.target.checked)}
              />
              <label htmlFor="is-global" className="text-sm">
                Make this view available to all users
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNewView} disabled={!newViewName.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Save View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit View</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="edit-view-name">
                View Name
              </label>
              <Input
                id="edit-view-name"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="edit-view-description">
                Description (Optional)
              </label>
              <Textarea
                id="edit-view-description"
                value={newViewDescription}
                onChange={(e) => setNewViewDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-is-global"
                checked={isGlobal}
                onChange={(e) => setIsGlobal(e.target.checked)}
              />
              <label htmlFor="edit-is-global" className="text-sm">
                Make this view available to all users
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateView} disabled={!newViewName.trim()}>
              <Check className="h-4 w-4 mr-2" />
              Update View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

