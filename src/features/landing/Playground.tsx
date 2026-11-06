import { useLayoutEffect, useMemo, useSyncExternalStore } from 'react';
import { Braces, Eye, RotateCcw } from 'lucide-react';
import { Badge, Button } from '../../components/ui';
import { CodeCheckTrack, CodePeek } from '../practice/CodeCheckTrack';
import { ResultDialog } from '../practice/ResultDialog';
import { usePractice } from '../practice/usePractice';
import { nextCodeCheck } from '../../core/catalog';
import { getLanguage } from '../../core/languages';
import type { Language, Selection, WorkspaceProps } from '../../types';

function EditorMode({ live }: { live: ReturnType<typeof usePractice>['live'] }) {
  const { vim } = useSyncExternalStore(live.subscribe, live.getSnapshot);
  return <span className="text-[10px] text-muted">{vim === 'off' ? 'Spaces: 4' : vim === 'normal' ? 'Vim Normal · i to insert' : `Vim ${vim}`}</span>;
}

export default function Playground({ onRecall, onOpen, ...props }: WorkspaceProps & {
  onRecall(): void;
  onOpen(selection: Selection, language?: Language): void;
}) {
  const { editor, host, live, location, result, referenceOpen, setReferenceOpen, submit, closeResult, jumpToLine, switchRun } = usePractice(props);
  const challenge = props.selection.kind === 'practice' ? props.selection.challenge : undefined;
  const source = challenge?.solutions[location.language];
  const lines = useMemo(() => {
    const all = source?.split('\n') ?? [];
    return location.range ? all.slice(location.range.start - 1, location.range.end) : all;
  }, [source, location.range]);
  const next = challenge && !location.range ? nextCodeCheck(challenge.id, location.language) : undefined;

  useLayoutEffect(() => {
    editor.current?.setInlineReference(lines);
  }, [editor, lines]);

  return (
    <section aria-label="Featured live playground" className="overflow-hidden rounded-2xl border border-accent/25 bg-surface shadow-2xl shadow-black/20">
      <CodeCheckTrack live={live} lines={lines} offset={location.range ? location.range.start - 1 : 0} />
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-raised/55 px-3 py-1.5 sm:px-5">
        <span className="flex min-w-0 flex-wrap items-center gap-2 font-mono text-xs font-semibold"><Braces size={15} className="text-accent" />practice.{getLanguage(location.language).extension}
          <EditorMode live={live} />
          {location.range ? <Badge>LINES {location.range.start}–{location.range.end}</Badge> : null}
        </span>
        <div className="flex flex-wrap gap-1">
          <Button variant="ghost" aria-haspopup="dialog" onClick={() => setReferenceOpen(true)} className="min-h-8 px-2 text-xs"><Eye size={14} /> Peek at code</Button>
          <Button variant="ghost" aria-label="Restart featured run" onClick={() => switchRun(location, true)} className="min-h-8 px-2"><RotateCcw size={14} /></Button>
          {location.range ? <Button variant="ghost" onClick={() => switchRun({ ...location, range: null })} className="min-h-8 px-2 text-xs">Full drill</Button> : null}
        </div>
      </div>
      <div ref={host} className="h-[clamp(180px,29dvh,280px)] min-w-0" />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-raised/55 px-3 py-2 sm:px-5">
        <Button variant="ghost" className="min-h-8 px-2 text-xs" onClick={() => editor.current?.focus()}>Focus editor <span aria-hidden="true">↵</span></Button>
        <Button variant="secondary" className="min-h-8 text-xs" onClick={() => { void submit(); }}>Finish run</Button>
      </div>
      <CodePeek lines={lines} open={referenceOpen} onClose={() => { setReferenceOpen(false); window.requestAnimationFrame(() => editor.current?.focus()); }} />
      <ResultDialog result={result} onClose={() => closeResult()} onJump={jumpToLine} onRestart={() => switchRun(location, true)}
        onRepeat={(range) => switchRun({ ...location, mode: 'guided', range }, true)} onRecall={onRecall}
        onNext={next ? () => onOpen(next, location.language) : undefined} />
    </section>
  );
}
