import * as React from "react";
import * as RadixAlertDialog from "@radix-ui/react-alert-dialog";
import clsx from "clsx";

export interface AlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * Alert dialog component using Radix UI AlertDialog.
 *
 * @example
 * <Alert open={open} onOpenChange={setOpen} title="Delete?" description="Are you sure?" onConfirm={handleDelete} />
 */
export const Alert: React.FC<AlertProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  className
}) => (
  <RadixAlertDialog.Root open={open} onOpenChange={onOpenChange}>
    <RadixAlertDialog.Portal>
      <RadixAlertDialog.Overlay 
        className="fixed inset-0 bg-black/40 z-50 animate-fadeIn"
        aria-hidden="true"
      />
      <RadixAlertDialog.Content
        className={clsx(
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
          "bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg w-full max-w-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary-500",
          className
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <RadixAlertDialog.Title className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
          {title}
        </RadixAlertDialog.Title>
        {description && (
          <RadixAlertDialog.Description className="mb-4 text-gray-600 dark:text-gray-300">
            {description}
          </RadixAlertDialog.Description>
        )}
        <div className="flex justify-end gap-2 mt-4">
          {cancelLabel && (
            <RadixAlertDialog.Cancel asChild>
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
                onClick={onCancel}
                tabIndex={0}
              >
                {cancelLabel}
              </button>
            </RadixAlertDialog.Cancel>
          )}
          <RadixAlertDialog.Action asChild>
            <button
              className="px-4 py-2 rounded bg-primary-600 hover:bg-primary-700 text-white"
              onClick={onConfirm}
              tabIndex={0}
            >
              {confirmLabel}
            </button>
          </RadixAlertDialog.Action>
        </div>
      </RadixAlertDialog.Content>
    </RadixAlertDialog.Portal>
  </RadixAlertDialog.Root>
);
Alert.displayName = "Alert";
