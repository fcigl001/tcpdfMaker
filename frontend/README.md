# PDF Layout Editor

A modern React-based visual editor for designing PDF report layouts. Drag-and-drop components onto a page canvas and export JSON layouts that are compatible with the TCPDF generator.

## Features

- **Drag-and-Drop Interface**: Drag components from the palette directly onto the page canvas
- **Visual Page Preview**: See an approximate preview of your PDF layout as you design
- **Component Types**:
  - Text blocks with placeholder support
  - Images with placeholder or static paths
  - Horizontal lines
  - Spacers
  - Multi-column layouts
  - Data tables with header and body configuration
  - Page breaks
- **Named Styles**: Create and manage reusable text styles
- **Page Settings**: Configure page size, orientation, margins, headers, and footers
- **Import/Export**: Export layouts as JSON or import existing layouts for editing

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

This will start the development server at `http://localhost:3000`.

### Production Build

```bash
npm run build
```

The built files will be output to the `dist` directory.

## Usage

1. **Add Components**: Drag components from the left sidebar onto the page canvas
2. **Select Elements**: Click on elements in the canvas or layout tree to select them
3. **Edit Properties**: Use the right panel to edit element properties
4. **Manage Styles**: Use the Styles tab to create and edit named styles
5. **Configure Page**: Use the Page tab to set document metadata and page settings
6. **Export**: Click "Export JSON" to download or copy your layout

## JSON Schema

The exported JSON follows the TCPDF generator schema. See the main project README for the complete schema documentation.

## Tech Stack

- React 18
- Vite
- Zustand (state management)
- @dnd-kit (drag and drop)
- Lucide React (icons)
