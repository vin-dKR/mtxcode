type LineVerdict = 'match' | 'edit' | 'empty';

interface Edit {
  inserted: number;
  deleted: number;
  paste: boolean;
}

export interface SessionStats {
  seconds: number;
  wpm: number;
  inserted: number;
  deleted: number;
  lines: number;
  matched: number | null;
  total: number | null;
}

function normalizedLines(text: string): string[] {
  return text.split(/\r\n?|\n/).map((line) => line.trim());
}

export function compareLines(input: string, reference: string) {
  const expected = normalizedLines(reference);
  let matched = 0;
  const lines = normalizedLines(input).map<LineVerdict>((line, index) => {
    if (!line) return 'empty';
    if (line !== expected[index]) return 'edit';
    matched += 1;
    return 'match';
  });
  return { lines, matched, total: expected.filter(Boolean).length };
}

export function createSession() {
  let startedAt: number | null = null;
  let inserted = 0;
  let deleted = 0;
  let result: SessionStats | undefined;

  function record(change: Edit): void {
    if (result || (!change.inserted && !change.deleted)) return;
    startedAt ??= performance.now();
    if (!change.paste) inserted += change.inserted;
    deleted += change.deleted;
  }

  function snapshot(text: string, reference?: string): SessionStats {
    if (result) return result;
    const seconds = startedAt === null ? 0 : (performance.now() - startedAt) / 1000;
    const comparison = reference === undefined ? null : compareLines(text, reference);
    return {
      seconds,
      wpm: seconds < 1 ? 0 : Math.round((inserted / 5) * (60 / seconds)),
      inserted,
      deleted,
      lines: normalizedLines(text).filter(Boolean).length,
      matched: comparison?.matched ?? null,
      total: comparison?.total ?? null,
    };
  }

  function finish(text: string, reference?: string, atSubmit?: SessionStats): SessionStats {
    result ??= atSubmit ?? snapshot(text, reference);
    return result;
  }

  return { record, snapshot, finish };
}
