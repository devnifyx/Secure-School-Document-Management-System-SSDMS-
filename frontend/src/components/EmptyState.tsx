import React from 'react';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    actionText?: string;
    onAction?: () => void;
    secondaryActionText?: string;
    onSecondaryAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    actionText,
    onAction,
    secondaryActionText,
    onSecondaryAction,
}) => {
    return (
        <div className="empty-state-modern">
            <div className="empty-state-icon-box">
                {icon || <FolderOpen size={36} className="text-slate-400" />}
            </div>
            <h4 className="empty-state-title">{title}</h4>
            {description && <p className="empty-state-desc">{description}</p>}
            {(actionText || secondaryActionText) && (
                <div className="empty-state-actions">
                    {actionText && onAction && (
                        <button type="button" className="btn btn-primary btn-sm" onClick={onAction}>
                            {actionText}
                        </button>
                    )}
                    {secondaryActionText && onSecondaryAction && (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={onSecondaryAction}>
                            {secondaryActionText}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
