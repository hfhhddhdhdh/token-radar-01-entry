// Token Radar — the sensitivity analysis (radar-2 companion).
//
// The board's implied value rests on one number more than any other: the
// category multiple, the median market-cap per dollar of TVL among the live
// protocols in the same category, shrunk toward the global median. That
// multiple is an estimate, and how good an estimate it is depends on how many
// live peers the category has: a category with twenty live tokens pins its
// multiple down, a category with one live token barely does. This module asks
// how far each row's implied value moves when its multiple is wrong, and
// summarises the board by category and by momentum, so a reader can see
// which ranks are solid and which rest on one shaky multiple.
//
// It changes nothing the board says. Every range is centred on the board's
// own implied value, the low and high ends only scale the row's own multiple,
// and the module only reads the board and the radar the model already wrote.
// The report is written beside board.json as sensitivity.json, in the same
// deterministic way: the same snapshot in gives the same bytes out.

// The category multiple's band, from the peers behind it. A multiple built on
// no peers is a guess borrowed whole from the market, so its band is wide;
// a multiple built on many peers is measured, so its band is narrow. The
// half-width runs from 0.50 with no peers down toward 0.10 as peers grow,
// following the same n / (n + 4) shrinkage the model uses for the multiple
// itself. The band is symmetric in the multiple, so the implied range is
// symmetric in the value up to the dollar rounding of the board.
import type { BoardRow, RadarData } from './model.ts';

/** How far one row's implied value moves when its multiple is off. */
export interface SensitivityRange {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  /** The multiple's band for this row, as [low, high] multipliers. */
  multiple_band: [number, number];
  /** The implied value with the multiple at the low end of its band. */
  low_usd: number;
  /** The board's own implied value: the centre of the range. */
  base_usd: number;
  /** The implied value with the multiple at the high end of its band. */
  high_usd: number;
  /** How wide the range is, as a whole percent of the base value. */
  width_pct: number;
  /** The live peers the row's multiple rests on. */
  peers: number;
}

/** One category's share of the board, for the summary table. */
export interface CategoryTotal {
  category: string;
  rows: number;
  total_tvl_usd: number;
  total_implied_usd: number;
  /** The median multiple across the category's rows. */
  median_multiple: number;
  /** The category's top row by implied value. */
  top_slug: string;
  top_name: string;
  top_implied_usd: number;
}

/** One protocol's seven-day move, for the momentum lists. */
export interface Mover {
  rank: number;
  slug: string;
  name: string;
  change_7d: number;
  implied_value_usd: number;
}

/** The board's biggest seven-day gainers and losers. */
export interface Movers {
  gainers: Mover[];
  losers: Mover[];
}

/** The whole sensitivity report, written to sensitivity.json. */
export interface SensitivityReport {
  as_of: string;
  model_version: string;
  board_size: number;
  /** Every row's range, in board order. */
  ranges: SensitivityRange[];
  /** Every category's totals, biggest implied value first. */
  categories: CategoryTotal[];
  /** The board's biggest seven-day moves, five each way. */
  movers: Movers;
  /** The board's totals, for the report's own checksum. */
  totals: {
    total_tvl_usd: number;
    total_implied_usd: number;
  };
}

/** The median of a non-empty sorted array of numbers. */
function median(sorted: number[]): number {
  const n = sorted.length;
  const mid = Math.floor(n / 2);
  return n % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** The half-width of a row's multiple band, from its peer count. */
export function bandHalfWidth(peers: number): number {
  const p = Math.max(0, Math.floor(peers));
  return 0.1 + 0.4 * (4 / (p + 4));
}

/** One row's implied-value range, from the row's own multipliers. */
export function rangeOf(row: BoardRow): SensitivityRange {
  const half = bandHalfWidth(row.model.category_peers);
  const lowMult = 1 - half;
  const highMult = 1 + half;
  const m = row.model;
  const base = row.implied_value_usd;
  const low = Math.max(
    1,
    Math.round(row.tvl_usd * m.category_multiple * lowMult * m.growth_multiplier * m.maturity_multiplier * m.breadth_multiplier),
  );
  const high = Math.round(
    row.tvl_usd * m.category_multiple * highMult * m.growth_multiplier * m.maturity_multiplier * m.breadth_multiplier,
  );
  const width = base > 0 ? Math.round(((high - low) / base) * 100) : 0;
  return {
    rank: row.rank,
    slug: row.slug,
    name: row.name,
    category: row.category,
    multiple_band: [Math.round(lowMult * 1000) / 1000, Math.round(highMult * 1000) / 1000],
    low_usd: low,
    base_usd: base,
    high_usd: high,
    width_pct: width,
    peers: row.model.category_peers,
  };
}

/** Every row's range, in board order. */
export function rangesOf(board: BoardRow[]): SensitivityRange[] {
  return board.map(rangeOf);
}

/** One category's totals, from the board rows that name it. */
export function categoryTotals(board: BoardRow[]): CategoryTotal[] {
  const byCat = new Map<string, BoardRow[]>();
  for (const row of board) {
    const key = row.category ?? 'Other';
    const list = byCat.get(key) ?? [];
    list.push(row);
    byCat.set(key, list);
  }
  const totals: CategoryTotal[] = [];
  for (const [category, rows] of byCat) {
    const multiples = rows.map((r) => r.model.category_multiple).sort((a, b) => a - b);
    const top = rows.reduce((a, b) => (b.implied_value_usd > a.implied_value_usd ? b : a));
    totals.push({
      category,
      rows: rows.length,
      total_tvl_usd: rows.reduce((s, r) => s + r.tvl_usd, 0),
      total_implied_usd: rows.reduce((s, r) => s + r.implied_value_usd, 0),
      median_multiple: Math.round(median(multiples) * 10000) / 10000,
      top_slug: top.slug,
      top_name: top.name,
      top_implied_usd: top.implied_value_usd,
    });
  }
  totals.sort((a, b) => b.total_implied_usd - a.total_implied_usd || (a.category < b.category ? -1 : 1));
  return totals;
}

/** The board's biggest seven-day moves, five gainers and five losers. */
export function topMovers(board: BoardRow[], n = 5): Movers {
  const moved = board.filter((r) => r.change_7d !== null);
  const byChange = (r: BoardRow): Mover => ({
    rank: r.rank,
    slug: r.slug,
    name: r.name,
    change_7d: r.change_7d!,
    implied_value_usd: r.implied_value_usd,
  });
  const gainers = [...moved].sort((a, b) => b.change_7d! - a.change_7d! || a.rank - b.rank).slice(0, n).map(byChange);
  const losers = [...moved].sort((a, b) => a.change_7d! - b.change_7d! || a.rank - b.rank).slice(0, n).map(byChange);
  return { gainers, losers };
}

/** The whole sensitivity report, from the board and the radar that hold it. */
export function buildSensitivity(board: BoardRow[], radar: RadarData): SensitivityReport {
  const ranges = rangesOf(board);
  const categories = categoryTotals(board);
  const movers = topMovers(board);
  return {
    as_of: radar.as_of,
    model_version: radar.model_version,
    board_size: board.length,
    ranges,
    categories,
    movers,
    totals: {
      total_tvl_usd: board.reduce((s, r) => s + r.tvl_usd, 0),
      total_implied_usd: board.reduce((s, r) => s + r.implied_value_usd, 0),
    },
  };
}

/** Why a sensitivity report is not one the gate will take, or null. */
export function sensitivityIssue(report: SensitivityReport, board: BoardRow[]): string | null {
  if (report.ranges.length !== board.length) {
    return `the report ranges ${report.ranges.length} rows and the board holds ${board.length}`;
  }
  for (let i = 0; i < board.length; i++) {
    const row = board[i]!;
    const range = report.ranges[i]!;
    if (range.slug !== row.slug) return `range ${i + 1} is ${range.slug} and board row ${i + 1} is ${row.slug}`;
    if (range.base_usd !== row.implied_value_usd) {
      return `${row.slug} centres its range on $${range.base_usd} and the board says $${row.implied_value_usd}`;
    }
    if (range.low_usd > range.base_usd || range.base_usd > range.high_usd) {
      return `${row.slug} has a range that does not contain its own value: $${range.low_usd} to $${range.high_usd} around $${range.base_usd}`;
    }
    if (range.width_pct < 0) return `${row.slug} has a negative range width`;
  }
  const covered = report.categories.reduce((s, c) => s + c.rows, 0);
  if (covered !== board.length) return `the categories cover ${covered} rows and the board holds ${board.length}`;
  const slugs = new Set(board.map((r) => r.slug));
  for (const m of [...report.movers.gainers, ...report.movers.losers]) {
    if (!slugs.has(m.slug)) return `a mover names ${m.slug}, which is not on the board`;
  }
  if (report.totals.total_implied_usd !== board.reduce((s, r) => s + r.implied_value_usd, 0)) {
    return `the report totals $${report.totals.total_implied_usd} of implied value and the board totals $${board.reduce((s, r) => s + r.implied_value_usd, 0)}`;
  }
  return null;
}
