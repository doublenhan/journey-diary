import React, { useEffect } from 'react';
import { X, Check, AlertCircle, Info } from 'lucide-react';
import '../styles/Toast.css';

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

  const icons = {
    success: <Check className="toast-icon" />,
    error: <AlertCircle className="toast-icon" />,
    info: <Info className="toast-icon" />,
    warning: <AlertCircle className="toast-icon" />,
  };

  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="polite">
      <div className="toast-content">
        {icons[type]}
        <p className="toast-message">{message}</p>
      </div>
      <button
        className="toast-close"
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
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

export default Toast;
