import type { Person } from '../types/person';

export function getRelationship(
    sourceId: string,
    targetId: string,
    people: Record<string, Person>
): string {
    if (sourceId === targetId) return 'Self';

    const source = people[sourceId];
    if (!source) return 'Relative';

    const visited = new Set<string>();
    const queue: { id: string; path: string[] }[] = [{ id: sourceId, path: [] }];

    while (queue.length > 0) {
        const { id, path } = queue.shift()!;
        if (id === targetId) {
            return translatePathToRelation(path, people[targetId]);
        }

        if (visited.has(id)) continue;
        visited.add(id);

        const current = people[id];
        if (!current) continue;

        // Go up to parents
        current.parentIds.forEach(pId => {
            queue.push({ id: pId, path: [...path, 'parent'] });
        });

        // Go down to children
        current.childrenIds.forEach(cId => {
            queue.push({ id: cId, path: [...path, 'child'] });
        });

        // Go to spouse
        if (current.spouseId) {
            queue.push({ id: current.spouseId, path: [...path, 'spouse'] });
        }
    }

    return 'Relative';
}

function translatePathToRelation(path: string[], target: Person): string {
    const isMale = target.gender === 'male';
    const pathStr = path.join('-');
    const m = (m: string, f: string) => isMale ? m : f;

    switch (pathStr) {
        case 'parent': return m('Father', 'Mother');
        case 'child': return m('Son', 'Daughter');
        case 'spouse': return m('Husband', 'Wife');
        // When going up to a parent, then down to a child (who isn't yourself since we would have matched on length 0) => sibling
        case 'parent-child': return m('Brother', 'Sister');
        case 'parent-parent': return m('Grandfather', 'Grandmother');
        case 'child-child': return m('Grandson', 'Granddaughter');
        case 'parent-parent-child': return m('Uncle', 'Aunt');
        case 'parent-parent-child-child': return 'Cousin';
        case 'parent-child-child': return m('Nephew', 'Niece');
        case 'parent-parent-parent': return m('Great-Grandfather', 'Great-Grandmother');
        case 'child-child-child': return m('Great-Grandson', 'Great-Granddaughter');
        case 'spouse-parent': return m('Father-in-law', 'Mother-in-law');
        case 'child-spouse': return m('Son-in-law', 'Daughter-in-law');
        case 'spouse-parent-child': return m('Brother-in-law', 'Sister-in-law');
        case 'parent-child-spouse': return m('Brother-in-law', 'Sister-in-law');
        default:
            // Heuristics for deeper connections
            if (pathStr.startsWith('parent-parent-parent')) return 'Ancestor';
            if (pathStr.startsWith('child-child-child')) return 'Descendant';
            return 'Relative';
    }
}
