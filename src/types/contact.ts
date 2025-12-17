export interface SocialLink {
  platform: string;
  url: string;
  icon?: string;
}

export type ContactStatus = 'active' | 'invited' | 'unclaimed';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  location: {
    lat: number;
    lng: number;
    city: string;
    country: string;
  };
  birthYear?: number;
  tags: string[];
  languages: string[];
  bio?: string;
  email?: string;
  socialLinks: SocialLink[];
  attributes: Record<string, string | number | boolean>;
  /** Contact status: active (claimed), invited (pending invite), unclaimed (placeholder) */
  status?: ContactStatus;
  /** Email/username used for invite (may differ from profile email) */
  inviteEmail?: string;
  /** When the contact was added */
  createdAt?: string;
  /** Who added this contact (for future use) */
  addedBy?: string;
}

export interface ContactCluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  contacts: Contact[];
}
