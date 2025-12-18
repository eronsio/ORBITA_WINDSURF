import { createClient } from './client';
import type { Group, GroupWithContacts } from '@/types/group';

interface DbGroup {
  id: string;
  owner_user_id: string;
  name: string;
  color: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function dbToGroup(db: DbGroup, contactCount?: number): Group {
  return {
    id: db.id,
    name: db.name,
    color: db.color,
    icon: db.icon || undefined,
    description: db.description || undefined,
    sortOrder: db.sort_order,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    contactCount,
  };
}

// Fetch all groups for the current user
export async function fetchGroups(): Promise<{ data: Group[] | null; error: string | null }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('Error fetching groups:', error);
    return { data: null, error: error.message };
  }
  
  return { data: (data as DbGroup[]).map(g => dbToGroup(g)), error: null };
}

// Fetch groups with contact counts
export async function fetchGroupsWithCounts(): Promise<{ data: Group[] | null; error: string | null }> {
  const supabase = createClient();
  
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('*')
    .order('sort_order', { ascending: true });
  
  if (groupsError) {
    return { data: null, error: groupsError.message };
  }
  
  // Get contact counts for each group
  const { data: counts, error: countsError } = await supabase
    .from('contact_groups')
    .select('group_id');
  
  if (countsError) {
    return { data: null, error: countsError.message };
  }
  
  const countMap = new Map<string, number>();
  counts?.forEach((row: { group_id: string }) => {
    countMap.set(row.group_id, (countMap.get(row.group_id) || 0) + 1);
  });
  
  return {
    data: (groups as DbGroup[]).map(g => dbToGroup(g, countMap.get(g.id) || 0)),
    error: null,
  };
}

// Create a new group
export async function createGroup(group: Partial<Group>): Promise<{ data: Group | null; error: string | null }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }
  
  const { data, error } = await supabase
    .from('groups')
    .insert({
      owner_user_id: user.id,
      name: group.name || 'New Group',
      color: group.color || '#3B82F6',
      icon: group.icon || null,
      description: group.description || null,
      sort_order: group.sortOrder || 0,
    })
    .select()
    .single();
  
  if (error) {
    return { data: null, error: error.message };
  }
  
  return { data: dbToGroup(data as DbGroup), error: null };
}

// Update a group
export async function updateGroup(id: string, updates: Partial<Group>): Promise<{ data: Group | null; error: string | null }> {
  const supabase = createClient();
  
  const dbUpdates: Partial<DbGroup> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  if (updates.icon !== undefined) dbUpdates.icon = updates.icon || null;
  if (updates.description !== undefined) dbUpdates.description = updates.description || null;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
  
  const { data, error } = await supabase
    .from('groups')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    return { data: null, error: error.message };
  }
  
  return { data: dbToGroup(data as DbGroup), error: null };
}

// Delete a group
export async function deleteGroup(id: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', id);
  
  if (error) {
    return { error: error.message };
  }
  
  return { error: null };
}

// Get contacts in a group
export async function getGroupContacts(groupId: string): Promise<{ data: string[] | null; error: string | null }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('contact_groups')
    .select('contact_id')
    .eq('group_id', groupId);
  
  if (error) {
    return { data: null, error: error.message };
  }
  
  return { data: data.map((d: { contact_id: string }) => d.contact_id), error: null };
}

// Get groups for a contact
export async function getContactGroups(contactId: string): Promise<{ data: string[] | null; error: string | null }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('contact_groups')
    .select('group_id')
    .eq('contact_id', contactId);
  
  if (error) {
    return { data: null, error: error.message };
  }
  
  return { data: data.map((d: { group_id: string }) => d.group_id), error: null };
}

// Add contact to group
export async function addContactToGroup(contactId: string, groupId: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('contact_groups')
    .insert({ contact_id: contactId, group_id: groupId });
  
  if (error && !error.message.includes('duplicate')) {
    return { error: error.message };
  }
  
  return { error: null };
}

// Remove contact from group
export async function removeContactFromGroup(contactId: string, groupId: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('contact_groups')
    .delete()
    .eq('contact_id', contactId)
    .eq('group_id', groupId);
  
  if (error) {
    return { error: error.message };
  }
  
  return { error: null };
}

// Set all groups for a contact (replaces existing)
export async function setContactGroups(contactId: string, groupIds: string[]): Promise<{ error: string | null }> {
  const supabase = createClient();
  
  // Delete existing
  const { error: deleteError } = await supabase
    .from('contact_groups')
    .delete()
    .eq('contact_id', contactId);
  
  if (deleteError) {
    return { error: deleteError.message };
  }
  
  // Insert new
  if (groupIds.length > 0) {
    const { error: insertError } = await supabase
      .from('contact_groups')
      .insert(groupIds.map(groupId => ({ contact_id: contactId, group_id: groupId })));
    
    if (insertError) {
      return { error: insertError.message };
    }
  }
  
  return { error: null };
}

// Fetch all contact-group relationships for the user
export async function fetchAllContactGroups(): Promise<{ data: Map<string, string[]> | null; error: string | null }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('contact_groups')
    .select('contact_id, group_id');
  
  if (error) {
    return { data: null, error: error.message };
  }
  
  const map = new Map<string, string[]>();
  data?.forEach((row: { contact_id: string; group_id: string }) => {
    const existing = map.get(row.contact_id) || [];
    existing.push(row.group_id);
    map.set(row.contact_id, existing);
  });
  
  return { data: map, error: null };
}
