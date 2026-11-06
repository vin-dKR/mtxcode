export type PacePoint = { seconds: number; chars: number };

export function compactTrace(points: PacePoint[], max = 160): PacePoint[] {
  const limit = Number.isFinite(max) ? Math.max(2, Math.floor(max)) : points.length;
  if (points.length <= limit) return points.slice();
  return Array.from({ length: limit }, (_, index) => {
    return points[Math.round(index * (points.length - 1) / (limit - 1))];
  });
}
