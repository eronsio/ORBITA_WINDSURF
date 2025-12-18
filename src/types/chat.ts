export interface Conversation {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt?: string;
  createdAt: string;
  isOwn: boolean;
}
