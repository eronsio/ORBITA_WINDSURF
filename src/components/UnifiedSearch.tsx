'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, X, UserPlus, Mail, MapPin, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Contact } from '@/types/contact';

interface UnifiedSearchProps {
  contacts: Contact[];
  onSearch: (query: string) => void;
  onSelectContact: (contact: Contact) => void;
  onAddPerson: (contact: Contact) => void;
  onInvite: (email: string, name?: string) => void;
}

// Common locations for quick add
const QUICK_LOCATIONS = [
  { city: 'San Francisco', country: 'USA', lat: 37.7749, lng: -122.4194 },
  { city: 'New York', country: 'USA', lat: 40.7128, lng: -74.006 },
  { city: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
  { city: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405 },
  { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
];

function isEmail(text: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}

function parseName(text: string): { firstName: string; lastName: string } {
  const parts = text.trim().split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
  };
}

export function UnifiedSearch({
  contacts,
  onSearch,
  onSelectContact,
  onAddPerson,
  onInvite,
}: UnifiedSearchProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [pendingName, setPendingName] = useState<{ firstName: string; lastName: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
        setShowLocationPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for map filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  // Search results - people on the map
  const matchingContacts = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    
    const q = query.toLowerCase();
    return contacts.filter(contact => {
      const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
      const email = contact.email?.toLowerCase() || '';
      const city = contact.location.city.toLowerCase();
      const tags = contact.tags.join(' ').toLowerCase();
      return fullName.includes(q) || email.includes(q) || city.includes(q) || tags.includes(q);
    }).slice(0, 5);
  }, [query, contacts]);

  const showDropdown = isFocused && query.length >= 2;
  const queryIsEmail = isEmail(query);
  const hasExactMatch = matchingContacts.some(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase() === query.toLowerCase().trim()
  );

  const handleSelectContact = useCallback((contact: Contact) => {
    onSelectContact(contact);
    setQuery('');
    setIsFocused(false);
  }, [onSelectContact]);

  const handleAddNewPerson = useCallback(() => {
    const { firstName, lastName } = parseName(query);
    setPendingName({ firstName, lastName });
    setShowLocationPicker(true);
  }, [query]);

  const handleSelectLocation = useCallback((location: typeof QUICK_LOCATIONS[0]) => {
    if (!pendingName) return;
    
    const newContact: Contact = {
      id: crypto.randomUUID(),
      firstName: pendingName.firstName,
      lastName: pendingName.lastName,
      location: {
        lat: location.lat,
        lng: location.lng,
        city: location.city,
        country: location.country,
      },
      tags: [],
      languages: [],
      socialLinks: [],
      attributes: {},
      status: 'unclaimed',
      createdAt: new Date().toISOString(),
    };
    
    onAddPerson(newContact);
    setQuery('');
    setIsFocused(false);
    setShowLocationPicker(false);
    setPendingName(null);
  }, [pendingName, onAddPerson]);

  const handleInvite = useCallback(() => {
    if (queryIsEmail) {
      onInvite(query);
      setQuery('');
      setIsFocused(false);
    }
  }, [query, queryIsEmail, onInvite]);

  const handleClear = useCallback(() => {
    setQuery('');
    setShowLocationPicker(false);
    setPendingName(null);
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsFocused(false);
      setShowLocationPicker(false);
      inputRef.current?.blur();
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-[420px] z-[1000]"
    >
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search people, places, or add someone..."
          className={cn(
            'w-full pl-12 pr-10 py-3 rounded-2xl',
            'bg-white/95 backdrop-blur-sm',
            'border border-neutral-200',
            'text-neutral-800 placeholder:text-neutral-400',
            'shadow-lg shadow-black/5',
            'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent',
            'transition-all duration-200'
          )}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && !showLocationPicker && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden animate-fade-in">
          {/* Matching contacts */}
          {matchingContacts.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1.5 text-xs font-medium text-neutral-400 uppercase tracking-wide">
                On the map
              </p>
              {matchingContacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium',
                    contact.status === 'unclaimed' 
                      ? 'bg-neutral-200 text-neutral-600' 
                      : 'bg-accent/10 text-accent'
                  )}>
                    {contact.firstName[0]}{contact.lastName?.[0] || ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 truncate">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {contact.location.city}, {contact.location.country}
                    </p>
                  </div>
                  {contact.status === 'unclaimed' && (
                    <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full">
                      Unclaimed
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Divider */}
          {matchingContacts.length > 0 && <div className="border-t border-neutral-100" />}

          {/* Actions */}
          <div className="p-2">
            <p className="px-3 py-1.5 text-xs font-medium text-neutral-400 uppercase tracking-wide">
              Actions
            </p>
            
            {/* Add as new person (if not email and no exact match) */}
            {!queryIsEmail && !hasExactMatch && query.trim() && (
              <button
                onClick={handleAddNewPerson}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/5 transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-neutral-900">
                    Add <span className="font-medium">"{query.trim()}"</span>
                  </p>
                  <p className="text-xs text-neutral-500">Create a new person on the map</p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-accent transition-colors" />
              </button>
            )}

            {/* Invite by email */}
            {queryIsEmail && (
              <button
                onClick={handleInvite}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/5 transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-neutral-900">
                    Invite <span className="font-medium">{query}</span>
                  </p>
                  <p className="text-xs text-neutral-500">Send an invite to join</p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-amber-500 transition-colors" />
              </button>
            )}

            {/* No results hint */}
            {matchingContacts.length === 0 && !queryIsEmail && !query.trim() && (
              <p className="px-3 py-2 text-sm text-neutral-400">
                Type a name to search or add someone
              </p>
            )}
          </div>
        </div>
      )}

      {/* Location picker */}
      {showLocationPicker && pendingName && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-neutral-100">
            <p className="font-medium text-neutral-900">
              Where is {pendingName.firstName} {pendingName.lastName} located?
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              Select a city to place them on the map
            </p>
          </div>
          <div className="p-2 grid grid-cols-2 gap-1">
            {QUICK_LOCATIONS.map(loc => (
              <button
                key={`${loc.city}-${loc.country}`}
                onClick={() => handleSelectLocation(loc)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors text-left"
              >
                <MapPin className="w-4 h-4 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">{loc.city}</p>
                  <p className="text-xs text-neutral-500">{loc.country}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-neutral-100">
            <button
              onClick={() => {
                setShowLocationPicker(false);
                setPendingName(null);
              }}
              className="w-full px-3 py-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
