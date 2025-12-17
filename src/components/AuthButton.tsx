'use client';

import { useState, useEffect } from 'react';
import { LogIn, LogOut, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';

interface AuthButtonProps {
  onAuthChange?: (user: SupabaseUser | null) => void;
}

export function AuthButton({ onAuthChange }: AuthButtonProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      onAuthChange?.(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      onAuthChange?.(newUser);
    });

    return () => subscription.unsubscribe();
  }, [supabase, onAuthChange]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setSending(false);

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowSignIn(false);
  };

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-neutral-100 animate-pulse" />
    );
  }

  // Signed in state
  if (user) {
    return (
      <div className="relative group">
        <button
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-full',
            'bg-white/90 backdrop-blur-sm border border-neutral-200 shadow-sm',
            'hover:bg-neutral-50 transition-colors',
            'text-neutral-700 text-sm'
          )}
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline max-w-[120px] truncate">
            {user.email?.split('@')[0]}
          </span>
        </button>
        
        {/* Dropdown */}
        <div className="absolute right-0 top-full mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
          <div className="bg-white rounded-lg shadow-lg border border-neutral-200 py-1 min-w-[160px]">
            <div className="px-3 py-2 text-xs text-neutral-500 border-b border-neutral-100 truncate">
              {user.email}
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sign in form
  if (showSignIn) {
    return (
      <div className="relative">
        <div className="absolute right-0 top-0 bg-white rounded-xl shadow-xl border border-neutral-200 p-4 w-72 animate-fade-in">
          {sent ? (
            <div className="text-center py-2">
              <p className="text-sm text-neutral-700 font-medium">Check your email!</p>
              <p className="text-xs text-neutral-500 mt-1">
                We sent a magic link to {email}
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="mt-3 text-xs text-accent hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignIn}>
              <p className="text-sm font-medium text-neutral-800 mb-3">
                Sign in with email
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border border-neutral-200',
                  'text-sm placeholder:text-neutral-400',
                  'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent'
                )}
                autoFocus
                disabled={sending}
              />
              {error && (
                <p className="text-xs text-red-500 mt-2">{error}</p>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowSignIn(false)}
                  className="flex-1 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors"
                  disabled={sending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || !email.trim()}
                  className={cn(
                    'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    sending || !email.trim()
                      ? 'bg-neutral-100 text-neutral-400'
                      : 'bg-accent text-white hover:bg-accent-dark'
                  )}
                >
                  {sending ? 'Sending...' : 'Send link'}
                </button>
              </div>
              <p className="text-xs text-neutral-400 mt-3 text-center">
                No password needed — we'll email you a magic link
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Sign in button
  return (
    <button
      onClick={() => setShowSignIn(true)}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-full',
        'bg-white/90 backdrop-blur-sm border border-neutral-200 shadow-sm',
        'hover:bg-neutral-50 transition-colors',
        'text-neutral-700 text-sm font-medium'
      )}
    >
      <LogIn className="w-4 h-4" />
      <span className="hidden sm:inline">Sign in</span>
    </button>
  );
}
