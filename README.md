# PDF Planner Generator

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-18.0-blue)
![Vite](https://img.shields.io/badge/Vite-5.0-purple)
![Vibe Coded](https://img.shields.io/badge/Vibe%20Coded-Anti%20Gravity%20%2B%20Gemini-ff69b4)

A powerful, customizable digital planner generator built with React, TypeScript, and `pdf-lib`. Create high-quality, hyperlinked PDF planners optimized for **GoodNotes, Notability, Samsung Notes, Xodo**, and other PDF annotation apps on **iPads, Android Tablets, and E-Ink devices**.


## Features

-   **Comprehensive Views**:
    -   **Yearly View**: High-level overview with goals.
    -   **Monthly View**: Calendar grid with "Texas Seasons" themes and monthly goals.
    -   **Weekly View**: Detailed layout with an advanced Habit Tracker (checkboxes & weekday columns).
    -   **Daily View**: Two-column layout featuring:
        -   **Top 3 Priorities** & **Schedule** (Hourly Timeline).
        -   **To-Do List** (10+ lines).
        -   **Reflect / Gratitude** section.
        -   **Hydration Tracker** (Colorless icons for customization).
        -   **Weather Tracker** (Visual icons: Sun, Cloud, Lightning, Refresh, Circle).
        -   **Notes** grid.
-   **Smart Navigation**: Fully hyperlinked tabs for easy navigation between Year, Month, Week, and Day views.
-   **Customization**:
    -   **Cover Page**: Support for custom background images and titles.
    -   **Themes**: Seasonal color palettes for month tabs.
    -   **Dashboard**: Index page with quick links to Projects, Areas, Learnings, Travel, and Books.
-   **High Performance**: Generates optimized PDFs client-side using Web Workers.

## Tech Stack

-   **Frontend**: React, TypeScript, Vite
-   **PDF Generation**: `pdf-lib`
-   **Styling**: Tailwind CSS (or custom CSS)
-   **Icons**: SVG Paths (Material Design style)

## Getting Started

### Prerequisites

-   Node.js (v16 or higher)
-   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/pdf-planner-generator.git
    cd pdf-planner-generator
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

## Usage

1.  **Configure**: Use the UI sidebar to set the Year, Start Date, and End Date.
2.  **Customize**: Upload a cover image or choose a preset.
3.  **Generate**: Click the "Generate Planner" button.
4.  **Download**: Once processing is complete, download your ready-to-use PDF planner!

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started, report bugs, or suggest new features.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
