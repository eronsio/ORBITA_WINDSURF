'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ProfilePanel } from '@/components/ProfilePanel';
import { ImportButton } from '@/components/ImportButton';
import { UnifiedSearch } from '@/components/UnifiedSearch';
import { AuthButton } from '@/components/AuthButton';
import { Logo } from '@/components/Logo';
import { ToastProvider, useToast } from '@/components/Toast';
import { 
  fetchContacts, 
  createContact, 
  updateContact as updateContactDb, 
  createContacts,
  uploadProfileImage 
} from '@/lib/supabase/contacts';
import { matchesSearch } from '@/lib/utils';
import type { Contact } from '@/types/contact';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-neutral-50 flex items-center justify-center">
      <div className="text-neutral-400">Loading map...</div>
    </div>
  ),
});

function HomeContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Load contacts when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadContacts();
    } else {
      setContacts([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadContacts = async () => {
    setLoading(true);
    const { data, error } = await fetchContacts();
    if (error) {
      showToast(`Failed to load contacts: ${error}`, 'error');
    } else if (data) {
      setContacts(data);
    }
    setLoading(false);
  };

  const handleAuthChange = useCallback((user: any) => {
    setIsAuthenticated(!!user);
  }, []);

  const handleImport = useCallback(async (newContacts: Contact[]) => {
    if (!isAuthenticated) {
      showToast('Please sign in to import contacts', 'error');
      return;
    }

    const { data, error, count } = await createContacts(newContacts);
    if (error) {
      showToast(`Import failed: ${error}`, 'error');
    } else if (data) {
      setContacts(prev => [...data, ...prev]);
      showToast(`Imported ${count} contact${count === 1 ? '' : 's'}`, 'success');
    }
  }, [isAuthenticated, showToast]);

  const handleImportError = useCallback((error: string) => {
    showToast(error, 'error');
  }, [showToast]);

  const handleAddPerson = useCallback(async (newContact: Contact) => {
    if (!isAuthenticated) {
      showToast('Please sign in to add contacts', 'error');
      return;
    }

    const { data, error } = await createContact(newContact);
    if (error) {
      showToast(`Failed to add contact: ${error}`, 'error');
    } else if (data) {
      setContacts(prev => [data, ...prev]);
      showToast(`Added ${data.firstName} ${data.lastName}`, 'success');
    }
  }, [isAuthenticated, showToast]);

  const handleInvite = useCallback(async (email: string, name?: string) => {
    if (!isAuthenticated) {
      showToast('Please sign in to invite people', 'error');
      return;
    }

    const newContact: Partial<Contact> = {
      firstName: name || email.split('@')[0],
      lastName: '',
      location: { lat: 0, lng: 0, city: '', country: '' },
      tags: [],
      languages: [],
      socialLinks: [],
      attributes: {},
      status: 'invited',
      inviteEmail: email,
    };

    const { data, error } = await createContact(newContact);
    if (error) {
      showToast(`Failed to send invite: ${error}`, 'error');
    } else if (data) {
      setContacts(prev => [data, ...prev]);
      showToast(`Invite sent to ${email}`, 'success');
    }
  }, [isAuthenticated, showToast]);

  const handleUpdateContact = useCallback(async (updatedContact: Contact) => {
    if (!isAuthenticated) {
      showToast('Please sign in to edit contacts', 'error');
      return;
    }

    // Optimistic update
    setContacts(prev => 
      prev.map(c => c.id === updatedContact.id ? updatedContact : c)
    );
    setSelectedContact(updatedContact);

    // Persist to database
    const { error } = await updateContactDb(updatedContact.id, updatedContact);
    if (error) {
      showToast(`Failed to save changes: ${error}`, 'error');
      // Reload contacts to get correct state
      loadContacts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, showToast]);

  const handlePhotoUpload = useCallback(async (contactId: string, file: File) => {
    if (!isAuthenticated) {
      showToast('Please sign in to upload photos', 'error');
      return;
    }

    const { url, error } = await uploadProfileImage(file, contactId);
    if (error) {
      showToast(`Failed to upload photo: ${error}`, 'error');
      return;
    }

    if (url) {
      const { error: updateError } = await updateContactDb(contactId, { photoUrl: url });
      if (updateError) {
        showToast(`Failed to save photo: ${updateError}`, 'error');
      } else {
        setContacts(prev => 
          prev.map(c => c.id === contactId ? { ...c, photoUrl: url } : c)
        );
        if (selectedContact?.id === contactId) {
          setSelectedContact(prev => prev ? { ...prev, photoUrl: url } : null);
        }
        showToast('Photo uploaded', 'success');
      }
    }
  }, [isAuthenticated, selectedContact, showToast]);

  // Filter contacts that have valid locations for the map
  const mappableContacts = useMemo(() => {
    return contacts.filter(c => c.location.lat !== 0 || c.location.lng !== 0);
  }, [contacts]);

  const filteredIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    return new Set(
      mappableContacts
        .filter((contact) => matchesSearch(contact, searchQuery))
        .map((c) => c.id)
    );
  }, [searchQuery, mappableContacts]);

  const hasActiveSearch = searchQuery.trim().length > 0;

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <Map
        contacts={mappableContacts}
        filteredIds={filteredIds}
        hasActiveSearch={hasActiveSearch}
        onSelectContact={setSelectedContact}
        selectedContactId={selectedContact?.id}
      />

      {/* Unified search bar - handles search, find, add, invite */}
      <UnifiedSearch
        contacts={contacts}
        onSearch={setSearchQuery}
        onSelectContact={setSelectedContact}
        onAddPerson={handleAddPerson}
        onInvite={handleInvite}
      />

      {/* Logo - subtle, bottom-left */}
      <div className="absolute bottom-4 left-4 z-[1000] opacity-50 hover:opacity-80 transition-opacity">
        <Logo height={20} className="text-neutral-500" />
      </div>

      {/* Auth + Import buttons - top-right */}
      <div className="absolute top-4 right-4 z-[900] flex items-center gap-2">
        {isAuthenticated && (
          <ImportButton onImport={handleImport} onError={handleImportError} />
        )}
        <AuthButton onAuthChange={handleAuthChange} />
      </div>

      {/* Loading indicator */}
      {loading && isAuthenticated && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm text-sm text-neutral-500">
            Loading contacts...
          </div>
        </div>
      )}

      {/* Welcome message for unauthenticated users */}
      {!isAuthenticated && !loading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[500] text-center">
          <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-sm">
            <Logo height={32} className="text-neutral-800 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-neutral-800 mb-2">
              Welcome to Orbita
            </h1>
            <p className="text-neutral-600 text-sm mb-4">
              Your personal map of people and places. Sign in to start adding your contacts.
            </p>
            <p className="text-neutral-400 text-xs">
              Click &quot;Sign in&quot; in the top right to get started
            </p>
          </div>
        </div>
      )}

      <ProfilePanel
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        onUpdate={handleUpdateContact}
        onPhotoUpload={handlePhotoUpload}
      />
    </main>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <HomeContent />
    </ToastProvider>
  );
}
