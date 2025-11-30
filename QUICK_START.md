# Quick Start Guide

## Start the Application

Run this single command from the project root:

```bash
./start-dev.sh
```

This starts both:
- PHP API server → `http://localhost:8000`
- React frontend → `http://localhost:5173`

## What You Can Do

### In the Browser Editor (http://localhost:5173)

1. **Design:** Drag elements from left sidebar to canvas
2. **Configure:** Click elements, edit properties in right panel
3. **Preview:** Click "Preview PDF" button to see result
4. **Download:** Click "Download PDF" button to save

### Key Features

- **Header/Body/Footer sections** for page layout
- **Drag & drop** elements: Text, Image, Table, Columns, etc.
- **Live editing** of properties
- **Style management** for consistent formatting
- **JSON import/export** for saving layouts

## Files Created

```
tcpdfMaker/
├── start-dev.sh              # Start both servers
├── start-server.sh           # Start PHP only
├── GETTING_STARTED.md        # Full documentation
├── frontend/
│   ├── api.php              # PHP backend endpoint
│   └── src/components/
│       └── Header.jsx       # Updated with PDF buttons
```

## Quick Commands

```bash
# Start everything
./start-dev.sh

# Start PHP only
./start-server.sh

# Start frontend only
cd frontend && npm run dev

# Stop servers
Ctrl+C
```

## Customizing Data

Edit `frontend/src/components/Header.jsx` around line 19 to add your data:

```javascript
data: {
  client: { name: 'Your Name' },
  report_title: 'Your Report',
  // Add more data fields here
}
```

Then use placeholders in your layout: `{{client.name}}`

## Troubleshooting

**Can't generate PDF?**
- Make sure PHP server is running (http://localhost:8000)
- Check browser console for errors

**Port conflicts?**
- PHP uses port 8000
- Vite uses port 5173 (or auto-picks next available)

That's it! You're ready to create PDFs. 🚀
