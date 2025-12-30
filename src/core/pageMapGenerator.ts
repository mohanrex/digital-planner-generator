import type { PlannerConfig, PageMap, PageDefinition } from './types';
import { getMonthsInYear, getCalendarMonthDays, formatDateId, getWeekId } from './dateUtils';
import { format } from 'date-fns';

export const generatePageMap = (config: PlannerConfig): PageMap => {
    const pages: PageDefinition[] = [];
    const pageOrder: string[] = [];

    const addPage = (page: PageDefinition) => {
        pages.push(page);
        pageOrder.push(page.id);
    };

    // 1. Cover Page
    addPage({
        id: 'cover',
        type: 'cover',
        title: 'Cover',
        links: []
    });

    // 2. Index Page
    addPage({
        id: 'index',
        type: 'index',
        title: 'Index',
        links: []
    });

    // 3. Yearly Overview
    addPage({
        id: 'year-overview',
        type: 'year',
        title: `${config.year} Overview`,
        links: []
    });

    const months = getMonthsInYear(config.year, config.startMonth, config.durationMonths);

    months.forEach(monthDate => {
        const monthId = `month-${format(monthDate, 'yyyy-MM')}`;

        // 4. Month Page
        addPage({
            id: monthId,
            type: 'month',
            title: format(monthDate, 'MMMM yyyy'),
            date: monthDate,
            links: []
        });

        // Generate Weeks and Days for this month
        // Note: We need to handle weeks that overlap months carefully.
        // Usually, a week belongs to the month it starts in, or we just link to the same week page from both months.
        // Here we'll generate weeks based on the calendar view of the month.

        const days = getCalendarMonthDays(monthDate.getFullYear(), monthDate.getMonth() + 1, config.weekStart);

        // Group days into weeks
        const weeks: Date[][] = [];
        let currentWeek: Date[] = [];

        days.forEach(day => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        });

        weeks.forEach(weekDays => {
            const weekStart = weekDays[0];
            const weekId = getWeekId(weekStart, config.weekStart);

            // Check if week already exists to avoid duplicates (for overlapping weeks)
            if (!pageOrder.includes(weekId)) {
                addPage({
                    id: weekId,
                    type: 'week',
                    title: `Week of ${format(weekStart, 'MMM d')}`,
                    date: weekStart,
                    links: []
                });
            }

            // Generate Daily Pages for days in this week that belong to the current month
            // Or just generate all days if they haven't been generated yet.
            weekDays.forEach(day => {
                const dayId = formatDateId(day);
                if (!pageOrder.includes(dayId)) {
                    addPage({
                        id: dayId,
                        type: 'day',
                        title: format(day, 'EEEE, MMMM d, yyyy'),
                        date: day,
                        links: []
                    });
                }
            });
        });
    });

    // Post-processing: Generate Links
    // Now that we have all pages, we can populate the links.
    // This is where the "Page Map Algorithm" from the spec comes in.
    // For MVP, we'll just link hierarchy: Year -> Month -> Week -> Day

    pages.forEach(page => {
        if (page.type === 'year') {
            // Link to Months
            months.forEach(m => {
                page.links.push({
                    pageId: page.id,
                    label: format(m, 'MMM'),
                    targetPageId: `month-${format(m, 'yyyy-MM')}`
                });
            });
        } else if (page.type === 'month') {
            // Link to Weeks and Days
            // This logic needs to be robust to find the correct week/day pages.
            // For now, simple links.
        }
    });

    // 5. Custom Sections (Appendix)
    config.customSections.forEach((section, sectionIndex) => {
        for (let i = 0; i < section.pageCount; i++) {
            const pageId = `section-${sectionIndex}-page-${i}`;
            addPage({
                id: pageId,
                type: 'note',
                title: `${section.title} - Page ${i + 1}`,
                metadata: {
                    sectionTitle: section.title,
                    template: section.template,
                    pageIndex: i,
                    totalPages: section.pageCount
                },
                links: []
            });
        }
    });

    return { pages, pageOrder };
};
