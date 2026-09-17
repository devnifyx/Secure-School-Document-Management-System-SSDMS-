import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
    className?: string;
    style?: React.CSSProperties;
    showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', style, showLabel = false }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`theme-toggle-btn ${className}`}
            style={style}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle light or dark theme"
        >
            {theme === 'dark' ? (
                <Sun size={18} style={{ color: '#FBBF24' }} />
            ) : (
                <Moon size={18} style={{ color: 'var(--text-secondary)' }} />
            )}
            {showLabel && (
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
            )}
        </button>
    );
};

export default ThemeToggle;
