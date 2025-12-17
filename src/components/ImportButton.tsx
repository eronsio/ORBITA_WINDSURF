'use client';

import { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, FileJson, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { importContactsFromJSON, importContactsFromCSV, autoMapPhotos } from '@/lib/contactImport';
import type { Contact } from '@/types/contact';

interface ImportButtonProps {
  onImport: (contacts: Contact[]) => void;
  onError: (message: string) => void;
}

export function ImportButton({ onImport, onError }: ImportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const pendingContactsRef = useRef<Contact[]>([]);

  const handleCSVSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = importContactsFromCSV(text);

      if (!result.success) {
        onError(result.errors.join('\n'));
        return;
      }

      if (result.warnings.length > 0) {
        console.warn('Import warnings:', result.warnings);
      }

      // Store contacts and prompt for photos
      pendingContactsRef.current = result.contacts;
      
      // Ask if user wants to add photos
      if (photoInputRef.current) {
        photoInputRef.current.click();
      }
    } catch (err) {
      onError('Failed to parse CSV file');
    }

    // Reset input
    if (csvInputRef.current) {
      csvInputRef.current.value = '';
    }
    setShowMenu(false);
  };

  const handleJsonSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const result = importContactsFromJSON(json);

      if (!result.success) {
        onError(result.errors.join('\n'));
        return;
      }

      if (result.errors.length > 0) {
        console.warn('Import warnings:', result.errors);
      }

      // Store contacts and prompt for photos
      pendingContactsRef.current = result.contacts;
      
      // Ask if user wants to add photos
      if (photoInputRef.current) {
        photoInputRef.current.click();
      }
    } catch (err) {
      onError('Failed to parse JSON file');
    }

    // Reset input
    if (jsonInputRef.current) {
      jsonInputRef.current.value = '';
    }
    setShowMenu(false);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    let contacts = pendingContactsRef.current;

    if (files && files.length > 0) {
      // Create object URLs for the photos
      const photoFiles = Array.from(files).map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
      }));

      // Auto-map photos to contacts by filename
      contacts = autoMapPhotos(contacts, photoFiles);
    }

    // Import the contacts
    if (contacts.length > 0) {
      onImport(contacts);
    }
    pendingContactsRef.current = [];

    // Reset input
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={cn(
          'p-2 rounded-full bg-white/90 backdrop-blur-sm',
          'border border-neutral-200 shadow-sm',
          'hover:bg-neutral-50 transition-colors',
          'text-neutral-500 hover:text-neutral-700'
        )}
        title="Import contacts"
      >
        <Upload className="w-4 h-4" />
      </button>

      {/* Import menu */}
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-[999]" 
            onClick={() => setShowMenu(false)} 
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-[1000] animate-fade-in">
            <button
              onClick={() => csvInputRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={() => jsonInputRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-50 transition-colors"
            >
              <FileJson className="w-4 h-4 text-blue-500" />
              <span>Import JSON</span>
            </button>
            <div className="border-t border-neutral-100 my-1" />
            <div className="px-4 py-2 text-xs text-neutral-400">
              CSV: name, city, country, lat, lng, roles (semicolon-separated)
            </div>
          </div>
        </>
      )}
      
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleCSVSelect}
        className="hidden"
      />
      
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleJsonSelect}
        className="hidden"
      />
      
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handlePhotoSelect}
        className="hidden"
      />
    </div>
  );
}
