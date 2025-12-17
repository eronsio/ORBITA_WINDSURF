'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  multiline?: boolean;
}

/**
 * Notion-style inline editable field
 * - Renders as text by default
 * - Click to edit
 * - Blur or Enter saves
 * - Escape cancels
 */
export function EditableField({
  value,
  onSave,
  className = '',
  inputClassName = '',
  placeholder = 'Click to edit...',
  multiline = false,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync editValue when value prop changes (e.g., from parent state)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(value);
  }, [value]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
    setIsEditing(false);
  }, [editValue, value, onSave]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Enter' && multiline && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel, multiline]);

  const handleBlur = useCallback(() => {
    handleSave();
  }, [handleSave]);

  if (isEditing) {
    const baseInputClass = cn(
      'bg-white border border-accent/30 rounded px-2 py-1',
      'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent',
      'transition-all duration-150',
      inputClassName
    );

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={cn(baseInputClass, 'w-full resize-none min-h-[60px]')}
          rows={3}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={baseInputClass}
      />
    );
  }

  // Display mode - clickable text
  const displayValue = value || placeholder;
  const isEmpty = !value;

  return (
    <span
      onClick={handleClick}
      className={cn(
        'cursor-pointer rounded px-1 -mx-1 py-0.5',
        'hover:bg-neutral-100 transition-colors duration-150',
        isEmpty && 'text-neutral-400 italic',
        className
      )}
      title="Click to edit"
    >
      {displayValue}
    </span>
  );
}
