import React, { useState, useRef, useEffect } from 'react';
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
    const [inspectFile, setInspectFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync external file prop into inspectFile if file is set or cleared
    useEffect(() => {
        if (file) {
            setInspectFile(file);
        } else if (file === null && (!inspectFile || inspectFile.size <= maxSizeMB * 1024 * 1024)) {
            setInspectFile(null);
        }
    }, [file, maxSizeMB]);

    const validateFile = (f: File): boolean => {
        if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(f.type)) {
            setLocalError(`File type "${f.type || f.name.split('.').pop()}" is not supported.`);
            return false;
        }
        if (f.size > maxSizeMB * 1024 * 1024) {
            setLocalError(`File exceeds the maximum allowed size of ${maxSizeMB} MB. Please select a smaller file.`);
            return false;
        }
        setLocalError('');
        return true;
    };

    const processSingleFile = (target: File) => {
        setInspectFile(target);
        const isValid = validateFile(target);
        if (isValid) {
            onFileSelect?.(target);
        } else {
            onFileSelect?.(null);
        }
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
            processSingleFile(dropped[0]);
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
            processSingleFile(selected[0]);
        }
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleRemoveFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setInspectFile(null);
        setLocalError('');
        if (inputRef.current) inputRef.current.value = '';
        onFileSelect?.(null);
    };

    const removeFileAtIndex = (index: number) => {
        if (files && onFilesSelect) {
            const updated = files.filter((_, i) => i !== index);
            onFilesSelect(updated);
        }
    };

    const displayError = error || localError;

    // Active file calculations for single mode indicator
    const activeFile = file || inspectFile;
    const fileSizeMB = activeFile ? activeFile.size / (1024 * 1024) : 0;
    const isExceeded = fileSizeMB > maxSizeMB;

    // Visual states:
    // GREEN: File size is small/light and safely below the limit (<= 7 MB)
    // YELLOW: File size is approaching the maximum allowed size (> 7 MB and <= 9 MB)
    // RED: File size is very close to the 10 MB limit (> 9 MB and <= 10 MB)
    // INVALID: Exceeds 10 MB limit
    let colorState: 'green' | 'yellow' | 'red' | 'invalid' = 'green';
    let badgeText = 'Safe File Size';

    if (isExceeded) {
        colorState = 'invalid';
        badgeText = `Exceeds ${maxSizeMB} MB`;
    } else if (fileSizeMB > 9.0) {
        colorState = 'red';
        badgeText = 'Close to Limit';
    } else if (fileSizeMB > 7.0) {
        colorState = 'yellow';
        badgeText = 'Approaching Limit';
    } else {
        colorState = 'green';
        badgeText = 'Safe / Light File';
    }

    const percentage = activeFile ? Math.min(100, (fileSizeMB / maxSizeMB) * 100) : 0;
    const barWidth = isExceeded ? 100 : Math.max(activeFile ? 3 : 0, percentage);

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

            {displayError && !activeFile && (
                <div className="form-error dropzone-error">
                    <AlertCircle size={14} />
                    <span>{displayError}</span>
                </div>
            )}

            {/* Selected File (Single mode) */}
            {!multiple && activeFile && (
                <div className="file-chip-item">
                    <div className="file-chip-info">
                        <FileText
                            size={20}
                            className="file-chip-icon"
                            style={{ color: isExceeded ? '#DC2626' : undefined }}
                        />
                        <div>
                            <div className="file-chip-name">{activeFile.name}</div>
                            <div className="file-chip-meta">{formatBytes(activeFile.size)}</div>
                        </div>
                    </div>
                    <div className="file-chip-actions">
                        {isExceeded ? (
                            <span className="badge badge-danger file-chip-badge">
                                <AlertCircle size={12} /> Too Large
                            </span>
                        ) : (
                            <span className="badge badge-success file-chip-badge">
                                <CheckCircle size={12} /> Ready
                            </span>
                        )}
                        <button
                            type="button"
                            className="file-chip-remove"
                            onClick={handleRemoveFile}
                            title="Remove file"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Visual File Size Progress Indicator (Single mode) */}
            {!multiple && activeFile && (
                <div className={`file-size-indicator-card state-${colorState}`}>
                    <div className="file-size-header">
                        <span className="file-size-label">
                            File size: <strong>{fileSizeMB.toFixed(2)} MB</strong> / {maxSizeMB} MB
                        </span>
                        <span className={`file-size-badge badge-${colorState}`}>
                            {badgeText}
                        </span>
                    </div>
                    <div className="file-size-track">
                        <div
                            className={`file-size-bar bar-${colorState}`}
                            style={{ width: `${barWidth}%` }}
                            role="progressbar"
                            aria-valuenow={fileSizeMB}
                            aria-valuemin={0}
                            aria-valuemax={maxSizeMB}
                            aria-label={`File size ${fileSizeMB.toFixed(2)} MB of ${maxSizeMB} MB limit`}
                        />
                    </div>
                    {isExceeded && (
                        <div className="file-size-error-text">
                            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                            <span>File exceeds the maximum allowed size of {maxSizeMB} MB. Please select a smaller file.</span>
                        </div>
                    )}
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
