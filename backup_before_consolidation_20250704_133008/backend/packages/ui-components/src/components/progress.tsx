import * as React from "react";
import * as RadixProgress from "@radix-ui/react-progress";
import clsx from "clsx";

export interface ProgressProps extends RadixProgress.ProgressProps {
  value: number;
  max?: number;
  className?: string;
}

/**
 * Progress bar component using Radix UI Progress.
 *
 * @example
 * <Progress value={60} max={100} />
 */
export const Progress: React.FC<ProgressProps> = ({ value, max = 100, className, ...props }) => (
  <RadixProgress.Root
    className={clsx(
      "relative w-full h-3 bg-gray-200 rounded overflow-hidden",
      className
    )}
    max={max}
    value={value}
    {...props}
  >
    <RadixProgress.Indicator
      className="absolute left-0 top-0 h-full bg-primary-600 transition-all duration-300"
      style={{ width: `${(value / max) * 100}%` }}
    />
  </RadixProgress.Root>
);
Progress.displayName = "Progress";
