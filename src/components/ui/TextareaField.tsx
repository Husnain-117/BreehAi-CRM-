import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: string;
  register: UseFormRegister<any>; // Or a more specific type if your forms are consistent
  error?: FieldError;
  wrapperClassName?: string;
  labelClassName?: string;
  // rows?: number; // Already part of TextareaHTMLAttributes
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  name,
  register,
  error,
  wrapperClassName = 'mb-4',
  labelClassName = 'block text-sm font-medium text-gray-700 mb-1',
  className = 'mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-foreground bg-background',
  rows = 3, // Default rows if not provided
  ...rest
}) => {
  return (
    <div className={wrapperClassName}>
      <label htmlFor={name} className={labelClassName}>
        {label}
        {rest.required && <span className="text-destructive ml-1">*</span>}
      </label>
      <textarea
        id={name}
        {...register(name, { required: rest.required })}
        {...rest}
        rows={rows}
        className={`${className} ${error ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}`}
        aria-invalid={error ? 'true' : 'false'}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error.message}</p>}
    </div>
  );
}; 