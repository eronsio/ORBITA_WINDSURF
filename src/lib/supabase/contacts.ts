import { createClient } from './client';
import type { DbContact, DbContactInsert, DbContactUpdate } from './types';
import type { Contact, SocialLink } from '@/types/contact';

// Convert database contact to app contact
export function dbToContact(db: DbContact): Contact {
  return {
    id: db.id,
    firstName: db.first_name,
    lastName: db.last_name || '',
    email: db.email || undefined,
    photoUrl: db.photo_url || undefined,
    location: {
      lat: db.lat || 0,
      lng: db.lng || 0,
      city: db.city || '',
      country: db.country || '',
    },
    birthYear: db.birth_year || undefined,
    bio: db.bio || undefined,
    tags: db.tags || [],
    languages: db.languages || [],
    socialLinks: (db.social_links || []) as SocialLink[],
    attributes: db.attributes || {},
    status: db.status || 'active',
    inviteEmail: db.invite_email || undefined,
    createdAt: db.created_at,
  };
}

// Convert app contact to database insert format
export function contactToDbInsert(contact: Partial<Contact>, userId: string): DbContactInsert {
  return {
    owner_user_id: userId,
    first_name: contact.firstName || '',
    last_name: contact.lastName || '',
    email: contact.email || null,
    city: contact.location?.city || '',
    country: contact.location?.country || '',
    lat: contact.location?.lat || null,
    lng: contact.location?.lng || null,
    birth_year: contact.birthYear || null,
    bio: contact.bio || null,
    photo_url: contact.photoUrl || null,
    tags: contact.tags || [],
    languages: contact.languages || [],
    social_links: contact.socialLinks || [],
    attributes: contact.attributes || {},
    status: contact.status || 'active',
    invite_email: contact.inviteEmail || null,
  };
}

// Convert app contact to database update format
export function contactToDbUpdate(contact: Partial<Contact>): DbContactUpdate {
  const update: DbContactUpdate = {};
  
  if (contact.firstName !== undefined) update.first_name = contact.firstName;
  if (contact.lastName !== undefined) update.last_name = contact.lastName;
  if (contact.email !== undefined) update.email = contact.email || null;
  if (contact.location) {
    update.city = contact.location.city;
    update.country = contact.location.country;
    update.lat = contact.location.lat || null;
    update.lng = contact.location.lng || null;
  }
  if (contact.birthYear !== undefined) update.birth_year = contact.birthYear || null;
  if (contact.bio !== undefined) update.bio = contact.bio || null;
  if (contact.photoUrl !== undefined) update.photo_url = contact.photoUrl || null;
  if (contact.tags !== undefined) update.tags = contact.tags;
  if (contact.languages !== undefined) update.languages = contact.languages;
  if (contact.socialLinks !== undefined) update.social_links = contact.socialLinks;
  if (contact.attributes !== undefined) update.attributes = contact.attributes;
  if (contact.status !== undefined) update.status = contact.status;
  if (contact.inviteEmail !== undefined) update.invite_email = contact.inviteEmail || null;
  
  return update;
}

// Fetch all contacts for the current user
export async function fetchContacts(): Promise<{ data: Contact[] | null; error: string | null }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching contacts:', error);
    return { data: null, error: error.message };
  }
  
  return { data: (data as DbContact[]).map(dbToContact), error: null };
}

// Create a new contact
export async function createContact(contact: Partial<Contact>): Promise<{ data: Contact | null; error: string | null }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }
  
  const dbInsert = contactToDbInsert(contact, user.id);
  
  const { data, error } = await supabase
    .from('contacts')
    .insert(dbInsert)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating contact:', error);
    return { data: null, error: error.message };
  }
  
  return { data: dbToContact(data as DbContact), error: null };
}

// Update an existing contact
export async function updateContact(id: string, updates: Partial<Contact>): Promise<{ data: Contact | null; error: string | null }> {
  const supabase = createClient();
  
  const dbUpdate = contactToDbUpdate(updates);
  
  const { data, error } = await supabase
    .from('contacts')
    .update(dbUpdate)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating contact:', error);
    return { data: null, error: error.message };
  }
  
  return { data: dbToContact(data as DbContact), error: null };
}

// Delete a contact
export async function deleteContact(id: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting contact:', error);
    return { error: error.message };
  }
  
  return { error: null };
}

// Bulk create contacts (for import)
export async function createContacts(contacts: Partial<Contact>[]): Promise<{ data: Contact[] | null; error: string | null; count: number }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated', count: 0 };
  }
  
  const dbInserts = contacts.map(c => contactToDbInsert(c, user.id));
  
  const { data, error } = await supabase
    .from('contacts')
    .insert(dbInserts)
    .select();
  
  if (error) {
    console.error('Error creating contacts:', error);
    return { data: null, error: error.message, count: 0 };
  }
  
  const created = (data as DbContact[]).map(dbToContact);
  return { data: created, error: null, count: created.length };
}

// Upload profile image to Supabase Storage
export async function uploadProfileImage(file: File, contactId: string): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { url: null, error: 'Not authenticated' };
  }
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${contactId}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true });
  
  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    return { url: null, error: uploadError.message };
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);
  
  return { url: publicUrl, error: null };
}
