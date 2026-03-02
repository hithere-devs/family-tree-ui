import type { Person } from '../types';

export interface NodePosition {
    personId: string;
    x: number;
    y: number;
}

const H_GAP = 200; // minimum gap between the last person of one unit and the first of the next
const V_GAP = 220; // vertical center-to-center
const COUPLE_GAP = 160; // gap between spouses within a couple

/**
 * Compute a flat array of node positions for the tree canvas.
 * The center person is always placed at (0, 0).
 *
 * Algorithm:
 *   1. BFS from center person to assign a "generation" to every person.
 *   2. Group people by generation row.
 *   3. Process rows **outward from center** (gen 0 first, then ±1, ±2 …)
 *      so every row's inner-neighbour is already positioned.
 *   4. Within each row build spouse-pair "units", order them by the
 *      average X of their already-positioned relatives, then place
 *      each unit at its *ideal* X (resolving overlaps left-to-right).
 *   5. Run a second refinement pass so that even the very first row
 *      (which had no hints in pass 1) benefits from full-tree info.
 *   6. Shift so the center person ends up at (0, 0).
 */
export function computeTreeLayout(
    people: Record<string, Person>,
    centerId: string,
): NodePosition[] {
    const center = people[centerId];
    if (!center) return [];

    /* ---- Step 1: assign generations via BFS ---- */

    const gen = new Map<string, number>();
    const queue: string[] = [centerId];
    gen.set(centerId, 0);

    if (center.spouseIds) {
        for (const sid of center.spouseIds) {
            if (people[sid] && !gen.has(sid)) {
                gen.set(sid, 0);
                queue.push(sid);
            }
        }
    }

    while (queue.length > 0) {
        const id = queue.shift()!;
        const person = people[id];
        if (!person) continue;
        const g = gen.get(id)!;

        for (const pid of person.parentIds) {
            if (!people[pid] || gen.has(pid)) continue;
            gen.set(pid, g - 1);
            queue.push(pid);
            const parent = people[pid];
            if (parent.spouseIds) {
                for (const sid of parent.spouseIds) {
                    if (people[sid] && !gen.has(sid)) {
                        gen.set(sid, g - 1);
                        queue.push(sid);
                    }
                }
            }
        }

        for (const cid of person.childrenIds) {
            if (!people[cid] || gen.has(cid)) continue;
            gen.set(cid, g + 1);
            queue.push(cid);
            const child = people[cid];
            if (child.spouseIds) {
                for (const sid of child.spouseIds) {
                    if (people[sid] && !gen.has(sid)) {
                        gen.set(sid, g + 1);
                        queue.push(sid);
                    }
                }
            }
        }

        if (person?.spouseIds) {
            for (const sid of person.spouseIds) {
                if (people[sid] && !gen.has(sid)) {
                    gen.set(sid, g);
                    queue.push(sid);
                }
            }
        }
    }

    /* ---- Step 2: group by generation ---- */

    const rows = new Map<number, string[]>();
    for (const [id, g] of gen) {
        if (!rows.has(g)) rows.set(g, []);
        rows.get(g)!.push(id);
    }

    /* ---- Step 3: generation processing order — outward from center ---- */

    const sortedGens = [...rows.keys()].sort((a, b) => {
        const da = Math.abs(a), db = Math.abs(b);
        return da !== db ? da - db : a - b;
    });

    /* ---- Step 4 & 5: two-pass layout ---- */

    let posMap = new Map<string, { x: number; y: number }>();
    let positions: NodePosition[] = [];

    for (let pass = 0; pass < 2; pass++) {
        const hintMap = pass > 0 ? new Map(posMap) : new Map<string, { x: number; y: number }>();
        posMap = new Map();
        positions = [];

        for (const g of sortedGens) {
            layoutRow(rows.get(g)!, g * V_GAP, people, posMap, hintMap, positions);
        }
    }

    /* ---- Step 6: shift everything so center person is at (0, 0) ---- */

    const centerPos = posMap.get(centerId);
    if (centerPos) {
        const dx = -centerPos.x;
        const dy = -centerPos.y;
        for (const pos of positions) {
            pos.x += dx;
            pos.y += dy;
        }
    }

    return positions;
}

/* ------------------------------------------------------------------ */
/*  Row layout helper                                                  */
/* ------------------------------------------------------------------ */

function layoutRow(
    ids: string[],
    y: number,
    people: Record<string, Person>,
    posMap: Map<string, { x: number; y: number }>,
    hintMap: Map<string, { x: number; y: number }>,
    positions: NodePosition[],
) {
    /* Resolve a position: prefer current-pass, fall back to previous-pass */
    const getPos = (id: string) => posMap.get(id) || hintMap.get(id);

    const avgXOf = (_personId: string, relIds: string[]): number | null => {
        const xs = relIds
            .map((rid) => getPos(rid))
            .filter(Boolean)
            .map((p) => p!.x);
        return xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
    };

    const avgParentX = (id: string) => {
        const p = people[id];
        return p ? avgXOf(id, p.parentIds) : null;
    };

    const avgChildX = (id: string) => {
        const p = people[id];
        return p ? avgXOf(id, p.childrenIds) : null;
    };

    const avgRelX = (id: string) => {
        const p = people[id];
        return p ? avgXOf(id, [...p.parentIds, ...p.childrenIds]) : null;
    };

    /* ---- build spouse-cluster units ---- */

    const placed = new Set<string>();
    const units: string[][] = [];

    for (const id of ids) {
        if (placed.has(id)) continue;
        placed.add(id);

        // Transitively collect all spouse-connected people in this row
        const cluster = new Set<string>([id]);
        const spouseQueue = [id];
        while (spouseQueue.length > 0) {
            const curr = spouseQueue.shift()!;
            const p = people[curr];
            if (p?.spouseIds) {
                for (const sid of p.spouseIds) {
                    if (ids.includes(sid) && !cluster.has(sid)) {
                        cluster.add(sid);
                        placed.add(sid);
                        spouseQueue.push(sid);
                    }
                }
            }
        }

        const members = [...cluster];

        if (members.length === 1) {
            units.push(members);
        } else if (members.length === 2) {
            // Simple pair — choose left/right by positional hints then gender
            const [a, b] = members;
            const rxA = avgRelX(a);
            const rxB = avgRelX(b);
            if (rxA !== null && rxB !== null && rxA !== rxB) {
                units.push(rxA <= rxB ? [a, b] : [b, a]);
            } else {
                // Gender fallback (deterministic)
                if ((people[a]?.gender ?? '') <= (people[b]?.gender ?? '')) {
                    units.push([a, b]);
                } else {
                    units.push([b, a]);
                }
            }
        } else {
            // 3+ members — find the hub (person with the most spouse
            // connections within the cluster) and center them
            let hubId = members[0];
            let maxConn = 0;
            for (const uid of members) {
                const conn = people[uid]?.spouseIds?.filter(
                    (sid) => cluster.has(sid),
                ).length ?? 0;
                if (conn > maxConn) {
                    maxConn = conn;
                    hubId = uid;
                }
            }

            const spouses = members.filter((uid) => uid !== hubId);
            // Sort spouses by positional hints, then gender
            spouses.sort((a, b) => {
                const rxA = avgRelX(a);
                const rxB = avgRelX(b);
                if (rxA !== null && rxB !== null && rxA !== rxB) return rxA - rxB;
                return (people[a]?.gender ?? '').localeCompare(
                    people[b]?.gender ?? '',
                );
            });

            // Split spouses: half on left, half on right, hub in center
            const leftCount = Math.floor(spouses.length / 2);
            const left = spouses.slice(0, leftCount);
            const right = spouses.slice(leftCount);
            units.push([...left, hubId, ...right]);
        }
    }

    /* ---- compute ideal center-X for each unit ---- */

    const idealXs = units.map((unit) => {
        const xs: number[] = [];
        for (const uid of unit) {
            const rx = avgRelX(uid);
            if (rx !== null) xs.push(rx);
        }
        return xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
    });

    /* ---- sort units by ideal X ---- */

    const order = units
        .map((_, i) => i)
        .sort((a, b) => idealXs[a] - idealXs[b]);
    const sortedUnits = order.map((i) => units[i]);
    const sortedIdealXs = order.map((i) => idealXs[i]);

    /* ---- place units at ideal X, resolve overlaps left-to-right ---- */

    const unitWidths = sortedUnits.map((u) => (u.length - 1) * COUPLE_GAP);
    const unitCenters: number[] = [];

    for (let i = 0; i < sortedUnits.length; i++) {
        let cx = sortedIdealXs[i];
        if (i > 0) {
            const prevRight = unitCenters[i - 1] + unitWidths[i - 1] / 2;
            const minCx = prevRight + H_GAP + unitWidths[i] / 2;
            if (cx < minCx) cx = minCx;
        }
        unitCenters.push(cx);
    }

    /* ---- assign positions ---- */

    for (let i = 0; i < sortedUnits.length; i++) {
        const unit = sortedUnits[i];
        const cx = unitCenters[i];
        const startX = cx - ((unit.length - 1) * COUPLE_GAP) / 2;

        for (let j = 0; j < unit.length; j++) {
            const x = startX + j * COUPLE_GAP;
            posMap.set(unit[j], { x, y });
            positions.push({ personId: unit[j], x, y });
        }
    }
}
