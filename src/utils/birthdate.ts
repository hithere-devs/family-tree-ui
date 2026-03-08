const MONTH_DAY_REGEX = /^--(\d{2})-(\d{2})$/;
const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})/;

export const MONTH_OPTIONS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

export function parseMonthDay(value?: string | null): {
    month: string;
    day: string;
} {
    if (!value) return { month: '', day: '' };

    const recurringMatch = value.match(MONTH_DAY_REGEX);
    if (recurringMatch) {
        return { month: recurringMatch[1], day: recurringMatch[2] };
    }

    const isoMatch = value.match(ISO_DATE_REGEX);
    if (isoMatch) {
        return { month: isoMatch[2], day: isoMatch[3] };
    }

    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
        return {
            month: String(date.getMonth() + 1).padStart(2, '0'),
            day: String(date.getDate()).padStart(2, '0'),
        };
    }

    return { month: '', day: '' };
}

export function buildMonthDay(month: string, day: string): string | undefined {
    if (!month || !day) return undefined;
    return `--${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function getDaysInMonth(month: string): number {
    const monthNumber = Number(month);
    if (!monthNumber || monthNumber < 1 || monthNumber > 12) return 31;
    return new Date(2024, monthNumber, 0).getDate();
}

export function formatBirthday(value?: string | null): string {
    const { month, day } = parseMonthDay(value);
    if (!month || !day) return 'Unknown';

    const monthName = MONTH_OPTIONS[Number(month) - 1];
    if (!monthName) return 'Unknown';
    return `${monthName} ${Number(day)}`;
}
