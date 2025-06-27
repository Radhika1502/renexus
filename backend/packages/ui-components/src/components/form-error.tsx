import * as React from "react";
import clsx from "clsx";

export interface FormErrorProps {
  message?: string;
  className?: string;
}

/**
 * FormError component for displaying form validation errors.
 *
 * @example
 * <FormError message="This field is required" />
 */
export const FormError: React.FC<FormErrorProps> = ({ message, className }) => {
  if (!message) return null;
  
  return (
    <p 
      className={clsx(
        "text-sm text-red-500 mt-1",
        className
      )}
      role="alert"
    >
      {message}
    </p>
  );
};
FormError.displayName = "FormError";
