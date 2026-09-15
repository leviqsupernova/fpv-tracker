export function padUnit(unit: number | string): string {
  return String(unit).padStart(4, "0");
}

export function buildSerial(prefix: string, unit: number | string): string {
  if (!prefix || unit === "" || unit === undefined || unit === null) return "";
  return `${prefix}-${padUnit(unit)}`;
}

/** Inclusive unit range, e.g. 450..453 -> [450,451,452,453].
 *  Rejects a non-integer bound, an inverted range, or anything over
 *  maxCount — the same guard the batch-reserve form uses to stop a
 *  fat-fingered range from generating thousands of rows. */
export function expandRange(start: number, end: number, maxCount = 1000): number[] {
  if (!Number.isInteger(start) || !Number.isInteger(end) || end < start) return [];
  const count = end - start + 1;
  if (count > maxCount) return [];
  return Array.from({ length: count }, (_, i) => start + i);
}

export type AssignMode = "split" | "single" | "none";

export interface UnitAssignment {
  unit: number;
  handler: string;
}

/** Turns a list of reserved units into per-unit handler assignments.
 *  "split" divides the range into contiguous blocks in pick order —
 *  first handler picked gets the lowest numbers — so nobody has to
 *  coordinate who owns which serials. */
export function assignUnits(
  units: number[],
  mode: AssignMode,
  opts: { singleHandler?: string; splitHandlers?: string[] } = {}
): UnitAssignment[] {
  if (mode === "single") {
    return units.map((u) => ({ unit: u, handler: opts.singleHandler || "" }));
  }
  if (mode === "none") {
    return units.map((u) => ({ unit: u, handler: "" }));
  }
  const splitHandlers = opts.splitHandlers || [];
  if (!splitHandlers.length) {
    return units.map((u) => ({ unit: u, handler: "" }));
  }
  const chunk = Math.ceil(units.length / splitHandlers.length);
  return units.map((u, i) => ({
    unit: u,
    handler: splitHandlers[Math.min(splitHandlers.length - 1, Math.floor(i / chunk))],
  }));
}

export interface HandlerRange {
  handler: string;
  start: number;
  end: number;
}

/** Collapses consecutive same-handler units into ranges for display —
 *  "450-500 Vladiq" instead of 50 separate rows. Only merges units that
 *  are both same-handler AND numerically consecutive. */
export function groupContiguousByHandler(assignments: UnitAssignment[]): HandlerRange[] {
  const out: HandlerRange[] = [];
  let cur: HandlerRange | null = null;
  assignments.forEach(({ unit, handler }) => {
    if (cur && cur.handler === handler && unit === cur.end + 1) {
      cur.end = unit;
    } else {
      if (cur) out.push(cur);
      cur = { handler, start: unit, end: unit };
    }
  });
  if (cur) out.push(cur);
  return out;
}
