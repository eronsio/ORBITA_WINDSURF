'use client';

import { useState, useMemo } from 'react';
import { Search, Users, Link2, ChevronRight, Map as MapIcon, ArrowLeft } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import type { Contact } from '@/types/contact';

interface ContactsListProps {
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
  selectedContactId?: string;
  activeGroupColor?: string;
  connections?: Map<string, string[]>; // contactId -> array of connected contactIds
  highlightedContactId?: string | null; // Contact whose connections to highlight
  onHighlightContact?: (contactId: string | null) => void;
  onBackToMap?: () => void;
}

export function ContactsList({
  contacts,
  onSelectContact,
  selectedContactId,
  activeGroupColor,
  connections = new Map(),
  highlightedContactId,
  onHighlightContact,
  onBackToMap,
}: ContactsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'country' | 'connections'>('name');

  // Get connection count for a contact
  const getConnectionCount = (contactId: string) => {
    return connections.get(contactId)?.length || 0;
  };

  // Check if contact is connected to highlighted contact
  const isConnectedToHighlighted = (contactId: string) => {
    if (!highlightedContactId) return true;
    if (contactId === highlightedContactId) return true;
    const highlightedConnections = connections.get(highlightedContactId) || [];
    return highlightedConnections.includes(contactId);
  };

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    let result = contacts;

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.location.city?.toLowerCase().includes(query) ||
        c.location.country?.toLowerCase().includes(query) ||
        c.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') {
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      } else if (sortBy === 'country') {
        return (a.location.country || '').localeCompare(b.location.country || '');
      } else if (sortBy === 'connections') {
        return getConnectionCount(b.id) - getConnectionCount(a.id);
      }
      return 0;
    });

    return result;
  }, [contacts, searchQuery, sortBy, connections]);

  // Group contacts by first letter or country
  const groupedContacts = useMemo(() => {
    const groups: Record<string, Contact[]> = {};
    
    filteredContacts.forEach(contact => {
      let key: string;
      if (sortBy === 'country') {
        key = contact.location.country || 'Unknown';
      } else {
        key = (contact.firstName[0] || '?').toUpperCase();
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(contact);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredContacts, sortBy]);

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Header */}
      <div className="p-4 border-b border-neutral-100">
        <h2 className="text-lg font-semibold text-neutral-800 mb-3">Contacts</h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>

        {/* Sort options */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Sort by:</span>
          {(['name', 'country', 'connections'] as const).map(option => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium transition-colors',
                sortBy === option
                  ? 'bg-accent text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>

        {/* Connection highlight indicator */}
        {highlightedContactId && (
          <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
            <Link2 className="w-3 h-3" />
            <span>Showing connections for selected contact</span>
            <button
              onClick={() => onHighlightContact?.(null)}
              className="text-accent hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Contact count */}
      <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-100">
        <span className="text-xs text-neutral-500">
          {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Contacts list */}
      <div className="flex-1 overflow-y-auto">
        {groupedContacts.map(([groupKey, groupContacts]) => (
          <div key={groupKey}>
            {/* Group header */}
            <div className="sticky top-0 px-4 py-2 bg-neutral-50 border-b border-neutral-100">
              <span className="text-xs font-semibold text-neutral-500">{groupKey}</span>
              <span className="text-xs text-neutral-400 ml-2">({groupContacts.length})</span>
            </div>

            {/* Contacts in group */}
            {groupContacts.map(contact => {
              const isConnected = isConnectedToHighlighted(contact.id);
              const connectionCount = getConnectionCount(contact.id);
              const isSelected = contact.id === selectedContactId;
              const isHighlighted = contact.id === highlightedContactId;

              return (
                <div
                  key={contact.id}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 border-b border-neutral-50 cursor-pointer transition-all',
                    isSelected ? 'bg-accent/10' : 'hover:bg-neutral-50',
                    !isConnected && highlightedContactId && 'opacity-30'
                  )}
                  onClick={() => onSelectContact(contact)}
                >
                  {/* Avatar */}
                  <div 
                    className={cn(
                      'relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0',
                      isHighlighted && 'ring-2 ring-accent ring-offset-1'
                    )}
                    style={{ 
                      border: activeGroupColor ? `2px solid ${activeGroupColor}` : undefined 
                    }}
                  >
                    {contact.photoUrl ? (
                      <img src={contact.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent-light to-accent flex items-center justify-center text-white text-xs font-medium">
                        {getInitials(contact.firstName, contact.lastName)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-neutral-800 truncate">
                        {contact.firstName} {contact.lastName}
                      </span>
                      {connectionCount > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-neutral-400">
                          <Link2 className="w-2.5 h-2.5" />
                          {connectionCount}
                        </span>
                      )}
                    </div>
                    {(contact.location.city || contact.location.country) && (
                      <p className="text-xs text-neutral-500 truncate">
                        {[contact.location.city, contact.location.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Connection toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onHighlightContact?.(highlightedContactId === contact.id ? null : contact.id);
                    }}
                    className={cn(
                      'p-1.5 rounded-full transition-colors',
                      isHighlighted
                        ? 'bg-accent text-white'
                        : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600'
                    )}
                    title="Show connections"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </button>

                  <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
                </div>
              );
            })}
          </div>
        ))}

        {filteredContacts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
            <Users className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No contacts found</p>
          </div>
        )}
      </div>

      {/* Map button - bottom right */}
      {onBackToMap && (
        <div className="absolute bottom-6 right-4">
          <button
            onClick={onBackToMap}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/95 backdrop-blur-sm border border-neutral-200 shadow-lg hover:bg-neutral-50 transition-colors text-neutral-700 text-sm font-medium"
          >
            <MapIcon className="w-4 h-4" />
            Map
          </button>
        </div>
      )}
    </div>
  );
}
