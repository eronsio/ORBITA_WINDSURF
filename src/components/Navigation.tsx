'use client';

import { Map, MessageCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'map' | 'chat';

interface NavigationProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  unreadCount?: number;
  onGroupsClick: () => void;
  activeGroupName?: string;
}

export function Navigation({
  activeView,
  onViewChange,
  unreadCount = 0,
  onGroupsClick,
  activeGroupName,
}: NavigationProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
      <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md rounded-full shadow-lg shadow-black/10 border border-neutral-200/50 p-1.5">
        {/* Groups button */}
        <button
          onClick={onGroupsClick}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-full transition-all',
            'text-neutral-600 hover:bg-neutral-100'
          )}
        >
          <Users className="w-5 h-5" />
          <span className="text-sm font-medium max-w-24 truncate">
            {activeGroupName || 'Everyone'}
          </span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-neutral-200" />

        {/* Map tab */}
        <button
          onClick={() => onViewChange('map')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-full transition-all',
            activeView === 'map'
              ? 'bg-accent text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          )}
        >
          <Map className="w-5 h-5" />
          <span className="text-sm font-medium">Map</span>
        </button>

        {/* Chat tab */}
        <button
          onClick={() => onViewChange('chat')}
          className={cn(
            'relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-all',
            activeView === 'chat'
              ? 'bg-accent text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          )}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Chat</span>
          {unreadCount > 0 && activeView !== 'chat' && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
