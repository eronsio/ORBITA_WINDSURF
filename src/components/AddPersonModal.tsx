'use client';

import { useState, useCallback, useMemo } from 'react';
import { X, UserPlus, Mail, MapPin, Search, User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Contact } from '@/types/contact';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPerson: (contact: Contact) => void;
  existingContacts: Contact[];
}

type AddMode = 'search' | 'invite' | 'placeholder';

interface LocationSuggestion {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

// Common city locations for quick selection
const COMMON_LOCATIONS: LocationSuggestion[] = [
  { city: 'San Francisco', country: 'USA', lat: 37.7749, lng: -122.4194 },
  { city: 'New York', country: 'USA', lat: 40.7128, lng: -74.006 },
  { city: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
  { city: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405 },
  { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { city: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
  { city: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333 },
];

export function AddPersonModal({
  isOpen,
  onClose,
  onAddPerson,
  existingContacts,
}: AddPersonModalProps) {
  const [mode, setMode] = useState<AddMode>('search');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Search existing contacts
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    
    const query = searchQuery.toLowerCase();
    return existingContacts.filter(contact => {
      const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
      const email = contact.email?.toLowerCase() || '';
      return fullName.includes(query) || email.includes(query);
    }).slice(0, 5);
  }, [searchQuery, existingContacts]);

  // Check for potential duplicates
  const potentialDuplicate = useMemo(() => {
    if (!firstName.trim()) return null;
    
    const query = `${firstName} ${lastName}`.toLowerCase().trim();
    return existingContacts.find(contact => {
      const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
      return fullName === query || (email && contact.email?.toLowerCase() === email.toLowerCase());
    });
  }, [firstName, lastName, email, existingContacts]);

  const resetForm = useCallback(() => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setCity('');
    setCountry('');
    setLat(null);
    setLng(null);
    setSearchQuery('');
    setMode('search');
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSelectLocation = useCallback((location: LocationSuggestion) => {
    setCity(location.city);
    setCountry(location.country);
    setLat(location.lat);
    setLng(location.lng);
  }, []);

  const handleInvite = useCallback(() => {
    if (!firstName.trim() || !email.trim()) return;

    const newContact: Contact = {
      id: crypto.randomUUID(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      location: {
        lat: lat || 0,
        lng: lng || 0,
        city: city.trim(),
        country: country.trim(),
      },
      tags: [],
      languages: [],
      socialLinks: [],
      attributes: {},
      status: 'invited',
      inviteEmail: email.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddPerson(newContact);
    handleClose();
  }, [firstName, lastName, email, city, country, lat, lng, onAddPerson, handleClose]);

  const handleAddPlaceholder = useCallback(() => {
    if (!firstName.trim() || !city.trim()) return;

    const newContact: Contact = {
      id: crypto.randomUUID(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      location: {
        lat: lat || 0,
        lng: lng || 0,
        city: city.trim(),
        country: country.trim(),
      },
      tags: [],
      languages: [],
      socialLinks: [],
      attributes: {},
      status: 'unclaimed',
      createdAt: new Date().toISOString(),
    };

    onAddPerson(newContact);
    handleClose();
  }, [firstName, lastName, city, country, lat, lng, onAddPerson, handleClose]);

  const canInvite = firstName.trim() && email.trim();
  const canAddPlaceholder = firstName.trim() && city.trim() && lat !== null && lng !== null;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-[1100] animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[1101] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto',
            'animate-fade-in'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-accent" />
              Add Person
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Mode tabs */}
            <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg">
              <button
                onClick={() => setMode('search')}
                className={cn(
                  'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                  mode === 'search'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                )}
              >
                <Search className="w-4 h-4 inline mr-1.5" />
                Find
              </button>
              <button
                onClick={() => setMode('invite')}
                className={cn(
                  'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                  mode === 'invite'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                )}
              >
                <Mail className="w-4 h-4 inline mr-1.5" />
                Invite
              </button>
              <button
                onClick={() => setMode('placeholder')}
                className={cn(
                  'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                  mode === 'placeholder'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                )}
              >
                <User className="w-4 h-4 inline mr-1.5" />
                Add
              </button>
            </div>

            {/* Search mode */}
            {mode === 'search' && (
              <div className="space-y-3">
                <p className="text-sm text-neutral-500">
                  Search for someone already on the map
                </p>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className={cn(
                    'w-full px-4 py-2.5 rounded-lg border border-neutral-200',
                    'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent',
                    'placeholder:text-neutral-400'
                  )}
                  autoFocus
                />
                
                {searchResults.length > 0 && (
                  <div className="space-y-1">
                    {searchResults.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-medium">
                          {contact.firstName[0]}{contact.lastName?.[0] || ''}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-900 truncate">
                            {contact.firstName} {contact.lastName}
                          </p>
                          <p className="text-sm text-neutral-500 truncate">
                            {contact.location.city}, {contact.location.country}
                          </p>
                        </div>
                        {contact.status === 'unclaimed' && (
                          <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                            Unclaimed
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="text-center py-6 text-neutral-500">
                    <p className="text-sm">No one found</p>
                    <button
                      onClick={() => setMode('invite')}
                      className="mt-2 text-sm text-accent hover:underline"
                    >
                      Invite them instead →
                    </button>
                  </div>
                )}

                {searchQuery.length < 2 && (
                  <div className="text-center py-6 text-neutral-400 text-sm">
                    Type at least 2 characters to search
                  </div>
                )}
              </div>
            )}

            {/* Invite mode */}
            {mode === 'invite' && (
              <div className="space-y-4">
                <p className="text-sm text-neutral-500">
                  Invite someone to add themselves to the map
                </p>

                {/* Name fields */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name *"
                    className={cn(
                      'flex-1 px-4 py-2.5 rounded-lg border border-neutral-200',
                      'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent',
                      'placeholder:text-neutral-400'
                    )}
                    autoFocus
                  />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className={cn(
                      'flex-1 px-4 py-2.5 rounded-lg border border-neutral-200',
                      'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent',
                      'placeholder:text-neutral-400'
                    )}
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address *"
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200',
                      'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent',
                      'placeholder:text-neutral-400'
                    )}
                  />
                </div>

                {/* Duplicate warning */}
                {potentialDuplicate && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                    <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-amber-800 font-medium">
                        {potentialDuplicate.firstName} {potentialDuplicate.lastName} may already exist
                      </p>
                      <p className="text-amber-600 text-xs mt-0.5">
                        {potentialDuplicate.location.city}, {potentialDuplicate.location.country}
                      </p>
                    </div>
                  </div>
                )}

                {/* Info */}
                <p className="text-xs text-neutral-400">
                  They'll receive an invite to complete their profile and pin themselves on the map.
                </p>

                {/* Submit */}
                <button
                  onClick={handleInvite}
                  disabled={!canInvite}
                  className={cn(
                    'w-full py-2.5 rounded-lg font-medium transition-colors',
                    canInvite
                      ? 'bg-accent text-white hover:bg-accent-dark'
                      : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                  )}
                >
                  Send Invite
                </button>
              </div>
            )}

            {/* Placeholder mode */}
            {mode === 'placeholder' && (
              <div className="space-y-4">
                <p className="text-sm text-neutral-500">
                  Add someone as a placeholder — they can claim their pin later
                </p>

                {/* Name fields */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name *"
                    className={cn(
                      'flex-1 px-4 py-2.5 rounded-lg border border-neutral-200',
                      'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent',
                      'placeholder:text-neutral-400'
                    )}
                    autoFocus
                  />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className={cn(
                      'flex-1 px-4 py-2.5 rounded-lg border border-neutral-200',
                      'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent',
                      'placeholder:text-neutral-400'
                    )}
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location *
                  </label>
                  
                  {/* Quick location buttons */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {COMMON_LOCATIONS.slice(0, 6).map((loc) => (
                      <button
                        key={`${loc.city}-${loc.country}`}
                        onClick={() => handleSelectLocation(loc)}
                        className={cn(
                          'px-2.5 py-1 text-xs rounded-full border transition-colors',
                          city === loc.city && country === loc.country
                            ? 'bg-accent text-white border-accent'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-accent hover:text-accent'
                        )}
                      >
                        {loc.city}
                      </button>
                    ))}
                  </div>

                  {/* Custom location */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg border border-neutral-200 text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent',
                        'placeholder:text-neutral-400'
                      )}
                    />
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Country"
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg border border-neutral-200 text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent',
                        'placeholder:text-neutral-400'
                      )}
                    />
                  </div>

                  {/* Coordinates (hidden but required) */}
                  {city && !lat && (
                    <p className="text-xs text-amber-600 mt-2">
                      Select a city from the buttons above, or coordinates will default to 0,0
                    </p>
                  )}
                </div>

                {/* Duplicate warning */}
                {potentialDuplicate && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                    <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-amber-800 font-medium">
                        {potentialDuplicate.firstName} {potentialDuplicate.lastName} may already exist
                      </p>
                      <p className="text-amber-600 text-xs mt-0.5">
                        {potentialDuplicate.location.city}, {potentialDuplicate.location.country}
                      </p>
                    </div>
                  </div>
                )}

                {/* Info */}
                <p className="text-xs text-neutral-400">
                  This creates an unclaimed pin. The person can claim it when they join.
                </p>

                {/* Submit */}
                <button
                  onClick={handleAddPlaceholder}
                  disabled={!canAddPlaceholder}
                  className={cn(
                    'w-full py-2.5 rounded-lg font-medium transition-colors',
                    canAddPlaceholder
                      ? 'bg-neutral-800 text-white hover:bg-neutral-900'
                      : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                  )}
                >
                  Add Placeholder
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
