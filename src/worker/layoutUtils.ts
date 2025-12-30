import type { PlannerConfig } from '../core/types';

export interface LayoutDimensions {
    width: number;
    height: number;
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
    contentWidth: number;
    contentHeight: number;
    tabWidth: number; // For side tabs
    tabHeight: number; // For top tabs
}

export const getLayoutDimensions = (config: PlannerConfig): LayoutDimensions => {
    let width = 595.28;
    let height = 841.89;

    // Determine base dimensions
    if (config.device === 'tab-s') {
        if (config.orientation === 'portrait') {
            width = 600; // Adjusted for better math
            height = 960; // 16:10 ratio approx
        } else {
            width = 960;
            height = 600;
        }
    } else if (config.device === 'fold') {
        if (config.orientation === 'portrait') {
            width = 600;
            height = 750;
        } else {
            width = 750;
            height = 600;
        }
    } else {
        if (config.orientation === 'portrait') {
            width = 595;
            height = 842;
        } else {
            width = 842;
            height = 595;
        }
    }

    // Safe zones (Samsung Notes toolbar interference)
    const safeMarginY = 50;
    const safeMarginX = 20;

    // Tab dimensions
    const sideTabWidth = 40;
    const topTabHeight = 30;

    // Calculate margins based on handedness
    const marginLeft = config.handedness === 'left' ? sideTabWidth + safeMarginX : safeMarginX;
    const marginRight = config.handedness === 'right' ? sideTabWidth + safeMarginX : safeMarginX;
    const marginTop = topTabHeight + safeMarginY;
    const marginBottom = safeMarginY;

    const round = (num: number) => Math.round(num * 100) / 100;

    return {
        width: round(width),
        height: round(height),
        marginTop: round(marginTop),
        marginBottom: round(marginBottom),
        marginLeft: round(marginLeft),
        marginRight: round(marginRight),
        contentWidth: round(width - marginLeft - marginRight),
        contentHeight: round(height - marginTop - marginBottom),
        tabWidth: round(sideTabWidth),
        tabHeight: round(topTabHeight)
    };
};
