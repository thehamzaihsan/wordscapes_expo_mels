export type Cell = string | null;
export type Grid = Cell[][];
type Dir = "across" | "down";

interface Placement {
  word: string;
  x: number; // start column (int)
  y: number; // start row (int)
  dir: Dir;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface Layout {
  placements: Placement[];
  gridMap: Map<number, string>; // packed coordinate => letter
  bounds: Bounds;
  crossings: number; // number of shared (intersection) cells
  detached: number; // words placed without touching the rest
}

// Pack (x, y) into one integer key — avoids allocating a string per lookup,
// which keeps generation fast and GC-quiet. Coordinates stay well inside
// [-OFFSET, OFFSET) for any 20-word input.
const OFFSET = 512;
const KEY = (x: number, y: number) => (x + OFFSET) * 1024 + (y + OFFSET);

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32) seeded from the word list, so the same
// level always produces the same layout across sessions/devices.
// ---------------------------------------------------------------------------
function hashWords(words: string[]): number {
  const s = [...words].sort().join("|");
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Placement validity (classic crossword adjacency rules):
// - every overlapping cell must hold the same letter (a crossing)
// - cells that introduce a new letter must not touch other words sideways
// - the cell before the start and after the end must be empty
// Returns the number of crossings, or -1 if the placement is invalid.
// ---------------------------------------------------------------------------
function tryPlacement(
  gridMap: Map<number, string>,
  word: string,
  startX: number,
  startY: number,
  dir: Dir
): number {
  const dx = dir === "across" ? 1 : 0;
  const dy = dir === "down" ? 1 : 0;

  const beforeKey = KEY(startX - dx, startY - dy);
  if (gridMap.has(beforeKey)) return -1;
  const afterKey = KEY(startX + dx * word.length, startY + dy * word.length);
  if (gridMap.has(afterKey)) return -1;

  let crossings = 0;
  for (let i = 0; i < word.length; i++) {
    const x = startX + dx * i;
    const y = startY + dy * i;
    const existing = gridMap.get(KEY(x, y));
    if (existing !== undefined) {
      if (existing !== word[i]) return -1;
      crossings++;
      continue;
    }
    // new letter: must not run alongside an existing word
    if (dir === "across") {
      if (gridMap.has(KEY(x, y - 1)) || gridMap.has(KEY(x, y + 1))) return -1;
    } else {
      if (gridMap.has(KEY(x - 1, y)) || gridMap.has(KEY(x + 1, y))) return -1;
    }
  }
  return crossings;
}

function commitPlacement(layout: Layout, p: Placement, crossings: number) {
  const dx = p.dir === "across" ? 1 : 0;
  const dy = p.dir === "down" ? 1 : 0;
  for (let i = 0; i < p.word.length; i++) {
    const x = p.x + dx * i;
    const y = p.y + dy * i;
    layout.gridMap.set(KEY(x, y), p.word[i]);
    if (x < layout.bounds.minX) layout.bounds.minX = x;
    if (x > layout.bounds.maxX) layout.bounds.maxX = x;
    if (y < layout.bounds.minY) layout.bounds.minY = y;
    if (y > layout.bounds.maxY) layout.bounds.maxY = y;
  }
  layout.placements.push(p);
  layout.crossings += crossings;
}

function boundsAfter(b: Bounds, p: Placement): Bounds {
  const endX = p.x + (p.dir === "across" ? p.word.length - 1 : 0);
  const endY = p.y + (p.dir === "down" ? p.word.length - 1 : 0);
  return {
    minX: Math.min(b.minX, p.x),
    minY: Math.min(b.minY, p.y),
    maxX: Math.max(b.maxX, endX),
    maxY: Math.max(b.maxY, endY),
  };
}

// ---------------------------------------------------------------------------
// Greedy connected placement: enumerate every crossing of `word` with the
// words already placed, keep the highest-scoring valid one.
// ---------------------------------------------------------------------------
function placeBestConnected(
  layout: Layout,
  word: string,
  rng: () => number
): boolean {
  let best: Placement | null = null;
  let bestCrossings = 0;
  let bestScore = -Infinity;

  for (const placed of layout.placements) {
    const perpDir: Dir = placed.dir === "across" ? "down" : "across";
    for (let i = 0; i < placed.word.length; i++) {
      const cellX = placed.x + (placed.dir === "across" ? i : 0);
      const cellY = placed.y + (placed.dir === "down" ? i : 0);
      for (let j = 0; j < word.length; j++) {
        if (placed.word[i] !== word[j]) continue;
        const startX = perpDir === "across" ? cellX - j : cellX;
        const startY = perpDir === "down" ? cellY - j : cellY;

        const crossings = tryPlacement(layout.gridMap, word, startX, startY, perpDir);
        if (crossings < 0) continue;

        const p: Placement = { word, x: startX, y: startY, dir: perpDir };
        const nb = boundsAfter(layout.bounds, p);
        const w = nb.maxX - nb.minX + 1;
        const h = nb.maxY - nb.minY + 1;
        // Prefer: more crossings, smaller area, squarer shape.
        // Small random jitter diversifies the candidates we compare later.
        const score =
          crossings * 120 - w * h * 2 - Math.abs(w - h) * 5 + rng() * 8;
        if (score > bestScore) {
          bestScore = score;
          best = p;
          bestCrossings = crossings;
        }
      }
    }
  }

  if (!best) return false;
  commitPlacement(layout, best, bestCrossings);
  return true;
}

// Last-resort placement for a word that shares no usable letter with the
// grid: put it as close to the existing words as adjacency rules allow.
function placeDetached(layout: Layout, word: string): boolean {
  const b = layout.bounds;
  for (let margin = 2; margin <= 6; margin += 2) {
    let best: Placement | null = null;
    let bestArea = Infinity;
    for (const dir of ["across", "down"] as Dir[]) {
      const lenX = dir === "across" ? word.length - 1 : 0;
      const lenY = dir === "down" ? word.length - 1 : 0;
      for (let y = b.minY - margin; y <= b.maxY + margin; y++) {
        for (let x = b.minX - margin; x <= b.maxX + margin; x++) {
          if (tryPlacement(layout.gridMap, word, x, y, dir) !== 0) continue;
          const nb = boundsAfter(b, { word, x, y, dir });
          const area = (nb.maxX - nb.minX + 1) * (nb.maxY - nb.minY + 1);
          if (area < bestArea) {
            bestArea = area;
            best = { word, x, y, dir };
          }
        }
      }
    }
    if (best) {
      commitPlacement(layout, best, 0);
      layout.detached++;
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Build one candidate layout for a given word order.
// ---------------------------------------------------------------------------
function buildCandidate(
  order: string[],
  rng: () => number,
  allowDetached: boolean
): Layout | null {
  const first = order[0];
  const dir: Dir = rng() < 0.5 ? "across" : "down";
  const layout: Layout = {
    placements: [],
    gridMap: new Map(),
    bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    crossings: 0,
    detached: 0,
  };
  commitPlacement(layout, { word: first, x: 0, y: 0, dir }, 0);

  // Deferral queue: words that can't connect yet get retried after others
  // have been placed (later words may open up new crossing letters).
  let pending = order.slice(1);
  let prev = Infinity;
  while (pending.length > 0 && pending.length < prev) {
    prev = pending.length;
    const next: string[] = [];
    for (const word of pending) {
      if (!placeBestConnected(layout, word, rng)) next.push(word);
    }
    pending = next;
  }

  for (const word of pending) {
    if (!allowDetached) return null;
    if (!placeDetached(layout, word)) return null;
  }
  return layout;
}

function scoreLayout(layout: Layout): number {
  const w = layout.bounds.maxX - layout.bounds.minX + 1;
  const h = layout.bounds.maxY - layout.bounds.minY + 1;
  return (
    layout.crossings * 60 -
    w * h * 2 -
    Math.abs(w - h) * 6 -
    layout.detached * 800
  );
}

// Shuffle, then stable-sort by length descending: longest words go first but
// ties are broken differently on every candidate for variety.
function randomizedOrder(words: string[], rng: () => number): string[] {
  const arr = [...words];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.sort((a, b) => b.length - a.length);
}

// ---------------------------------------------------------------------------
// Public API (unchanged): returns a tight rectangular grid of uppercase
// letters / nulls, or null when nothing could be placed.
// ---------------------------------------------------------------------------
export function generateCrossword(words: string[]): Grid | null {
  if (!Array.isArray(words) || words.length === 0) return null;
  if (words.length > 20) throw new Error("generateCrossword accepts up to 20 words");

  const list = words.map((w) => w.toUpperCase());
  const rng = mulberry32(hashWords(list));

  // Deterministic work cap: candidate count shrinks as word count grows so
  // generation stays a few ms even for the 20-word maximum. No wall-clock
  // cutoffs — the same input always yields the same layout on any device.
  const CANDIDATES = list.length <= 8 ? 28 : list.length <= 12 ? 16 : 8;

  let best: Layout | null = null;
  let bestScore = -Infinity;

  for (let c = 0; c < CANDIDATES; c++) {
    // First pass over the candidates requires full connectivity; if that
    // never succeeds, later candidates may fall back to detached placement.
    const allowDetached = best === null && c >= CANDIDATES / 2;
    const layout = buildCandidate(randomizedOrder(list, rng), rng, allowDetached);
    if (!layout) continue;
    const score = scoreLayout(layout);
    if (score > bestScore) {
      bestScore = score;
      best = layout;
    }
  }

  // Absolute fallback: place whatever fits, starting from the longest word.
  if (!best) {
    best = buildCandidate(
      [...list].sort((a, b) => b.length - a.length),
      rng,
      true
    );
  }
  if (!best || best.gridMap.size === 0) return null;

  return renderGrid(best);
}

// Render the layout into a tight Grid: no outer padding, and any fully-empty
// run of rows/columns (only possible around detached words) is compressed to
// a single empty row/column.
function renderGrid(layout: Layout): Grid {
  const points: { x: number; y: number; ch: string }[] = [];
  for (const [k, ch] of layout.gridMap.entries()) {
    points.push({ x: Math.floor(k / 1024) - OFFSET, y: (k % 1024) - OFFSET, ch });
  }

  const xs = Array.from(new Set(points.map((p) => p.x))).sort((a, b) => a - b);
  const ys = Array.from(new Set(points.map((p) => p.y))).sort((a, b) => a - b);

  const xMap = new Map<number, number>();
  const yMap = new Map<number, number>();
  let cx = 0;
  for (let i = 0; i < xs.length; i++) {
    xMap.set(xs[i], cx);
    if (i < xs.length - 1) cx += Math.min(xs[i + 1] - xs[i], 2);
  }
  let cy = 0;
  for (let i = 0; i < ys.length; i++) {
    yMap.set(ys[i], cy);
    if (i < ys.length - 1) cy += Math.min(ys[i + 1] - ys[i], 2);
  }

  const width = cx + 1;
  const height = cy + 1;
  const out: Grid = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => null as Cell)
  );
  for (const { x, y, ch } of points) {
    out[yMap.get(y) as number][xMap.get(x) as number] = ch;
  }
  return out;
}
