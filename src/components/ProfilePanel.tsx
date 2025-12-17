'use client';

import { useState, useCallback, useRef } from 'react';
import { X, Mail, ChevronDown, ChevronUp, MapPin, Globe, Camera } from 'lucide-react';
import { cn, getInitials, getAge } from '@/lib/utils';
import { EditableField } from './EditableField';
import { EditableTags } from './EditableTags';
import { EditableSocialLinks } from './EditableSocialLinks';
import type { Contact, SocialLink } from '@/types/contact';

interface ProfilePanelProps {
  contact: Contact | null;
  onClose: () => void;
  onUpdate?: (contact: Contact) => void;
  onPhotoUpload?: (contactId: string, file: File) => void;
}


export function ProfilePanel({ contact, onClose, onUpdate, onPhotoUpload }: ProfilePanelProps) {
  const [showContact, setShowContact] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = useCallback(() => {
    if (onPhotoUpload && contact) {
      fileInputRef.current?.click();
    }
  }, [onPhotoUpload, contact]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && contact && onPhotoUpload) {
      onPhotoUpload(contact.id, file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [contact, onPhotoUpload]);

  // Field update handlers - each field saves immediately on blur/Enter
  const updateField = useCallback((field: string, value: string) => {
    if (!contact || !onUpdate) return;
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      onUpdate({
        ...contact,
        [parent]: {
          ...(contact as any)[parent],
          [child]: value,
        },
      });
    } else {
      onUpdate({ ...contact, [field]: value });
    }
  }, [contact, onUpdate]);

  const updateAttribute = useCallback((key: string, value: string) => {
    if (!contact || !onUpdate) return;
    onUpdate({
      ...contact,
      attributes: { ...contact.attributes, [key]: value },
    });
  }, [contact, onUpdate]);

  const updateTags = useCallback((tags: string[]) => {
    if (!contact || !onUpdate) return;
    onUpdate({ ...contact, tags });
  }, [contact, onUpdate]);

  const updateLanguages = useCallback((languages: string[]) => {
    if (!contact || !onUpdate) return;
    onUpdate({ ...contact, languages });
  }, [contact, onUpdate]);

  const updateSocialLinks = useCallback((socialLinks: SocialLink[]) => {
    if (!contact || !onUpdate) return;
    onUpdate({ ...contact, socialLinks });
  }, [contact, onUpdate]);

  if (!contact) return null;

  const age = contact.birthYear ? getAge(contact.birthYear) : null;
  const hasContactInfo = contact.email || contact.socialLinks.length > 0;
  const isEditable = !!onUpdate;

  return (
    <>
      {/* Desktop: Right panel */}
      <div
        className={cn(
          'hidden md:block fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-[1001]',
          'animate-slide-in-right'
        )}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-end p-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <ProfileContent
              contact={contact}
              age={age}
              showContact={showContact}
              setShowContact={setShowContact}
              hasContactInfo={hasContactInfo}
              isEditable={isEditable}
              onFieldChange={updateField}
              onAttributeChange={updateAttribute}
              onTagsChange={updateTags}
              onLanguagesChange={updateLanguages}
              onSocialLinksChange={updateSocialLinks}
              onPhotoClick={onPhotoUpload ? handlePhotoClick : undefined}
            />
          </div>
        </div>
      </div>

      {/* Mobile: Bottom sheet */}
      <div
        className={cn(
          'md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[1001]',
          'animate-slide-up max-h-[80vh] overflow-hidden'
        )}
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-neutral-100">
            <div className="w-12 h-1 bg-neutral-200 rounded-full mx-auto" />
            <button
              onClick={onClose}
              className="absolute right-4 p-2 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          <div className="overflow-y-auto px-6 pb-8 pt-2">
            <ProfileContent
              contact={contact}
              age={age}
              showContact={showContact}
              setShowContact={setShowContact}
              hasContactInfo={hasContactInfo}
              isEditable={isEditable}
              onFieldChange={updateField}
              onAttributeChange={updateAttribute}
              onTagsChange={updateTags}
              onLanguagesChange={updateLanguages}
              onSocialLinksChange={updateSocialLinks}
              onPhotoClick={onPhotoUpload ? handlePhotoClick : undefined}
            />
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-[1000] animate-fade-in"
        onClick={onClose}
      />

      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}

interface ProfileContentProps {
  contact: Contact;
  age: number | null;
  showContact: boolean;
  setShowContact: (show: boolean) => void;
  hasContactInfo: boolean;
  isEditable: boolean;
  onFieldChange: (field: string, value: string) => void;
  onAttributeChange: (key: string, value: string) => void;
  onTagsChange: (tags: string[]) => void;
  onLanguagesChange: (languages: string[]) => void;
  onSocialLinksChange: (links: SocialLink[]) => void;
  onPhotoClick?: () => void;
}

function ProfileContent({
  contact,
  age,
  showContact,
  setShowContact,
  hasContactInfo,
  isEditable,
  onFieldChange,
  onAttributeChange,
  onTagsChange,
  onLanguagesChange,
  onSocialLinksChange,
  onPhotoClick,
}: ProfileContentProps) {
  // Render text or editable field based on isEditable
  const renderField = (
    value: string,
    field: string,
    placeholder: string,
    className?: string,
    multiline?: boolean
  ) => {
    if (isEditable) {
      return (
        <EditableField
          value={value}
          onSave={(v) => onFieldChange(field, v)}
          placeholder={placeholder}
          className={className}
          multiline={multiline}
        />
      );
    }
    return <span className={className}>{value || placeholder}</span>;
  };

  const renderAttribute = (
    key: string,
    placeholder: string,
    className?: string
  ) => {
    const value = (contact.attributes[key] as string) || '';
    if (isEditable) {
      return (
        <EditableField
          value={value}
          onSave={(v) => onAttributeChange(key, v)}
          placeholder={placeholder}
          className={className}
        />
      );
    }
    return value ? <span className={className}>{value}</span> : null;
  };

  return (
    <div className="space-y-6">
      {/* Avatar and name */}
      <div className="flex flex-col items-center text-center">
        <div 
          className={cn(
            "relative w-24 h-24 rounded-full overflow-hidden border-4 border-neutral-100 shadow-lg mb-4",
            onPhotoClick && "cursor-pointer group"
          )}
          onClick={onPhotoClick}
        >
          {contact.photoUrl ? (
            <img
              src={contact.photoUrl}
              alt={`${contact.firstName} ${contact.lastName}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-light to-accent text-white text-2xl font-semibold">
              {getInitials(contact.firstName, contact.lastName)}
            </div>
          )}
          {onPhotoClick && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Status badge for unclaimed/invited contacts */}
        {(contact.status === 'unclaimed' || contact.status === 'invited') && (
          <div className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-2',
            contact.status === 'unclaimed' 
              ? 'bg-neutral-100 text-neutral-600' 
              : 'bg-amber-100 text-amber-700'
          )}>
            {contact.status === 'unclaimed' ? 'Unclaimed' : 'Invited'}
          </div>
        )}

        <h2 className="text-xl font-semibold text-neutral-900">
          {isEditable ? (
            <span className="inline-flex gap-1">
              <EditableField
                value={contact.firstName}
                onSave={(v) => onFieldChange('firstName', v)}
                placeholder="First"
                className="text-center"
              />
              <EditableField
                value={contact.lastName}
                onSave={(v) => onFieldChange('lastName', v)}
                placeholder="Last"
                className="text-center"
              />
            </span>
          ) : (
            <>{contact.firstName} {contact.lastName}</>
          )}
        </h2>
        <div className="text-neutral-500 mt-1">
          {isEditable ? (
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <EditableField
                value={(contact.attributes.role as string) || ''}
                onSave={(v) => onAttributeChange('role', v)}
                placeholder="Role"
                className="text-sm"
              />
              <span className="text-neutral-400">at</span>
              <EditableField
                value={(contact.attributes.company as string) || ''}
                onSave={(v) => onAttributeChange('company', v)}
                placeholder="Company"
                className="text-sm"
              />
            </div>
          ) : (
            contact.attributes.role && (
              <p>
                {contact.attributes.role as string}
                {contact.attributes.company && (
                  <span> at {contact.attributes.company as string}</span>
                )}
              </p>
            )
          )}
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
        <MapPin className="w-4 h-4" />
        {isEditable ? (
          <span className="inline-flex items-center gap-1">
            <EditableField
              value={contact.location.city}
              onSave={(v) => onFieldChange('location.city', v)}
              placeholder="City"
              className="text-sm"
            />
            <span>,</span>
            <EditableField
              value={contact.location.country}
              onSave={(v) => onFieldChange('location.country', v)}
              placeholder="Country"
              className="text-sm"
            />
          </span>
        ) : (
          <span>
            {contact.location.city}, {contact.location.country}
          </span>
        )}
        {age && <span className="text-neutral-300">•</span>}
        {age && <span>{age} years old</span>}
      </div>

      {/* Bio */}
      {(contact.bio || isEditable) && (
        <div className="text-neutral-600 text-center leading-relaxed">
          {isEditable ? (
            <EditableField
              value={contact.bio || ''}
              onSave={(v) => onFieldChange('bio', v)}
              placeholder="Add a bio..."
              multiline
              className="text-center"
            />
          ) : (
            <span>{contact.bio}</span>
          )}
        </div>
      )}

      {/* Tags */}
      {(contact.tags.length > 0 || isEditable) && (
        <div className="flex flex-wrap justify-center gap-2">
          {isEditable ? (
            <EditableTags
              tags={contact.tags}
              onUpdate={onTagsChange}
              placeholder="Add tag..."
              className="justify-center"
            />
          ) : (
            contact.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-sm"
              >
                {tag}
              </span>
            ))
          )}
        </div>
      )}

      {/* Languages */}
      {(contact.languages.length > 0 || isEditable) && (
        <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
          <Globe className="w-4 h-4 flex-shrink-0" />
          {isEditable ? (
            <EditableTags
              tags={contact.languages}
              onUpdate={onLanguagesChange}
              placeholder="Add language..."
            />
          ) : (
            <span>{contact.languages.join(', ')}</span>
          )}
        </div>
      )}

      {/* Social links & Contact info */}
      <div className="border-t border-neutral-100 pt-4">
        <button
          onClick={() => setShowContact(!showContact)}
          className="w-full flex items-center justify-between py-2 text-sm font-medium text-neutral-700 hover:text-accent transition-colors"
        >
          <span>Contact & Social</span>
          {showContact ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showContact && (
          <div className="mt-2 space-y-3 animate-fade-in">
            {/* Email */}
            {(contact.email || isEditable) && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                {isEditable ? (
                  <EditableField
                    value={contact.email || ''}
                    onSave={(v) => onFieldChange('email', v)}
                    placeholder="Add email..."
                    className="text-sm"
                  />
                ) : (
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-sm text-neutral-600 hover:text-accent transition-colors"
                  >
                    {contact.email}
                  </a>
                )}
              </div>
            )}

            {/* Social links */}
            {isEditable ? (
              <EditableSocialLinks
                links={contact.socialLinks}
                onUpdate={onSocialLinksChange}
              />
            ) : (
              contact.socialLinks.length > 0 && (
                <div className="space-y-1">
                  {contact.socialLinks.map((link, idx) => (
                    <a
                      key={`${link.platform}-${idx}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-neutral-600 hover:text-accent transition-colors"
                    >
                      <span className="capitalize">{link.platform}</span>
                    </a>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
