import React from 'react';

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  error?: string;
  options: Array<{ value: string | number; label: string }>;
  // Allow any other props
  [key: string]: any;
}

const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, name, error, options, className, ...props }, ref) => {
    return (
      <div className="mb-4">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <select
          id={name}
          name={name}
          ref={ref}
          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border ${error ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${className}`}
          {...props}
        >
          {/* Optional: Add a default placeholder option if needed */}
          {/* <option value="">Select an option</option> */}
          {options.map((option: { value: string | number; label: string }) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';

export { SelectField }; 