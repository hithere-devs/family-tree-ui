export type Gender = 'male' | 'female' | 'other';

export type SocialLinkType = 'facebook' | 'instagram' | 'twitter' | 'linkedin';

export interface SocialLink {
    type: SocialLinkType;
    url: string;
    handle: string;
}

export interface Person {
    id: string;
    firstName: string;
    lastName: string;
    gender: Gender;
    isDeceased: boolean;
    parentIds: string[];
    spouseIds: string[];
    exSpouseIds: string[];
    childrenIds: string[];
    birthDate?: string | null;
    deathYear?: number | null;
    bio?: string | null;
    phoneNumber?: string | null;
    socialLinks?: SocialLink[] | null;
    phoneVerified?: boolean;
    location?: string | null;
    birthYear?: number;
    createdBy: string;
    updatedBy: string;
}
