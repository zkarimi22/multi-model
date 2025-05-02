import React from 'react';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label, 
    error, 
    leftIcon, 
    rightIcon, 
    id,
    ...props 
  }, ref) => {
    const inputId = id || label ? label?.toLowerCase().replace(/\s+/g, '-') : undefined;
    
    return (
      <>
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
       
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={twMerge(
              'block rounded-full bg-muted/80 border-none shadow-none',
              'focus:outline-none focus:bg-muted/90 transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'border-destructive' : '',
              leftIcon ? 'pl-10' : '',
              rightIcon ? 'pr-10' : '',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
              {rightIcon}
            </div>
          )}
         
        {error && (
          <p className="mt-1 text-sm text-destructive">{error}</p>
        )}
      </>
    );
  }
);

Input.displayName = 'Input'; 