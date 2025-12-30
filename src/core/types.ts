export type PageType = 'cover' | 'year' | 'month' | 'week' | 'day' | 'index' | 'collection' | 'note';

export interface PageLink {
    pageId: string;
    label: string;
    targetPageId: string;
}

export interface PageDefinition {
    id: string;
    type: PageType;
    title: string;
    date?: Date; // For calendar pages
    metadata?: Record<string, any>;
    links: PageLink[]; // Pre-calculated links to other pages
}

export interface PlannerConfig {
    year: number;
    startMonth: number; // 1-12
    durationMonths: number;
    weekStart: 'sunday' | 'monday';
    device: 'tab-s' | 'fold' | 'standard';
    orientation: 'portrait' | 'landscape';
    handedness: 'left' | 'right';
    theme: {
        accentColor: string;
        font: string;
        lineHeight: number; // 1.0 to 2.0
    };
    customSections: {
        title: string;
        pageCount: number;
        template: 'lined' | 'dotted' | 'blank';
    }[];
    cover?: {
        title?: string;
        subtitle?: string;
        image?: string; // Base64 data URL
    };
}

export interface PageMap {
    pages: PageDefinition[];
    pageOrder: string[]; // Array of page IDs in order
}
