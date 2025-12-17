'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 5000) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[2000] flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 5000;

  useEffect(() => {
    if (isPaused) return;

    const startTime = Date.now();
    const remainingTime = (progress / 100) * duration;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.max(0, ((remainingTime - elapsed) / duration) * 100);
      setProgress(newProgress);

      if (newProgress <= 0) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPaused, duration, toast.id, onDismiss, progress]);

  const Icon = toast.type === 'success' ? CheckCircle : toast.type === 'error' ? AlertCircle : Info;
  
  const bgColor = toast.type === 'success' 
    ? 'bg-green-50 border-green-200' 
    : toast.type === 'error' 
      ? 'bg-red-50 border-red-200' 
      : 'bg-white border-neutral-200';
  
  const iconColor = toast.type === 'success' 
    ? 'text-green-500' 
    : toast.type === 'error' 
      ? 'text-red-500' 
      : 'text-accent';

  const textColor = toast.type === 'success' 
    ? 'text-green-800' 
    : toast.type === 'error' 
      ? 'text-red-800' 
      : 'text-neutral-800';

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg',
        'animate-fade-in overflow-hidden',
        bgColor
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconColor)} />
      <p className={cn('text-sm flex-1 pr-6', textColor)}>{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="absolute top-2 right-2 p-1 rounded hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4 text-neutral-400" />
      </button>
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5">
        <div 
          className={cn(
            'h-full transition-all duration-50',
            toast.type === 'success' ? 'bg-green-400' : toast.type === 'error' ? 'bg-red-400' : 'bg-accent'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
