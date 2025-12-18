'use client';

import { useState, useCallback } from 'react';
import { X, Plus, Users, Check, Trash2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Group } from '@/types/group';

const GROUP_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#64748B', // Slate
];

interface GroupsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  activeGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  onCreateGroup: (group: Partial<Group>) => void;
  onUpdateGroup: (id: string, updates: Partial<Group>) => void;
  onDeleteGroup: (id: string) => void;
}

export function GroupsPanel({
  isOpen,
  onClose,
  groups,
  activeGroupId,
  onSelectGroup,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
}: GroupsPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState(GROUP_COLORS[0]);

  const handleCreate = useCallback(() => {
    if (!newGroupName.trim()) return;
    onCreateGroup({ name: newGroupName.trim(), color: newGroupColor });
    setNewGroupName('');
    setNewGroupColor(GROUP_COLORS[0]);
    setIsCreating(false);
  }, [newGroupName, newGroupColor, onCreateGroup]);

  const handleSelectGroup = useCallback((groupId: string | null) => {
    onSelectGroup(groupId);
    onClose();
  }, [onSelectGroup, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-[1500] animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-[1501] animate-slide-in-left pb-20">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-800">Groups</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* All contacts option */}
            <button
              onClick={() => handleSelectGroup(null)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors mb-2',
                activeGroupId === null
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'hover:bg-neutral-50 text-neutral-600'
              )}
            >
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                <Users className="w-4 h-4 text-neutral-600" />
              </div>
              <span className="flex-1 text-left font-medium">Everyone</span>
              {activeGroupId === null && (
                <Check className="w-4 h-4 text-accent" />
              )}
            </button>

            {/* Divider */}
            {groups.length > 0 && (
              <div className="h-px bg-neutral-100 my-3" />
            )}

            {/* Groups list */}
            <div className="space-y-1">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className={cn(
                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer',
                    activeGroupId === group.id
                      ? 'bg-neutral-100'
                      : 'hover:bg-neutral-50'
                  )}
                  onClick={() => handleSelectGroup(group.id)}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: group.color }}
                  >
                    {group.icon || group.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-800 truncate">
                      {group.name}
                    </p>
                    {group.contactCount !== undefined && (
                      <p className="text-xs text-neutral-500">
                        {group.contactCount} {group.contactCount === 1 ? 'person' : 'people'}
                      </p>
                    )}
                  </div>
                  {activeGroupId === group.id ? (
                    <Check className="w-4 h-4 text-accent" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${group.name}"?`)) {
                        onDeleteGroup(group.id);
                      }
                    }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-neutral-200 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                </div>
              ))}
            </div>

            {/* Create new group */}
            {isCreating ? (
              <div className="mt-4 p-3 bg-neutral-50 rounded-xl">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group name..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') setIsCreating(false);
                  }}
                />
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {GROUP_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewGroupColor(color)}
                      className={cn(
                        'w-6 h-6 rounded-full transition-transform',
                        newGroupColor === color && 'ring-2 ring-offset-2 ring-neutral-400 scale-110'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newGroupName.trim()}
                    className={cn(
                      'flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors',
                      newGroupName.trim()
                        ? 'bg-accent text-white hover:bg-accent-dark'
                        : 'bg-neutral-100 text-neutral-400'
                    )}
                  >
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-neutral-200 text-neutral-500 hover:border-accent hover:text-accent transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">New Group</span>
              </button>
            )}
          </div>

          {/* Footer hint */}
          <div className="p-4 border-t border-neutral-100">
            <p className="text-xs text-neutral-400 text-center">
              Groups help you focus on the relationships that matter most
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
