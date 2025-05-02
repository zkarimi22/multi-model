'use client';

import { useState, useEffect, ReactNode } from 'react';

type ToastVariant = 'default' | 'destructive' | 'success';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toast: (props: ToastProps) => void;
}

const toastContext: ToastContextType = {
  toast: () => {},
};

const Toast = ({ title, description, variant = 'default', duration = 3000 }: ToastProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    destructive: 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-500',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-500',
  };

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-md border ${variantClasses[variant]} z-50 max-w-md`}>
      {title && <h3 className="font-medium mb-1">{title}</h3>}
      {description && <p className="text-sm opacity-90">{description}</p>}
    </div>
  );
};

let toastId = 0;
type ToastItem = ToastProps & { id: number };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (props: ToastProps) => {
    const id = toastId++;
    setToasts((prev) => [...prev, { ...props, id }]);

    // Auto remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, props.duration || 3000);
  };

  toastContext.toast = showToast;

  return (
    <>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </>
  );
}

export const useToast = (): ToastContextType => {
  return toastContext;
};

export { Toast }; 