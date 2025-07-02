import React, { useState } from 'react';
import {
  Button,
  Switch,
  FormControl,
  FormLabel,
  FormDescription,
  Input,
} from '../../../../components/ui';

interface DuplicateTasksSelectorProps {
  onSelect: (data: any) => void;
  onCancel: () => void;
}

export const DuplicateTasksSelector: React.FC<DuplicateTasksSelectorProps> = ({
  onSelect,
  onCancel,
}) => {
  const [includeSubtasks, setIncludeSubtasks] = useState(true);
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [includeComments, setIncludeComments] = useState(false);
  const [nameSuffix, setNameSuffix] = useState('(Copy)');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSelect({
      includeSubtasks,
      includeAttachments,
      includeComments,
      nameSuffix,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <FormControl>
        <div className="flex items-center justify-between">
          <div>
            <FormLabel>Include Subtasks</FormLabel>
            <FormDescription>Duplicate all subtasks with the parent task</FormDescription>
          </div>
          <Switch
            checked={includeSubtasks}
            onCheckedChange={setIncludeSubtasks}
          />
        </div>
      </FormControl>

      <FormControl>
        <div className="flex items-center justify-between">
          <div>
            <FormLabel>Include Attachments</FormLabel>
            <FormDescription>Copy all attachments to the duplicated tasks</FormDescription>
          </div>
          <Switch
            checked={includeAttachments}
            onCheckedChange={setIncludeAttachments}
          />
        </div>
      </FormControl>

      <FormControl>
        <div className="flex items-center justify-between">
          <div>
            <FormLabel>Include Comments</FormLabel>
            <FormDescription>Copy all comments to the duplicated tasks</FormDescription>
          </div>
          <Switch
            checked={includeComments}
            onCheckedChange={setIncludeComments}
          />
        </div>
      </FormControl>

      <FormControl>
        <FormLabel>Name Suffix</FormLabel>
        <Input
          value={nameSuffix}
          onChange={(e) => setNameSuffix(e.target.value)}
          placeholder="(Copy)"
        />
        <FormDescription>
          This text will be added to the end of each duplicated task name
        </FormDescription>
      </FormControl>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Duplicate Tasks</Button>
      </div>
    </form>
  );
};
