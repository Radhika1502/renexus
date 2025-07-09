import React, { useState } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  FormDescription,
  DatePicker,
  Select,
  Switch,
  Textarea,
} from '../../../../components/ui';

interface ScheduleTasksSelectorProps {
  onSelect: (data: any) => void;
  onCancel: () => void;
}

export const ScheduleTasksSelector: React.FC<ScheduleTasksSelectorProps> = ({
  onSelect,
  onCancel,
}) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [distributionMethod, setDistributionMethod] = useState<'even' | 'front_loaded' | 'back_loaded' | 'custom'>('even');
  const [notifyAssignees, setNotifyAssignees] = useState(true);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) return;
    
    onSelect({
      startDate,
      endDate,
      distributionMethod,
      notifyAssignees,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <FormControl>
        <FormLabel>Start Date</FormLabel>
        <DatePicker
          selected={startDate}
          onSelect={setStartDate}
          placeholder="Select start date"
        />
      </FormControl>

      <FormControl>
        <FormLabel>End Date (Optional)</FormLabel>
        <DatePicker
          selected={endDate}
          onSelect={setEndDate}
          placeholder="Select end date"
          disabled={!startDate}
          minDate={startDate}
        />
        <FormDescription>
          If set, tasks will be distributed between start and end dates
        </FormDescription>
      </FormControl>

      <FormControl>
        <FormLabel>Distribution Method</FormLabel>
        <Select
          value={distributionMethod}
          onValueChange={(value) => setDistributionMethod(value as any)}
          disabled={!endDate}
        >
          <option value="even">Even Distribution</option>
          <option value="front_loaded">Front Loaded</option>
          <option value="back_loaded">Back Loaded</option>
          <option value="custom">Custom</option>
        </Select>
        <FormDescription>
          How to distribute tasks between start and end dates
        </FormDescription>
      </FormControl>

      <FormControl>
        <div className="flex items-center justify-between">
          <div>
            <FormLabel>Notify Assignees</FormLabel>
            <FormDescription>Send notifications to task assignees</FormDescription>
          </div>
          <Switch
            checked={notifyAssignees}
            onCheckedChange={setNotifyAssignees}
          />
        </div>
      </FormControl>

      <FormControl>
        <FormLabel>Notes (Optional)</FormLabel>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this scheduling"
          rows={3}
        />
      </FormControl>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!startDate}>
          Schedule Tasks
        </Button>
      </div>
    </form>
  );
};
