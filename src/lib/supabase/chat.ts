import { createClient } from './client';
import type { Conversation, Message } from '@/types/chat';

interface DbConversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
}

interface DbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

// Fetch all conversations for the current user
export async function fetchConversations(): Promise<{ data: Conversation[] | null; error: string | null }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }
  
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  
  if (error) {
    return { data: null, error: error.message };
  }
  
  // Get profile info for other participants
  const otherUserIds = (data as DbConversation[]).map(c => 
    c.participant_1 === user.id ? c.participant_2 : c.participant_1
  );
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, photo_url')
    .in('id', otherUserIds);
  
  const profileMap = new Map<string, { display_name: string; photo_url: string | null }>();
  profiles?.forEach((p: { id: string; display_name: string; photo_url: string | null }) => {
    profileMap.set(p.id, p);
  });
  
  // Get unread counts
  const { data: unreadData } = await supabase
    .from('messages')
    .select('conversation_id')
    .neq('sender_id', user.id)
    .is('read_at', null);
  
  const unreadMap = new Map<string, number>();
  unreadData?.forEach((m: { conversation_id: string }) => {
    unreadMap.set(m.conversation_id, (unreadMap.get(m.conversation_id) || 0) + 1);
  });
  
  const conversations: Conversation[] = (data as DbConversation[]).map(c => {
    const otherUserId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
    const profile = profileMap.get(otherUserId);
    
    return {
      id: c.id,
      otherUserId,
      otherUserName: profile?.display_name || 'Unknown',
      otherUserPhoto: profile?.photo_url || undefined,
      lastMessageAt: c.last_message_at || undefined,
      lastMessagePreview: c.last_message_preview || undefined,
      unreadCount: unreadMap.get(c.id) || 0,
      createdAt: c.created_at,
    };
  });
  
  return { data: conversations, error: null };
}

// Get or create a conversation with another user
export async function getOrCreateConversation(otherUserId: string): Promise<{ data: string | null; error: string | null }> {
  const supabase = createClient();
  
  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    other_user_id: otherUserId,
  });
  
  if (error) {
    return { data: null, error: error.message };
  }
  
  return { data: data as string, error: null };
}

// Fetch messages for a conversation
export async function fetchMessages(conversationId: string, limit = 50): Promise<{ data: Message[] | null; error: string | null }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (error) {
    return { data: null, error: error.message };
  }
  
  const messages: Message[] = (data as DbMessage[]).map(m => ({
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    content: m.content,
    readAt: m.read_at || undefined,
    createdAt: m.created_at,
    isOwn: m.sender_id === user.id,
  }));
  
  return { data: messages, error: null };
}

// Send a message
export async function sendMessage(conversationId: string, content: string): Promise<{ data: Message | null; error: string | null }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
    })
    .select()
    .single();
  
  if (error) {
    return { data: null, error: error.message };
  }
  
  const m = data as DbMessage;
  return {
    data: {
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      content: m.content,
      readAt: m.read_at || undefined,
      createdAt: m.created_at,
      isOwn: true,
    },
    error: null,
  };
}

// Mark messages as read
export async function markMessagesAsRead(conversationId: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }
  
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .is('read_at', null);
  
  if (error) {
    return { error: error.message };
  }
  
  return { error: null };
}

// Subscribe to new messages in a conversation
export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: Message) => void
) {
  const supabase = createClient();
  
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload: { new: DbMessage }) => {
        const { data: { user } } = await supabase.auth.getUser();
        const m = payload.new as DbMessage;
        onMessage({
          id: m.id,
          conversationId: m.conversation_id,
          senderId: m.sender_id,
          content: m.content,
          readAt: m.read_at || undefined,
          createdAt: m.created_at,
          isOwn: m.sender_id === user?.id,
        });
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

// Get total unread message count
export async function getUnreadCount(): Promise<{ count: number; error: string | null }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { count: 0, error: 'Not authenticated' };
  }
  
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .neq('sender_id', user.id)
    .is('read_at', null);
  
  if (error) {
    return { count: 0, error: error.message };
  }
  
  return { count: count || 0, error: null };
}
