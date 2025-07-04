import * as React from "react";
import * as RadixRadioGroup from "@radix-ui/react-radio-group";
import clsx from "clsx";

export interface RadioProps extends RadixRadioGroup.RadioGroupItemProps {
  label?: string;
  className?: string;
}

/**
 * Radio button built on Radix UI RadioGroup.Item.
 *
 * @example
 * <Radio checked={value === 'a'} value="a" onCheckedChange={setValue} label="Option A" />
 */
export const Radio = React.forwardRef<HTMLButtonElement, RadioProps>(
  ({ label, className, ...props }, ref) => (
    <div className={clsx("flex items-center gap-2", className)}>
      <RadixRadioGroup.Item
        ref={ref}
        className={clsx(
          "w-5 h-5 rounded-full border border-gray-300 bg-white text-primary-600 flex items-center justify-center transition-colors",
          "focus:ring-2 focus:ring-primary-500 focus:outline-none",
          "data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600 data-[state=checked]:text-white"
        )}
        {...props}
      >
        <div className="w-3 h-3 rounded-full bg-primary-600 data-[state=checked]:block hidden" />
      </RadixRadioGroup.Item>
      {label && (
        <label className="text-sm select-none cursor-pointer" onClick={e => e.preventDefault()}>{label}</label>
      )}
    </div>
  )
);
Radio.displayName = "Radio";
