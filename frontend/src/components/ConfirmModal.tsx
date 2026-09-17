import React, { useState, useEffect } from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    loading?: boolean;
    inputMode?: boolean;
    inputLabel?: string;
    inputPlaceholder?: string;
    initialValue?: string;
    inputRequired?: boolean;
    onConfirm: (inputValue?: string) => void;
    onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = false,
    loading = false,
    inputMode = false,
    inputLabel,
    inputPlaceholder,
    initialValue = '',
    inputRequired = true,
    onConfirm,
    onCancel,
}) => {
    const [inputValue, setInputValue] = useState(initialValue);
    const [inputError, setInputError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setInputValue(initialValue);
            setInputError('');
        }
    }, [isOpen, initialValue]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !loading) {
                onCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, loading, onCancel]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (inputMode && inputRequired && !inputValue.trim()) {
            setInputError('This field is required.');
            return;
        }
        onConfirm(inputValue);
    };

    return (
        <div className="modal-overlay" onClick={() => !loading && onCancel()}>
            <div
                className="modal-box confirm-dialog-box"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="confirm-dialog-header">
                    <div className={`confirm-icon-bubble ${isDanger ? 'bubble-danger' : 'bubble-primary'}`}>
                        {isDanger ? <AlertTriangle size={24} /> : <HelpCircle size={24} />}
                    </div>
                    <button
                        className="modal-close"
                        onClick={onCancel}
                        disabled={loading}
                        aria-label="Close dialog"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="confirm-dialog-body">
                    <h3 className="confirm-title">{title}</h3>
                    <p className="confirm-desc">{message}</p>

                    {inputMode && (
                        <div className="confirm-input-group">
                            {inputLabel && <label className="form-label">{inputLabel}</label>}
                            <textarea
                                className={`form-control ${inputError ? 'border-danger' : ''}`}
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    if (inputError) setInputError('');
                                }}
                                placeholder={inputPlaceholder}
                                rows={3}
                                autoFocus
                                disabled={loading}
                            />
                            {inputError && <div className="form-error">{inputError}</div>}
                        </div>
                    )}
                </div>

                <div className="confirm-dialog-footer">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Processing…' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
