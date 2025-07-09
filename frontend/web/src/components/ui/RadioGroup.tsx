import React, { createContext, useContext } from 'react';

interface RadioGroupContextType {
  name: string;
  value: string;
  onChange: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextType | undefined>(undefined);

interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  children,
  label,
  className = ''
}) => {
  return (
    <RadioGroupContext.Provider value={{ name, value, onChange }}>
      <div role="radiogroup" className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            {label}
          </label>
        )}
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
};

interface RadioGroupItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const RadioGroupItem: React.FC<RadioGroupItemProps> = ({
  value,
  children,
  disabled = false,
  className = ''
}) => {
  const context = useContext(RadioGroupContext);
  if (!context) throw new Error('RadioGroupItem must be used within RadioGroup');

  const { name, value: selectedValue, onChange } = context;
  const checked = value === selectedValue;

  return (
    <label
      className={`
        relative flex items-start py-1
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <div className="flex items-center h-5">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="
            w-4 h-4 text-blue-600 bg-gray-100 border-gray-300
            focus:ring-blue-500 dark:focus:ring-blue-600
            dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600
          "
        />
      </div>
      <div className="ml-3 text-sm">
        {children}
      </div>
    </label>
  );
}; 