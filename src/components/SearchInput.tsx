'use client';

import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-96 z-[1000]">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search people, places, skills..."
          className={cn(
            'w-full pl-12 pr-10 py-3 rounded-full',
            'bg-white/95 backdrop-blur-sm',
            'border border-neutral-200',
            'text-neutral-800 placeholder:text-neutral-400',
            'shadow-lg shadow-black/5',
            'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent',
            'transition-all duration-200'
          )}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        )}
      </div>
      {value && (
        <div className="mt-2 text-xs text-neutral-500 text-center">
          Try: &quot;designer&quot;, &quot;under 30&quot;, &quot;Berlin&quot;, &quot;Spanish&quot;
        </div>
      )}
    </div>
  );
}
