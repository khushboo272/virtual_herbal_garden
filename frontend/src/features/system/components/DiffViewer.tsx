import React from 'react';

interface DiffViewerProps {
  oldValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ oldValue, newValue }) => {
  if (!oldValue && !newValue) {
    return <p className="text-xs text-gray-500 italic">No details recorded for this event.</p>;
  }

  // Find all unique keys
  const keys = Array.from(
    new Set([...Object.keys(oldValue || {}), ...Object.keys(newValue || {})]),
  );

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
      <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 p-2.5 font-semibold text-gray-700">
        <div>Property</div>
        <div>Before (Old Value)</div>
        <div>After (New Value)</div>
      </div>
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {keys.map((key) => {
          const oldVal = oldValue ? oldValue[key] : undefined;
          const newVal = newValue ? newValue[key] : undefined;
          const isChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);

          return (
            <div
              key={key}
              className={`grid grid-cols-3 p-2.5 items-start ${
                isChanged ? 'bg-amber-50/40' : 'hover:bg-gray-50'
              }`}
            >
              <div className="font-mono text-gray-600 font-medium break-all">{key}</div>
              <div className="font-mono text-red-600/90 break-all pr-2">
                {oldVal !== undefined ? (
                  typeof oldVal === 'object' && oldVal !== null ? (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(oldVal, null, 2)}</pre>
                  ) : (
                    String(oldVal)
                  )
                ) : (
                  <span className="text-gray-400 italic">none</span>
                )}
              </div>
              <div className="font-mono text-emerald-700 font-medium break-all pl-2">
                {newVal !== undefined ? (
                  typeof newVal === 'object' && newVal !== null ? (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(newVal, null, 2)}</pre>
                  ) : (
                    String(newVal)
                  )
                ) : (
                  <span className="text-gray-400 italic">none</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
