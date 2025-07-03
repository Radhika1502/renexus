/**
 * UI Components Package
 * 
 * This is the main entry point for the shared UI components package
 */

// Export all components
export * from './components/Button';
export * from './components/Card';
export * from './components/Input';
export * from './components/Modal';
export * from './components/Notification';
export * from './components/Dropdown';
export * from './components/Table';
export * from './components/Tabs';
export * from './components/Avatar';
export * from './components/Badge';
export * from './components/Spinner';
export * from './components/ProgressBar';
export * from './components/Toggle';
export * from './components/Tooltip';
export * from './components/Pagination';

// Export hooks
export * from './hooks/useForm';
export * from './hooks/useModal';
export * from './hooks/useToast';
export * from './hooks/useClickOutside';
export * from './hooks/useMediaQuery';
export * from './hooks/useLocalStorage';

// Export theme
export * from './theme';

// Export types
export * from './types';

// UI Components Package - Renexus
export { default as Button } from './src/components/Button';
export { default as Card } from './src/components/Card';
export { default as CardContent } from './src/components/Card/CardContent';
export { default as CardHeader } from './src/components/Card/CardHeader';
export { default as CardTitle } from './src/components/Card/CardTitle';
export { default as Select } from './src/components/Select';
export { default as SelectContent } from './src/components/Select/SelectContent';
export { default as SelectItem } from './src/components/Select/SelectItem';
export { default as SelectTrigger } from './src/components/Select/SelectTrigger';
export { default as SelectValue } from './src/components/Select/SelectValue';
export { default as Badge } from './src/components/Badge';
export { default as Tabs } from './src/components/Tabs';
export { default as TabsContent } from './src/components/Tabs/TabsContent';
export { default as TabsList } from './src/components/Tabs/TabsList';
export { default as TabsTrigger } from './src/components/Tabs/TabsTrigger';
export { default as DropdownMenu } from './src/components/DropdownMenu';
export { default as DropdownMenuContent } from './src/components/DropdownMenu/DropdownMenuContent';
export { default as DropdownMenuItem } from './src/components/DropdownMenu/DropdownMenuItem';
export { default as DropdownMenuTrigger } from './src/components/DropdownMenu/DropdownMenuTrigger';
export { default as Skeleton } from './src/components/Skeleton';
export { default as Input } from './src/components/Input';
export { default as Textarea } from './src/components/Textarea';
export { default as Label } from './src/components/Label';
export { default as Dialog } from './src/components/Dialog';
export { default as DialogContent } from './src/components/Dialog/DialogContent';
export { default as DialogHeader } from './src/components/Dialog/DialogHeader';
export { default as DialogTitle } from './src/components/Dialog/DialogTitle';
export { default as DialogTrigger } from './src/components/Dialog/DialogTrigger';

// Re-export types
export type { ButtonProps } from './src/components/Button';
export type { CardProps } from './src/components/Card';
export type { SelectProps } from './src/components/Select';
export type { BadgeProps } from './src/components/Badge';
export type { TabsProps } from './src/components/Tabs';
export type { DropdownMenuProps } from './src/components/DropdownMenu';
export type { SkeletonProps } from './src/components/Skeleton';
export type { InputProps } from './src/components/Input';
export type { TextareaProps } from './src/components/Textarea';
export type { LabelProps } from './src/components/Label';
export type { DialogProps } from './src/components/Dialog';

// Core UI Components
export { default as Button } from './src/components/Button';
export { default as Card } from './src/components/Card';
export { default as CardContent } from './src/components/Card/CardContent';
export { default as CardHeader } from './src/components/Card/CardHeader';
export { default as CardTitle } from './src/components/Card/CardTitle';

// Form Components
export { default as Badge } from './src/components/Badge';
export { default as Select } from './src/components/Select';
export { default as Input } from './src/components/Input';
export { default as Textarea } from './src/components/Textarea';
export { default as Checkbox } from './src/components/Checkbox';
export { default as Label } from './src/components/Label';

// Feedback Components
export { default as Tooltip } from './src/components/Tooltip';
export { default as Dialog } from './src/components/Dialog';
export { default as DialogContent } from './src/components/Dialog/DialogContent';
export { default as DialogHeader } from './src/components/Dialog/DialogHeader';
export { default as DialogTitle } from './src/components/Dialog/DialogTitle';
export { default as DialogTrigger } from './src/components/Dialog/DialogTrigger';

// Layout Components
export { default as Tabs } from './src/components/Tabs';
export { default as TabsContent } from './src/components/Tabs/TabsContent';
export { default as TabsList } from './src/components/Tabs/TabsList';
export { default as TabsTrigger } from './src/components/Tabs/TabsTrigger';

// Utility exports
export { cn } from './src/utils/cn';

// Types
export type * from './src/types';
