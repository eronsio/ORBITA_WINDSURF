'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ProfilePanel } from '@/components/ProfilePanel';
import { ImportButton } from '@/components/ImportButton';
import { UnifiedSearch } from '@/components/UnifiedSearch';
import { AuthButton } from '@/components/AuthButton';
import { ProfileSetup } from '@/components/ProfileSetup';
import { GroupsPanel } from '@/components/GroupsPanel';
import { ChatView } from '@/components/ChatView';
import { Navigation, type ViewMode } from '@/components/Navigation';
import { Logo } from '@/components/Logo';
import { ToastProvider, useToast } from '@/components/Toast';
import { 
  fetchContacts, 
  createContact, 
  updateContact as updateContactDb, 
  createContacts,
  uploadProfileImage 
} from '@/lib/supabase/contacts';
import {
  fetchDiscoverableProfiles,
  profileToContact,
} from '@/lib/supabase/profiles';
import {
  fetchGroupsWithCounts,
  createGroup,
  deleteGroup,
  fetchAllContactGroups,
} from '@/lib/supabase/groups';
import { getUnreadCount } from '@/lib/supabase/chat';
import { matchesSearch } from '@/lib/utils';
import type { Contact } from '@/types/contact';
import type { Group } from '@/types/group';

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
  const [communityProfiles, setCommunityProfiles] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  
  // New state for groups, chat, and navigation
  const [activeView, setActiveView] = useState<ViewMode>('map');
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [contactGroupsMap, setContactGroupsMap] = useState<Map<string, string[]>>(new Map());
  const [showGroupsPanel, setShowGroupsPanel] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  
  const { showToast } = useToast();

  // Load all data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadContacts();
      loadCommunityProfiles();
      loadGroups();
      loadContactGroups();
      loadUnreadCount();
    } else {
      setContacts([]);
      setCommunityProfiles([]);
      setGroups([]);
      setContactGroupsMap(new Map());
      setUnreadChatCount(0);
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

  const loadCommunityProfiles = async () => {
    const { data, error } = await fetchDiscoverableProfiles();
    if (error) {
      console.error('Failed to load community profiles:', error);
    } else if (data) {
      setCommunityProfiles(data.map(profileToContact));
    }
  };

  const loadGroups = async () => {
    const { data, error } = await fetchGroupsWithCounts();
    if (error) {
      console.error('Failed to load groups:', error);
    } else if (data) {
      setGroups(data);
    }
  };

  const loadContactGroups = async () => {
    const { data, error } = await fetchAllContactGroups();
    if (error) {
      console.error('Failed to load contact groups:', error);
    } else if (data) {
      setContactGroupsMap(data);
    }
  };

  const loadUnreadCount = async () => {
    const { count } = await getUnreadCount();
    setUnreadChatCount(count);
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

  // Group handlers
  const handleCreateGroup = useCallback(async (group: Partial<Group>) => {
    const { data, error } = await createGroup(group);
    if (error) {
      showToast(`Failed to create group: ${error}`, 'error');
    } else if (data) {
      setGroups(prev => [...prev, data]);
      showToast(`Created "${data.name}"`, 'success');
    }
  }, [showToast]);

  const handleDeleteGroup = useCallback(async (id: string) => {
    const { error } = await deleteGroup(id);
    if (error) {
      showToast(`Failed to delete group: ${error}`, 'error');
    } else {
      setGroups(prev => prev.filter(g => g.id !== id));
      if (activeGroupId === id) {
        setActiveGroupId(null);
      }
    }
  }, [activeGroupId, showToast]);

  const handleUpdateGroup = useCallback(async (id: string, updates: Partial<Group>) => {
    // For now, just update locally - can add API call later
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  }, []);

  // Combine personal contacts with community profiles
  const allPeople = useMemo(() => {
    const contactEmails = new Set(contacts.map(c => c.email?.toLowerCase()).filter(Boolean));
    const uniqueCommunity = communityProfiles.filter(c => !c.email || !contactEmails.has(c.email.toLowerCase()));
    return [...contacts, ...uniqueCommunity];
  }, [contacts, communityProfiles]);

  // Filter by active group
  const filteredByGroup = useMemo(() => {
    if (!activeGroupId) return allPeople;
    return allPeople.filter(c => {
      const groups = contactGroupsMap.get(c.id) || [];
      return groups.includes(activeGroupId);
    });
  }, [allPeople, activeGroupId, contactGroupsMap]);

  // Filter for map (only those with valid locations)
  const allPeopleOnMap = useMemo(() => {
    return filteredByGroup.filter(c => c.location.lat !== 0 || c.location.lng !== 0);
  }, [filteredByGroup]);

  const filteredIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    return new Set(
      allPeopleOnMap
        .filter((contact) => matchesSearch(contact, searchQuery))
        .map((c) => c.id)
    );
  }, [searchQuery, allPeopleOnMap]);

  const hasActiveSearch = searchQuery.trim().length > 0;

  // Get active group name for navigation
  const activeGroupName = useMemo(() => {
    if (!activeGroupId) return undefined;
    return groups.find(g => g.id === activeGroupId)?.name;
  }, [activeGroupId, groups]);

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <Map
        contacts={allPeopleOnMap}
        filteredIds={filteredIds}
        hasActiveSearch={hasActiveSearch}
        onSelectContact={setSelectedContact}
        selectedContactId={selectedContact?.id}
      />

      {/* Chat view - full screen when active */}
      {activeView === 'chat' && isAuthenticated && (
        <div className="absolute inset-0 z-[1100] bg-white">
          <ChatView
            onBack={() => setActiveView('map')}
          />
        </div>
      )}

      {/* Map UI elements - only show when map is active */}
      {activeView === 'map' && (
        <>
          {/* Unified search bar */}
          <UnifiedSearch
            contacts={filteredByGroup}
            onSearch={setSearchQuery}
            onSelectContact={setSelectedContact}
            onAddPerson={handleAddPerson}
            onInvite={handleInvite}
          />

          {/* Auth + Import + Profile buttons - top-right */}
          <div className="absolute top-4 right-4 z-[900] flex items-center gap-2">
            {isAuthenticated && (
              <>
                <button
                  onClick={() => setShowProfileSetup(true)}
                  className="px-3 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-neutral-200 shadow-sm hover:bg-neutral-50 transition-colors text-neutral-700 text-sm font-medium"
                >
                  My Profile
                </button>
                <ImportButton onImport={handleImport} onError={handleImportError} />
              </>
            )}
            <AuthButton onAuthChange={handleAuthChange} />
          </div>

          {/* Loading indicator */}
          {loading && isAuthenticated && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000]">
              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm text-sm text-neutral-500">
                Loading...
              </div>
            </div>
          )}
        </>
      )}

      {/* Logo - bottom-left, always visible */}
      <div className="absolute bottom-20 left-4 z-[900] opacity-60 hover:opacity-90 transition-opacity">
        <Logo height={24} className="text-neutral-700" />
      </div>

      {/* Navigation bar - bottom center */}
      {isAuthenticated && (
        <Navigation
          activeView={activeView}
          onViewChange={setActiveView}
          unreadCount={unreadChatCount}
          onGroupsClick={() => setShowGroupsPanel(true)}
          activeGroupName={activeGroupName}
        />
      )}

      {/* Welcome message for unauthenticated users */}
      {!isAuthenticated && !loading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[500] text-center">
          <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-sm">
            <Logo height={36} className="text-neutral-800 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-neutral-800 mb-2">
              Welcome to Orbita
            </h1>
            <p className="text-neutral-600 text-sm mb-4">
              Your relationship landscape. See who matters, where they are, and stay intentionally connected.
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

      {/* Groups panel */}
      <GroupsPanel
        isOpen={showGroupsPanel}
        onClose={() => setShowGroupsPanel(false)}
        groups={groups}
        activeGroupId={activeGroupId}
        onSelectGroup={setActiveGroupId}
        onCreateGroup={handleCreateGroup}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
      />

      {/* Profile setup modal */}
      <ProfileSetup
        isOpen={showProfileSetup}
        onClose={() => setShowProfileSetup(false)}
        onSaved={() => {
          loadCommunityProfiles();
          showToast('Profile saved! Others can now find you.', 'success');
        }}
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
