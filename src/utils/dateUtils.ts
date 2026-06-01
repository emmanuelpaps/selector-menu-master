import { addDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const safeDateParse = (dateStr: string) => {
    try {
        if (!dateStr) return new Date(NaN);
        // Clean and remove any time part if present
        const clean = dateStr.split(' ')[0].replace(/\//g, '-').trim();

        // Pattern 1: YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
            return new Date(clean + 'T00:00:00');
        }

        // Pattern 2: DD-MM-YYYY or MM-DD-YYYY
        if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(clean)) {
            const parts = clean.split('-');
            const v1 = parseInt(parts[0]);
            const v2 = parseInt(parts[1]);
            const year = parseInt(parts[2]);

            // If second part is > 12, it MUST be MM-DD-YYYY (style: 02-23-2026)
            if (v2 > 12) {
                return new Date(year, v1 - 1, v2);
            }
            // If first part is > 12, it MUST be DD-MM-YYYY (style: 23-02-2026)
            if (v1 > 12) {
                return new Date(year, v2 - 1, v1);
            }

            // Ambiguous (both <= 12). Default to MM-DD-YYYY for these sheets
            // as Tijuana uses 02/09/2026 for Feb 9th.
            return new Date(year, v1 - 1, v2);
        }

        const parsed = parseISO(clean);
        if (!isNaN(parsed.getTime())) return parsed;

        const date = new Date(clean);
        return isNaN(date.getTime()) ? new Date(NaN) : date;
    } catch (e) {
        return new Date(NaN);
    }
};

export const getWeekDates = (startDateStr: string, numDays: number = 5) => {
    const startDate = safeDateParse(startDateStr);
    if (isNaN(startDate.getTime())) {
        console.error("Invalid date string:", startDateStr);
        return [];
    }

    return Array.from({ length: numDays }).map((_, i) => {
        const date = addDays(startDate, i);
        const monthAbbr = format(date, 'MMM', { locale: es }).toUpperCase().replace('.', '');
        return {
            day: format(date, 'EEEE', { locale: es }),
            date: `${format(date, 'd')} ${monthAbbr}`,
            fullDate: format(date, 'yyyy-MM-dd')
        };
    });
};

export const formatMenuRange = (startDateStr: string) => {
    const startDate = safeDateParse(startDateStr);
    if (isNaN(startDate.getTime())) return "Fecha Inválida";

    const endDate = addDays(startDate, 4);

    const startDay = format(startDate, 'd');
    const endDay = format(endDate, 'd');
    const startMonth = format(startDate, 'MMMM', { locale: es });
    const endMonth = format(endDate, 'MMMM', { locale: es });

    if (startMonth !== endMonth) {
        return `del ${startDay} de ${startMonth} al ${endDay} de ${endMonth}`;
    }

    return `del ${startDay} al ${endDay} de ${startMonth.charAt(0).toUpperCase() + startMonth.slice(1)}`;
};
