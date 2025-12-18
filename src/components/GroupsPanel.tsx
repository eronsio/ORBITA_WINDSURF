'use client';

import { useState, useCallback, useMemo } from 'react';
import { X, Plus, Users, Check, Trash2, ChevronRight, Search, UserPlus, ArrowLeft, Sparkles } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import type { Group } from '@/types/group';
import type { Contact } from '@/types/contact';

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
  contacts?: Contact[];
  contactGroupsMap?: globalThis.Map<string, string[]>;
  onAddContactToGroup?: (contactId: string, groupId: string) => void;
  onRemoveContactFromGroup?: (contactId: string, groupId: string) => void;
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
  contacts = [],
  contactGroupsMap = new globalThis.Map(),
  onAddContactToGroup,
  onRemoveContactFromGroup,
}: GroupsPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState(GROUP_COLORS[0]);
  const [managingGroupId, setManagingGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get the group being managed
  const managingGroup = managingGroupId ? groups.find(g => g.id === managingGroupId) : null;

  // Get contacts in the managing group
  const contactsInGroup = useMemo(() => {
    if (!managingGroupId) return [];
    return contacts.filter(c => {
      const groups = contactGroupsMap.get(c.id) || [];
      return groups.includes(managingGroupId);
    });
  }, [managingGroupId, contacts, contactGroupsMap]);

  // Get contacts NOT in the group (for adding)
  const contactsNotInGroup = useMemo(() => {
    if (!managingGroupId) return [];
    return contacts.filter(c => {
      const groups = contactGroupsMap.get(c.id) || [];
      return !groups.includes(managingGroupId);
    });
  }, [managingGroupId, contacts, contactGroupsMap]);

  // Filter by search
  const filteredContactsNotInGroup = useMemo(() => {
    if (!searchQuery.trim()) return contactsNotInGroup;
    const query = searchQuery.toLowerCase();
    return contactsNotInGroup.filter(c => 
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query)
    );
  }, [contactsNotInGroup, searchQuery]);

  // Smart suggestions based on group name matching contact attributes
  const suggestedContacts = useMemo(() => {
    if (!managingGroup || contactsNotInGroup.length === 0) return [];
    
    const groupNameWords = managingGroup.name.toLowerCase().split(/\s+/);
    
    return contactsNotInGroup.filter(contact => {
      // Check attributes for matching words
      const attrValues = Object.values(contact.attributes || {})
        .map(v => String(v).toLowerCase())
        .join(' ');
      const tags = (contact.tags || []).join(' ').toLowerCase();
      const searchText = `${attrValues} ${tags} ${contact.bio || ''}`.toLowerCase();
      
      return groupNameWords.some(word => 
        word.length > 2 && searchText.includes(word)
      );
    }).slice(0, 5); // Limit to 5 suggestions
  }, [managingGroup, contactsNotInGroup]);

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

  // Manage group members view
  if (managingGroup && managingGroupId) {
    return (
      <>
        <div 
          className="fixed inset-0 bg-black/20 z-[1500] animate-fade-in"
          onClick={() => setManagingGroupId(null)}
        />
        <div className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-[1501] animate-slide-in-left">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-neutral-100">
              <button
                onClick={() => {
                  setManagingGroupId(null);
                  setSearchQuery('');
                }}
                className="p-2 -ml-2 rounded-full hover:bg-neutral-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-600" />
              </button>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: managingGroup.color }}
              >
                {managingGroup.icon || managingGroup.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-lg font-semibold text-neutral-800 truncate">
                {managingGroup.name}
              </h2>
            </div>

            {/* Search to add */}
            <div className="p-4 border-b border-neutral-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search to add..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Smart suggestions */}
              {!searchQuery && suggestedContacts.length > 0 && (
                <div className="p-4 border-b border-neutral-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-medium text-neutral-500">Suggested</span>
                  </div>
                  <div className="space-y-1">
                    {suggestedContacts.map(contact => (
                      <button
                        key={contact.id}
                        onClick={() => onAddContactToGroup?.(contact.id, managingGroupId)}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                          {contact.photoUrl ? (
                            <img src={contact.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-accent-light to-accent flex items-center justify-center text-white text-xs font-medium">
                              {getInitials(contact.firstName, contact.lastName)}
                            </div>
                          )}
                        </div>
                        <span className="flex-1 text-sm text-neutral-700 text-left truncate">
                          {contact.firstName} {contact.lastName}
                        </span>
                        <Plus className="w-4 h-4 text-accent" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Current members */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-neutral-500">
                    Members ({contactsInGroup.length})
                  </span>
                </div>
                {contactsInGroup.length === 0 ? (
                  <p className="text-sm text-neutral-400 text-center py-4">
                    No members yet. Search above to add people.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {contactsInGroup.map(contact => (
                      <div
                        key={contact.id}
                        className="group flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                          {contact.photoUrl ? (
                            <img src={contact.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-accent-light to-accent flex items-center justify-center text-white text-xs font-medium">
                              {getInitials(contact.firstName, contact.lastName)}
                            </div>
                          )}
                        </div>
                        <span className="flex-1 text-sm text-neutral-700 truncate">
                          {contact.firstName} {contact.lastName}
                        </span>
                        <button
                          onClick={() => onRemoveContactFromGroup?.(contact.id, managingGroupId)}
                          className="p-1 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Search results */}
              {searchQuery && (
                <div className="p-4 border-t border-neutral-100">
                  <span className="text-xs font-medium text-neutral-500 mb-3 block">
                    Add to group
                  </span>
                  {filteredContactsNotInGroup.length === 0 ? (
                    <p className="text-sm text-neutral-400 text-center py-2">
                      No contacts found
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {filteredContactsNotInGroup.slice(0, 10).map(contact => (
                        <button
                          key={contact.id}
                          onClick={() => {
                            onAddContactToGroup?.(contact.id, managingGroupId);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            {contact.photoUrl ? (
                              <img src={contact.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-accent-light to-accent flex items-center justify-center text-white text-xs font-medium">
                                {getInitials(contact.firstName, contact.lastName)}
                              </div>
                            )}
                          </div>
                          <span className="flex-1 text-sm text-neutral-700 text-left truncate">
                            {contact.firstName} {contact.lastName}
                          </span>
                          <Plus className="w-4 h-4 text-accent" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

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
                      setManagingGroupId(group.id);
                    }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-neutral-200 transition-all"
                    title="Manage members"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
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
