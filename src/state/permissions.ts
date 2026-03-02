import type { Person, User } from '../types';

export function canEdit(
    currentUser: User,
    targetPersonId: string,
    people: Record<string, Person>,
): boolean {
    // Admin can edit anyone
    if (currentUser.role === 'admin') return true;

    const targetPerson = people[targetPersonId];
    if (!targetPerson) return false;

    // Only admin can edit late (deceased) people's profiles
    if (targetPerson.isDeceased) return false;

    const self = people[currentUser.personId];
    if (!self) return false;

    // Can edit self
    if (targetPersonId === self.id) return true;

    // Can edit spouse
    if (self.spouseId === targetPersonId) return true;

    // Can edit children
    if (self.childrenIds.includes(targetPersonId)) return true;

    return false;
}

export function getRelationshipLabel(
    person: Person,
    relativeTo: Person,
): string {
    if (person.id === relativeTo.id) return 'You';

    if (relativeTo.parentIds.includes(person.id)) {
        if (person.gender === 'male') return 'Father';
        if (person.gender === 'female') return 'Mother';
        return 'Parent';
    }

    if (relativeTo.childrenIds.includes(person.id)) {
        if (person.gender === 'male') return 'Son';
        if (person.gender === 'female') return 'Daughter';
        return 'Child';
    }

    if (relativeTo.spouseId === person.id) return 'Spouse';

    if (
        person.parentIds.length > 0 &&
        relativeTo.parentIds.length > 0 &&
        person.parentIds.some((id) => relativeTo.parentIds.includes(id))
    ) {
        if (person.gender === 'male') return 'Brother';
        if (person.gender === 'female') return 'Sister';
        return 'Sibling';
    }

    return 'Relative';
}
