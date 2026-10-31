import React from 'react';
import { Database, Folder, Leaf, Sparkles, Shield, Bookmark, Map, User, Key, Layers } from 'lucide-react';
import type { CollectionKey, CollectionMeta } from '../types';

interface CollectionPickerProps {
  collections: CollectionMeta[];
  selected?: CollectionKey | 'bundle' | '';
  onChange: (key: CollectionKey | 'bundle') => void;
  includeBundleOption?: boolean;
  className?: string;
}

const COLLECTION_ICONS: Record<string, React.ElementType> = {
  categories: Folder,
  plants: Leaf,
  remedies: Sparkles,
  tours: Map,
  users: User,
  bookmarks: Bookmark,
  detections: Sparkles,
  gardens: Leaf,
  auditlogs: Shield,
  featureflags: Shield,
  systemconfigs: Database,
  refreshtokens: Key,
};

export const CollectionPicker: React.FC<CollectionPickerProps> = ({
  collections,
  selected,
  onChange,
  includeBundleOption = false,
  className = '',
}) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={selected || ''}
        onChange={(e) => onChange(e.target.value as any)}
        className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      >
        <option value="" disabled>Select a collection...</option>
        {includeBundleOption && (
          <option value="bundle">🌿 Full Content Bundle (All collections)</option>
        )}
        {collections.map((c) => (
          <option key={c.key} value={c.key}>
            {c.label} ({c.key})
          </option>
        ))}
      </select>
    </div>
  );
};

