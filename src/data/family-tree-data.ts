import type { Person, User } from '../types';

export const initialPeople: Record<string, Person> = {
    azhar: {
        id: 'azhar',
        firstName: 'Azhar',
        lastName: 'Mahmood',
        gender: 'male',
        isDeceased: false,
        parentIds: ['tahir', 'shabnam'],
        spouseIds: [],
        exSpouseIds: [],
        childrenIds: [],
        createdBy: 'system',
        updatedBy: 'system',
    },
    tahir: {
        id: 'tahir',
        firstName: 'Tahir',
        lastName: 'Mahmood',
        gender: 'male',
        isDeceased: false,
        parentIds: [],
        spouseIds: ['shabnam'],
        exSpouseIds: [],
        childrenIds: ['azhar'],
        createdBy: 'system',
        updatedBy: 'system',
    },
    shabnam: {
        id: 'shabnam',
        firstName: 'Shabnam',
        lastName: '',
        gender: 'female',
        isDeceased: false,
        parentIds: [],
        spouseIds: ['tahir'],
        exSpouseIds: [],
        childrenIds: ['azhar'],
        createdBy: 'system',
        updatedBy: 'system',
    },
};

export const initialUsers: User[] = [
    {
        id: 'user-azhar',
        username: 'azhar',
        personId: 'azhar',
        role: 'admin',
        mustChangePassword: false,
    },
];
