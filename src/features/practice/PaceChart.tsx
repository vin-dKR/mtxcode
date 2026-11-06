import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '../../components/ui';
import type { PracticeResult } from '../../types';

type PacePoint = PracticeResult['points'][number];

function chartPoints(points: PacePoint[] = []): PacePoint[] {
  return points
    .filter(({ seconds, chars }) => Number.isFinite(seconds) && seconds >= 0 && Number.isFinite(chars) && chars >= 0)
    .sort((first, second) => first.seconds - second.seconds);
}

export function PaceChart({ points, ghost }: { points: PacePoint[]; ghost?: PacePoint[] }) {
  const current = chartPoints(points);
  const previous = chartPoints(ghost);
  if (!current.length) {
    return <p className="rounded-xl border border-line bg-canvas p-4 text-sm text-muted">No pace data was recorded for this run.</p>;
  }
  return <PaceReplay current={current} previous={previous} />;
}

function PaceReplay({ current, previous }: { current: PacePoint[]; previous: PacePoint[] }) {
  const currentEnd = current.at(-1)!.seconds;
  const duration = Math.max(currentEnd, previous.at(-1)?.seconds ?? 0);
  const peak = Math.max(1, ...current.map(point => point.chars), ...previous.map(point => point.chars));
  const [position, setPosition] = useState(currentEnd);
  const [playing, setPlaying] = useState(false);
  const hasMoved = useRef(false);
  const frame = useRef<number | undefined>(undefined);
  const gradientId = useId();
  const outputId = useId();

  useEffect(() => () => {
    if (frame.current !== undefined) window.cancelAnimationFrame(frame.current);
  }, []);

  function pause() {
    if (frame.current !== undefined) window.cancelAnimationFrame(frame.current);
    frame.current = undefined;
    setPlaying(false);
  }

  function togglePlayback() {
    if (playing) {
      pause();
      return;
    }
    const startPosition = !hasMoved.current || position >= duration ? 0 : position;
    const startTime = window.performance.now();
    hasMoved.current = true;
    setPosition(startPosition);
    setPlaying(true);

    function tick(now: number) {
      const nextPosition = Math.min(duration, startPosition + (now - startTime) / 1000);
      setPosition(nextPosition);
      if (nextPosition < duration) {
        frame.current = window.requestAnimationFrame(tick);
      } else {
        frame.current = undefined;
        setPlaying(false);
      }
    }

    frame.current = window.requestAnimationFrame(tick);
  }

  const left = 46;
  const right = 576;
  const top = 22;
  const bottom = 115;
  const x = (seconds: number) => left + (seconds / (duration || 1)) * (right - left);
  const y = (chars: number) => bottom - (chars / peak) * (bottom - top);

  function pathFor(series: PacePoint[]) {
    return series.map((point, index) => {
      const pointX = x(point.seconds).toFixed(1);
      const pointY = y(point.chars).toFixed(1);
      return index === 0 ? `M ${pointX} ${pointY}` : `H ${pointX} V ${pointY}`;
    }).join(' ');
  }

  const currentPath = pathFor(current);
  const currentLastX = x(currentEnd).toFixed(1);
  const currentFirstX = x(current[0].seconds).toFixed(1);
  let sampleIndex = current.length - 1;
  while (sampleIndex >= 0 && current[sampleIndex].seconds > position) sampleIndex--;
  const lastPoint = current[sampleIndex];
  const chars = lastPoint?.chars ?? 0;
  const runTime = Math.min(position, currentEnd);
  const readout = `${position.toFixed(1)} s · ${chars} chars`;
  const tickValues = [...new Set([0, Math.round(peak / 2), peak])];
  const tickClass = 'font-mono text-[18px] text-muted sm:text-[12px]';

  return (
    <div className="rounded-xl border border-line bg-canvas px-3 pb-3 pt-2 sm:px-4">
      <svg
        viewBox="0 0 596 143"
        role="img"
        aria-label={previous.length ? 'Recorded characters over time for this run and your personal ghost' : 'Recorded characters over time for this run'}
        className="w-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity=".22" className="text-accent" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-accent" />
          </linearGradient>
        </defs>
        {tickValues.map(value => (
          <g key={value}>
            <line x1={left} x2={right} y1={y(value)} y2={y(value)} stroke="currentColor" className="text-line" />
            <text x={left - 8} y={y(value) + 4} textAnchor="end" fill="currentColor" className={tickClass}>
              {value}
            </text>
          </g>
        ))}
        <text x={left + 4} y={top - 3} fill="currentColor" className={tickClass}>chars</text>
        <text x={left} y={bottom + 20} fill="currentColor" className={tickClass}>0 s</text>
        {duration > 0 ? (
          <text x={right} y={bottom + 20} textAnchor="end" fill="currentColor" className={tickClass}>
            {duration.toFixed(1)} s
          </text>
        ) : null}
        {current.length > 1 ? (
          <path d={`${currentPath} L ${currentLastX} ${bottom} L ${currentFirstX} ${bottom} Z`} fill={`url(#${gradientId})`} />
        ) : null}
        {previous.length ? (
          <path d={pathFor(previous)} fill="none" stroke="currentColor" strokeDasharray="5 5" strokeWidth="1.5" vectorEffect="non-scaling-stroke" className="text-muted" />
        ) : null}
        {previous.length === 1 ? (
          <circle cx={x(previous[0].seconds)} cy={y(previous[0].chars)} r="3" fill="currentColor" className="text-muted" />
        ) : null}
        <path d={currentPath} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" className="text-accent" />
        {current.length === 1 ? (
          <circle cx={x(current[0].seconds)} cy={y(current[0].chars)} r="3" fill="currentColor" className="text-accent" />
        ) : null}
        <line x1={x(position)} x2={x(position)} y1={top} y2={bottom} stroke="currentColor" className="text-accent opacity-50" />
        {lastPoint && position <= currentEnd ? (
          <circle cx={x(position)} cy={y(chars)} r="4" fill="currentColor" className="text-accent" />
        ) : null}
      </svg>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button variant="secondary" onClick={togglePlayback} disabled={!duration}>
          {playing ? 'Pause replay' : 'Play replay'}
        </Button>
        <input
          id={outputId}
          className="min-w-24 flex-1 accent-accent"
          type="range"
          min={0}
          max={duration}
          step="any"
          value={position}
          disabled={!duration}
          aria-label="Pace replay timeline"
          aria-valuetext={readout}
          onChange={event => {
            pause();
            hasMoved.current = true;
            setPosition(event.currentTarget.valueAsNumber);
          }}
        />
        <output htmlFor={outputId} aria-live="off" className="w-full font-mono text-[11px] tabular-nums text-muted sm:w-auto sm:text-xs">
          {readout}{runTime > 0 && lastPoint ? <span className="whitespace-nowrap"> · {(chars / runTime).toFixed(1)} chars/s avg</span> : null}
        </output>
      </div>
      {previous.length ? (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-2.5 font-mono text-[11px] text-muted">
          <span className="flex items-center gap-1.5"><span aria-hidden="true" className="w-4 border-t-2 border-accent" />This run</span>
          <span className="flex items-center gap-1.5"><span aria-hidden="true" className="w-4 border-t-2 border-dashed border-muted" />Personal ghost</span>
        </div>
      ) : null}
    </div>
  );
}
