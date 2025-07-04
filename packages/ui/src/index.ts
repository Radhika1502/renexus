/**
 * UI Components Package
 * 
 * This is the main entry point for the shared UI components package
 */

// Core UI Components
export { default as Button } from './components/Button';
export { default as Card } from './components/Card';
export { default as Badge } from './components/Badge';
export { default as Input } from './components/Input';
export { default as Textarea } from './components/Textarea';
export { default as Checkbox } from './components/Checkbox';
export { default as Label } from './components/Label';
export { default as Select } from './components/Select';
export { default as Dialog } from './components/Dialog';
export { default as Tabs } from './components/Tabs';
export { default as Tooltip } from './components/Tooltip';

// Sub-components
export { default as CardContent } from './components/Card/CardContent';
export { default as CardHeader } from './components/Card/CardHeader';
export { default as CardTitle } from './components/Card/CardTitle';
export { default as DialogContent } from './components/Dialog/DialogContent';
export { default as DialogHeader } from './components/Dialog/DialogHeader';
export { default as DialogTitle } from './components/Dialog/DialogTitle';
export { default as DialogTrigger } from './components/Dialog/DialogTrigger';
export { default as TabsContent } from './components/Tabs/TabsContent';
export { default as TabsList } from './components/Tabs/TabsList';
export { default as TabsTrigger } from './components/Tabs/TabsTrigger';

// Utility exports
export { cn } from './utils/cn';

// Types
export type * from './types';
