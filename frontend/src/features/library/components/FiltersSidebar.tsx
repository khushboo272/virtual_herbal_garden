import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { LibraryMeta, SearchParams } from '../types/library.types';

interface FiltersSidebarProps {
  params: SearchParams;
  meta: LibraryMeta | null;
  onMedicinalUse: (use: string) => void;
  onRegion: (region: string) => void;
  onType: (type: string) => void;
  onClear: () => void;
}

interface FilterGroupProps {
  title: string;
  items: { name: string; count: number }[];
  selected: string | undefined;
  onSelect: (value: string) => void;
  maxVisible?: number;
}

function FilterGroup({ title, items, selected, onSelect, maxVisible = 6 }: FilterGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, maxVisible);
  const hasMore = items.length > maxVisible;

  if (items.length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-semibold text-green-800 mb-3">{title}</h4>
      <div className="space-y-1.5">
        {visible.map((item) => {
          const isActive = selected === item.name;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onSelect(isActive ? '' : item.name)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-green-600 text-white font-medium'
                  : 'text-green-700 hover:bg-green-50 hover:text-green-900'
              }`}
            >
              <span className="truncate text-left">{item.name}</span>
              <span
                className={`ml-2 flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-green-100 text-green-600'
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-xs text-green-500 hover:text-green-700 flex items-center gap-1 transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="w-3 h-3" /> Show less</>
          ) : (
            <><ChevronDown className="w-3 h-3" /> +{items.length - maxVisible} more</>
          )}
        </button>
      )}
    </div>
  );
}

export function FiltersSidebar({
  params,
  meta,
  onMedicinalUse,
  onRegion,
  onType,
  onClear,
}: FiltersSidebarProps) {
  const activeCount = [params.medicinalUse, params.region, params.type].filter(Boolean).length;

  // Use facets from API when available, fall back to static list
  const medicinalUseItems =
    meta?.facets?.medicinalUse?.length
      ? meta.facets.medicinalUse
      : [
          { name: 'Immunity', count: 0 },
          { name: 'Digestive', count: 0 },
          { name: 'Stress Relief', count: 0 },
          { name: 'Anti-inflammatory', count: 0 },
          { name: 'Skin Care', count: 0 },
          { name: 'Respiratory', count: 0 },
        ];

  const regionItems =
    meta?.facets?.region?.length
      ? meta.facets.region
      : [
          { name: 'India', count: 0 },
          { name: 'Southeast Asia', count: 0 },
          { name: 'North Africa', count: 0 },
          { name: 'Middle East', count: 0 },
        ];

  const typeItems = meta?.facets?.type ?? [];

  return (
    <div className="bg-white rounded-2xl border-2 border-green-100 p-5 sticky top-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-green-900">Filters</h3>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-full transition-colors"
          >
            <X className="w-3 h-3" />
            Clear {activeCount}
          </button>
        )}
      </div>

      {/* Active filter pills */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {params.medicinalUse && (
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full">
              {params.medicinalUse}
              <button onClick={() => onMedicinalUse('')} aria-label="Remove filter" className="ml-0.5 hover:text-green-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {params.region && (
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full">
              {params.region}
              <button onClick={() => onRegion('')} aria-label="Remove filter" className="ml-0.5 hover:text-green-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {params.type && (
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full">
              {params.type}
              <button onClick={() => onType('')} aria-label="Remove filter" className="ml-0.5 hover:text-green-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      <div className="space-y-6">
        <FilterGroup
          title="Medicinal Use"
          items={medicinalUseItems}
          selected={params.medicinalUse}
          onSelect={onMedicinalUse}
        />
        <FilterGroup
          title="Region"
          items={regionItems}
          selected={params.region}
          onSelect={onRegion}
        />
        {typeItems.length > 0 && (
          <FilterGroup
            title="Plant Type"
            items={typeItems}
            selected={params.type}
            onSelect={onType}
          />
        )}
      </div>
    </div>
  );
}
