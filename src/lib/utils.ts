import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Contact } from '@/types/contact';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

export function matchesSearch(contact: Contact, query: string): boolean {
  if (!query.trim()) return true;
  
  const searchLower = query.toLowerCase();
  const tokens = searchLower.split(/\s+/);
  
  return tokens.every(token => {
    // Age-based queries
    const underMatch = token.match(/^under\s*(\d+)$/);
    if (underMatch && contact.birthYear) {
      return getAge(contact.birthYear) < parseInt(underMatch[1]);
    }
    
    const overMatch = token.match(/^over\s*(\d+)$/);
    if (overMatch && contact.birthYear) {
      return getAge(contact.birthYear) > parseInt(overMatch[1]);
    }
    
    // Check all searchable fields
    const searchableText = [
      contact.firstName,
      contact.lastName,
      contact.location.city,
      contact.location.country,
      ...contact.tags,
      ...contact.languages,
      contact.bio || '',
      ...Object.values(contact.attributes).map(String),
    ].join(' ').toLowerCase();
    
    return searchableText.includes(token);
  });
}
