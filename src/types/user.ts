export type UserRole = 'admin' | 'member';

export interface User {
    id: string;
    username: string;
    personId: string;
    role: UserRole;
    mustChangePassword: boolean;
}
