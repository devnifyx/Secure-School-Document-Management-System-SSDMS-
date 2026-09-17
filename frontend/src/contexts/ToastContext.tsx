import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    title?: string;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string, title?: string) => void;
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((type: ToastType, message: string, title?: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast: Toast = { id, type, message, title };
        setToasts((prev) => [...prev, newToast]);

        setTimeout(() => {
            removeToast(id);
        }, 4500);
    }, [removeToast]);

    const success = useCallback((message: string, title = 'Success') => showToast('success', message, title), [showToast]);
    const error = useCallback((message: string, title = 'Error') => showToast('error', message, title), [showToast]);
    const info = useCallback((message: string, title = 'Notice') => showToast('info', message, title), [showToast]);
    const warning = useCallback((message: string, title = 'Warning') => showToast('warning', message, title), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
            {children}
            <div className="toast-container" aria-live="polite">
                {toasts.map((toast) => {
                    const icons = {
                        success: <CheckCircle2 className="toast-icon text-success" size={20} />,
                        error: <AlertCircle className="toast-icon text-danger" size={20} />,
                        warning: <AlertTriangle className="toast-icon text-warning" size={20} />,
                        info: <Info className="toast-icon text-info" size={20} />,
                    };

                    return (
                        <div key={toast.id} className={`toast-card toast-${toast.type}`}>
                            <div className="toast-body">
                                {icons[toast.type]}
                                <div className="toast-content">
                                    {toast.title && <div className="toast-title">{toast.title}</div>}
                                    <div className="toast-msg">{toast.message}</div>
                                </div>
                                <button className="toast-close" onClick={() => removeToast(toast.id)}>
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="toast-progress" />
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
