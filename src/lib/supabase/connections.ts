import { createClient } from './client';

const supabase = createClient();

export interface Connection {
  id: string;
  contactId1: string;
  contactId2: string;
  createdAt: string;
  notes?: string;
}

/**
 * Fetch all connections for the current user as a Map
 */
export async function fetchConnections(): Promise<{
  data: Map<string, string[]> | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .rpc('get_connections_map');

    if (error) {
      console.error('Error fetching connections:', error);
      return { data: null, error: error.message };
    }

    // Convert to Map
    const connectionsMap = new Map<string, string[]>();
    if (data) {
      for (const row of data) {
        connectionsMap.set(row.contact_id, row.connected_ids || []);
      }
    }

    return { data: connectionsMap, error: null };
  } catch (err) {
    console.error('Error fetching connections:', err);
    return { data: null, error: 'Failed to fetch connections' };
  }
}

/**
 * Add a connection between two contacts
 */
export async function addConnection(
  contactId1: string,
  contactId2: string,
  notes?: string
): Promise<{ error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Ensure consistent ordering to avoid duplicates
    const [id1, id2] = contactId1 < contactId2 
      ? [contactId1, contactId2] 
      : [contactId2, contactId1];

    const { error } = await supabase
      .from('connections')
      .insert({
        user_id: user.id,
        contact_id_1: id1,
        contact_id_2: id2,
        notes,
      });

    if (error) {
      if (error.code === '23505') {
        return { error: null }; // Already exists, not an error
      }
      console.error('Error adding connection:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error('Error adding connection:', err);
    return { error: 'Failed to add connection' };
  }
}

/**
 * Remove a connection between two contacts
 */
export async function removeConnection(
  contactId1: string,
  contactId2: string
): Promise<{ error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Try both orderings
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('user_id', user.id)
      .or(`and(contact_id_1.eq.${contactId1},contact_id_2.eq.${contactId2}),and(contact_id_1.eq.${contactId2},contact_id_2.eq.${contactId1})`);

    if (error) {
      console.error('Error removing connection:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error('Error removing connection:', err);
    return { error: 'Failed to remove connection' };
  }
}

/**
 * Get connections for a specific contact
 */
export async function getContactConnections(
  contactId: string
): Promise<{ data: string[] | null; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('connections')
      .select('contact_id_1, contact_id_2')
      .eq('user_id', user.id)
      .or(`contact_id_1.eq.${contactId},contact_id_2.eq.${contactId}`);

    if (error) {
      console.error('Error fetching contact connections:', error);
      return { data: null, error: error.message };
    }

    // Extract the other contact ID from each connection
    const connectedIds = data?.map((row: { contact_id_1: string; contact_id_2: string }) => 
      row.contact_id_1 === contactId ? row.contact_id_2 : row.contact_id_1
    ) || [];

    return { data: connectedIds, error: null };
  } catch (err) {
    console.error('Error fetching contact connections:', err);
    return { data: null, error: 'Failed to fetch contact connections' };
  }
}
