import React, { useState } from 'react';
import {
  Button,
  RadioGroup,
  RadioGroupItem,
  FormControl,
  FormLabel,
  FormDescription,
  Switch,
  Label,
} from '../../../../components/ui';

interface ExportTasksSelectorProps {
  onSelect: (data: any) => void;
  onCancel: () => void;
}

export const ExportTasksSelector: React.FC<ExportTasksSelectorProps> = ({
  onSelect,
  onCancel,
}) => {
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('excel');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeSubtasks, setIncludeSubtasks] = useState(true);
  const [includeComments, setIncludeComments] = useState(false);
  const [includeHistory, setIncludeHistory] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSelect({
      format,
      includeDetails,
      includeSubtasks,
      includeComments,
      includeHistory,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="space-y-2">
        <FormLabel>Export Format</FormLabel>
        <RadioGroup value={format} onValueChange={(value) => setFormat(value as 'csv' | 'excel' | 'pdf')}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="csv" id="csv" />
            <Label htmlFor="csv">CSV</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="excel" id="excel" />
            <Label htmlFor="excel">Excel</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pdf" id="pdf" />
            <Label htmlFor="pdf">PDF</Label>
          </div>
        </RadioGroup>
      </div>

      <FormControl>
        <div className="flex items-center justify-between">
          <div>
            <FormLabel>Include Full Details</FormLabel>
            <FormDescription>Export all task fields and properties</FormDescription>
          </div>
          <Switch
            checked={includeDetails}
            onCheckedChange={setIncludeDetails}
          />
        </div>
      </FormControl>

      <FormControl>
        <div className="flex items-center justify-between">
          <div>
            <FormLabel>Include Subtasks</FormLabel>
            <FormDescription>Include subtasks in the export</FormDescription>
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
            <FormLabel>Include Comments</FormLabel>
            <FormDescription>Include task comments in the export</FormDescription>
          </div>
          <Switch
            checked={includeComments}
            onCheckedChange={setIncludeComments}
          />
        </div>
      </FormControl>

      <FormControl>
        <div className="flex items-center justify-between">
          <div>
            <FormLabel>Include History</FormLabel>
            <FormDescription>Include task change history in the export</FormDescription>
          </div>
          <Switch
            checked={includeHistory}
            onCheckedChange={setIncludeHistory}
          />
        </div>
      </FormControl>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Export Tasks</Button>
      </div>
    </form>
  );
};
