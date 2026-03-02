export type Gender = 'male' | 'female' | 'other';

export interface Person {
    id: string;
    firstName: string;
    lastName: string;
    gender: Gender;
    isDeceased: boolean;
    parentIds: string[];
    spouseIds: string[];
    childrenIds: string[];
    birthDate?: string | null;
    bio?: string | null;
    phoneNumber?: string | null;
    socialLinks?: { type: string; url: string; handle: string; }[] | null;
    location?: string | null;
    birthYear?: number;
    deathYear?: number;
    createdBy: string;
    updatedBy: string;
}
