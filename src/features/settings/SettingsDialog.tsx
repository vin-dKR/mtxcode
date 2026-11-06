import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Check, ChevronDown, Keyboard, Palette, Search, Trash2 } from 'lucide-react';
import { Button, Dialog, cx } from '../../components/ui';
import type { VimMapping } from '../../core/editor';
import type { SaveKey, Settings } from '../../types';
import { THEMES } from '../../core/themes';
import { vimBindings } from './vim-reference';

const TABS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'keybindings', label: 'Keybindings', icon: Keyboard },
] as const;

export type SettingsTab = (typeof TABS)[number]['id'];

const SAVE_KEYS: Record<SaveKey, string> = {
  'Mod-s': 'Ctrl / ⌘ + S',
  'Mod-Enter': 'Ctrl / ⌘ + Enter',
  'Alt-s': 'Alt + S',
};

const inputClass = 'mt-1 block min-h-10 w-full min-w-0 rounded-lg border border-line bg-canvas px-3 text-sm text-ink placeholder:text-muted';

interface SettingsControls {
  settings: Settings;
  onChange(settings: Settings): void;
}

interface SettingsDialogProps extends SettingsControls {
  open: boolean;
  onClose(): void;
  initialTab?: SettingsTab;
}

export default function SettingsDialog({ open, onClose, initialTab = 'appearance', ...controls }: SettingsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Settings" description="Make the workspace your own." className="sm:max-w-2xl">
      {open && <SettingsContent key={initialTab} initialTab={initialTab} {...controls} />}
    </Dialog>
  );
}

function SettingsContent({ initialTab, settings, onChange }: SettingsControls & { initialTab: SettingsTab }) {
  const [tab, setTab] = useState(initialTab);
  const tablist = useRef<HTMLDivElement>(null);
  const id = useId();

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    let next: SettingsTab;
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
        next = tab === 'appearance' ? 'keybindings' : 'appearance';
        break;
      case 'Home':
        next = 'appearance';
        break;
      case 'End':
        next = 'keybindings';
        break;
      default:
        return;
    }
    event.preventDefault();
    setTab(next);
    tablist.current?.querySelector<HTMLButtonElement>(`[data-tab="${next}"]`)?.focus();
  }

  return (
    <>
      <div ref={tablist} role="tablist" aria-label="Settings sections" className="mb-5 flex gap-1 border-b border-line">
        {TABS.map(({ id: value, label, icon: Icon }) => (
          <button
            key={value}
            id={`${id}-tab-${value}`}
            data-tab={value}
            type="button"
            role="tab"
            aria-controls={`${id}-panel-${value}`}
            aria-selected={tab === value}
            tabIndex={tab === value ? 0 : -1}
            onClick={() => setTab(value)}
            onKeyDown={handleTabKey}
            className={cx(
              'inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors',
              tab === value ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            <Icon size={15} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div id={`${id}-panel-appearance`} role="tabpanel" aria-labelledby={`${id}-tab-appearance`} hidden={tab !== 'appearance'}>
        <ThemePicker settings={settings} onChange={onChange} />
      </div>
      <div id={`${id}-panel-keybindings`} role="tabpanel" aria-labelledby={`${id}-tab-keybindings`} hidden={tab !== 'keybindings'}>
        {tab === 'keybindings' && <Keybindings settings={settings} onChange={onChange} />}
      </div>
    </>
  );
}

function ThemePicker({ settings, onChange }: SettingsControls) {
  const name = useId();
  return (
    <fieldset className="min-w-0">
      <legend className="text-[1rem] font-semibold text-ink">Color theme</legend>
      <p className="mb-4 mt-1 text-sm text-muted">Applies to the editor and the rest of the workspace.</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {THEMES.map((theme) => {
          const selected = settings.theme === theme.id;
          return (
            <label key={theme.id} className="group relative min-w-0 cursor-pointer">
              <input
                className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0"
                type="radio"
                name={name}
                value={theme.id}
                checked={selected}
                aria-label={theme.name}
                aria-describedby={`${name}-${theme.id}-description`}
                onChange={() => onChange({ ...settings, theme: theme.id })}
              />
              <span className={cx(
                'relative flex h-full flex-col gap-2 rounded-xl border bg-raised p-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
                selected ? 'border-accent' : 'border-line group-hover:border-accent/60',
              )}>
                <span data-theme={theme.id} aria-hidden="true" className="block overflow-hidden rounded-md border border-line bg-surface">
                  <span className="flex h-4 items-center gap-0.5 border-b border-line bg-canvas px-1.5">
                    <span className="size-1 rounded-full bg-accent" />
                    <span className="size-1 rounded-full bg-muted/60" />
                    <span className="size-1 rounded-full bg-muted/30" />
                  </span>
                  <span className="grid min-h-12 content-center gap-1 px-2 py-2">
                    <span className="flex items-center gap-1">
                      <span className="h-[3px] w-3 rounded-full bg-(--kc-syntax-keyword)" />
                      <span className="h-[3px] w-7 rounded-full bg-(--kc-syntax-function)" />
                    </span>
                    <span className="ml-2 flex items-center gap-1">
                      <span className="h-[3px] w-2 rounded-full bg-(--kc-syntax-number)" />
                      <span className="h-[3px] w-7 rounded-full bg-(--kc-syntax-string)" />
                    </span>
                    <span className="h-[3px] w-2 rounded-full bg-(--kc-syntax-keyword)" />
                  </span>
                </span>
                {selected && (
                  <span aria-hidden="true" className="absolute right-3 top-3 grid size-4 place-items-center rounded-full bg-accent text-on-accent">
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
                <span className="px-0.5 pb-0.5">
                  <span className="block text-sm font-semibold leading-tight text-ink">{theme.name}</span>
                  <span id={`${name}-${theme.id}-description`} className="mt-1 block text-[11px] leading-tight text-muted">{theme.description}</span>
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Keybindings({ settings, onChange }: SettingsControls) {
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<VimMapping['mode']>('insert');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const fromInput = useRef<HTMLInputElement>(null);
  const vimDescription = useId();

  function saveMapping(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const mapping = { mode, from: from.trim(), to: to.trim() };
    if (!mapping.from || !mapping.to || mapping.from === mapping.to) {
      setMessage('Enter two different Vim key sequences.');
      return;
    }
    if (mapping.from.startsWith(':') && mapping.from.length > 1) {
      setMessage('Choose a key sequence as the trigger. Ex commands can be used in the Command field.');
      return;
    }
    const updated = settings.mappings.some((item) => item.mode === mode && item.from === mapping.from);
    const mappings = settings.mappings.filter((item) => item.mode !== mode || item.from !== mapping.from);
    onChange({ ...settings, mappings: [...mappings, mapping] });
    setFrom('');
    setTo('');
    setMessage(updated ? 'Mapping updated.' : 'Mapping saved.');
    fromInput.current?.focus();
  }

  function removeMapping(mapping: VimMapping) {
    onChange({ ...settings, mappings: settings.mappings.filter((item) => item !== mapping) });
    setMessage(`Removed ${mapping.from} mapping.`);
    fromInput.current?.focus();
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-xl border border-line bg-canvas/50 p-3.5 sm:p-4">
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span className="block text-sm font-semibold text-ink">Vim mode</span>
            <span id={vimDescription} className="mt-0.5 block text-sm text-muted">Use modal editing in the code editor.</span>
          </span>
          <span className="relative shrink-0">
            <input
              type="checkbox"
              role="switch"
              checked={settings.vim}
              aria-label="Vim mode"
              aria-describedby={vimDescription}
              onChange={(event) => onChange({ ...settings, vim: event.target.checked })}
              className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0"
            />
            <span aria-hidden="true" className="relative block h-6 w-10 rounded-full border border-line bg-raised after:absolute after:left-0.5 after:top-0.5 after:size-4.5 after:rounded-full after:bg-muted after:transition-transform peer-checked:border-accent peer-checked:bg-accent peer-checked:after:translate-x-4 peer-checked:after:bg-on-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent" />
          </span>
        </label>
        <div className="mt-3 border-t border-line pt-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <label className="block text-sm font-semibold text-ink sm:contents">
            <span className="block">
              Save shortcut
              <span className="mt-0.5 block font-normal text-muted">Save and score an active drill. In Vim, you can also use <code className="text-ink">:w</code>.</span>
            </span>
            <select
              aria-label="Save shortcut"
              value={settings.saveKey}
              onChange={(event) => onChange({ ...settings, saveKey: event.target.value as SaveKey })}
              className={`${inputClass} sm:mt-0 sm:w-auto`}
            >
              {Object.entries(SAVE_KEYS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <form onSubmit={saveMapping} className="rounded-xl border border-line bg-canvas/50 p-3.5 sm:p-4">
        <h3 className="text-sm font-semibold text-ink">Custom Vim mappings</h3>
        <p className="mt-1 text-sm text-muted">
          Use Vim notation. For example, map <code className="text-ink">jk</code> to <code className="text-ink">&lt;Esc&gt;</code> in Insert mode.
        </p>
        <div className="mt-3 grid grid-cols-2 items-end gap-2 sm:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="block text-xs font-medium text-muted">
            Mode
            <select value={mode} onChange={(event) => setMode(event.target.value as VimMapping['mode'])} className={inputClass}>
              <option value="insert">Insert</option>
              <option value="normal">Normal</option>
              <option value="visual">Visual</option>
            </select>
          </label>
          <label className="block text-xs font-medium text-muted">
            Keys
            <input ref={fromInput} value={from} onChange={(event) => setFrom(event.target.value)} className={`${inputClass} font-mono`} maxLength={32} placeholder="jk" autoComplete="off" autoCapitalize="off" spellCheck={false} required />
          </label>
          <label className="block text-xs font-medium text-muted">
            Command
            <input value={to} onChange={(event) => setTo(event.target.value)} className={`${inputClass} font-mono`} maxLength={64} placeholder="<Esc>" autoComplete="off" autoCapitalize="off" spellCheck={false} required />
          </label>
          <Button variant="primary" type="submit" className="min-h-10">Save mapping</Button>
        </div>
        <p className={cx('text-xs text-muted', message && 'mt-2')} role="status">{message}</p>
        {settings.mappings.length > 0 && (
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {settings.mappings.map((mapping) => (
              <li key={`${mapping.mode}:${mapping.from}`} className="flex min-h-11 items-center justify-between gap-2 text-sm">
                <span className="min-w-0 break-all">
                  <span className="mr-2 text-xs capitalize text-muted">{mapping.mode}</span>
                  <code>{mapping.from}</code> <span className="text-muted">→</span> <code>{mapping.to}</code>
                </span>
                <Button variant="ghost" aria-label={`Remove ${mapping.from} mapping in ${mapping.mode} mode`} className="shrink-0 px-2" onClick={() => removeMapping(mapping)}>
                  <Trash2 size={15} aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </form>

      <VimReference />
      <p className="text-xs leading-relaxed text-muted">
        Press <kbd className="text-ink">Esc</kbd> then <kbd className="text-ink">Tab</kbd> to leave the editor.
        {' '}<a href="https://vimhelp.org/index.txt.html" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">Native Vim manual<span aria-hidden="true"> ↗</span></a>
      </p>
    </div>
  );
}

const searchableBindings = vimBindings.map((binding) => ({ binding, search: binding.join(' ').toLowerCase() }));

function VimReference() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const terms = query.trim().toLowerCase().split(/\s+/);
  const bindings = open ? searchableBindings.filter(({ search }) => terms.every((term) => search.includes(term))) : [];

  return (
    <details onToggle={(event) => setOpen(event.currentTarget.open)} className="group rounded-xl border border-line bg-canvas/50">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-3.5 py-3 text-sm font-semibold text-ink hover:bg-raised sm:px-4 [&::-webkit-details-marker]:hidden">
        <span>Built-in browser Vim bindings</span>
        <span className="ml-auto rounded-full border border-line bg-raised px-2 py-0.5 font-mono text-xs font-normal text-muted">{vimBindings.length}</span>
        <ChevronDown size={15} className="text-muted group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-line px-3.5 pb-3.5 pt-3 sm:px-4 sm:pb-4">
        <p className="mb-3 text-sm text-muted">Browser and system shortcuts can take precedence over these editor bindings.</p>
        <label className="relative block">
          <span className="sr-only">Filter Vim bindings</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-3 text-muted" aria-hidden="true" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by keys, mode, or command" className={`${inputClass} pl-9`} />
        </label>
        <p className="my-2 text-xs text-muted" role="status">{bindings.length} of {vimBindings.length} bindings</p>
        <div className="max-h-56 overflow-auto rounded-lg border border-line" role="region" aria-label="Vim binding results" tabIndex={0}>
          <table className="w-full border-collapse text-left text-xs">
            <caption className="sr-only">Default browser Vim bindings</caption>
            <thead className="sticky top-0 bg-raised text-muted">
              <tr><th scope="col" className="px-2.5 py-2">Keys</th><th scope="col" className="px-2.5 py-2">Mode</th><th scope="col" className="px-2.5 py-2">Command</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {bindings.map(({ binding: [keys, context, command] }) => (
                <tr key={`${keys}:${context}:${command}`}>
                  <td className="px-2.5 py-2 text-accent"><code>{keys}</code></td>
                  <td className="px-2.5 py-2 capitalize text-muted">{context}</td>
                  <td className="px-2.5 py-2 text-ink">{command}</td>
                </tr>
              ))}
              {bindings.length === 0 && <tr><td colSpan={3} className="px-2.5 py-4 text-muted">No matching bindings.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}
