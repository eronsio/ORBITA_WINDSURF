'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditableField } from './EditableField';

interface AttributeCategoriesProps {
  attributes: Record<string, string | number | boolean>;
  isEditable: boolean;
  onAttributeChange: (key: string, value: string) => void;
}

// Reserved attribute keys that are handled elsewhere
const RESERVED_KEYS = ['role', 'company'];

// Parse category from attribute key (format: "category:attribute" or just "attribute")
function parseAttributeKey(key: string): { category: string; attribute: string } {
  if (key.includes(':')) {
    const [category, ...rest] = key.split(':');
    return { category, attribute: rest.join(':') };
  }
  return { category: 'General', attribute: key };
}

// Create attribute key from category and attribute name
function createAttributeKey(category: string, attribute: string): string {
  if (category === 'General') return attribute;
  return `${category}:${attribute}`;
}

export function AttributeCategories({
  attributes,
  isEditable,
  onAttributeChange,
}: AttributeCategoriesProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['General']));
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newAttributes, setNewAttributes] = useState<Record<string, { name: string; value: string }>>({});

  // Group attributes by category
  const categorizedAttributes = Object.entries(attributes)
    .filter(([key]) => !RESERVED_KEYS.includes(key))
    .reduce((acc, [key, value]) => {
      const { category, attribute } = parseAttributeKey(key);
      if (!acc[category]) acc[category] = [];
      acc[category].push({ key, attribute, value: String(value) });
      return acc;
    }, {} as Record<string, Array<{ key: string; attribute: string; value: string }>>);

  const categories = Object.keys(categorizedAttributes).sort((a, b) => {
    if (a === 'General') return -1;
    if (b === 'General') return 1;
    return a.localeCompare(b);
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    const categoryName = newCategory.trim();
    setExpandedCategories(prev => new Set([...Array.from(prev), categoryName]));
    setNewAttributes(prev => ({
      ...prev,
      [categoryName]: { name: '', value: '' },
    }));
    setNewCategory('');
    setShowNewCategory(false);
  };

  const handleAddAttribute = (category: string) => {
    const newAttr = newAttributes[category];
    if (!newAttr?.name.trim()) return;
    
    const key = createAttributeKey(category, newAttr.name.trim());
    onAttributeChange(key, newAttr.value);
    setNewAttributes(prev => ({
      ...prev,
      [category]: { name: '', value: '' },
    }));
  };

  const handleDeleteAttribute = (key: string) => {
    onAttributeChange(key, '');
  };

  // Don't render if no attributes and not editable
  if (categories.length === 0 && !isEditable) return null;

  return (
    <div className="border-t border-neutral-100 pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700">Attributes</h3>
        {isEditable && (
          <button
            onClick={() => setShowNewCategory(true)}
            className="text-xs text-accent hover:text-accent-dark transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Category
          </button>
        )}
      </div>

      {/* New category input */}
      {showNewCategory && (
        <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Category name..."
            className="flex-1 px-2 py-1 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-accent"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCategory();
              if (e.key === 'Escape') {
                setShowNewCategory(false);
                setNewCategory('');
              }
            }}
          />
          <button
            onClick={handleAddCategory}
            disabled={!newCategory.trim()}
            className="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent-dark disabled:opacity-50 transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => {
              setShowNewCategory(false);
              setNewCategory('');
            }}
            className="px-2 py-1 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Categories */}
      {categories.map((category) => (
        <div key={category} className="border border-neutral-100 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleCategory(category)}
            className="w-full flex items-center justify-between px-3 py-2 bg-neutral-50 hover:bg-neutral-100 transition-colors"
          >
            <span className="text-sm font-medium text-neutral-700">{category}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">
                {categorizedAttributes[category]?.length || 0}
              </span>
              {expandedCategories.has(category) ? (
                <ChevronUp className="w-4 h-4 text-neutral-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              )}
            </div>
          </button>

          {expandedCategories.has(category) && (
            <div className="p-3 space-y-2">
              {categorizedAttributes[category]?.map(({ key, attribute, value }) => (
                <div key={key} className="flex items-center gap-2 group">
                  <span className="text-xs text-neutral-500 w-24 truncate flex-shrink-0">
                    {attribute}
                  </span>
                  {isEditable ? (
                    <>
                      <EditableField
                        value={value}
                        onSave={(v) => onAttributeChange(key, v)}
                        placeholder="Value..."
                        className="text-sm flex-1"
                      />
                      <button
                        onClick={() => handleDeleteAttribute(key)}
                        className="p-1 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <span className="text-sm text-neutral-700">{value}</span>
                  )}
                </div>
              ))}

              {/* Add new attribute to category */}
              {isEditable && (
                <div className="flex items-center gap-2 pt-2 border-t border-neutral-50">
                  <input
                    type="text"
                    value={newAttributes[category]?.name || ''}
                    onChange={(e) => setNewAttributes(prev => ({
                      ...prev,
                      [category]: { ...prev[category], name: e.target.value },
                    }))}
                    placeholder="Attribute name..."
                    className="w-24 px-2 py-1 text-xs border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <input
                    type="text"
                    value={newAttributes[category]?.value || ''}
                    onChange={(e) => setNewAttributes(prev => ({
                      ...prev,
                      [category]: { ...prev[category], value: e.target.value },
                    }))}
                    placeholder="Value..."
                    className="flex-1 px-2 py-1 text-xs border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-accent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddAttribute(category);
                    }}
                  />
                  <button
                    onClick={() => handleAddAttribute(category)}
                    disabled={!newAttributes[category]?.name?.trim()}
                    className="p-1 text-accent hover:text-accent-dark disabled:opacity-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Empty state for editable */}
      {categories.length === 0 && isEditable && !showNewCategory && (
        <p className="text-xs text-neutral-400 text-center py-2">
          Add categories to organize custom attributes
        </p>
      )}
    </div>
  );
}
