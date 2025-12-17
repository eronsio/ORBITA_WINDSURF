// Database types for Supabase

export interface DbContact {
  id: string;
  owner_user_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
  birth_year: number | null;
  bio: string | null;
  photo_url: string | null;
  tags: string[];
  languages: string[];
  social_links: { platform: string; url: string }[];
  attributes: Record<string, string | number | boolean>;
  status: 'active' | 'invited' | 'unclaimed';
  invite_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbContactInsert {
  owner_user_id: string;
  first_name: string;
  last_name?: string;
  email?: string | null;
  city?: string;
  country?: string;
  lat?: number | null;
  lng?: number | null;
  birth_year?: number | null;
  bio?: string | null;
  photo_url?: string | null;
  tags?: string[];
  languages?: string[];
  social_links?: { platform: string; url: string }[];
  attributes?: Record<string, string | number | boolean>;
  status?: 'active' | 'invited' | 'unclaimed';
  invite_email?: string | null;
}

export interface DbContactUpdate {
  first_name?: string;
  last_name?: string;
  email?: string | null;
  city?: string;
  country?: string;
  lat?: number | null;
  lng?: number | null;
  birth_year?: number | null;
  bio?: string | null;
  photo_url?: string | null;
  tags?: string[];
  languages?: string[];
  social_links?: { platform: string; url: string }[];
  attributes?: Record<string, string | number | boolean>;
  status?: 'active' | 'invited' | 'unclaimed';
  invite_email?: string | null;
}
