import React, { useState } from 'react';
import {
  Button,
  RadioGroup,
  RadioGroupItem,
  FormControl,
  FormLabel,
  FormDescription,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../../../components/ui';
import { Workflow } from '../../hooks/useWorkflows';

interface WorkflowSelectorProps {
  workflows: Workflow[];
  onSelect: (data: any) => void;
  onCancel: () => void;
}

export const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({
  workflows,
  onSelect,
  onCancel,
}) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflowId) return;
    
    onSelect({
      workflowId: selectedWorkflowId,
    });
  };

  const activeWorkflows = workflows.filter(workflow => workflow.isActive);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="space-y-2">
        <FormLabel>Select Workflow</FormLabel>
        <FormDescription>
          Choose a workflow to apply to the selected tasks
        </FormDescription>
        
        {activeWorkflows.length === 0 ? (
          <div className="text-center p-4 border rounded-md bg-muted/20">
            <p className="text-muted-foreground">No active workflows available</p>
          </div>
        ) : (
          <RadioGroup 
            value={selectedWorkflowId} 
            onValueChange={setSelectedWorkflowId}
            className="space-y-2"
          >
            {activeWorkflows.map(workflow => (
              <div key={workflow.id} className="flex items-start space-x-2">
                <RadioGroupItem value={workflow.id} id={workflow.id} className="mt-1" />
                <Card className="flex-1 cursor-pointer" onClick={() => setSelectedWorkflowId(workflow.id)}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">{workflow.name}</CardTitle>
                    <CardDescription className="text-xs">{workflow.steps.length} steps</CardDescription>
                  </CardHeader>
                  <CardContent className="py-2 text-sm">
                    <p>{workflow.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </RadioGroup>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!selectedWorkflowId || activeWorkflows.length === 0}
        >
          Apply Workflow
        </Button>
      </div>
    </form>
  );
};
