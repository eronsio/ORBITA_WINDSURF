import { createClient } from './client';

export interface Profile {
  id: string;
  display_name: string;
  email: string | null;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
  bio: string | null;
  photo_url: string | null;
  tags: string[];
  languages: string[];
  social_links: { platform: string; url: string }[];
  is_discoverable: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch current user's profile
export async function fetchMyProfile(): Promise<{ data: Profile | null; error: string | null }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) {
    // Profile might not exist yet
    if (error.code === 'PGRST116') {
      return { data: null, error: null };
    }
    return { data: null, error: error.message };
  }
  
  return { data: data as Profile, error: null };
}

// Update current user's profile
export async function updateMyProfile(updates: Partial<Profile>): Promise<{ data: Profile | null; error: string | null }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();
  
  if (error) {
    return { data: null, error: error.message };
  }
  
  return { data: data as Profile, error: null };
}

// Create profile if it doesn't exist
export async function createMyProfile(profile: Partial<Profile>): Promise<{ data: Profile | null; error: string | null }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      display_name: profile.display_name || user.email?.split('@')[0] || 'Anonymous',
      email: profile.email || user.email,
      ...profile,
    })
    .select()
    .single();
  
  if (error) {
    return { data: null, error: error.message };
  }
  
  return { data: data as Profile, error: null };
}

// Search discoverable profiles
export async function searchProfiles(query: string): Promise<{ data: Profile[] | null; error: string | null }> {
  const supabase = createClient();
  
  if (!query.trim()) {
    return { data: [], error: null };
  }
  
  const searchTerm = `%${query.trim().toLowerCase()}%`;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_discoverable', true)
    .or(`display_name.ilike.${searchTerm},city.ilike.${searchTerm},country.ilike.${searchTerm}`)
    .limit(10);
  
  if (error) {
    return { data: null, error: error.message };
  }
  
  return { data: data as Profile[], error: null };
}

// Fetch all discoverable profiles (for showing on map)
export async function fetchDiscoverableProfiles(): Promise<{ data: Profile[] | null; error: string | null }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_discoverable', true);
  
  if (error) {
    return { data: null, error: error.message };
  }
  
  return { data: data as Profile[], error: null };
}

// Convert profile to contact format for display on map
export function profileToContact(profile: Profile) {
  return {
    id: `profile-${profile.id}`,
    firstName: profile.display_name.split(' ')[0] || profile.display_name,
    lastName: profile.display_name.split(' ').slice(1).join(' ') || '',
    email: profile.email || undefined,
    photoUrl: profile.photo_url || undefined,
    location: {
      lat: profile.lat || 0,
      lng: profile.lng || 0,
      city: profile.city || '',
      country: profile.country || '',
    },
    bio: profile.bio || undefined,
    tags: profile.tags || [],
    languages: profile.languages || [],
    socialLinks: profile.social_links || [],
    attributes: {},
    status: 'active' as const,
    createdAt: profile.created_at,
    isProfile: true, // Flag to identify this is a user profile, not a contact
    profileId: profile.id,
  };
}
