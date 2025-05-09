import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  // Allow any other props like aria-label, etc.
  [key: string]: any;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    // Basic styling, can be expanded with Tailwind variants
    const baseStyle = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
    // Example variant styling (can be expanded)
    const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
      default: 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800',
      destructive: 'bg-red-500 text-white hover:bg-red-600',
      outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'underline-offset-4 hover:underline text-primary',
    };
    const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
    };

    return (
      <button
        className={`${baseStyle} ${variantStyles[variant as NonNullable<ButtonProps['variant']>]} ${sizeStyles[size as NonNullable<ButtonProps['size']>]} ${className}`.trim()}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button }; 