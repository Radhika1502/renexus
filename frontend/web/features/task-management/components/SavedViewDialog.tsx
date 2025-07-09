import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Checkbox
} from '@renexus/ui-components';
import { Save } from 'lucide-react';

interface SavedViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, isGlobal: boolean) => void;
  isEdit?: boolean;
  initialName?: string;
  initialDescription?: string;
  initialIsGlobal?: boolean;
}

export const SavedViewDialog: React.FC<SavedViewDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  isEdit = false,
  initialName = '',
  initialDescription = '',
  initialIsGlobal = false
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isGlobal, setIsGlobal] = useState(initialIsGlobal);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription(initialDescription);
      setIsGlobal(initialIsGlobal);
    }
  }, [isOpen, initialName, initialDescription, initialIsGlobal]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), description.trim(), isGlobal);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit View' : 'Save View'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="view-name">
              View Name
            </label>
            <Input
              id="view-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Custom View"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="view-description">
              Description (Optional)
            </label>
            <Textarea
              id="view-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this view shows"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-global"
              checked={isGlobal}
              onCheckedChange={(checked) => setIsGlobal(checked === true)}
            />
            <label htmlFor="is-global" className="text-sm cursor-pointer">
              Make this view available to all users
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? 'Update View' : 'Save View'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
