import * as React from "react";
import * as RadixSwitch from "@radix-ui/react-switch";
import clsx from "clsx";

export interface SwitchProps extends RadixSwitch.SwitchProps {
  label?: string;
  className?: string;
}

/**
 * Switch component built on Radix UI Switch.
 *
 * @example
 * <Switch checked={value} onCheckedChange={setValue} label="Enable feature" />
 */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ label, className, ...props }, ref) => (
    <div className={clsx("flex items-center gap-2", className)}>
      <RadixSwitch.Root
        ref={ref}
        className={clsx(
          "w-[42px] h-[25px] bg-gray-200 rounded-full relative data-[state=checked]:bg-primary-600 outline-none cursor-default",
          "focus:ring-2 focus:ring-primary-500 focus:outline-none",
        )}
        {...props}
      >
        <RadixSwitch.Thumb
          className={clsx(
            "block w-[21px] h-[21px] bg-white rounded-full transition-transform duration-100 will-change-transform",
            "data-[state=checked]:translate-x-[19px] data-[state=unchecked]:translate-x-[2px]"
          )}
        />
      </RadixSwitch.Root>
      {label && (
        <label className="text-sm select-none cursor-pointer" onClick={e => e.preventDefault()}>{label}</label>
      )}
    </div>
  )
);
Switch.displayName = "Switch";
