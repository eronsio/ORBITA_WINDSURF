import type { Contact, SocialLink } from '@/types/contact';

/**
 * Phone country code to approximate coordinates mapping
 * Uses capital city or geographic center as default location
 */
const PHONE_COUNTRY_CODES: Record<string, { lat: number; lng: number; country: string }> = {
  '1': { lat: 37.0902, lng: -95.7129, country: 'USA' }, // USA center
  '7': { lat: 55.7558, lng: 37.6173, country: 'Russia' }, // Moscow
  '20': { lat: 30.0444, lng: 31.2357, country: 'Egypt' }, // Cairo
  '27': { lat: -25.7479, lng: 28.2293, country: 'South Africa' }, // Pretoria
  '30': { lat: 37.9838, lng: 23.7275, country: 'Greece' }, // Athens
  '31': { lat: 52.3676, lng: 4.9041, country: 'Netherlands' }, // Amsterdam
  '32': { lat: 50.8503, lng: 4.3517, country: 'Belgium' }, // Brussels
  '33': { lat: 48.8566, lng: 2.3522, country: 'France' }, // Paris
  '34': { lat: 40.4168, lng: -3.7038, country: 'Spain' }, // Madrid
  '36': { lat: 47.4979, lng: 19.0402, country: 'Hungary' }, // Budapest
  '39': { lat: 41.9028, lng: 12.4964, country: 'Italy' }, // Rome
  '40': { lat: 44.4268, lng: 26.1025, country: 'Romania' }, // Bucharest
  '41': { lat: 46.9480, lng: 7.4474, country: 'Switzerland' }, // Bern
  '43': { lat: 48.2082, lng: 16.3738, country: 'Austria' }, // Vienna
  '44': { lat: 51.5074, lng: -0.1278, country: 'UK' }, // London
  '45': { lat: 55.6761, lng: 12.5683, country: 'Denmark' }, // Copenhagen
  '46': { lat: 59.3293, lng: 18.0686, country: 'Sweden' }, // Stockholm
  '47': { lat: 59.9139, lng: 10.7522, country: 'Norway' }, // Oslo
  '48': { lat: 52.2297, lng: 21.0122, country: 'Poland' }, // Warsaw
  '49': { lat: 52.5200, lng: 13.4050, country: 'Germany' }, // Berlin
  '51': { lat: -12.0464, lng: -77.0428, country: 'Peru' }, // Lima
  '52': { lat: 19.4326, lng: -99.1332, country: 'Mexico' }, // Mexico City
  '53': { lat: 23.1136, lng: -82.3666, country: 'Cuba' }, // Havana
  '54': { lat: -34.6037, lng: -58.3816, country: 'Argentina' }, // Buenos Aires
  '55': { lat: -15.7975, lng: -47.8919, country: 'Brazil' }, // Brasilia
  '56': { lat: -33.4489, lng: -70.6693, country: 'Chile' }, // Santiago
  '57': { lat: 4.7110, lng: -74.0721, country: 'Colombia' }, // Bogota
  '58': { lat: 10.4806, lng: -66.9036, country: 'Venezuela' }, // Caracas
  '60': { lat: 3.1390, lng: 101.6869, country: 'Malaysia' }, // Kuala Lumpur
  '61': { lat: -35.2809, lng: 149.1300, country: 'Australia' }, // Canberra
  '62': { lat: -6.2088, lng: 106.8456, country: 'Indonesia' }, // Jakarta
  '63': { lat: 14.5995, lng: 120.9842, country: 'Philippines' }, // Manila
  '64': { lat: -41.2865, lng: 174.7762, country: 'New Zealand' }, // Wellington
  '65': { lat: 1.3521, lng: 103.8198, country: 'Singapore' }, // Singapore
  '66': { lat: 13.7563, lng: 100.5018, country: 'Thailand' }, // Bangkok
  '81': { lat: 35.6762, lng: 139.6503, country: 'Japan' }, // Tokyo
  '82': { lat: 37.5665, lng: 126.9780, country: 'South Korea' }, // Seoul
  '84': { lat: 21.0285, lng: 105.8542, country: 'Vietnam' }, // Hanoi
  '86': { lat: 39.9042, lng: 116.4074, country: 'China' }, // Beijing
  '90': { lat: 39.9334, lng: 32.8597, country: 'Turkey' }, // Ankara
  '91': { lat: 28.6139, lng: 77.2090, country: 'India' }, // New Delhi
  '92': { lat: 33.6844, lng: 73.0479, country: 'Pakistan' }, // Islamabad
  '93': { lat: 34.5553, lng: 69.2075, country: 'Afghanistan' }, // Kabul
  '94': { lat: 6.9271, lng: 79.8612, country: 'Sri Lanka' }, // Colombo
  '95': { lat: 19.7633, lng: 96.0785, country: 'Myanmar' }, // Naypyidaw
  '98': { lat: 35.6892, lng: 51.3890, country: 'Iran' }, // Tehran
  '212': { lat: 33.9716, lng: -6.8498, country: 'Morocco' }, // Rabat
  '213': { lat: 36.7538, lng: 3.0588, country: 'Algeria' }, // Algiers
  '216': { lat: 36.8065, lng: 10.1815, country: 'Tunisia' }, // Tunis
  '220': { lat: 13.4549, lng: -16.5790, country: 'Gambia' }, // Banjul
  '221': { lat: 14.7167, lng: -17.4677, country: 'Senegal' }, // Dakar
  '234': { lat: 9.0765, lng: 7.3986, country: 'Nigeria' }, // Abuja
  '254': { lat: -1.2921, lng: 36.8219, country: 'Kenya' }, // Nairobi
  '255': { lat: -6.1630, lng: 35.7516, country: 'Tanzania' }, // Dodoma
  '256': { lat: 0.3476, lng: 32.5825, country: 'Uganda' }, // Kampala
  '351': { lat: 38.7223, lng: -9.1393, country: 'Portugal' }, // Lisbon
  '352': { lat: 49.6116, lng: 6.1319, country: 'Luxembourg' }, // Luxembourg
  '353': { lat: 53.3498, lng: -6.2603, country: 'Ireland' }, // Dublin
  '354': { lat: 64.1466, lng: -21.9426, country: 'Iceland' }, // Reykjavik
  '358': { lat: 60.1699, lng: 24.9384, country: 'Finland' }, // Helsinki
  '370': { lat: 54.6872, lng: 25.2797, country: 'Lithuania' }, // Vilnius
  '371': { lat: 56.9496, lng: 24.1052, country: 'Latvia' }, // Riga
  '372': { lat: 59.4370, lng: 24.7536, country: 'Estonia' }, // Tallinn
  '380': { lat: 50.4501, lng: 30.5234, country: 'Ukraine' }, // Kyiv
  '381': { lat: 44.7866, lng: 20.4489, country: 'Serbia' }, // Belgrade
  '385': { lat: 45.8150, lng: 15.9819, country: 'Croatia' }, // Zagreb
  '386': { lat: 46.0569, lng: 14.5058, country: 'Slovenia' }, // Ljubljana
  '420': { lat: 50.0755, lng: 14.4378, country: 'Czech Republic' }, // Prague
  '421': { lat: 48.1486, lng: 17.1077, country: 'Slovakia' }, // Bratislava
  '852': { lat: 22.3193, lng: 114.1694, country: 'Hong Kong' }, // Hong Kong
  '853': { lat: 22.1987, lng: 113.5439, country: 'Macau' }, // Macau
  '886': { lat: 25.0330, lng: 121.5654, country: 'Taiwan' }, // Taipei
  '971': { lat: 24.4539, lng: 54.3773, country: 'UAE' }, // Abu Dhabi
  '972': { lat: 31.7683, lng: 35.2137, country: 'Israel' }, // Jerusalem
  '974': { lat: 25.2854, lng: 51.5310, country: 'Qatar' }, // Doha
  '966': { lat: 24.7136, lng: 46.6753, country: 'Saudi Arabia' }, // Riyadh
};

/**
 * Extract country code from phone number and return location
 */
function getLocationFromPhone(phone: string): { lat: number; lng: number; country: string } | null {
  if (!phone) return null;
  
  // Clean the phone number - remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Must start with + or be a long number
  let digits = cleaned;
  if (cleaned.startsWith('+')) {
    digits = cleaned.substring(1);
  } else if (!cleaned.match(/^\d{10,}/)) {
    return null; // Too short to determine country
  }
  
  // Try matching country codes from longest to shortest (3, 2, 1 digits)
  for (const len of [3, 2, 1]) {
    const code = digits.substring(0, len);
    if (PHONE_COUNTRY_CODES[code]) {
      return PHONE_COUNTRY_CODES[code];
    }
  }
  
  return null;
}

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
  
  // If no lat/lng, try to geocode from phone number
  if (lat === 0 && lng === 0) {
    const phone1 = columns.phone1 !== undefined ? row[columns.phone1]?.trim() : undefined;
    const phone2 = columns.phone2 !== undefined ? row[columns.phone2]?.trim() : undefined;
    const phoneLocation = getLocationFromPhone(phone1 || '') || getLocationFromPhone(phone2 || '');
    
    if (phoneLocation) {
      lat = phoneLocation.lat;
      lng = phoneLocation.lng;
      // Also set country if not already set
      if (!country) {
        country = phoneLocation.country;
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
