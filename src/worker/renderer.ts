import { PDFPage, PDFFont, rgb, PDFDocument, PDFName } from 'pdf-lib';
import type { PageDefinition, PlannerConfig } from '../core/types';
import type { LayoutDimensions } from './layoutUtils';
import { getLayoutDimensions } from './layoutUtils';
import { getCalendarMonthDays, formatDateId, getWeekId } from '../core/dateUtils';
import { format } from 'date-fns';

export const renderPageContent = (
    page: PDFPage,
    pageDef: PageDefinition,
    font: PDFFont,
    config: PlannerConfig,
    pdfDoc: PDFDocument,
    pageRefs: Record<string, PDFPage>
) => {
    const layout = getLayoutDimensions(config);

    // Draw Navigation Tabs (skip for cover)
    if (pageDef.type !== 'cover') {
        drawNavigationTabs(page, layout, font, config, pdfDoc, pageRefs, pageDef);
    }

    // Draw Title
    // Only draw title if it's not a page type that handles its own header
    if (!['cover', 'month', 'week', 'day', 'year', 'index'].includes(pageDef.type)) {
        page.drawText(pageDef.title, {
            x: layout.marginLeft,
            y: layout.height - layout.marginTop + 10,
            size: 18,
            font: font,
            color: rgb(0, 0, 0),
        });
    }

    // Date drawing removed to prevent duplication

    // Draw Grid/Layout based on type
    if (pageDef.type === 'cover') {
        drawCoverPage(page, layout, config, font, pdfDoc);
    } else if (pageDef.type === 'index') {
        drawIndexPage(page, layout, font);
    } else if (pageDef.type === 'year') {
        drawYearPage(page, layout, font, config, pdfDoc, pageRefs);
    } else if (pageDef.type === 'month') {
        drawMonthGrid(page, layout, pageDef, font, config, pdfDoc, pageRefs);
    } else if (pageDef.type === 'week') {
        drawWeekLayout(page, layout, pageDef, font, config, pdfDoc, pageRefs);
    } else if (pageDef.type === 'day') {
        drawDayLayout(page, layout, font, pageDef);
    } else if (pageDef.type === 'note') {
        drawNoteLayout(page, layout, pageDef, config);
    }
};

const drawNavigationTabs = (
    page: PDFPage,
    layout: LayoutDimensions,
    font: PDFFont,
    config: PlannerConfig,
    pdfDoc: PDFDocument,
    pageRefs: Record<string, PDFPage>,
    pageDef: PageDefinition
) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthColors = [
        [0.9, 0.92, 0.95], // Jan - Winter (Cool Grey)
        [0.85, 0.9, 0.95], // Feb - Winter (Pale Blue)
        [0.7, 0.8, 0.95],  // Mar - Spring (Bluebonnet)
        [0.85, 0.7, 0.9],  // Apr - Spring (Wildflower)
        [0.7, 0.9, 0.7],   // May - Spring (Fresh Green)
        [0.95, 0.9, 0.6],  // Jun - Summer (Sunny Yellow)
        [0.95, 0.8, 0.6],  // Jul - Summer (Bright Orange)
        [0.95, 0.7, 0.6],  // Aug - Summer (Hot Red/Orange)
        [0.9, 0.6, 0.4],   // Sep - Fall (Burnt Orange)
        [0.95, 0.7, 0.4],  // Oct - Fall (Pumpkin)
        [0.85, 0.75, 0.65],// Nov - Fall (Harvest Brown)
        [0.95, 0.95, 0.98] // Dec - Winter (Icy White)
    ];
    const tabHeight = (layout.height - layout.marginTop - layout.marginBottom) / 12;

    // Side Tabs (Months)
    months.forEach((month, index) => {
        const y = layout.height - layout.marginTop - (index * tabHeight);
        const x = config.handedness === 'right'
            ? layout.width - layout.tabWidth
            : 0;

        const [r, g, b] = monthColors[index];

        // Draw Tab Background
        page.drawRectangle({
            x,
            y: y - tabHeight,
            width: layout.tabWidth,
            height: tabHeight,
            color: rgb(r, g, b),
            borderColor: rgb(0.6, 0.6, 0.6),
            borderWidth: 0.5,
        });

        // Draw Tab Text (Rotated)
        page.drawText(month, {
            x: x + (layout.tabWidth / 2) - 4,
            y: y - (tabHeight / 2) - 6,
            size: 10,
            font: font,
            color: rgb(0.2, 0.2, 0.2), // Dark text for contrast
            rotate: { type: 'degrees', angle: config.handedness === 'right' ? -90 : 90 } as any,
        });

        // Link to Month Page
        const monthNum = String(index + 1).padStart(2, '0');
        const targetId = `month-${config.year}-${monthNum}`;
        const targetPage = pageRefs[targetId];

        if (targetPage) {
            page.node.set(
                // @ts-ignore
                PDFName.of('Annots'),
                // @ts-ignore
                pdfDoc.context.obj([
                    // @ts-ignore
                    ...(page.node.Annots()?.asArray() || []), // Preserve existing annotations
                    pdfDoc.context.obj({
                        Type: 'Annot',
                        Subtype: 'Link',
                        Rect: [x, y - tabHeight, x + layout.tabWidth, y],
                        Border: [0, 0, 0],
                        Dest: [targetPage.ref, 'Fit'],
                    })
                ])
            );
        }
    });

    // --- Top Navigation Icons ---
    const iconSize = 16; // Slightly smaller for cleaner look
    const iconGap = 20;
    // Align with Daily View Date Title
    // Date is at: marginBottom + contentHeight + 15
    // contentHeight = height - marginTop - marginBottom
    // So y = height - layout.marginTop + 15
    const topY = layout.height - layout.marginTop + 12;

    const icons = [
        { id: 'home', path: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z', target: 'index' }, // Home
        { id: 'year', path: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z', target: 'year-overview' }, // Calendar
    ];

    // Add Contextual Icons (Month, Week, Prev, Next)
    if (pageDef.date) {
        // Month Link (Grid)
        const monthNum = String(pageDef.date.getMonth() + 1).padStart(2, '0');
        icons.push({ id: 'month', path: 'M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-6v6h5V5h-5z', target: `month-${config.year}-${monthNum}` });

        // Week Link (List/View Week)
        const weekId = getWeekId(pageDef.date, config.weekStart);
        icons.push({ id: 'week', path: 'M4 18h17v-6H4v6zm0-8h17V4H4v6z', target: weekId });

        // Previous Day (Chevron Left)
        const prevDate = new Date(pageDef.date);
        prevDate.setDate(prevDate.getDate() - 1);
        if (prevDate.getFullYear() === config.year) {
            icons.push({ id: 'prev', path: 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z', target: formatDateId(prevDate) });
        }

        // Next Day (Chevron Right)
        const nextDate = new Date(pageDef.date);
        nextDate.setDate(nextDate.getDate() + 1);
        if (nextDate.getFullYear() === config.year) {
            icons.push({ id: 'next', path: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z', target: formatDateId(nextDate) });
        }
    }

    // Right Align: Start from right margin and move left
    const totalWidth = icons.length * (iconSize + iconGap) - iconGap;
    // Let's calculate startX for the group to be right-aligned
    // Actually, user wants them right aligned.
    // Let's do Home -> Next, but aligned to the right.

    const groupStartX = layout.width - layout.marginRight - totalWidth;

    icons.forEach((icon, index) => {
        const x = groupStartX + (index * (iconSize + iconGap));

        // Draw Icon (SVG Path)
        // Note: SVG paths are usually 24x24. We need to scale them.
        page.drawSvgPath(icon.path, {
            x,
            y: topY + iconSize, // SVG coordinate system is often top-down, but pdf-lib might be bottom-up? 
            // pdf-lib drawSvgPath origin is bottom-left of the path bounding box?
            // Actually pdf-lib docs say: "The path is drawn in the page's coordinate system."
            // Standard SVG paths (like Material Design) are 24x24 with (0,0) at top-left.
            // In PDF (0,0) is bottom-left.
            // So we need to flip the Y axis or just scale/translate carefully.
            // Let's try drawing it and see. Usually need to scale and maybe flip.
            // A simple way is to scale by iconSize/24.
            scale: iconSize / 24,
            color: rgb(0.3, 0.3, 0.3),
            borderColor: rgb(0.3, 0.3, 0.3),
        });

        // Link Overlay (Invisible)
        const targetPage = pageRefs[icon.target];
        if (targetPage) {
            page.node.set(
                // @ts-ignore
                PDFName.of('Annots'),
                // @ts-ignore
                pdfDoc.context.obj([
                    // @ts-ignore
                    ...(page.node.Annots()?.asArray() || []),
                    pdfDoc.context.obj({
                        Type: 'Annot',
                        Subtype: 'Link',
                        Rect: [x - 5, topY - 5, x + iconSize + 5, topY + iconSize + 5], // Larger touch target
                        Border: [0, 0, 0],
                        Dest: [targetPage.ref, 'Fit'],
                    })
                ])
            );
        }
    });

    // Custom Sections (Left of the icons? Or further right? User said "align this to the right side")
    // If icons are right aligned, custom sections should probably be to the left of them or hidden?
    // Let's put custom sections to the LEFT of the icons.

    const customSectionGap = 15;
    let customX = groupStartX - 20; // Start 20px left of icons

    // Draw Custom Sections in reverse (Right to Left)
    [...config.customSections].reverse().forEach((section, i) => {
        // Original index needed for link
        const originalIndex = config.customSections.length - 1 - i;
        const title = section.title.substring(0, 8);
        const width = font.widthOfTextAtSize(title, 10);

        customX -= width; // Move left by text width

        page.drawText(title, {
            x: customX,
            y: topY + 4,
            size: 10,
            font,
            color: rgb(0.4, 0.4, 0.4)
        });

        const targetId = `section-${originalIndex}-page-0`;
        const targetPage = pageRefs[targetId];
        if (targetPage) {
            page.node.set(
                // @ts-ignore
                PDFName.of('Annots'),
                // @ts-ignore
                pdfDoc.context.obj([
                    // @ts-ignore
                    ...(page.node.Annots()?.asArray() || []),
                    pdfDoc.context.obj({
                        Type: 'Annot',
                        Subtype: 'Link',
                        Rect: [customX, topY, customX + width, topY + iconSize],
                        Border: [0, 0, 0],
                        Dest: [targetPage.ref, 'Fit'],
                    })
                ])
            );
        }

        customX -= customSectionGap; // Gap for next item
    });
};

const drawMonthGrid = (
    page: PDFPage,
    layout: LayoutDimensions,
    pageDef: PageDefinition,
    font: PDFFont,
    config: PlannerConfig,
    pdfDoc: PDFDocument,
    pageRefs: Record<string, PDFPage>
) => {
    const { marginLeft, marginBottom, contentWidth, contentHeight } = layout;

    // Layout: Grid (Top 80%) + Goals (Bottom 20%)
    const goalsHeight = contentHeight * 0.2;
    const gridHeight = contentHeight - goalsHeight - 20;
    const headerHeight = 30;
    const cellWidth = contentWidth / 7;
    const cellHeight = (gridHeight - headerHeight) / 6; // Max 6 weeks

    // Draw Header (Days of Week)
    const days = config.weekStart === 'sunday'
        ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    days.forEach((day, i) => {
        page.drawRectangle({
            x: marginLeft + (i * cellWidth),
            y: marginBottom + goalsHeight + 20 + gridHeight - headerHeight,
            width: cellWidth,
            height: headerHeight,
            color: rgb(0.95, 0.95, 0.95),
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 0.5,
        });

        page.drawText(day, {
            x: marginLeft + (i * cellWidth) + 5,
            y: marginBottom + goalsHeight + 20 + gridHeight - headerHeight + 10,
            size: 10,
            font: font,
            color: rgb(0.3, 0.3, 0.3),
        });
    });

    // Calculate Dates
    if (!pageDef.date) return;
    const monthDates = getCalendarMonthDays(pageDef.date.getFullYear(), pageDef.date.getMonth() + 1, config.weekStart);

    // Draw Grid and Dates
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            const index = row * 7 + col;
            if (index >= monthDates.length) break;

            const date = monthDates[index];
            const isCurrentMonth = date.getMonth() === pageDef.date.getMonth();

            const x = marginLeft + (col * cellWidth);
            const y = marginBottom + goalsHeight + 20 + gridHeight - headerHeight - ((row + 1) * cellHeight);

            // Cell Background
            page.drawRectangle({
                x,
                y,
                width: cellWidth,
                height: cellHeight,
                color: isCurrentMonth ? rgb(1, 1, 1) : rgb(0.98, 0.98, 0.98),
                borderColor: rgb(0.8, 0.8, 0.8),
                borderWidth: 0.5,
            });

            // Date Number
            page.drawText(date.getDate().toString(), {
                x: x + 5,
                y: y + cellHeight - 15,
                size: 12,
                font: font,
                color: isCurrentMonth ? rgb(0, 0, 0) : rgb(0.6, 0.6, 0.6),
            });

            // Link to Day Page
            const dayId = formatDateId(date);
            const targetPage = pageRefs[dayId];
            if (targetPage) {
                page.node.set(
                    // @ts-ignore
                    PDFName.of('Annots'),
                    // @ts-ignore
                    pdfDoc.context.obj([
                        // @ts-ignore
                        ...(page.node.Annots()?.asArray() || []),
                        pdfDoc.context.obj({
                            Type: 'Annot',
                            Subtype: 'Link',
                            Rect: [x, y, x + cellWidth, y + cellHeight],
                            Border: [0, 0, 0],
                            Dest: [targetPage.ref, 'Fit'],
                        })
                    ])
                );
            }
        }
    }

    // Draw Monthly Goals Section (Bottom)
    const goalsY = marginBottom;
    drawSectionBox(page, font, marginLeft, goalsY, contentWidth, goalsHeight, 'MONTHLY GOALS');
    drawLinesInBox(page, marginLeft, goalsY, contentWidth, goalsHeight, 5);
};

const drawWeekLayout = (
    page: PDFPage,
    layout: LayoutDimensions,
    pageDef: PageDefinition,
    font: PDFFont,
    config: PlannerConfig,
    pdfDoc: PDFDocument,
    pageRefs: Record<string, PDFPage>
) => {
    const { marginLeft, marginBottom, contentWidth, contentHeight } = layout;

    // Layout: Top Focus/Habits (20%) + Days (80%)
    const topSectionHeight = contentHeight * 0.2;
    const daysHeight = contentHeight - topSectionHeight - 20;
    const dayHeight = daysHeight / 7;

    // Draw Top Section
    const halfWidth = (contentWidth - 20) / 2;

    // Weekly Focus
    page.drawText('Weekly Focus', {
        x: marginLeft,
        y: marginBottom + contentHeight - 15,
        size: 12,
        font,
        color: rgb(0, 0, 0)
    });
    page.drawRectangle({
        x: marginLeft,
        y: marginBottom + contentHeight - topSectionHeight,
        width: halfWidth,
        height: topSectionHeight - 25,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 0.5
    });

    // Habit Tracker
    page.drawText('Habit Tracker', {
        x: marginLeft + halfWidth + 20,
        y: marginBottom + contentHeight - 15,
        size: 12,
        font,
        color: rgb(0, 0, 0)
    });

    // Draw Habit Grid (5 habits x 7 days)
    const habitX = marginLeft + halfWidth + 20;
    const habitY = marginBottom + contentHeight - topSectionHeight;
    const habitWidth = halfWidth;
    const habitHeight = topSectionHeight - 25;

    // Header Row (Weekdays)
    const headerHeight = 20;
    const habitRowHeight = (habitHeight - headerHeight) / 5;
    const habitNameWidth = 90;
    const dayColWidth = (habitWidth - habitNameWidth) / 7;

    const dayLabels = config.weekStart === 'sunday'
        ? ['S', 'M', 'T', 'W', 'T', 'F', 'S']
        : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    // Draw Header
    dayLabels.forEach((label, i) => {
        page.drawText(label, {
            x: habitX + habitNameWidth + (i * dayColWidth) + (dayColWidth / 2) - 3,
            y: habitY + habitHeight - 14,
            size: 9,
            font,
            color: rgb(0.4, 0.4, 0.4)
        });
    });

    // Draw Rows
    for (let i = 0; i < 5; i++) {
        const y = habitY + habitHeight - headerHeight - ((i + 1) * habitRowHeight);

        // Habit Name Line
        page.drawLine({
            start: { x: habitX, y: y },
            end: { x: habitX + habitNameWidth - 10, y: y },
            color: rgb(0.8, 0.8, 0.8),
            thickness: 0.5
        });

        // Checkboxes for each day
        for (let d = 0; d < 7; d++) {
            const cx = habitX + habitNameWidth + (d * dayColWidth) + (dayColWidth / 2) - 6;
            const cy = y + (habitRowHeight / 2) - 6;

            page.drawRectangle({
                x: cx,
                y: cy,
                width: 12,
                height: 12,
                borderColor: rgb(0.7, 0.7, 0.7),
                borderWidth: 0.5
            });
        }
    }

    // Days Section
    const days = config.weekStart === 'sunday'
        ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Calculate dates for the week
    const weekStart = pageDef.date || new Date();
    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
    });

    for (let i = 0; i < 7; i++) {
        const y = marginBottom + daysHeight - ((i + 1) * dayHeight);
        const date = weekDates[i];
        const dayName = days[i];
        const dateStr = format(date, 'MMM d');

        // Day Container
        page.drawRectangle({
            x: marginLeft,
            y,
            width: contentWidth,
            height: dayHeight,
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 0.5,
            color: rgb(1, 1, 1)
        });

        // Day Name
        page.drawText(dayName, {
            x: marginLeft + 10,
            y: y + dayHeight - 20,
            size: 12,
            font: font,
            color: rgb(0, 0, 0),
        });

        // Date
        page.drawText(dateStr, {
            x: marginLeft + 100,
            y: y + dayHeight - 20,
            size: 12,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
        });

        // Link to Day Page
        const dayId = formatDateId(date);
        const targetPage = pageRefs[dayId];
        if (targetPage) {
            page.node.set(
                // @ts-ignore
                PDFName.of('Annots'),
                // @ts-ignore
                pdfDoc.context.obj([
                    // @ts-ignore
                    ...(page.node.Annots()?.asArray() || []),
                    pdfDoc.context.obj({
                        Type: 'Annot',
                        Subtype: 'Link',
                        Rect: [marginLeft, y, marginLeft + contentWidth, y + dayHeight],
                        Border: [0, 0, 0],
                        Dest: [targetPage.ref, 'Fit'],
                    })
                ])
            );
        }
    }
};

const drawDayLayout = (page: PDFPage, layout: LayoutDimensions, font: PDFFont, pageDef: PageDefinition) => {
    const { marginLeft, marginBottom, contentWidth, contentHeight } = layout;

    // Draw Title (Date)
    if (pageDef.date) {
        const dateStr = format(pageDef.date, 'EEEE, MMMM d, yyyy');
        page.drawText(dateStr, {
            x: marginLeft,
            y: marginBottom + contentHeight + 15,
            size: 18,
            font,
            color: rgb(0, 0, 0),
        });
    }

    // Layout Constants
    const colGap = 20;
    const leftColWidth = (contentWidth - colGap) * 0.4;
    const rightColWidth = (contentWidth - colGap) * 0.6;
    const rightColX = marginLeft + leftColWidth + colGap;
    const sectionGap = 15;

    // --- LEFT COLUMN ---
    let currentY = marginBottom + contentHeight;

    // 1. Top 3 Tasks
    const top3Height = 100;
    drawSectionBox(page, font, marginLeft, currentY - top3Height, leftColWidth, top3Height, 'TOP 3 PRIORITIES');

    // Checkboxes for Top 3
    for (let i = 0; i < 3; i++) {
        const y = currentY - 40 - (i * 25);
        drawCheckboxLine(page, marginLeft + 10, y, leftColWidth - 20);
    }
    currentY -= (top3Height + sectionGap);

    // 2. Schedule
    const scheduleHeight = currentY - marginBottom;
    drawSectionBox(page, font, marginLeft, marginBottom, leftColWidth, scheduleHeight, 'SCHEDULE');

    // Timeline
    const startHour = 6;
    const endHour = 22;
    const hourHeight = (scheduleHeight - 40) / (endHour - startHour + 1);

    for (let h = startHour; h <= endHour; h++) {
        const y = marginBottom + scheduleHeight - 40 - ((h - startHour) * hourHeight);

        // Hour Text
        page.drawText(`${h}:00`, {
            x: marginLeft + 5,
            y: y - 4,
            size: 9,
            font,
            color: rgb(0.5, 0.5, 0.5)
        });

        // Line
        page.drawLine({
            start: { x: marginLeft + 35, y },
            end: { x: marginLeft + leftColWidth - 10, y },
            color: rgb(0.9, 0.9, 0.9),
            thickness: 0.5
        });
    }

    // --- RIGHT COLUMN ---
    currentY = marginBottom + contentHeight;

    // 1. To-Do List (At least 8 lines)
    const todoLines = 10;
    const todoLineHeight = 20;
    const todoHeight = (todoLines * todoLineHeight) + 30; // Header + padding
    drawSectionBox(page, font, rightColX, currentY - todoHeight, rightColWidth, todoHeight, 'TO-DO LIST');

    for (let i = 0; i < todoLines; i++) {
        const y = currentY - 40 - (i * todoLineHeight);
        drawCheckboxLine(page, rightColX + 10, y, rightColWidth - 20);
    }
    currentY -= (todoHeight + sectionGap);

    // 2. Reflect / Gratitude (Small, 2 lines)
    const reflectHeight = 80;
    drawSectionBox(page, font, rightColX, currentY - reflectHeight, rightColWidth, reflectHeight, 'REFLECT / GRATITUDE');
    drawLinesInBox(page, rightColX, currentY - reflectHeight, rightColWidth, reflectHeight, 2);
    currentY -= (reflectHeight + sectionGap);

    // 3. Water & Weather (Side by Side in one row)
    const trackerHeight = 50;
    const trackerY = currentY - trackerHeight;

    // Water (Left half of right col)
    const waterWidth = (rightColWidth - 10) / 2;
    drawSectionBox(page, font, rightColX, trackerY, waterWidth, trackerHeight, 'WATER');

    // Water Icons (6 Droplets)
    const dropPath = 'M12 22c4.97 0 9-4.03 9-9-4.5 0-9-9-9-9s-4.5 9-9 9c0 4.97 4.03 9 9 9z'; // Simple droplet-ish shape
    const dropSize = 12;
    const dropGap = 5;
    const dropStartX = rightColX + (waterWidth - (6 * (dropSize + dropGap))) / 2 + 5;

    for (let i = 0; i < 6; i++) {
        page.drawSvgPath(dropPath, {
            x: dropStartX + (i * (dropSize + dropGap)),
            y: trackerY + 15,
            scale: dropSize / 24,
            color: rgb(1, 1, 1), // White fill for user to color
            borderColor: rgb(0.6, 0.6, 0.6), // Grey border
            borderWidth: 1
        });
    }

    // Weather (Right half of right col)
    const weatherX = rightColX + waterWidth + 10;
    drawSectionBox(page, font, weatherX, trackerY, waterWidth, trackerHeight, 'WEATHER');

    // Weather Icons (Sun, Cloud, Lightning, Wind/Spiral, Snow/Circle)
    const wIcons = [
        'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0-5v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42', // Sun
        'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z', // Cloud
        'M7 2v11h3v9l7-12h-4l4-8z', // Lightning
        'M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z', // Spiral/Refresh
        'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z' // Circle
    ];

    const wSize = 12;
    const wGap = 8;
    const wStartX = weatherX + (waterWidth - (6 * (wSize + wGap))) / 2 + 5;

    for (let i = 0; i < 5; i++) { // 5 icons to fit comfortably
        const path = wIcons[i] || wIcons[0];
        page.drawSvgPath(path, {
            x: wStartX + (i * (wSize + wGap)),
            y: trackerY + 15,
            scale: wSize / 24,
            color: rgb(0.5, 0.5, 0.5),
            borderColor: rgb(0.5, 0.5, 0.5),
            borderWidth: 1
        });
    }

    currentY -= (trackerHeight + sectionGap);

    // 4. Notes (Remaining Space)
    const notesHeight = currentY - marginBottom;
    drawSectionBox(page, font, rightColX, marginBottom, rightColWidth, notesHeight, 'NOTES');

    // Dotted grid for notes
    const dotSpacing = 20;
    const cols = Math.floor((rightColWidth - 20) / dotSpacing);
    const rows = Math.floor((notesHeight - 40) / dotSpacing);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            page.drawCircle({
                x: rightColX + 10 + (c * dotSpacing),
                y: marginBottom + notesHeight - 40 - (r * dotSpacing),
                size: 1,
                color: rgb(0.8, 0.8, 0.8)
            });
        }
    }
};

// Helper: Draw a titled section box
const drawSectionBox = (page: PDFPage, font: PDFFont, x: number, y: number, width: number, height: number, title: string) => {
    const headerHeight = 20;

    // Header Background (Fill only)
    page.drawRectangle({
        x,
        y: y + height - headerHeight,
        width,
        height: headerHeight,
        color: rgb(0.95, 0.95, 0.95),
        borderWidth: 0 // No border on the fill
    });

    // Separator Line
    page.drawLine({
        start: { x, y: y + height - headerHeight },
        end: { x: x + width, y: y + height - headerHeight },
        color: rgb(0.8, 0.8, 0.8),
        thickness: 0.5
    });

    // Outer Border (Full Box)
    page.drawRectangle({
        x,
        y,
        width,
        height,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 0.5,
        color: undefined // Transparent fill
    });

    // Header Text
    page.drawText(title, {
        x: x + 10,
        y: y + height - 14,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3)
    });
};

// Helper: Draw checkbox and line
const drawCheckboxLine = (page: PDFPage, x: number, y: number, width: number) => {
    // Checkbox
    page.drawRectangle({
        x,
        y,
        width: 12,
        height: 12,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 1
    });

    // Line
    page.drawLine({
        start: { x: x + 20, y: y + 2 },
        end: { x: x + width, y: y + 2 },
        color: rgb(0.8, 0.8, 0.8),
        thickness: 0.5
    });
};

// Helper: Draw lines in a box
const drawLinesInBox = (page: PDFPage, x: number, y: number, width: number, height: number, count: number) => {
    const spacing = (height - 40) / count;
    for (let i = 0; i < count; i++) {
        const ly = y + height - 40 - (i * spacing);
        page.drawLine({
            start: { x: x + 10, y: ly },
            end: { x: x + width - 10, y: ly },
            color: rgb(0.8, 0.8, 0.8),
            thickness: 0.5
        });
    }
};
const drawNoteLayout = (page: PDFPage, layout: LayoutDimensions, pageDef: PageDefinition, config: PlannerConfig) => {
    const { marginLeft, marginBottom, contentWidth, contentHeight } = layout;
    const template = pageDef.metadata?.template || 'lined';
    const lineHeight = (config.theme.lineHeight || 1.2) * 20; // Base 20px * multiplier

    if (template === 'lined') {
        const lines = Math.floor(contentHeight / lineHeight);
        for (let i = 0; i < lines; i++) {
            const y = marginBottom + contentHeight - ((i + 1) * lineHeight);
            page.drawLine({
                start: { x: marginLeft, y },
                end: { x: marginLeft + contentWidth, y },
                color: rgb(0.8, 0.8, 0.8),
                thickness: 0.5,
            });
        }
    } else if (template === 'dotted') {
        const dotSpacing = lineHeight;
        const rows = Math.floor(contentHeight / dotSpacing);
        const cols = Math.floor(contentWidth / dotSpacing);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                page.drawCircle({
                    x: marginLeft + (c * dotSpacing),
                    y: marginBottom + contentHeight - ((r + 1) * dotSpacing),
                    size: 1,
                    color: rgb(0.8, 0.8, 0.8),
                });
            }
        }
    }
};

const drawIndexPage = (
    page: PDFPage,
    layout: LayoutDimensions,
    font: PDFFont
) => {
    const { marginLeft, marginBottom, contentWidth, contentHeight } = layout;

    // Layout Constants
    const colGap = 15;
    const colWidth = (contentWidth - (colGap * 2)) / 3;

    const topSectionHeight = contentHeight * 0.65;
    const bottomSectionHeight = contentHeight * 0.30;

    const topY = marginBottom + contentHeight;

    // --- TOP SECTION ---

    // Column 1: Active Projects
    const col1X = marginLeft;
    drawSectionBox(page, font, col1X, topY - topSectionHeight, colWidth, topSectionHeight, 'ACTIVE PROJECTS');
    drawLinesInBox(page, col1X, topY - topSectionHeight, colWidth, topSectionHeight, 20);

    // Column 2: Areas
    const col2X = marginLeft + colWidth + colGap;
    drawSectionBox(page, font, col2X, topY - topSectionHeight, colWidth, topSectionHeight, 'AREAS');
    drawLinesInBox(page, col2X, topY - topSectionHeight, colWidth, topSectionHeight, 20);

    // Column 3: Learnings & Travel (Split)
    const col3X = marginLeft + (colWidth + colGap) * 2;
    const splitHeight = (topSectionHeight - 15) / 2;

    // Learnings (Top)
    drawSectionBox(page, font, col3X, topY - splitHeight, colWidth, splitHeight, 'LEARNINGS');
    drawLinesInBox(page, col3X, topY - splitHeight, colWidth, splitHeight, 10);

    // Travel (Bottom)
    drawSectionBox(page, font, col3X, topY - topSectionHeight, colWidth, splitHeight, 'TRAVEL');
    drawLinesInBox(page, col3X, topY - topSectionHeight, colWidth, splitHeight, 10);


    // --- BOTTOM SECTION ---

    // Books (2/3 Width)
    const booksWidth = (colWidth * 2) + colGap;
    drawSectionBox(page, font, col1X, marginBottom, booksWidth, bottomSectionHeight, 'BOOKS');
    drawLinesInBox(page, col1X, marginBottom, booksWidth, bottomSectionHeight, 8);

    // Links (1/3 Width, Empty)
    drawSectionBox(page, font, col3X, marginBottom, colWidth, bottomSectionHeight, 'LINKS');
    drawLinesInBox(page, col3X, marginBottom, colWidth, bottomSectionHeight, 8);
};


const drawYearPage = (
    page: PDFPage,
    layout: LayoutDimensions,
    font: PDFFont,
    config: PlannerConfig,
    pdfDoc: PDFDocument,
    pageRefs: Record<string, PDFPage>
) => {
    const { marginLeft, marginBottom, contentWidth, contentHeight } = layout;

    // Layout: 3x4 Grid of Months + Bottom Goals
    const goalsHeight = contentHeight * 0.2;
    const gridHeight = contentHeight - goalsHeight - 20;

    const cols = 3;
    const rows = 4;
    const cellWidth = contentWidth / cols;
    const cellHeight = gridHeight / rows;

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    months.forEach((month, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = marginLeft + (col * cellWidth);
        const y = marginBottom + goalsHeight + 20 + gridHeight - ((row + 1) * cellHeight);

        // Month Box
        page.drawRectangle({
            x: x + 5,
            y: y + 5,
            width: cellWidth - 10,
            height: cellHeight - 10,
            color: rgb(0.98, 0.98, 0.98),
            borderColor: rgb(0.9, 0.9, 0.9),
            borderWidth: 1,
        });

        // Month Title
        page.drawText(month, {
            x: x + 15,
            y: y + cellHeight - 25,
            size: 12,
            font,
            color: rgb(0, 0, 0)
        });

        // Link to Month
        const monthNum = String(i + 1).padStart(2, '0');
        const targetId = `month-${config.year}-${monthNum}`;
        const targetPage = pageRefs[targetId];

        if (targetPage) {
            page.node.set(
                // @ts-ignore
                PDFName.of('Annots'),
                // @ts-ignore
                pdfDoc.context.obj([
                    // @ts-ignore
                    ...(page.node.Annots()?.asArray() || []),
                    pdfDoc.context.obj({
                        Type: 'Annot', Subtype: 'Link',
                        Rect: [x + 5, y + 5, x + cellWidth - 5, y + cellHeight - 5],
                        Border: [0, 0, 0], Dest: [targetPage.ref, 'Fit']
                    })
                ])
            );
        }
    });

    // Goals Section
    const goalsY = marginBottom;
    page.drawText('Yearly Goals', {
        x: marginLeft,
        y: goalsY + goalsHeight - 15,
        size: 14,
        font,
        color: rgb(0, 0, 0)
    });

    page.drawRectangle({
        x: marginLeft,
        y: goalsY,
        width: contentWidth,
        height: goalsHeight - 25,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 0.5,
    });

    // Dotted lines for goals
    const lineSpacing = 25;
    const numLines = Math.floor((goalsHeight - 35) / lineSpacing);
    for (let i = 0; i < numLines; i++) {
        const ly = goalsY + goalsHeight - 45 - (i * lineSpacing);
        page.drawLine({
            start: { x: marginLeft + 10, y: ly },
            end: { x: marginLeft + contentWidth - 10, y: ly },
            color: rgb(0.8, 0.8, 0.8),
            thickness: 0.5,
            dashArray: [2, 2]
        });
    }
};

const drawCoverPage = async (
    page: PDFPage,
    layout: LayoutDimensions,
    config: PlannerConfig,
    font: PDFFont,
    pdfDoc: PDFDocument
) => {
    const { width, height } = layout;

    // Draw Background Image if available
    if (config.cover?.image) {
        try {
            let imageBytes: ArrayBuffer;
            let isPng = false;

            if (config.cover.image.startsWith('data:')) {
                // Handle Data URL manually
                const base64Data = config.cover.image.split(',')[1];
                const binaryString = atob(base64Data);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                imageBytes = bytes.buffer;

                // Check magic bytes for PNG (89 50 4E 47)
                if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
                    isPng = true;
                }
            } else {
                // Handle URL (fallback)
                const res = await fetch(config.cover.image);
                imageBytes = await res.arrayBuffer();
                isPng = config.cover.image.toLowerCase().endsWith('.png');
            }

            let image;
            if (isPng) {
                image = await pdfDoc.embedPng(imageBytes);
            } else {
                image = await pdfDoc.embedJpg(imageBytes);
            }

            // Scale image to fill page (cover)
            const imgDims = image.scale(1);
            const scale = Math.max(width / imgDims.width, height / imgDims.height);
            const scaledWidth = imgDims.width * scale;
            const scaledHeight = imgDims.height * scale;

            page.drawImage(image, {
                x: (width - scaledWidth) / 2,
                y: (height - scaledHeight) / 2,
                width: scaledWidth,
                height: scaledHeight,
                opacity: 0.3 // Dim it slightly for text readability
            });
        } catch (e) {
            console.error('Failed to load cover image', e);
        }
    }

    // Draw Title
    const title = config.cover?.title || `${config.year} Planner`;
    const titleSize = 48;
    const titleWidth = font.widthOfTextAtSize(title, titleSize);

    page.drawText(title, {
        x: (width - titleWidth) / 2,
        y: height * 0.6,
        size: titleSize,
        font: font,
        color: rgb(0, 0, 0),
    });

    // Draw Subtitle
    if (config.cover?.subtitle) {
        const subtitle = config.cover.subtitle;
        const subtitleSize = 24;
        const subtitleWidth = font.widthOfTextAtSize(subtitle, subtitleSize);

        page.drawText(subtitle, {
            x: (width - subtitleWidth) / 2,
            y: height * 0.6 - 40,
            size: subtitleSize,
            font: font,
            color: rgb(0.4, 0.4, 0.4),
        });
    }
};
