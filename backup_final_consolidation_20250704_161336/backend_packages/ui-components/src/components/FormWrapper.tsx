import * as React from "react";
import { useForm, FormProvider, SubmitHandler, UseFormProps, FieldValues } from "react-hook-form";
import { z, ZodType, ZodTypeDef } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

/**
 * FormWrapper provides a type-safe form context using React Hook Form and Zod.
 * Pass your Zod schema and children (form fields) as props.
 *
 * @example
 * const schema = z.object({ email: z.string().email() });
 * <FormWrapper schema={schema} onSubmit={handleSubmit}>{...}</FormWrapper>
 */
export interface FormWrapperProps<T extends FieldValues = FieldValues> {
  schema: ZodType<T, ZodTypeDef, unknown>;
  defaultValues?: UseFormProps<T>["defaultValues"];
  onSubmit: SubmitHandler<T>;
  children: React.ReactNode;
  className?: string;
}

export function FormWrapper<T extends FieldValues = FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
}: FormWrapperProps<T>) {
  const methods = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onTouched",
  });

  return (
    <FormProvider {...methods}>
      <form className={className} onSubmit={methods.handleSubmit(onSubmit)}>
        {children}
      </form>
    </FormProvider>
  );
}
