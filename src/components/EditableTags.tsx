'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableTagsProps {
  tags: string[];
  onUpdate: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function EditableTags({
  tags,
  onUpdate,
  placeholder = 'Add tag...',
  className,
}: EditableTagsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = useCallback(() => {
    const trimmed = newTag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onUpdate([...tags, trimmed]);
    }
    setNewTag('');
    setIsAdding(false);
  }, [newTag, tags, onUpdate]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    onUpdate(tags.filter(t => t !== tagToRemove));
  }, [tags, onUpdate]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Escape') {
      setNewTag('');
      setIsAdding(false);
    } else if (e.key === 'Backspace' && !newTag && tags.length > 0) {
      // Remove last tag on backspace when input is empty
      onUpdate(tags.slice(0, -1));
    }
  }, [handleAddTag, newTag, tags, onUpdate]);

  const handleStartAdding = useCallback(() => {
    setIsAdding(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  return (
    <div className={cn('flex flex-wrap gap-1.5 items-center', className)}>
      {tags.map(tag => (
        <span
          key={tag}
          className="group inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-full text-sm hover:bg-neutral-200 transition-colors"
        >
          {tag}
          <button
            onClick={() => handleRemoveTag(tag)}
            className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      
      {isAdding ? (
        <input
          ref={inputRef}
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleAddTag}
          placeholder={placeholder}
          className="px-2 py-1 text-sm bg-transparent border-b border-accent focus:outline-none min-w-[80px] max-w-[120px]"
          autoFocus
        />
      ) : (
        <button
          onClick={handleStartAdding}
          className="inline-flex items-center gap-1 px-2 py-1 text-sm text-neutral-400 hover:text-accent hover:bg-accent/5 rounded-full transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Add</span>
        </button>
      )}
    </div>
  );
}
