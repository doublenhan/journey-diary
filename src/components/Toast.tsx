import React, { useEffect } from 'react';
import { X, Check, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps extends ToastMessage {
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 4000, onRemove }) => {
  useEffect(() => {
    if (duration === 0) return;
    const timer = setTimeout(() => onRemove(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const toastStyles = {
    success: 'border-l-green-500 bg-green-50',
    error: 'border-l-red-500 bg-red-50',
    info: 'border-l-blue-500 bg-blue-50',
    warning: 'border-l-amber-500 bg-amber-50',
  };

  const iconStyles = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    warning: 'text-amber-500',
  };

  const icons = {
    success: <Check className={`flex-shrink-0 w-5 h-5 ${iconStyles.success}`} />,
    error: <AlertCircle className={`flex-shrink-0 w-5 h-5 ${iconStyles.error}`} />,
    info: <Info className={`flex-shrink-0 w-5 h-5 ${iconStyles.info}`} />,
    warning: <AlertCircle className={`flex-shrink-0 w-5 h-5 ${iconStyles.warning}`} />,
  };

  return (
    <div 
      className={`flex items-center justify-between px-5 py-4 rounded-lg bg-white shadow-lg animate-slideInRight pointer-events-auto border-l-4 gap-3 ${toastStyles[type]}`}
      role="alert" 
      aria-live="polite"
    >
      <div className="flex items-center gap-3 flex-1">
        {icons[type]}
        <p className="m-0 text-[0.95rem] font-medium leading-relaxed">{message}</p>
      </div>
      <button
        className="flex-shrink-0 bg-transparent border-none p-1 cursor-pointer text-gray-500 transition-colors duration-200 flex items-center justify-center hover:text-gray-900"
        onClick={() => onRemove(id)}
        aria-label="Close notification"
      >
        <X size={18} />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none max-w-[400px] sm:top-2 sm:right-2 sm:left-2 sm:max-w-none" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

export default Toast;
