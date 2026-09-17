import React from 'react';

export const SkeletonBox: React.FC<{ className?: string; height?: string | number; width?: string | number; style?: React.CSSProperties }> = ({
    className = '',
    height,
    width,
    style = {},
}) => {
    return (
        <div
            className={`skeleton-shimmer ${className}`}
            style={{
                height,
                width,
                ...style,
            }}
        />
    );
};

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 4 }) => {
    return (
        <div className="summary-grid">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="summary-card skeleton-card-item">
                    <SkeletonBox height={12} width="55%" style={{ marginBottom: 8 }} />
                    <SkeletonBox height={24} width="35%" style={{ marginBottom: 6 }} />
                    <SkeletonBox height={10} width="75%" />
                </div>
            ))}
        </div>
    );
};

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 5 }) => {
    return (
        <div className="table-wrap">
            <table className="data-table">
                <thead>
                    <tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i}>
                                <SkeletonBox height={14} width="70%" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, r) => (
                        <tr key={r}>
                            {Array.from({ length: columns }).map((_, c) => (
                                <td key={c}>
                                    <SkeletonBox height={16} width={c === 0 ? '80%' : '50%'} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
