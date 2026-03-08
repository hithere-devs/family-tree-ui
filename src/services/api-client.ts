// const API_BASE = 'http://localhost:8080/api';
const API_BASE = 'https://api.family.hitheredevs.com/api';

import type { Person, SocialLink } from '../types';

let authToken: string | null = localStorage.getItem('ft_token');

export function setToken(token: string | null) {
    authToken = token;
    if (token) localStorage.setItem('ft_token', token);
    else localStorage.removeItem('ft_token');
}

export function getToken(): string | null {
    return authToken;
}

function headers(): HeadersInit {
    const h: HeadersInit = { 'Content-Type': 'application/json' };
    if (authToken) h['Authorization'] = `Bearer ${authToken}`;
    return h;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { ...headers(), ...(options.headers as Record<string, string>) },
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(body.error ?? body.message ?? res.statusText, res.status);
    }

    return res.json();
}

export class ApiError extends Error {
    public status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

export interface AuthUser {
    id: string;
    username: string;
    role: 'admin' | 'member';
    mustChangePassword: boolean;
    personId: string;
    phoneNumber?: string | null;
    phoneVerified?: boolean;
}

export interface LoginResponse {
    token: string;
    user: AuthUser;
}

export async function login(
    username: string,
    password: string,
): Promise<LoginResponse> {
    return apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });
}

export async function getMe(): Promise<AuthUser> {
    return apiFetch<AuthUser>('/auth/me');
}

export async function changePassword(
    currentPassword: string,
    newPassword: string,
): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
    });
}

export async function requestPhoneOtp(
    phoneNumber: string,
): Promise<{ message: string; phoneNumber: string }> {
    return apiFetch('/auth/phone-otp/request', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
    });
}

export async function verifyPhoneOtp(
    otp: string,
): Promise<{ message: string; user: AuthUser }> {
    return apiFetch('/auth/phone-otp/verify', {
        method: 'POST',
        body: JSON.stringify({ otp }),
    });
}

export async function requestForgotPasswordOtp(
    username: string,
    phoneNumber: string,
): Promise<{ message: string }> {
    return apiFetch('/auth/forgot-password/request', {
        method: 'POST',
        body: JSON.stringify({ username, phoneNumber }),
    });
}

export async function resetPasswordWithOtp(data: {
    username: string;
    phoneNumber: string;
    otp: string;
    newPassword: string;
}): Promise<{ message: string }> {
    return apiFetch('/auth/forgot-password/reset', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export interface TreeResponse {
    people: Record<string, Person>;
}

export async function getSubtree(personId: string): Promise<TreeResponse> {
    return apiFetch<TreeResponse>(`/tree/${personId}`);
}

export interface CreatePersonPayload {
    firstName: string;
    lastName?: string;
    gender?: string;
    isDeceased?: boolean;
    birthDate?: string | null;
    deathYear?: number | null;
    bio?: string | null;
    phoneNumber?: string | null;
    socialLinks?: SocialLink[] | null;
    location?: string | null;
}

export interface PersonResponse {
    id: string;
    firstName: string;
    lastName: string;
    gender: string;
    isDeceased: boolean;
    birthDate?: string | null;
    deathYear?: number | null;
    bio?: string | null;
    phoneNumber?: string | null;
    socialLinks?: SocialLink[] | null;
    phoneVerified?: boolean;
    location?: string | null;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
}

export async function createPerson(
    data: CreatePersonPayload,
): Promise<PersonResponse> {
    return apiFetch<PersonResponse>('/persons', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updatePerson(
    id: string,
    data: Partial<CreatePersonPayload>,
): Promise<PersonResponse> {
    return apiFetch<PersonResponse>(`/persons/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deletePerson(id: string): Promise<void> {
    await apiFetch<{ message: string }>(`/persons/${id}`, {
        method: 'DELETE',
    });
}

export type RelationshipType = 'PARENT' | 'CHILD' | 'SPOUSE';

export interface RelationshipResponse {
    id: string;
    source_person_id: string;
    target_person_id: string;
    relationship_type: RelationshipType;
    status: string;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export async function addRelationship(data: {
    sourcePersonId: string;
    targetPersonId: string;
    relationshipType: RelationshipType;
}): Promise<{ forward: RelationshipResponse; inverse: RelationshipResponse }> {
    return apiFetch('/relationships', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function removeRelationship(id: string): Promise<void> {
    await apiFetch<{ message: string }>(`/relationships/${id}`, {
        method: 'DELETE',
    });
}

export async function updateRelationshipStatus(data: {
    sourcePersonId: string;
    targetPersonId: string;
    status: 'confirmed' | 'pending' | 'divorced';
}): Promise<void> {
    await apiFetch<{ message: string }>('/relationships/status', {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function getRelationshipsForPerson(
    personId: string,
): Promise<RelationshipResponse[]> {
    return apiFetch<RelationshipResponse[]>(`/relationships/person/${personId}`);
}
