'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send, MessageCircle, Search, Plus, X } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { 
  fetchConversations, 
  fetchMessages, 
  sendMessage, 
  markMessagesAsRead,
  subscribeToMessages,
  getOrCreateConversation 
} from '@/lib/supabase/chat';
import { fetchDiscoverableProfiles, type Profile } from '@/lib/supabase/profiles';
import type { Conversation, Message } from '@/types/chat';

interface ChatViewProps {
  onBack: () => void;
  onSelectProfile?: (userId: string) => void;
}

export function ChatView({ onBack, onSelectProfile }: ChatViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      markMessagesAsRead(activeConversation.id);
    }
  }, [activeConversation?.id]);

  // Subscribe to new messages
  useEffect(() => {
    if (!activeConversation) return;

    const unsubscribe = subscribeToMessages(activeConversation.id, (message) => {
      setMessages(prev => [...prev, message]);
      if (!message.isOwn) {
        markMessagesAsRead(activeConversation.id);
      }
    });

    return unsubscribe;
  }, [activeConversation?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    setLoading(true);
    const { data, error } = await fetchConversations();
    if (data) {
      setConversations(data);
    }
    setLoading(false);
  };

  // Search for users to start new chat
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      setSearchLoading(true);
      const { data } = await fetchDiscoverableProfiles();
      if (data) {
        const query = searchQuery.toLowerCase();
        const filtered = data.filter(p => 
          p.display_name.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query)
        );
        setSearchResults(filtered);
      }
      setSearchLoading(false);
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const startNewChat = async (profile: Profile) => {
    const { data: conversationId, error } = await getOrCreateConversation(profile.id);
    if (conversationId) {
      // Create a temporary conversation object
      const newConv: Conversation = {
        id: conversationId,
        otherUserId: profile.id,
        otherUserName: profile.display_name,
        otherUserPhoto: profile.photo_url || undefined,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
      };
      setActiveConversation(newConv);
      setShowNewChat(false);
      setSearchQuery('');
      // Refresh conversations list
      loadConversations();
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data } = await fetchMessages(conversationId);
    if (data) {
      setMessages(data);
    }
  };

  const handleSend = useCallback(async () => {
    if (!activeConversation || !newMessage.trim() || sending) return;

    setSending(true);
    const { data, error } = await sendMessage(activeConversation.id, newMessage.trim());
    
    if (data) {
      setMessages(prev => [...prev, data]);
      setNewMessage('');
      // Update conversation preview
      setConversations(prev => prev.map(c => 
        c.id === activeConversation.id 
          ? { ...c, lastMessagePreview: data.content, lastMessageAt: data.createdAt }
          : c
      ));
    }
    setSending(false);
  }, [activeConversation, newMessage, sending]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // New chat search view
  if (showNewChat) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-neutral-100">
          <button
            onClick={() => {
              setShowNewChat(false);
              setSearchQuery('');
            }}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <h1 className="text-lg font-semibold text-neutral-800">New Chat</h1>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-neutral-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              autoFocus
            />
          </div>
        </div>

        {/* Search results */}
        <div className="flex-1 overflow-y-auto">
          {searchLoading ? (
            <div className="flex items-center justify-center h-32 text-neutral-400">
              Searching...
            </div>
          ) : searchQuery && searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-8">
              <p className="text-neutral-500">No users found</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y divide-neutral-50">
              {searchResults.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => startNewChat(profile)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    {profile.photo_url ? (
                      <img
                        src={profile.photo_url}
                        alt={profile.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent-light to-accent flex items-center justify-center text-white font-medium">
                        {getInitials(profile.display_name, '')}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-800 truncate">
                      {profile.display_name}
                    </p>
                    {profile.city && (
                      <p className="text-sm text-neutral-500 truncate">
                        {profile.city}{profile.country ? `, ${profile.country}` : ''}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center px-8">
              <p className="text-neutral-400 text-sm">
                Search for someone to start a conversation
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Conversation list view
  if (!activeConversation) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <h1 className="text-lg font-semibold text-neutral-800">Messages</h1>
          </div>
          <button
            onClick={() => setShowNewChat(true)}
            className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <Plus className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-neutral-400">
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-8">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-neutral-600 font-medium mb-1">No conversations yet</p>
              <p className="text-sm text-neutral-400 mb-4">
                Start a conversation with someone
              </p>
              <button
                onClick={() => setShowNewChat(true)}
                className="px-4 py-2 bg-accent text-white rounded-full text-sm font-medium hover:bg-accent-dark transition-colors"
              >
                New Chat
              </button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-neutral-50 transition-colors text-left"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    {conv.otherUserPhoto ? (
                      <img
                        src={conv.otherUserPhoto}
                        alt={conv.otherUserName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent-light to-accent flex items-center justify-center text-white font-medium">
                        {getInitials(conv.otherUserName, '')}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn(
                        'font-medium truncate',
                        conv.unreadCount > 0 ? 'text-neutral-900' : 'text-neutral-700'
                      )}>
                        {conv.otherUserName}
                      </p>
                      {conv.lastMessageAt && (
                        <span className="text-xs text-neutral-400 flex-shrink-0">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    {conv.lastMessagePreview && (
                      <p className={cn(
                        'text-sm truncate',
                        conv.unreadCount > 0 ? 'text-neutral-600' : 'text-neutral-400'
                      )}>
                        {conv.lastMessagePreview}
                      </p>
                    )}
                  </div>

                  {/* Unread badge */}
                  {conv.unreadCount > 0 && (
                    <div className="w-5 h-5 rounded-full bg-accent text-white text-xs font-medium flex items-center justify-center">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active conversation view
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-neutral-100">
        <button
          onClick={() => setActiveConversation(null)}
          className="p-2 -ml-2 rounded-full hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </button>
        
        <button
          onClick={() => onSelectProfile?.(activeConversation.otherUserId)}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            {activeConversation.otherUserPhoto ? (
              <img
                src={activeConversation.otherUserPhoto}
                alt={activeConversation.otherUserName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-accent-light to-accent flex items-center justify-center text-white font-medium text-sm">
                {getInitials(activeConversation.otherUserName, '')}
              </div>
            )}
          </div>
          <span className="font-medium text-neutral-800 truncate">
            {activeConversation.otherUserName}
          </span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message, i) => {
          const showTime = i === 0 || 
            new Date(message.createdAt).getTime() - new Date(messages[i-1].createdAt).getTime() > 300000;
          
          return (
            <div key={message.id}>
              {showTime && (
                <div className="text-center text-xs text-neutral-400 my-4">
                  {formatTime(message.createdAt)}
                </div>
              )}
              <div className={cn(
                'flex',
                message.isOwn ? 'justify-end' : 'justify-start'
              )}>
                <div className={cn(
                  'max-w-[75%] px-4 py-2.5 rounded-2xl',
                  message.isOwn
                    ? 'bg-accent text-white rounded-br-md'
                    : 'bg-neutral-100 text-neutral-800 rounded-bl-md'
                )}>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-neutral-100">
        <div className="flex items-end gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-2.5 rounded-2xl border border-neutral-200 resize-none focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm max-h-32"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={{
              height: 'auto',
              minHeight: '44px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className={cn(
              'p-3 rounded-full transition-colors',
              newMessage.trim() && !sending
                ? 'bg-accent text-white hover:bg-accent-dark'
                : 'bg-neutral-100 text-neutral-400'
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
