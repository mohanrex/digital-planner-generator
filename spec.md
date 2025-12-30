Product Specification: Custom Digital Planner Generator (Samsung Notes Edition)

Project Name: Galaxy Planner Forge (Working Title)
Version: 1.0
Platform: Web-based Application (Client-Side Only)
Target Output: Hyperlinked PDF optimized for Samsung Notes (Android)

1. Executive Summary

This project aims to build a free, browser-based tool that allows users to configure and generate a custom digital planner PDF. The tool addresses the frustration of buying static planner templates that don't fit specific needs. By processing everything client-side, we ensure user privacy, zero server costs for file generation, and high customization.

Core Value Proposition:

Device Optimized: Specific aspect ratios for Samsung Tab S series and Galaxy Fold.

Highly Configurable: Users choose layouts, start dates, and handedness (Left/Right).

Zero Cost/High Privacy: No data transfer; files are generated on the user's device.

2. User Interface (The Configurator)

The application will consist of a single-page application (SPA) with a split-screen layout: Configuration Sidebar (Left) and Live Preview (Right).

Phase 1: Global Settings

Device Profile:

Galaxy Tab S Series (16:10) - Canvas resolution approx. 2560 x 1600.

Galaxy Fold (5:4) - Boxier layout for foldables.

Standard (4:3) - iPad/General Android style.

Timeframe:

Year: Select Year (2025, 2026, etc.).

Start Month: Dropdown (Jan - Dec) to support academic years.

Duration: 12 Months (fixed cap for performance).

Localization:

Week Start: Sunday or Monday.

Language: English (Initial release).

Phase 2: Aesthetic & Ergonomics

Handedness (Crucial for S-Pen):

Right-Handed: Navigation tabs placed on the Right edge.

Left-Handed: Navigation tabs placed on the Left edge (prevents palm interference).

Theme Engine:

Presets: Minimalist White, Dark Mode, Pastel, Corporate.

Custom Accent: Color Picker (Hex Code input) for tabs/headers.

Typography:

Line Height: Slider to adjust line spacing (Wide Rule vs. College Rule).

Phase 3: Layout Selection

Users select specific templates for each hierarchy level:

Monthly View: Grid (Classic) vs. Dashboard (Split view with goals).

Weekly View: Horizontal, Vertical Hourly, or Box/Grid.

Daily View:

Timeline: None, 12h, or 24h.

Background: Lined, Dotted, Graph, or Blank.

Widgets: Toggle for Weather, Hydration, Priorities, Notes.

3. Technical Architecture

Tech Stack

Frontend Framework: React.js or Vue.js.

PDF Generation Library: pdf-lib (JavaScript).

Reasoning: Excellent support for drawing text/SVG and creating thousands of internal "Outline" links without server dependency.

State Management: Standard Context API or Redux (to hold the configuration object).

Concurrency: Web Workers.

Requirement: The main thread cannot block while generating ~400 pages. The generation loop must run in a background worker, posting progress updates (%) to the UI.

PDF Structure & Logic

The PDF is generated linearly, but logically structured as a "Page Map" to enable hyperlinking.

The Page Map Algorithm:
To link "June 15th" from the Annual Calendar to the Daily Page, the system must pre-calculate the array of pages:

Index Pages: [Cover, Index, Yearly_Overview] (Pages 1-3)

Monthly Loops: For m in 1..12:

[Month_Cover, Month_Grid]

[Week_1, Week_2, Week_3, Week_4, Week_5]

[Day_1, Day_2 ... Day_30]

Address Calculation: The system calculates the exact Page ID for every single date before drawing starts.

4. Functional Specifications (The PDF Output)

Navigation System (The "App" Feel)

Global Tabs: Visible on every page (except Cover).

Side Tabs: 12 Tabs (Jan-Dec) + 1 "Index" Tab.

Top Tabs: 4-5 Custom Section Tabs (Notes, Projects, Goals).

Samsung Notes Safe Zones:

50px margin reserved on top/bottom to avoid interference with the Samsung Notes toolbar and system status bar.

Hyperlinking Requirements

Year View:

Click Month Name $\rightarrow$ Jump to Monthly Cover.

Click Date $\rightarrow$ Jump to specific Daily Page.

Month View:

Click Date $\rightarrow$ Jump to Daily Page.

Click Week Number/Icon $\rightarrow$ Jump to Weekly View.

Week View:

Click Day Header $\rightarrow$ Jump to Daily Page.

Click Mini-Calendar $\rightarrow$ Jump to Month View.

Daily View:

Click "Back to Week" text/icon $\rightarrow$ Jump to parent Weekly View.

Custom Sections (Appendix)

User can add "Collections" (e.g., Meeting Notes).

Generator appends 20-50 pages of the chosen template (Lined/Dotted).

These pages are linked solely from the "Index" page or Top Tabs.

5. Development Phases

Phase 1: MVP (Minimum Viable Product)

Fixed Aspect Ratio (Samsung Tab S).

One Theme (Minimalist).

Standard layouts only (Year/Month/Week/Day).

Working Hyperlinks.

Browser-based generation download.

Phase 2: Customization Update

Add Hex Color picker.
Add "Smart Text" (User inputs name to appear on Cover).

6. Known Limitations & User Education

File Size: Client-side generation of complex vector PDFs can become large. We must optimize SVG paths to keep the file under 50MB.

Samsung Notes Behavior: Users must be instructed that Hyperlinks only work in "Reading Mode" (the book icon), not in "Editing Mode."

Generation Time: Generating 400+ pages in JS may take 10-30 seconds depending on the device CPU. A "Progress Bar" is mandatory UI.