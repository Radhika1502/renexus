import * as React from "react";
import { useFormContext, type FieldValues, type UseFormRegister } from "react-hook-form";
import clsx from "clsx";

interface FormFieldProps extends React.ComponentPropsWithoutRef<"div"> {
  name: string;
  label?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
  description?: string;
}

/**
 * FormField wrapper component for form controls.
 * Integrates with React Hook Form for validation.
 *
 * @example
 * <FormField name="email" label="Email Address" required>
 *   <Input />
 * </FormField>
 */
export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(({
  name,
  label,
  required = false,
  className,
  children,
  description,
  ...props
}, ref) => {
  const { formState, register } = useFormContext() || {};
  const error = formState?.errors?.[name];
  const errorMessage = error?.message as string | undefined;

  return (
    <div className={clsx("mb-4", className)} ref={ref} {...props}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {description && (
        <p className="text-xs text-gray-500 mb-1">{description}</p>
      )}
      <div className="relative">
        {React.isValidElement(children)
          ? React.cloneElement(children, {
              id: name,
              name,
              "aria-invalid": !!error,
              "aria-describedby": error ? `${name}-error` : undefined,
              ...register(name),
              ...children.props,
            })
          : children}
      </div>
      {errorMessage && (
        <p
          id={`${name}-error`}
          className="mt-1 text-xs text-red-500"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
});
FormField.displayName = "FormField";
