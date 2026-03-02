import type { Person } from '../types';

/**
 * Returns a URL for a simple, respectful avatar based on gender.
 * Uses local assets (man.png/woman.png) as default images.
 */
export function getAvatarUrl(person: Person): string {
    const isFemale = person.gender === 'female';
    return isFemale ? '/woman.png' : '/man.png';
}
