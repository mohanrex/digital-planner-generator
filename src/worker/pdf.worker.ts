import { PDFDocument, StandardFonts, PDFPage } from 'pdf-lib';
import type { PlannerConfig } from '../core/types';
import { generatePageMap } from '../core/pageMapGenerator';
import { renderPageContent } from './renderer';
import { getLayoutDimensions } from './layoutUtils';

self.onmessage = async (e: MessageEvent<PlannerConfig>) => {
    const config = e.data;

    try {
        // 1. Generate Page Map
        const pageMap = generatePageMap(config);
        const totalPages = pageMap.pages.length;

        // 2. Create PDF
        const pdfDoc = await PDFDocument.create();
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Map pageId to PDFPage
        const pageRefs: Record<string, PDFPage> = {};

        // Pass 1: Create all pages
        for (let i = 0; i < totalPages; i++) {
            const pageDef = pageMap.pages[i];

            // Determine size based on device and orientation
            const layout = getLayoutDimensions(config);
            const page = pdfDoc.addPage([layout.width, layout.height]);
            pageRefs[pageDef.id] = page;
        }

        // Pass 2: Render Content and Links
        for (let i = 0; i < totalPages; i++) {
            const pageDef = pageMap.pages[i];
            const page = pageRefs[pageDef.id];

            // Report progress
            self.postMessage({ type: 'progress', value: Math.round(((i + 1) / totalPages) * 100), message: `Rendering ${pageDef.title}...` });

            // Render Content (includes tabs and links)
            renderPageContent(page, pageDef, helveticaFont, config, pdfDoc, pageRefs);
        }

        // 4. Save PDF
        const pdfBytes = await pdfDoc.save();

        // 5. Send back result
        self.postMessage({ type: 'complete', data: pdfBytes }, { transfer: [pdfBytes.buffer] });

    } catch (error) {
        self.postMessage({ type: 'error', error: (error as Error).message });
    }
};
