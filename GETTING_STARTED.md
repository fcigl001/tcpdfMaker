# Getting Started with PDF Layout Editor

This guide will help you get the PDF Layout Editor running on your local machine.

## Prerequisites

Make sure you have installed:
- **PHP 7.4+** (you have PHP 8.2.13 ✓)
- **Composer** (PHP package manager)
- **Node.js 16+** (JavaScript runtime)
- **npm** (comes with Node.js)

## Installation

All dependencies are already installed! If you need to reinstall:

```bash
# Install PHP dependencies (TCPDF)
cd frontend
composer install

# Install Node.js dependencies
npm install
```

## Running the Application

### Option 1: Quick Start (Recommended)

Run both servers with one command from the project root:

```bash
./start-dev.sh
```

This will:
1. Start the PHP API server on `http://localhost:8000`
2. Start the React frontend on `http://localhost:5173`
3. Automatically open your browser to the editor

Press `Ctrl+C` to stop both servers.

### Option 2: Manual Start

If you prefer to run servers separately:

**Terminal 1 - PHP API Server:**
```bash
./start-server.sh
# OR manually:
cd frontend
php -S localhost:8000
```

**Terminal 2 - React Frontend:**
```bash
cd frontend
npm run dev
```

## Using the Editor

### 1. Design Your Layout

- **Drag elements** from the left sidebar onto the canvas
- Elements include: Text, Image, Line, Spacer, Columns, Table, Page Break
- **Organize sections**: Header, Body, and Footer
- Use the **section tabs** at the top of the canvas to switch between them

### 2. Configure Elements

- Click on any element in the canvas to select it
- Edit properties in the **right panel**:
  - Content (text, image paths, etc.)
  - Layout (position, size, margins)
  - Style (fonts, colors, borders)
  - Element-specific settings

### 3. Define Styles

- Click **"Manage Styles"** in the properties panel
- Create reusable styles for consistent formatting
- Apply styles to elements using the `styleRef` property

### 4. Generate PDFs

**Preview:**
- Click the **"Preview PDF"** button in the header
- The PDF opens in a new browser tab
- Perfect for testing your layout

**Download:**
- Click the **"Download PDF"** button
- Saves the PDF file to your computer

### 5. Save Your Work

**Export JSON:**
- Click **"Export JSON"** to save your layout
- Store in version control
- Share with your team

**Import JSON:**
- Click **"Import"** to load a saved layout
- Paste JSON or upload a file

## Working with Data

The PDF generator supports dynamic data through placeholders:

### Sample Data

Edit the data in [Header.jsx](frontend/src/components/Header.jsx) (line 18-23):

```javascript
data: {
  client: { name: 'John Doe' },
  report_title: 'Sample Report',
  logo_path: '/path/to/logo.png',
  table_rows: [
    { property: 'Item 1', value: 1000 },
    { property: 'Item 2', value: 2000 }
  ]
}
```

### Using Placeholders

In your layout elements:

**Text content:**
```
"Report for {{client.name}}"
```

**Image source:**
```json
{
  "type": "image",
  "source": {
    "type": "placeholder",
    "value": "{{logo_path}}"
  }
}
```

**Table data:**
```json
{
  "type": "table",
  "body": {
    "rowSource": {
      "type": "placeholder",
      "value": "{{table_rows}}"
    }
  }
}
```

## Troubleshooting

### PHP Server Issues

**Port already in use:**
```bash
# Change the port in frontend/src/components/Header.jsx (line 12)
# And start PHP on a different port:
php -S localhost:8001
```

**TCPDF not found:**
```bash
cd frontend
composer install
```

### Frontend Issues

**Module not found errors:**
```bash
cd frontend
npm install
```

**Port 5173 already in use:**
- Vite will automatically try the next available port
- Check the terminal output for the actual URL

### PDF Generation Fails

1. Check that the PHP server is running (`http://localhost:8000/api.php`)
2. Open browser DevTools Console to see error messages
3. Verify file paths in image elements are absolute paths on your system
4. Make sure CORS headers are being sent (already configured in api.php)

## API Endpoint

The PHP backend exposes a single endpoint:

**Endpoint:** `POST http://localhost:8000/api.php`

**Request Body:**
```json
{
  "layout": { /* your layout JSON */ },
  "data": { /* dynamic data */ },
  "action": "preview" // or "download"
}
```

**Response:**
- `action: "preview"` → JSON with base64-encoded PDF
- `action: "download"` → Binary PDF file

## Next Steps

1. **Explore the examples** in the [README.md](README.md)
2. **Customize styles** to match your brand
3. **Add more data fields** for your use case
4. **Create templates** for different document types

## Need Help?

- Check the [README.md](README.md) for detailed API documentation
- Review the JSON schema for layout structure
- Inspect the example layouts in the editor

Happy PDF designing! 🎨📄
