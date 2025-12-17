'use client';

import { useState, useCallback } from 'react';
import { X, Plus, ExternalLink, Linkedin, Instagram, Github, Globe, Twitter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SocialLink } from '@/types/contact';

interface EditableSocialLinksProps {
  links: SocialLink[];
  onUpdate: (links: SocialLink[]) => void;
  className?: string;
}

const PLATFORM_OPTIONS = [
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'twitter', label: 'Twitter/X', icon: Twitter },
  { value: 'github', label: 'GitHub', icon: Github },
  { value: 'website', label: 'Website', icon: Globe },
];

function getPlatformIcon(platform: string) {
  const option = PLATFORM_OPTIONS.find(p => p.value === platform.toLowerCase());
  return option?.icon || Globe;
}

export function EditableSocialLinks({
  links,
  onUpdate,
  className,
}: EditableSocialLinksProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newPlatform, setNewPlatform] = useState('linkedin');
  const [newUrl, setNewUrl] = useState('');

  const handleAddLink = useCallback(() => {
    if (!newUrl.trim()) {
      setIsAdding(false);
      return;
    }
    
    let url = newUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    onUpdate([...links, { platform: newPlatform, url }]);
    setNewUrl('');
    setNewPlatform('linkedin');
    setIsAdding(false);
  }, [newUrl, newPlatform, links, onUpdate]);

  const handleUpdateLink = useCallback((index: number, url: string) => {
    let finalUrl = url.trim();
    if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    
    const updated = [...links];
    updated[index] = { ...updated[index], url: finalUrl };
    onUpdate(updated);
    setEditingIndex(null);
  }, [links, onUpdate]);

  const handleRemoveLink = useCallback((index: number) => {
    onUpdate(links.filter((_, i) => i !== index));
  }, [links, onUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setEditingIndex(null);
      setNewUrl('');
    }
  }, []);

  return (
    <div className={cn('space-y-2', className)}>
      {links.map((link, index) => {
        const Icon = getPlatformIcon(link.platform);
        const isEditing = editingIndex === index;
        
        return (
          <div
            key={`${link.platform}-${index}`}
            className="group flex items-center gap-2"
          >
            <Icon className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            
            {isEditing ? (
              <input
                type="text"
                defaultValue={link.url}
                onBlur={(e) => handleUpdateLink(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, () => handleUpdateLink(index, (e.target as HTMLInputElement).value))}
                className="flex-1 px-2 py-1 text-sm bg-neutral-50 border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setEditingIndex(index)}
                className="flex-1 text-left text-sm text-neutral-600 hover:text-accent truncate transition-colors"
                title="Click to edit"
              >
                {link.url.replace(/^https?:\/\//, '')}
              </button>
            )}
            
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-neutral-300 hover:text-accent transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            
            <button
              onClick={() => handleRemoveLink(index)}
              className="p-1 text-neutral-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      {isAdding ? (
        <div className="flex items-center gap-2">
          <select
            value={newPlatform}
            onChange={(e) => setNewPlatform(e.target.value)}
            className="px-2 py-1.5 text-sm bg-neutral-50 border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-accent/50"
          >
            {PLATFORM_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleAddLink)}
            onBlur={handleAddLink}
            placeholder="URL or username"
            className="flex-1 px-2 py-1.5 text-sm bg-neutral-50 border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent"
            autoFocus
          />
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-2 py-1 text-sm text-neutral-400 hover:text-accent hover:bg-accent/5 rounded transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add link</span>
        </button>
      )}
    </div>
  );
}
