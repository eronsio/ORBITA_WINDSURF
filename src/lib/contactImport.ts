import type { Contact, SocialLink } from '@/types/contact';

/**
 * Normalize a name for matching: lowercase, remove accents, spaces, punctuation
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[\s_-]+/g, '') // Remove spaces, underscores, hyphens
    .replace(/[^a-z0-9]/g, ''); // Remove all non-alphanumeric
}

/**
 * Normalize filename for matching (without extension)
 */
export function normalizeFilename(filename: string): string {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  return normalizeName(nameWithoutExt);
}

/**
 * Generate possible photo filenames for a contact
 */
export function generatePhotoFilenames(firstName: string, lastName: string): string[] {
  const normalized = normalizeName(`${firstName} ${lastName}`);
  const firstNorm = normalizeName(firstName);
  const lastNorm = normalizeName(lastName);
  
  return [
    `${normalized}.jpg`,
    `${normalized}.jpeg`,
    `${normalized}.png`,
    `${normalized}.webp`,
    `${firstNorm}-${lastNorm}.jpg`,
    `${firstNorm}-${lastNorm}.jpeg`,
    `${firstNorm}-${lastNorm}.png`,
    `${lastNorm}-${firstNorm}.jpg`,
    `${firstNorm}.jpg`,
    `${firstNorm}.png`,
  ];
}

/**
 * Match a photo filename to a contact name
 * Matches: john-smith.jpg, john_smith.png, johnsmith.webp → "John Smith"
 */
export function matchPhotoToContact(
  filename: string,
  firstName: string,
  lastName: string
): boolean {
  const normalizedFilename = normalizeFilename(filename);
  const possibleNames = [
    normalizeName(`${firstName}${lastName}`),
    normalizeName(`${lastName}${firstName}`),
    normalizeName(firstName),
  ];
  
  return possibleNames.some(name => normalizedFilename === name);
}

// ============================================================================
// CSV IMPORT
// ============================================================================

/**
 * Parse CSV string into rows
 * Handles quoted fields with commas inside
 */
function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  const lines = csvText.split(/\r?\n/);
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }
  
  return rows;
}

/**
 * CSV column mapping
 */
interface CSVColumnMap {
  name?: number;
  firstName?: number;
  lastName?: number;
  city?: number;
  country?: number;
  lat?: number;
  lng?: number;
  roles?: number;
  tags?: number;
  languages?: number;
  birthYear?: number;
  email?: number;
  bio?: number;
  linkedin?: number;
  instagram?: number;
  twitter?: number;
  github?: number;
  website?: number;
}

/**
 * CSV column mapping - extended for Google Contacts
 */
interface CSVColumnMapExtended extends CSVColumnMap {
  middleName?: number;
  nickname?: number;
  organization?: number;
  title?: number;
  birthday?: number;
  notes?: number;
  photo?: number;
  labels?: number;
  phone1?: number;
  phone2?: number;
  address1City?: number;
  address1Country?: number;
  website1?: number;
}

/**
 * Detect column indices from header row
 * Supports both simple CSV and Google Contacts export format
 */
function detectColumns(headers: string[]): CSVColumnMapExtended {
  const map: CSVColumnMapExtended = {};
  
  headers.forEach((header, index) => {
    const h = header.toLowerCase().trim();
    
    // Standard columns
    if (h === 'name' || h === 'fullname' || h === 'full_name') map.name = index;
    else if (h === 'first name' || h === 'firstname' || h === 'first_name' || h === 'first') map.firstName = index;
    else if (h === 'last name' || h === 'lastname' || h === 'last_name' || h === 'last') map.lastName = index;
    else if (h === 'middle name' || h === 'middlename') map.middleName = index;
    else if (h === 'nickname') map.nickname = index;
    else if (h === 'city') map.city = index;
    else if (h === 'country') map.country = index;
    else if (h === 'lat' || h === 'latitude') map.lat = index;
    else if (h === 'lng' || h === 'lon' || h === 'longitude') map.lng = index;
    else if (h === 'roles' || h === 'role' || h === 'tags' || h === 'tag') map.roles = index;
    else if (h === 'languages' || h === 'language' || h === 'langs') map.languages = index;
    else if (h === 'birthyear' || h === 'birth_year' || h === 'year' || h === 'born') map.birthYear = index;
    else if (h === 'email' || h === 'mail' || h === 'e-mail 1 - value') map.email = index;
    else if (h === 'bio' || h === 'about' || h === 'description' || h === 'notes') map.bio = index;
    else if (h === 'linkedin') map.linkedin = index;
    else if (h === 'instagram' || h === 'insta') map.instagram = index;
    else if (h === 'twitter' || h === 'x') map.twitter = index;
    else if (h === 'github') map.github = index;
    else if (h === 'website' || h === 'web' || h === 'url' || h === 'website 1 - value') map.website = index;
    
    // Google Contacts specific columns
    else if (h === 'organization name') map.organization = index;
    else if (h === 'organization title') map.title = index;
    else if (h === 'birthday') map.birthday = index;
    else if (h === 'photo') map.photo = index;
    else if (h === 'labels') map.labels = index;
    else if (h === 'phone 1 - value') map.phone1 = index;
    else if (h === 'phone 2 - value') map.phone2 = index;
    else if (h === 'address 1 - city') map.address1City = index;
    else if (h === 'address 1 - country') map.address1Country = index;
  });
  
  return map;
}

/**
 * Parse semicolon-delimited list
 */
function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(';').map(s => s.trim()).filter(Boolean);
}

/**
 * Parse a single CSV row into a Contact
 * Supports both simple CSV and Google Contacts format
 */
function parseCSVRow(row: string[], columns: CSVColumnMapExtended, rowIndex: number): Contact | null {
  // Get name - either from combined name field or firstName/lastName
  let firstName = '';
  let lastName = '';
  
  if (columns.name !== undefined && row[columns.name]) {
    const nameParts = row[columns.name].trim().split(/\s+/);
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
  }
  
  if (columns.firstName !== undefined && row[columns.firstName]) {
    firstName = row[columns.firstName].trim();
  }
  if (columns.lastName !== undefined && row[columns.lastName]) {
    lastName = row[columns.lastName].trim();
  }
  
  // For Google Contacts: include middle name in lastName if present
  if (columns.middleName !== undefined && row[columns.middleName]?.trim()) {
    const middleName = row[columns.middleName].trim();
    lastName = middleName + (lastName ? ' ' + lastName : '');
  }
  
  // Require at least a first name
  if (!firstName) {
    console.warn(`Row ${rowIndex + 1}: Missing name, skipping`);
    return null;
  }
  
  // Parse location - check both standard and Google Contacts columns
  let city = columns.city !== undefined ? row[columns.city]?.trim() || '' : '';
  let country = columns.country !== undefined ? row[columns.country]?.trim() || '' : '';
  
  // Google Contacts address columns
  if (!city && columns.address1City !== undefined) {
    city = row[columns.address1City]?.trim() || '';
  }
  if (!country && columns.address1Country !== undefined) {
    country = row[columns.address1Country]?.trim() || '';
  }
  
  // Parse lat/lng - validate they're valid numbers
  let lat = 0;
  let lng = 0;
  
  if (columns.lat !== undefined && columns.lng !== undefined) {
    const latStr = row[columns.lat]?.trim();
    const lngStr = row[columns.lng]?.trim();
    
    if (latStr && lngStr) {
      const parsedLat = parseFloat(latStr);
      const parsedLng = parseFloat(lngStr);
      
      if (!isNaN(parsedLat) && !isNaN(parsedLng) && 
          parsedLat >= -90 && parsedLat <= 90 &&
          parsedLng >= -180 && parsedLng <= 180) {
        lat = parsedLat;
        lng = parsedLng;
      } else {
        console.warn(`Row ${rowIndex + 1}: Invalid lat/lng, using defaults`);
      }
    }
  }
  
  // Parse labels from Google Contacts (use as tags)
  let tags: string[] = [];
  if (columns.labels !== undefined && row[columns.labels]) {
    // Google labels are separated by " ::: "
    tags = row[columns.labels]
      .split(' ::: ')
      .map(s => s.trim())
      .filter(s => s && s !== '* myContacts' && !s.startsWith('*')); // Filter out system labels
  }
  
  // Also check for roles column
  const roles = parseList(columns.roles !== undefined ? row[columns.roles] : undefined);
  tags = [...tags, ...roles];
  
  const languages = parseList(columns.languages !== undefined ? row[columns.languages] : undefined);
  
  // Parse birth year - check both birthYear column and birthday column
  let birthYear: number | undefined;
  if (columns.birthYear !== undefined && row[columns.birthYear]) {
    const parsed = parseInt(row[columns.birthYear].trim(), 10);
    if (!isNaN(parsed) && parsed > 1900 && parsed < 2100) {
      birthYear = parsed;
    }
  }
  if (!birthYear && columns.birthday !== undefined && row[columns.birthday]) {
    // Try to extract year from birthday (various formats)
    const birthdayStr = row[columns.birthday].trim();
    const yearMatch = birthdayStr.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      birthYear = parseInt(yearMatch[0], 10);
    }
  }
  
  // Parse social links
  const socialLinks: SocialLink[] = [];
  
  if (columns.linkedin !== undefined && row[columns.linkedin]?.trim()) {
    socialLinks.push({ platform: 'linkedin', url: row[columns.linkedin].trim() });
  }
  if (columns.instagram !== undefined && row[columns.instagram]?.trim()) {
    socialLinks.push({ platform: 'instagram', url: row[columns.instagram].trim() });
  }
  if (columns.twitter !== undefined && row[columns.twitter]?.trim()) {
    socialLinks.push({ platform: 'twitter', url: row[columns.twitter].trim() });
  }
  if (columns.github !== undefined && row[columns.github]?.trim()) {
    socialLinks.push({ platform: 'github', url: row[columns.github].trim() });
  }
  if (columns.website !== undefined && row[columns.website]?.trim()) {
    socialLinks.push({ platform: 'website', url: row[columns.website].trim() });
  }
  
  // Get email
  let email = columns.email !== undefined ? row[columns.email]?.trim() : undefined;
  
  // Get bio/notes
  let bio = columns.bio !== undefined ? row[columns.bio]?.trim() : undefined;
  
  // Get phone numbers for attributes
  const attributes: Record<string, string | number | boolean> = {};
  
  if (columns.phone1 !== undefined && row[columns.phone1]?.trim()) {
    attributes.phone = row[columns.phone1].trim();
  }
  if (columns.phone2 !== undefined && row[columns.phone2]?.trim()) {
    attributes.phone2 = row[columns.phone2].trim();
  }
  
  // Organization info
  if (columns.organization !== undefined && row[columns.organization]?.trim()) {
    attributes.company = row[columns.organization].trim();
  }
  if (columns.title !== undefined && row[columns.title]?.trim()) {
    attributes.role = row[columns.title].trim();
  }
  
  // Photo URL from Google Contacts
  let photoUrl: string | undefined;
  if (columns.photo !== undefined && row[columns.photo]?.trim()) {
    const photoValue = row[columns.photo].trim();
    if (photoValue.startsWith('http')) {
      photoUrl = photoValue;
    }
  }
  
  // Build contact
  const contact: Contact = {
    id: crypto.randomUUID(),
    firstName,
    lastName,
    photoUrl,
    location: { lat, lng, city, country },
    tags,
    languages,
    birthYear,
    email,
    bio,
    socialLinks,
    attributes,
  };
  
  return contact;
}

/**
 * Import contacts from CSV data
 */
export function importContactsFromCSV(csvText: string): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const contacts: Contact[] = [];
  
  try {
    const rows = parseCSV(csvText);
    
    if (rows.length < 2) {
      return {
        success: false,
        contacts: [],
        errors: ['CSV must have a header row and at least one data row'],
        warnings: [],
      };
    }
    
    const headers = rows[0];
    const columns = detectColumns(headers);
    
    // Validate we have minimum required columns
    const hasName = columns.name !== undefined || columns.firstName !== undefined;
    if (!hasName) {
      return {
        success: false,
        contacts: [],
        errors: ['CSV must have a "name" or "firstName" column'],
        warnings: [],
      };
    }
    
    // Parse data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.every(cell => !cell.trim())) continue; // Skip empty rows
      
      const contact = parseCSVRow(row, columns, i);
      if (contact) {
        contacts.push(contact);
      } else {
        warnings.push(`Row ${i + 1} skipped due to missing required fields`);
      }
    }
    
    return {
      success: contacts.length > 0,
      contacts,
      errors,
      warnings,
    };
  } catch (err) {
    return {
      success: false,
      contacts: [],
      errors: [`Failed to parse CSV: ${err instanceof Error ? err.message : 'Unknown error'}`],
      warnings: [],
    };
  }
}

/**
 * Raw contact data from JSON import (all fields optional except required ones)
 */
interface RawContactData {
  id?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  location?: {
    lat?: number;
    lng?: number;
    city?: string;
    country?: string;
  };
  birthYear?: number;
  tags?: string[];
  languages?: string[];
  bio?: string;
  email?: string;
  socialLinks?: Array<{
    platform?: string;
    url?: string;
    icon?: string;
  }>;
  attributes?: Record<string, unknown>;
}

/**
 * Validation result
 */
interface ValidationResult {
  valid: boolean;
  contact?: Contact;
  errors: string[];
}

/**
 * Validate and normalize a single contact from raw data
 */
export function validateContact(raw: RawContactData, index: number): ValidationResult {
  const errors: string[] = [];
  const prefix = `Contact ${index + 1}`;

  // Required fields
  if (!raw.firstName || typeof raw.firstName !== 'string') {
    errors.push(`${prefix}: firstName is required`);
  }
  if (!raw.lastName || typeof raw.lastName !== 'string') {
    errors.push(`${prefix}: lastName is required`);
  }
  if (!raw.location) {
    errors.push(`${prefix}: location is required`);
  } else {
    if (typeof raw.location.lat !== 'number') {
      errors.push(`${prefix}: location.lat must be a number`);
    }
    if (typeof raw.location.lng !== 'number') {
      errors.push(`${prefix}: location.lng must be a number`);
    }
    if (!raw.location.city || typeof raw.location.city !== 'string') {
      errors.push(`${prefix}: location.city is required`);
    }
    if (!raw.location.country || typeof raw.location.country !== 'string') {
      errors.push(`${prefix}: location.country is required`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Build validated contact with defaults for optional fields
  const contact: Contact = {
    id: raw.id || crypto.randomUUID(),
    firstName: raw.firstName!,
    lastName: raw.lastName!,
    photoUrl: raw.photoUrl,
    location: {
      lat: raw.location!.lat!,
      lng: raw.location!.lng!,
      city: raw.location!.city!,
      country: raw.location!.country!,
    },
    birthYear: typeof raw.birthYear === 'number' ? raw.birthYear : undefined,
    tags: Array.isArray(raw.tags) ? raw.tags.filter(t => typeof t === 'string') : [],
    languages: Array.isArray(raw.languages) ? raw.languages.filter(l => typeof l === 'string') : [],
    bio: typeof raw.bio === 'string' ? raw.bio : undefined,
    email: typeof raw.email === 'string' ? raw.email : undefined,
    socialLinks: validateSocialLinks(raw.socialLinks),
    attributes: validateAttributes(raw.attributes),
  };

  return { valid: true, contact, errors: [] };
}

function validateSocialLinks(raw?: Array<{ platform?: string; url?: string; icon?: string }>): SocialLink[] {
  if (!Array.isArray(raw)) return [];
  
  return raw
    .filter(link => link && typeof link.platform === 'string' && typeof link.url === 'string')
    .map(link => ({
      platform: link.platform!,
      url: link.url!,
      icon: typeof link.icon === 'string' ? link.icon : undefined,
    }));
}

function validateAttributes(raw?: Record<string, unknown>): Record<string, string | number | boolean> {
  if (!raw || typeof raw !== 'object') return {};
  
  const result: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Import contacts from JSON data
 */
export interface ImportResult {
  success: boolean;
  contacts: Contact[];
  errors: string[];
  warnings: string[];
}

export function importContactsFromJSON(jsonData: unknown): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const contacts: Contact[] = [];

  if (!Array.isArray(jsonData)) {
    return {
      success: false,
      contacts: [],
      errors: ['JSON data must be an array of contacts'],
      warnings: [],
    };
  }

  for (let i = 0; i < jsonData.length; i++) {
    const result = validateContact(jsonData[i], i);
    if (result.valid && result.contact) {
      contacts.push(result.contact);
    } else {
      errors.push(...result.errors);
    }
  }

  return {
    success: contacts.length > 0,
    contacts,
    errors,
    warnings: errors.length > 0 ? [`${errors.length} contact(s) failed validation`] : [],
  };
}

/**
 * Auto-map photos to contacts based on filename matching
 */
export function autoMapPhotos(
  contacts: Contact[],
  photoFiles: { name: string; url: string }[]
): Contact[] {
  return contacts.map(contact => {
    if (contact.photoUrl) return contact; // Already has a photo
    
    const matchedPhoto = photoFiles.find(photo => 
      matchPhotoToContact(photo.name, contact.firstName, contact.lastName)
    );
    
    if (matchedPhoto) {
      return { ...contact, photoUrl: matchedPhoto.url };
    }
    
    return contact;
  });
}
