import * as React from "react";
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";
import clsx from "clsx";

export interface CheckboxProps extends RadixCheckbox.CheckboxProps {
  /**
   * Optional label for the checkbox
   */
  label?: string;
  /**
   * Additional className for the root element
   */
  className?: string;
}

/**
 * Checkbox component built on Radix UI Checkbox.
 *
 * @example
 * <Checkbox checked={value} onCheckedChange={setValue} label="Accept terms" />
 */
export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ label, className, ...props }, ref) => (
    <div className={clsx("flex items-center gap-2", className)}>
      <RadixCheckbox.Root
        ref={ref}
        className={clsx(
          "w-5 h-5 rounded border border-gray-300 bg-white text-primary-600 flex items-center justify-center transition-colors",
          "focus:ring-2 focus:ring-primary-500 focus:outline-none",
          "data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600 data-[state=checked]:text-white"
        )}
        {...props}
      >
        <RadixCheckbox.Indicator>
          <CheckIcon className="w-4 h-4" />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label && (
        <label className="text-sm select-none cursor-pointer" onClick={e => e.preventDefault()}>{label}</label>
      )}
    </div>
  )
);
Checkbox.displayName = "Checkbox";
