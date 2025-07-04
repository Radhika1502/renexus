import * as React from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import clsx from "clsx";

export interface TooltipProps extends RadixTooltip.TooltipContentProps {
  content: string;
  children: React.ReactNode;
  delayDuration?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  sideOffset?: number;
}

/**
 * Tooltip component built on Radix UI Tooltip.
 *
 * @example
 * <Tooltip content="This is a tooltip"><Button>Hover me</Button></Tooltip>
 */
export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  delayDuration = 300,
  open,
  defaultOpen,
  onOpenChange,
  className,
  sideOffset = 4,
  ...props
}) => (
  <RadixTooltip.Provider delayDuration={delayDuration}>
    <RadixTooltip.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          className={clsx(
            "px-3 py-1 text-sm bg-gray-800 text-white rounded shadow-md",
            "data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade",
            "data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade",
            "data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade",
            "data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade",
            className
          )}
          sideOffset={sideOffset}
          {...props}
        >
          {content}
          <RadixTooltip.Arrow className="fill-current text-gray-800" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  </RadixTooltip.Provider>
);
Tooltip.displayName = "Tooltip";
