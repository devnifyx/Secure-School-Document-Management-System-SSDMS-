import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, X, AlertCircle } from 'lucide-react';

interface FileDropzoneProps {
    file?: File | null;
    files?: File[];
    multiple?: boolean;
    onFileSelect?: (file: File | null) => void;
    onFilesSelect?: (files: File[]) => void;
    allowedTypes?: string[];
    accept?: string;
    maxSizeMB?: number;
    error?: string;
    label?: string;
    hint?: string;
    disabled?: boolean;
}

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileDropzone: React.FC<FileDropzoneProps> = ({
    file,
    files,
    multiple = false,
    onFileSelect,
    onFilesSelect,
    allowedTypes,
    accept = '.pdf,.docx,.doc,.jpg,.jpeg,.png',
    maxSizeMB = 10,
    error,
    label = 'Upload File',
    hint = 'PDF, DOCX, DOC, JPG, PNG (up to 10 MB)',
    disabled = false,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [localError, setLocalError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const validateFile = (f: File): boolean => {
        if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(f.type)) {
            setLocalError(`File type "${f.type || f.name.split('.').pop()}" is not supported.`);
            return false;
        }
        if (f.size > maxSizeMB * 1024 * 1024) {
            setLocalError(`File exceeds maximum allowed size of ${maxSizeMB} MB.`);
            return false;
        }
        setLocalError('');
        return true;
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (disabled) return;

        const dropped = Array.from(e.dataTransfer.files);
        if (dropped.length === 0) return;

        if (multiple && onFilesSelect) {
            const valid = dropped.filter(validateFile);
            if (valid.length > 0) {
                const combined = files ? [...files, ...valid] : valid;
                onFilesSelect(combined);
            }
        } else if (onFileSelect) {
            const target = dropped[0];
            if (validateFile(target)) {
                onFileSelect(target);
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        if (selected.length === 0) return;

        if (multiple && onFilesSelect) {
            const valid = selected.filter(validateFile);
            if (valid.length > 0) {
                const combined = files ? [...files, ...valid] : valid;
                onFilesSelect(combined);
            }
        } else if (onFileSelect) {
            const target = selected[0];
            if (validateFile(target)) {
                onFileSelect(target);
            }
        }
        if (inputRef.current) inputRef.current.value = '';
    };

    const removeFileAtIndex = (index: number) => {
        if (files && onFilesSelect) {
            const updated = files.filter((_, i) => i !== index);
            onFilesSelect(updated);
        }
    };

    const displayError = error || localError;

    return (
        <div className="dropzone-wrapper">
            {label && <label className="form-label">{label}</label>}

            <div
                className={`dropzone-box ${isDragging ? 'dragging' : ''} ${displayError ? 'has-error' : ''} ${disabled ? 'disabled' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !disabled && inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple={multiple}
                    accept={accept}
                    onChange={handleInputChange}
                    style={{ display: 'none' }}
                    disabled={disabled}
                />

                <div className="dropzone-content">
                    <div className="dropzone-icon-circle">
                        <UploadCloud size={28} className="dropzone-icon" />
                    </div>
                    <div className="dropzone-text">
                        <span className="dropzone-cta">Click to browse</span> or drag & drop files here
                    </div>
                    {hint && <div className="dropzone-hint">{hint}</div>}
                </div>
            </div>

            {displayError && (
                <div className="form-error dropzone-error">
                    <AlertCircle size={14} />
                    <span>{displayError}</span>
                </div>
            )}

            {/* Selected File (Single mode) */}
            {!multiple && file && (
                <div className="file-chip-item">
                    <div className="file-chip-info">
                        <FileText size={20} className="file-chip-icon" />
                        <div>
                            <div className="file-chip-name">{file.name}</div>
                            <div className="file-chip-meta">{formatBytes(file.size)}</div>
                        </div>
                    </div>
                    <div className="file-chip-actions">
                        <span className="badge badge-success file-chip-badge">
                            <CheckCircle size={12} /> Ready
                        </span>
                        <button
                            type="button"
                            className="file-chip-remove"
                            onClick={(e) => {
                                e.stopPropagation();
                                onFileSelect?.(null);
                            }}
                            title="Remove file"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Selected Files (Multiple mode) */}
            {multiple && files && files.length > 0 && (
                <div className="file-chips-list">
                    {files.map((f, idx) => (
                        <div key={`${f.name}-${idx}`} className="file-chip-item">
                            <div className="file-chip-info">
                                <FileText size={18} className="file-chip-icon" />
                                <div>
                                    <div className="file-chip-name">{f.name}</div>
                                    <div className="file-chip-meta">{formatBytes(f.size)}</div>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="file-chip-remove"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFileAtIndex(idx);
                                }}
                                title="Remove file"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileDropzone;
