import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
    sublabel?: string;
    icon?: React.ReactNode;
}

interface CustomSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    searchable?: boolean;
    clearable?: boolean;
    style?: React.CSSProperties;
    className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select an option…',
    disabled = false,
    searchable,
    clearable = false,
    style,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const optionsListRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    // Automatically enable search if there are 6 or more items, unless explicitly set
    const shouldShowSearch = searchable !== undefined ? searchable : options.length >= 6;

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) return options;
        const q = searchQuery.toLowerCase();
        return options.filter((opt) =>
            opt.label.toLowerCase().includes(q) ||
            (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
        );
    }, [options, searchQuery]);

    // Handle outside clicks and keyboard navigation
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                setIsOpen(false);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedIndex((prev) =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1
                );
            } else if (e.key === 'Enter') {
                if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
                    e.preventDefault();
                    handleSelect(filteredOptions[focusedIndex].value);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [isOpen, filteredOptions, focusedIndex]);

    // Auto-focus search input when popover opens
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            const selectedIdx = filteredOptions.findIndex((o) => o.value === value);
            setFocusedIndex(selectedIdx >= 0 ? selectedIdx : 0);
            if (shouldShowSearch) {
                setTimeout(() => searchInputRef.current?.focus(), 50);
            }
        }
    }, [isOpen]);

    // Scroll focused option into view
    useEffect(() => {
        if (isOpen && focusedIndex >= 0 && optionsListRef.current) {
            const focusedEl = optionsListRef.current.children[focusedIndex] as HTMLElement;
            if (focusedEl) {
                focusedEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [focusedIndex, isOpen]);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    return (
        <div
            ref={containerRef}
            className={`custom-select-container ${className} ${disabled ? 'is-disabled' : ''}`}
            style={style}
        >
            {/* Dropdown Trigger Button */}
            <button
                type="button"
                className={`custom-select-trigger ${isOpen ? 'is-open' : ''} ${!selectedOption ? 'has-placeholder' : ''}`}
                onClick={() => !disabled && setIsOpen((prev) => !prev)}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <div className="custom-select-selected-content">
                    {selectedOption ? (
                        <div className="custom-select-value-display">
                            {selectedOption.icon ? (
                                <span className="custom-select-item-icon">{selectedOption.icon}</span>
                            ) : (
                                <div className="custom-select-avatar-badge-sm">
                                    {selectedOption.label.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="custom-select-value-text">
                                <span className="custom-select-label">{selectedOption.label}</span>
                                {selectedOption.sublabel && (
                                    <span className="custom-select-sublabel-inline">
                                        ({selectedOption.sublabel})
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <span className="custom-select-placeholder">{placeholder}</span>
                    )}
                </div>

                <div className="custom-select-actions">
                    {clearable && selectedOption && !disabled && (
                        <span
                            className="custom-select-clear"
                            onClick={handleClear}
                            title="Clear selection"
                        >
                            <X size={14} />
                        </span>
                    )}
                    <ChevronDown
                        size={16}
                        className={`custom-select-chevron ${isOpen ? 'is-rotated' : ''}`}
                    />
                </div>
            </button>

            {/* Custom Floating Options Menu */}
            {isOpen && (
                <div className="custom-select-menu" role="listbox">
                    {/* Optional Search Bar */}
                    {shouldShowSearch && (
                        <div className="custom-select-search-wrapper">
                            <Search size={14} className="custom-select-search-icon" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="custom-select-search-input"
                                placeholder="Search…"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setFocusedIndex(0);
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="custom-select-search-clear"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSearchQuery('');
                                        searchInputRef.current?.focus();
                                    }}
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Options List */}
                    <div className="custom-select-options-list" ref={optionsListRef}>
                        {filteredOptions.length === 0 ? (
                            <div className="custom-select-empty">
                                {searchQuery ? `No matches for "${searchQuery}"` : 'No options available'}
                            </div>
                        ) : (
                            filteredOptions.map((opt, idx) => {
                                const isSelected = opt.value === value;
                                const isFocused = idx === focusedIndex;

                                return (
                                    <div
                                        key={opt.value}
                                        className={`custom-select-option ${isSelected ? 'is-selected' : ''} ${isFocused ? 'is-focused' : ''}`}
                                        onClick={() => handleSelect(opt.value)}
                                        onMouseEnter={() => setFocusedIndex(idx)}
                                        role="option"
                                        aria-selected={isSelected}
                                    >
                                        <div className="custom-select-option-content">
                                            <div className="custom-select-option-icon">
                                                {opt.icon ? (
                                                    <span className="custom-select-item-icon">{opt.icon}</span>
                                                ) : (
                                                    <div className="custom-select-avatar-badge">
                                                        {opt.label.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="custom-select-option-labels">
                                                <div className="custom-select-option-title">{opt.label}</div>
                                                {opt.sublabel && (
                                                    <div className="custom-select-option-subtitle">{opt.sublabel}</div>
                                                )}
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <Check size={16} className="custom-select-check-icon" />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
