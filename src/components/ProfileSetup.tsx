'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Globe, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchMyProfile, createMyProfile, updateMyProfile, type Profile } from '@/lib/supabase/profiles';

interface ProfileSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const QUICK_CITIES = [
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194, country: 'USA' },
  { name: 'New York', lat: 40.7128, lng: -74.006, country: 'USA' },
  { name: 'London', lat: 51.5074, lng: -0.1278, country: 'UK' },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, country: 'France' },
  { name: 'Berlin', lat: 52.52, lng: 13.405, country: 'Germany' },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, country: 'Japan' },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, country: 'Australia' },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832, country: 'Canada' },
];

export function ProfileSetup({ isOpen, onClose, onSaved }: ProfileSetupProps) {
  const [profile, setProfile] = useState<Partial<Profile>>({
    display_name: '',
    city: '',
    country: '',
    lat: null,
    lng: null,
    bio: '',
    is_discoverable: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    setLoading(true);
    const { data, error } = await fetchMyProfile();
    if (error) {
      setError(error);
    } else if (data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!profile.display_name?.trim()) {
      setError('Please enter your name');
      return;
    }

    setSaving(true);
    setError(null);

    const { error } = profile.id 
      ? await updateMyProfile(profile)
      : await createMyProfile(profile);

    setSaving(false);

    if (error) {
      setError(error);
    } else {
      onSaved();
      onClose();
    }
  };

  const selectCity = useCallback((city: typeof QUICK_CITIES[0]) => {
    setProfile(prev => ({
      ...prev,
      city: city.name,
      country: city.country,
      lat: city.lat,
      lng: city.lng,
    }));
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-[2000] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2001] w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-neutral-800">
              Set Up Your Profile
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-neutral-500">Loading...</div>
          ) : (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={profile.display_name || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="How others will see you"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Your Location
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={profile.city || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                  <input
                    type="text"
                    value={profile.country || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Country"
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_CITIES.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => selectCity(city)}
                      className={cn(
                        'px-2.5 py-1 text-xs rounded-full transition-colors',
                        profile.city === city.name
                          ? 'bg-accent text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      )}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Short Bio (optional)
                </label>
                <textarea
                  value={profile.bio || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="A few words about yourself..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
                />
              </div>

              {/* Discoverable toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-neutral-700">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Discoverable by others
                  </p>
                  <p className="text-xs text-neutral-500">
                    Let friends find you on the map
                  </p>
                </div>
                <button
                  onClick={() => setProfile(prev => ({ ...prev, is_discoverable: !prev.is_discoverable }))}
                  className={cn(
                    'w-12 h-7 rounded-full transition-colors relative',
                    profile.is_discoverable ? 'bg-accent' : 'bg-neutral-200'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform',
                      profile.is_discoverable ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  'w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
                  saving
                    ? 'bg-neutral-100 text-neutral-400'
                    : 'bg-accent text-white hover:bg-accent-dark'
                )}
              >
                {saving ? (
                  'Saving...'
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Profile
                  </>
                )}
              </button>

              <p className="text-xs text-neutral-400 text-center">
                Your profile lets friends find you on the map
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
