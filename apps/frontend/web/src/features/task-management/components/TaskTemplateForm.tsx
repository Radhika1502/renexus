  Select, 
  Switch, 
  FormField, 
  FormLabel, 
  FormMessage,
  Badge
} from '../../../components/ui';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Loader2, 
  MoveUp, 
  MoveDown 
} from 'lucide-react';
import { TaskTemplate, 
  CreateTaskTemplateInput, 
  UpdateTaskTemplateInput, 
  TaskTemplateSubtask,
  TaskTemplateCustomField
 } from "../../../shared/types/templates";
import { TaskPriority, TaskStatus } from '../types';
import { useCreateTaskTemplate, useUpdateTaskTemplate } from '../hooks/useTaskTemplates';

interface TaskTemplateFormProps {
  template?: TaskTemplate;
  projectId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const TaskTemplateForm: React.FC<TaskTemplateFormProps> = ({
  template,
  projectId,
  onSuccess,
  onCancel
}) => {
  const isEditing = !!template;
  const [subtasks, setSubtasks] = useState<TaskTemplateSubtask[]>(
    template?.subtasks || []
  );
  const [customFields, setCustomFields] = useState<Omit<TaskTemplateCustomField, 'id'>[]>(
    template?.customFields?.map(({ id, ...rest }) => rest) || []
  );
  const [labels, setLabels] = useState<string[]>(template?.labels || []);
  const [newLabel, setNewLabel] = useState('');

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      name: template?.name || '',
      description: template?.description || '',
      status: template?.status || 'todo' as TaskStatus,
      priority: template?.priority || 'medium' as TaskPriority,
      estimatedHours: template?.estimatedHours || undefined,
      isGlobal: template?.isGlobal || false
    }
  });

  const { mutate: createTemplate, isPending: isCreating } = useCreateTaskTemplate();
  const { mutate: updateTemplate, isPending: isUpdating } = useUpdateTaskTemplate();

  const isPending = isCreating || isUpdating;

  const onSubmit = (data: any) => {
    if (isEditing && template) {
      const updateData: UpdateTaskTemplateInput = {
        id: template.id,
        ...data,
        labels,
        subtasks,
        customFields
      };
      
      updateTemplate(updateData, {
        onSuccess: () => {
          onSuccess();
        }
      });
    } else {
      const createData: CreateTaskTemplateInput = {
        ...data,
        labels,
        subtasks,
        customFields,
        projectId: data.isGlobal ? undefined : projectId
      };
      
      createTemplate(createData, {
        onSuccess: () => {
          onSuccess();
        }
      });
    }
  };

  const handleAddSubtask = () => {
    setSubtasks([
      ...subtasks,
      {
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium'
      }
    ]);
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleUpdateSubtask = (index: number, field: keyof TaskTemplateSubtask, value: any) => {
    setSubtasks(
      subtasks.map((subtask, i) => 
        i === index ? { ...subtask, [field]: value } : subtask
      )
    );
  };

  const handleMoveSubtask = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === subtasks.length - 1)
    ) {
      return;
    }

    const newSubtasks = [...subtasks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newSubtasks[index];
    newSubtasks[index] = newSubtasks[targetIndex];
    newSubtasks[targetIndex] = temp;
    
    setSubtasks(newSubtasks);
  };

  const handleAddCustomField = () => {
    setCustomFields([
      ...customFields,
      {
        name: '',
        type: 'text',
        required: false
      }
    ]);
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleUpdateCustomField = (
    index: number, 
    field: keyof Omit<TaskTemplateCustomField, 'id'>, 
    value: any
  ) => {
    setCustomFields(
      customFields.map((customField, i) => 
        i === index ? { ...customField, [field]: value } : customField
      )
    );
  };

  const handleAddLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      setLabels([...labels, newLabel.trim()]);
      setNewLabel('');
    }
  };

  const handleRemoveLabel = (label: string) => {
    setLabels(labels.filter(l => l !== label));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField>
        <FormLabel htmlFor="name">Template Name*</FormLabel>
        <Input
          id="name"
          placeholder="Enter template name"
          {...register('name', { required: 'Template name is required' })}
          error={errors.name?.message}
        />
        {errors.name && <FormMessage>{errors.name.message}</FormMessage>}
      </FormField>

      <FormField>
        <FormLabel htmlFor="description">Description</FormLabel>
        <Textarea
          id="description"
          placeholder="Enter template description"
          {...register('description')}
          rows={3}
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField>
          <FormLabel htmlFor="status">Default Status*</FormLabel>
          <Controller
            name="status"
            control={control}
            rules={{ required: 'Status is required' }}
            render={({ field }) => (
              <Select
                id="status"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'backlog', label: 'Backlog' },
                  { value: 'todo', label: 'To Do' },
                  { value: 'inProgress', label: 'In Progress' },
                  { value: 'review', label: 'Review' },
                  { value: 'done', label: 'Done' }
                ]}
              />
            )}
          />
          {errors.status && <FormMessage>{errors.status.message}</FormMessage>}
        </FormField>

        <FormField>
          <FormLabel htmlFor="priority">Default Priority*</FormLabel>
          <Controller
            name="priority"
            control={control}
            rules={{ required: 'Priority is required' }}
            render={({ field }) => (
              <Select
                id="priority"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'highest', label: 'Highest' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
                  { value: 'lowest', label: 'Lowest' }
                ]}
              />
            )}
          />
          {errors.priority && <FormMessage>{errors.priority.message}</FormMessage>}
        </FormField>
      </div>

      <FormField>
        <FormLabel htmlFor="estimatedHours">Estimated Hours</FormLabel>
        <Input
          id="estimatedHours"
          type="number"
          min="0"
          step="0.5"
          placeholder="Enter estimated hours"
          {...register('estimatedHours', {
            valueAsNumber: true,
            min: { value: 0, message: 'Hours must be positive' }
          })}
          error={errors.estimatedHours?.message}
        />
        {errors.estimatedHours && <FormMessage>{errors.estimatedHours.message}</FormMessage>}
      </FormField>

      <FormField>
        <div className="flex items-center justify-between">
          <FormLabel htmlFor="isGlobal">Make Global Template</FormLabel>
          <Controller
            name="isGlobal"
            control={control}
            render={({ field }) => (
              <Switch
                id="isGlobal"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Global templates are available across all projects
        </p>
      </FormField>

      {/* Labels Section */}
      <div className="space-y-2">
        <FormLabel>Labels</FormLabel>
        <div className="flex flex-wrap gap-2 mb-2">
          {labels.map((label) => (
            <Badge key={label} variant="outline" className="flex items-center gap-1">
              {label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleRemoveLabel(label)}
              />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Add a label"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddLabel();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddLabel}
            disabled={!newLabel.trim()}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Custom Fields Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <FormLabel>Custom Fields</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCustomField}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Field
          </Button>
        </div>
        
        {customFields.length === 0 ? (
          <p className="text-sm text-gray-500">No custom fields defined</p>
        ) : (
          <div className="space-y-3">
            {customFields.map((field, index) => (
              <div key={index} className="border rounded-md p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Field {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCustomField(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <FormLabel htmlFor={`field-${index}-name`}>Name</FormLabel>
                    <Input
                      id={`field-${index}-name`}
                      value={field.name}
                      onChange={(e) => handleUpdateCustomField(index, 'name', e.target.value)}
                      placeholder="Field name"
                    />
                  </div>
                  
                  <div>
                    <FormLabel htmlFor={`field-${index}-type`}>Type</FormLabel>
                    <Select
                      id={`field-${index}-type`}
                      value={field.type}
                      onChange={(value) => handleUpdateCustomField(index, 'type', value)}
                      options={[
                        { value: 'text', label: 'Text' },
                        { value: 'number', label: 'Number' },
                        { value: 'date', label: 'Date' },
                        { value: 'select', label: 'Select' },
                        { value: 'multiselect', label: 'Multi-select' },
                        { value: 'checkbox', label: 'Checkbox' }
                      ]}
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Switch
                    id={`field-${index}-required`}
                    checked={field.required || false}
                    onCheckedChange={(checked) => handleUpdateCustomField(index, 'required', checked)}
                  />
                  <FormLabel htmlFor={`field-${index}-required`} className="ml-2">
                    Required field
                  </FormLabel>
                </div>
                
                {(field.type === 'select' || field.type === 'multiselect') && (
                  <div>
                    <FormLabel htmlFor={`field-${index}-options`}>Options (comma separated)</FormLabel>
                    <Input
                      id={`field-${index}-options`}
                      value={field.options?.join(', ') || ''}
                      onChange={(e) => handleUpdateCustomField(
                        index, 
                        'options', 
                        e.target.value.split(',').map(o => o.trim()).filter(Boolean)
                      )}
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subtasks Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <FormLabel>Subtasks</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSubtask}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Subtask
          </Button>
        </div>
        
        {subtasks.length === 0 ? (
          <p className="text-sm text-gray-500">No subtasks defined</p>
        ) : (
          <div className="space-y-3">
            {subtasks.map((subtask, index) => (
              <div key={index} className="border rounded-md p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Subtask {index + 1}</h4>
                  <div className="flex items-center space-x-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveSubtask(index, 'up')}
                      disabled={index === 0}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveSubtask(index, 'down')}
                      disabled={index === subtasks.length - 1}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSubtask(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <FormLabel htmlFor={`subtask-${index}-title`}>Title</FormLabel>
                  <Input
                    id={`subtask-${index}-title`}
                    value={subtask.title}
                    onChange={(e) => handleUpdateSubtask(index, 'title', e.target.value)}
                    placeholder="Subtask title"
                  />
                </div>
                
                <div>
                  <FormLabel htmlFor={`subtask-${index}-description`}>Description</FormLabel>
                  <Textarea
                    id={`subtask-${index}-description`}
                    value={subtask.description || ''}
                    onChange={(e) => handleUpdateSubtask(index, 'description', e.target.value)}
                    placeholder="Subtask description"
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <FormLabel htmlFor={`subtask-${index}-status`}>Status</FormLabel>
                    <Select
                      id={`subtask-${index}-status`}
                      value={subtask.status || 'todo'}
                      onChange={(value) => handleUpdateSubtask(index, 'status', value)}
                      options={[
                        { value: 'backlog', label: 'Backlog' },
                        { value: 'todo', label: 'To Do' },
                        { value: 'inProgress', label: 'In Progress' },
                        { value: 'review', label: 'Review' },
                        { value: 'done', label: 'Done' }
                      ]}
                    />
                  </div>
                  
                  <div>
                    <FormLabel htmlFor={`subtask-${index}-priority`}>Priority</FormLabel>
                    <Select
                      id={`subtask-${index}-priority`}
                      value={subtask.priority || 'medium'}
                      onChange={(value) => handleUpdateSubtask(index, 'priority', value)}
                      options={[
                        { value: 'highest', label: 'Highest' },
                        { value: 'high', label: 'High' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'low', label: 'Low' },
                        { value: 'lowest', label: 'Lowest' }
                      ]}
                    />
                  </div>
                </div>
                
                <div>
                  <FormLabel htmlFor={`subtask-${index}-hours`}>Estimated Hours</FormLabel>
                  <Input
                    id={`subtask-${index}-hours`}
                    type="number"
                    min="0"
                    step="0.5"
                    value={subtask.estimatedHours || ''}
                    onChange={(e) => handleUpdateSubtask(
                      index, 
                      'estimatedHours', 
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )}
                    placeholder="Hours"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Update Template' : 'Create Template'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

