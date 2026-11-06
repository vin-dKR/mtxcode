import { ArrowUpRight, Search } from 'lucide-react';
import { useState } from 'react';
import { cx, Dialog } from '../../components/ui';
import { drillCatalog, topicNames } from '../../core/catalog';
import type { Selection } from '../../types';

export default function Finder({ onClose, onOpen }: { onClose(): void; onOpen(selection: Selection): void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const words = query.trim().toLowerCase().split(/\s+/);
  const matches = drillCatalog.filter((drill) => {
    const searchable = `${drill.title} ${topicNames.get(drill.topic)} ${drill.languages}`.toLowerCase();
    return words.every((word) => searchable.includes(word));
  });

  return (
    <Dialog open onClose={onClose} title="Find a drill">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas px-3 text-muted focus-within:border-accent">
        <Search size={17} />
        <input data-dialog-autofocus type="search" value={query} role="combobox" aria-label="Search drills" aria-expanded="true"
          aria-controls="finder-results" aria-activedescendant={matches.length ? `finder-option-${active}` : undefined}
          placeholder="Debounce, promises, repair…" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-ink outline-none"
          onChange={(event) => { setQuery(event.currentTarget.value); setActive(0); }}
          onKeyDown={(event) => {
            if (!matches.length) return;
            if (event.key === 'Enter') { event.preventDefault(); onOpen(matches[active].selection); }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              const next = (active + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
              setActive(next);
              document.getElementById(`finder-option-${next}`)?.scrollIntoView({ block: 'nearest' });
            }
          }} />
      </div>
      <div id="finder-results" role="listbox" aria-label="Matching drills" className="my-2 grid max-h-[45dvh] gap-1 overflow-auto py-1">
        {matches.map((drill, index) => (
          <button type="button" id={`finder-option-${index}`} key={drill.id} role="option" aria-selected={index === active} tabIndex={-1}
            className={cx('flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-raised', active === index && 'bg-raised text-accent')}
            onClick={() => onOpen(drill.selection)}>
            <span className="min-w-0"><span className="block truncate font-semibold">{drill.title}</span><span className="block text-xs text-muted">{topicNames.get(drill.topic)}</span></span>
            <ArrowUpRight size={14} className="shrink-0" />
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">{matches.length ? 'Use ↑ and ↓ to move, then Enter to open.' : 'No drills match that search.'}</p>
    </Dialog>
  );
}
