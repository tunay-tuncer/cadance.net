'use client';

import React from 'react';
import { FaCheck } from 'react-icons/fa';
import { MdDeleteOutline, MdAdd } from 'react-icons/md';
import { BulletItem } from '@/types/mail';
import { COLOR_PRESETS } from '../../templates/templateData';
import styles from './CustomControls.module.css';

// 1. CUSTOM TOGGLE SWITCH
interface CustomToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    sublabel?: string;
    accentColor?: string;
    disabled?: boolean;
}

export function CustomToggleSwitch({
    checked,
    onChange,
    label,
    sublabel,
    accentColor = '#2972f5',
    disabled = false,
}: CustomToggleSwitchProps) {
    return (
        <label
            className={styles.switchLabel}
            style={{ '--accent': accentColor } as React.CSSProperties}
        >
            <div className={styles.switchContainer}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                    className={styles.switchInput}
                />
                <span className={styles.switchSlider} />
            </div>
            <div>
                <span className={styles.switchText}>{label}</span>
                {sublabel && <span className={styles.switchSubtext}>{sublabel}</span>}
            </div>
        </label>
    );
}

// 2. CUSTOM COLOR SWATCH PICKER
interface CustomColorPickerProps {
    value: string;
    onChange: (hex: string) => void;
}

export function CustomColorPicker({ value, onChange }: CustomColorPickerProps) {
    return (
        <div className={styles.colorPickerContainer}>
            <div className={styles.swatchRow}>
                {COLOR_PRESETS.map((preset) => {
                    const isActive = value.toLowerCase() === preset.hex.toLowerCase();
                    return (
                        <button
                            key={preset.hex}
                            type="button"
                            className={`${styles.colorSwatchBtn} ${isActive ? styles.colorSwatchActive : ''}`}
                            style={{ backgroundColor: preset.hex, color: preset.hex }}
                            onClick={() => onChange(preset.hex)}
                            title={preset.name}
                            aria-label={`Select ${preset.name}`}
                        >
                            {isActive && <FaCheck className={styles.swatchCheck} />}
                        </button>
                    );
                })}

                {/* Custom Hex / Native Color Picker */}
                <div className={styles.customHexWrapper}>
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className={styles.nativeColorInput}
                        title="Pick custom color"
                        aria-label="Pick custom color"
                    />
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className={styles.customHexInput}
                        maxLength={7}
                        placeholder="#2972f5"
                    />
                </div>
            </div>
        </div>
    );
}

// 3. CUSTOM BULLET LIST EDITOR
interface CustomBulletListEditorProps {
    items: BulletItem[];
    onChange: (items: BulletItem[]) => void;
    accentColor?: string;
}

export function CustomBulletListEditor({
    items,
    onChange,
    accentColor = '#2972f5',
}: CustomBulletListEditorProps) {
    const handleTextChange = (id: string, newText: string) => {
        onChange(items.map((item) => (item.id === id ? { ...item, text: newText } : item)));
    };

    const handleDelete = (id: string) => {
        onChange(items.filter((item) => item.id !== id));
    };

    const handleAdd = () => {
        const newItem: BulletItem = {
            id: `bullet-${Date.now()}`,
            text: '',
        };
        onChange([...items, newItem]);
    };

    return (
        <div
            className={styles.bulletListWrapper}
            style={{ '--accent': accentColor } as React.CSSProperties}
        >
            {items.map((item, index) => (
                <div key={item.id} className={styles.bulletItemRow}>
                    <span className={styles.bulletNumber}>{index + 1}.</span>
                    <textarea
                        value={item.text}
                        onChange={(e) => handleTextChange(item.id, e.target.value)}
                        placeholder="Madde metnini buraya yazın..."
                        rows={2}
                        className={styles.bulletTextarea}
                    />
                    <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className={styles.bulletDeleteBtn}
                        title="Maddeyi Sil"
                        aria-label="Maddeyi Sil"
                    >
                        <MdDeleteOutline size={16} />
                    </button>
                </div>
            ))}

            <button type="button" onClick={handleAdd} className={styles.addBulletBtn}>
                <MdAdd size={16} />
                <span>Yeni Madde Ekle</span>
            </button>
        </div>
    );
}

// 4. CUSTOM SEGMENT CONTROL
interface SegmentOption<T extends string> {
    value: T;
    label: string;
    icon?: React.ReactNode;
}

interface CustomSegmentControlProps<T extends string> {
    options: SegmentOption<T>[];
    value: T;
    onChange: (val: T) => void;
    accentColor?: string;
    className?: string;
}

export function CustomSegmentControl<T extends string>({
    options,
    value,
    onChange,
    accentColor = '#2972f5',
    className = '',
}: CustomSegmentControlProps<T>) {
    return (
        <div
            className={`${styles.segmentGroup} ${className}`}
            style={{ '--accent': accentColor } as React.CSSProperties}
        >
            {options.map((opt) => {
                const isActive = opt.value === value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        className={`${styles.segmentItem} ${isActive ? styles.segmentItemActive : ''}`}
                        onClick={() => onChange(opt.value)}
                    >
                        {opt.icon}
                        <span>{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
