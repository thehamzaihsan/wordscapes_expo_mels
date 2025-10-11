// hooks/crossword-gen.ts
export type Cell = string | null;
export type Grid = Cell[][];
type Dir = "across" | "down";

interface Placement {
  word: string;
  x: number; // start column (int)
  y: number; // start row (int)
  dir: Dir;
}

const KEY = (x: number, y: number) => `${x},${y}`;

export function generateCrossword(words: string[]): Grid | null {
  if (!Array.isArray(words) || words.length === 0) return null;
  if (words.length > 10) throw new Error("generateCrossword accepts up to 10 words");

  // normalize + sort longest first (better chance to place)
  const list = [...words].map(w => w.toUpperCase()).sort((a, b) => b.length - a.length);

  // constraints to avoid runaway grid growth
  const MAX_COORD = 40; // allowed coordinates range [-MAX_COORD, MAX_COORD]
  const MAX_ATTEMPTS = 20000; // global trial limit (safe guard)

  let attemptCount = 0;

  const placements: Placement[] = [];
  const gridMap = new Map<string, string>(); // key => letter

  const inBounds = (x: number, y: number) =>
    Math.abs(x) <= MAX_COORD && Math.abs(y) <= MAX_COORD;

  function setLetter(x: number, y: number, ch: string) {
    gridMap.set(KEY(x, y), ch);
  }
  function getLetter(x: number, y: number): string | undefined {
    return gridMap.get(KEY(x, y));
  }

  function placePlacement(p: Placement) {
    for (let i = 0; i < p.word.length; i++) {
      const x = p.x + (p.dir === "across" ? i : 0);
      const y = p.y + (p.dir === "down" ? i : 0);
      setLetter(x, y, p.word[i]);
    }
    placements.push(p);
  }

  function rebuildGridMapFromPlacements() {
    gridMap.clear();
    for (const p of placements) {
      for (let i = 0; i < p.word.length; i++) {
        const x = p.x + (p.dir === "across" ? i : 0);
        const y = p.y + (p.dir === "down" ? i : 0);
        setLetter(x, y, p.word[i]);
      }
    }
  }

  function removePlacement(word: string) {
    const idx = placements.findIndex(p => p.word === word);
    if (idx >= 0) {
      placements.splice(idx, 1);
      rebuildGridMapFromPlacements();
    }
  }

  // Check if a proposed placement is valid according to crossword adjacency rules:
  // - letters must match existing letters where they overlap.
  // - cannot touch other letters orthogonally except at overlap cells.
  // - start-1 and end+1 in same direction must be empty (prevents chained words).
  function canPlace(word: string, startX: number, startY: number, dir: Dir): boolean {
    // bounds check for whole word
    const endX = startX + (dir === "across" ? word.length - 1 : 0);
    const endY = startY + (dir === "down" ? word.length - 1 : 0);
    if (!inBounds(startX, startY) || !inBounds(endX, endY)) return false;

    for (let i = 0; i < word.length; i++) {
      const x = startX + (dir === "across" ? i : 0);
      const y = startY + (dir === "down" ? i : 0);

      const existing = getLetter(x, y);
      if (existing !== undefined && existing !== word[i]) return false;

      // If there's no existing letter at this cell, ensure there are no adjacent letters
      // orthogonally (they would touch illegally).
      if (existing === undefined) {
        // orthogonal neighbors must be empty
        const neighbors = dir === "across"
          ? [getLetter(x, y - 1), getLetter(x, y + 1)]
          : [getLetter(x - 1, y), getLetter(x + 1, y)];
        if (neighbors.some(n => n !== undefined)) return false;
      }
    }

    // cells immediately before and after the word must be empty (prevents joining words)
    const beforeX = startX + (dir === "across" ? -1 : 0);
    const beforeY = startY + (dir === "down" ? -1 : 0);
    const afterX = endX + (dir === "across" ? 1 : 0);
    const afterY = endY + (dir === "down" ? 1 : 0);
    if (getLetter(beforeX, beforeY) !== undefined) return false;
    if (getLetter(afterX, afterY) !== undefined) return false;

    return true;
  }

  // Backtracking attempt
  function backtrack(index: number): boolean {
    if (attemptCount++ > MAX_ATTEMPTS) return false;
    if (index >= list.length) return true;

    const word = list[index];

    // special-case: place first word centered at (0,0) horizontally to create base
    if (index === 0) {
      const startX = Math.max(-MAX_COORD, Math.min(MAX_COORD - word.length + 1, 0));
      const startY = 0;
      const p: Placement = { word, x: startX, y: startY, dir: "across" };
      if (!canPlace(word, p.x, p.y, p.dir)) {
        return false;
      }
      placePlacement(p);
      if (backtrack(index + 1)) return true;
      removePlacement(word);
      return false;
    }

    // Try to place word by crossing each already-placed word (perpendicular only)
    for (const placed of placements) {
      for (let i = 0; i < placed.word.length; i++) {
        for (let j = 0; j < word.length; j++) {
          if (placed.word[i] !== word[j]) continue; // must match at crossing letter

          // compute crossing coordinates
          const crossX = placed.x + (placed.dir === "across" ? i : 0);
          const crossY = placed.y + (placed.dir === "down" ? i : 0);

          // perpendicular direction
          const dir: Dir = placed.dir === "across" ? "down" : "across";

          // compute candidate start so that word[j] lands at crossX,crossY
          const startX = dir === "across" ? crossX - j : crossX;
          const startY = dir === "down" ? crossY - j : crossY;

          if (!inBounds(startX, startY)) continue;
          const endX = startX + (dir === "across" ? word.length - 1 : 0);
          const endY = startY + (dir === "down" ? word.length - 1 : 0);
          if (!inBounds(endX, endY)) continue;

          if (!canPlace(word, startX, startY, dir)) continue;

          // place and recurse
          placePlacement({ word, x: startX, y: startY, dir });
          if (backtrack(index + 1)) return true;
          // backtrack removal
          removePlacement(word);

          if (attemptCount > MAX_ATTEMPTS) return false;
        } // j
      } // i
    } // placed

    // As a fallback, allow a limited number of tries to place the word anywhere (non-crossing)
    // This keeps isolated words possible but limits explosion.
    const RANDOM_PLACEMENT_TRIES = 300;
    let fallbackTries = 0;
    while (fallbackTries++ < RANDOM_PLACEMENT_TRIES && attemptCount <= MAX_ATTEMPTS) {
      const dir: Dir = Math.random() < 0.5 ? "across" : "down";
      // pick a start within the current placements bounding box ±5
      const bounds = computeBounds();
      // choose random start near bounds (helps cluster words)
      const rangeXStart = Math.max(-MAX_COORD, bounds.minX - 5);
      const rangeXEnd = Math.min(MAX_COORD, bounds.maxX + 5);
      const rangeYStart = Math.max(-MAX_COORD, bounds.minY - 5);
      const rangeYEnd = Math.min(MAX_COORD, bounds.maxY + 5);

      const rx = randInt(rangeXStart, rangeXEnd);
      const ry = randInt(rangeYStart, rangeYEnd);

      const startX = dir === "across" ? Math.max(-MAX_COORD, Math.min(rx, MAX_COORD - word.length + 1)) : rx;
      const startY = dir === "down" ? Math.max(-MAX_COORD, Math.min(ry, MAX_COORD - word.length + 1)) : ry;

      if (!canPlace(word, startX, startY, dir)) {
        continue;
      }
      placePlacement({ word, x: startX, y: startY, dir });
      if (backtrack(index + 1)) return true;
      removePlacement(word);
    }

    return false;
  }

  // Utility: compute bounding box of current placed letters (or zero box if none)
  function computeBounds() {
    if (gridMap.size === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const k of gridMap.keys()) {
      const [xStr, yStr] = k.split(",");
      const x = parseInt(xStr, 10);
      const y = parseInt(yStr, 10);
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    return { minX, minY, maxX, maxY };
  }

  function randInt(a: number, b: number) {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  }

  // Start backtracking
  const ok = backtrack(0);
  if (!ok) return null;

  // Build 2D grid from gridMap with minimum padding
  if (gridMap.size === 0) return null;

  return buildGridWithPadding(gridMap);
}

// Helper function to build grid with minimal padding
function buildGridWithPadding(gridMap: Map<string, string>): Grid {
  if (gridMap.size === 0) return [];

  // Find the actual bounds of placed letters
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const k of gridMap.keys()) {
    const [xStr, yStr] = k.split(",");
    const x = parseInt(xStr, 10);
    const y = parseInt(yStr, 10);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  // Use the exact bounds without extra padding since the placement logic
  // already ensures proper spacing between words
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  
  // Create grid filled with null values
  const out: Grid = Array.from({ length: height }, () => 
    Array.from({ length: width }, () => null)
  );

  // Place the letters in the grid
  for (const [k, ch] of gridMap.entries()) {
    const [xStr, yStr] = k.split(",");
    const x = parseInt(xStr, 10);
    const y = parseInt(yStr, 10);
    const gridX = x - minX;
    const gridY = y - minY;
    out[gridY][gridX] = ch;
  }

  return out;
}
