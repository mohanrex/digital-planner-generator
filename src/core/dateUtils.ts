import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addMonths,
    format
} from 'date-fns';

export const getCalendarMonthDays = (year: number, month: number, weekStart: 'sunday' | 'monday' = 'sunday'): Date[] => {
    // month is 1-indexed (1 = January)
    const date = new Date(year, month - 1, 1);
    const start = startOfWeek(startOfMonth(date), { weekStartsOn: weekStart === 'sunday' ? 0 : 1 });
    const end = endOfWeek(endOfMonth(date), { weekStartsOn: weekStart === 'sunday' ? 0 : 1 });

    return eachDayOfInterval({ start, end });
};

export const getMonthsInYear = (year: number, startMonth: number = 1, duration: number = 12): Date[] => {
    const startDate = new Date(year, startMonth - 1, 1);
    const months: Date[] = [];
    for (let i = 0; i < duration; i++) {
        months.push(addMonths(startDate, i));
    }
    return months;
};

export const formatDateId = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
};

export const getWeekId = (date: Date, weekStart: 'sunday' | 'monday' = 'sunday'): string => {
    const start = startOfWeek(date, { weekStartsOn: weekStart === 'sunday' ? 0 : 1 });
    return `week-${format(start, 'yyyy-MM-dd')}`;
};
