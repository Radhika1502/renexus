import * as React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { ChevronDownIcon } from "lucide-react";
import clsx from "clsx";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends RadixSelect.SelectProps {
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

/**
 * Select dropdown built on Radix UI Select.
 *
 * @example
 * <Select options={[{label: 'A', value: 'a'}]} value={value} onValueChange={setValue} />
 */
export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ options, placeholder, className, ...props }, ref) => (
    <RadixSelect.Root {...props}>
      <RadixSelect.Trigger
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors",
          className
        )}
      >
        <RadixSelect.Value placeholder={placeholder || "Select..."} />
        <RadixSelect.Icon>
          <ChevronDownIcon className="w-4 h-4 ml-2" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content className="bg-white border border-gray-200 rounded shadow-lg z-50">
          <RadixSelect.Viewport>
            {options.map(option => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className="px-3 py-2 cursor-pointer hover:bg-primary-50 focus:bg-primary-100 rounded text-sm"
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
);
Select.displayName = "Select";
