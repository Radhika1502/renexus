// Temporary UI components to fix import issues
import React from 'react';

// Card Components
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`rounded-lg border bg-white shadow-sm p-4 ${className || ''}`}>
    {children}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`p-4 ${className || ''}`}>
    {children}
  </div>
);

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`p-4 pb-2 ${className || ''}`}>
    {children}
  </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <h3 className={`text-lg font-semibold ${className || ''}`}>
    {children}
  </h3>
);

// Button Component
export const Button: React.FC<{ 
  children: React.ReactNode; 
  className?: string; 
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}> = ({ children, className, onClick, type = 'button', disabled }) => (
  <button 
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 ${className || ''}`}
  >
    {children}
  </button>
);

// Input Component
export const Input: React.FC<{ 
  className?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ className, type = 'text', placeholder, value, onChange }) => (
  <input 
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className || ''}`}
  />
);

// Select Component
export const Select: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}> = ({ children, className, value, onChange }) => (
  <select 
    value={value}
    onChange={onChange}
    className={`px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className || ''}`}
  >
    {children}
  </select>
);

// Badge Component
export const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={`inline-block px-2 py-1 text-xs font-semibold bg-gray-200 text-gray-800 rounded-full ${className || ''}`}>
    {children}
  </span>
);

// Skeleton Component
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className || 'h-4 w-full'}`}></div>
);

// Alert Component
export const Alert: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`p-4 border rounded bg-blue-50 border-blue-200 text-blue-800 ${className || ''}`}>
    {children}
  </div>
);

// Checkbox Component
export const Checkbox: React.FC<{ 
  className?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ className, checked, onChange }) => (
  <input 
    type="checkbox"
    checked={checked}
    onChange={onChange}
    className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${className || ''}`}
  />
);

// Tooltip Component
export const Tooltip: React.FC<{ children: React.ReactNode; content: string; className?: string }> = ({ children, content, className }) => (
  <div className={`relative group ${className || ''}`}>
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity">
      {content}
    </div>
  </div>
);

// Tabs Components
export const Tabs: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={className}>
    {children}
  </div>
);

export const TabsList: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`flex border-b ${className || ''}`}>
    {children}
  </div>
);

export const TabsTrigger: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 border-b-2 border-transparent hover:border-blue-500 ${className || ''}`}
  >
    {children}
  </button>
);

export const TabsContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`mt-4 ${className || ''}`}>
    {children}
  </div>
);

// Form Components
export const FormField: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`mb-4 ${className || ''}`}>
    {children}
  </div>
);

export const FormWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <form className={`space-y-4 ${className || ''}`}>
    {children}
  </form>
);

export const Label: React.FC<{ children: React.ReactNode; className?: string; htmlFor?: string }> = ({ children, className, htmlFor }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 mb-1 ${className || ''}`}>
    {children}
  </label>
);

export const Textarea: React.FC<{ 
  className?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
}> = ({ className, placeholder, value, onChange, rows = 3 }) => (
  <textarea 
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    className={`px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full ${className || ''}`}
  />
);

// Progress Component
export const Progress: React.FC<{ value: number; className?: string }> = ({ value, className }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className || ''}`}>
    <div 
      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    ></div>
  </div>
);

// Avatar Components
export const Avatar: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`relative inline-block rounded-full overflow-hidden ${className || 'h-8 w-8'}`}>
    {children}
  </div>
);

export const AvatarFallback: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`flex items-center justify-center w-full h-full bg-gray-200 text-gray-600 ${className || ''}`}>
    {children}
  </div>
);

export const AvatarImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => (
  <img src={src} alt={alt} className={`w-full h-full object-cover ${className || ''}`} />
);

// Dialog Components
export const Dialog: React.FC<{ children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }> = ({ children, open, onOpenChange }) => (
  <>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => onOpenChange?.(false)}>
        <div className="bg-white rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    )}
  </>
);

export const DialogContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`p-6 ${className || ''}`}>
    {children}
  </div>
);

export const DialogHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`pb-4 ${className || ''}`}>
    {children}
  </div>
);

export const DialogTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <h2 className={`text-lg font-semibold ${className || ''}`}>
    {children}
  </h2>
);

export const DialogTrigger: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
  <div onClick={onClick}>
    {children}
  </div>
);

// Additional missing components that might be needed
export const DatePicker: React.FC<{ 
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}> = ({ className, value, onChange }) => (
  <input 
    type="date"
    value={value}
    onChange={(e) => onChange?.(e.target.value)}
    className={`px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className || ''}`}
  />
);

export const DateRangePicker: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex space-x-2 ${className || ''}`}>
    <input type="date" className="px-3 py-2 border border-gray-300 rounded" />
    <span className="flex items-center">to</span>
    <input type="date" className="px-3 py-2 border border-gray-300 rounded" />
  </div>
);

// Dropdown Components (simplified)
export const Dropdown: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`relative ${className || ''}`}>
    {children}
  </div>
);

export const DropdownTrigger: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
  <div onClick={onClick}>
    {children}
  </div>
);

export const DropdownContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`absolute top-full left-0 mt-1 bg-white border rounded shadow-lg z-10 ${className || ''}`}>
    {children}
  </div>
);

export const DropdownItem: React.FC<{ children: React.ReactNode; onClick?: () => void; className?: string }> = ({ children, onClick, className }) => (
  <div 
    onClick={onClick}
    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${className || ''}`}
  >
    {children}
  </div>
);

// Toast Components (simplified)
export const Toast: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`fixed bottom-4 right-4 bg-white border rounded shadow-lg p-4 ${className || ''}`}>
    {children}
  </div>
);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>
    {children}
  </div>
);

export const ToastViewport: React.FC<{ className?: string }> = ({ className }) => (
  <div className={className}></div>
);

// Tooltip Provider Components
export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>
    {children}
  </div>
);

export const TooltipContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black rounded ${className || ''}`}>
    {children}
  </div>
);

export const TooltipTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative group">
    {children}
  </div>
); 