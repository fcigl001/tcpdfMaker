# Columns Guide

## Basic Column Structure

```json
{
  "type": "columns",
  "columnGap": 5,
  "columns": [
    {
      "width": "50%",
      "elements": [ /* your elements here */ ]
    },
    {
      "width": "50%",
      "elements": [ /* your elements here */ ]
    }
  ]
}
```

## Properties

### `columnGap`
Space between columns in millimeters.
- Default: 4mm
- Example: `"columnGap": 5`

### `width`
Width of each column.
- Can be percentage: `"50%"`, `"33.33%"`, etc.
- Can be fixed mm: `60` (60mm wide)
- Can be `"auto"` (divides remaining space equally)

## Examples

### Two Equal Columns

```json
{
  "type": "columns",
  "columnGap": 5,
  "columns": [
    {
      "width": "50%",
      "elements": [
        {"type": "text", "content": "Left side"}
      ]
    },
    {
      "width": "50%",
      "elements": [
        {"type": "text", "content": "Right side"}
      ]
    }
  ]
}
```

### Three Columns (Custom Widths)

```json
{
  "type": "columns",
  "columnGap": 4,
  "columns": [
    {
      "width": "40%",
      "elements": [
        {"type": "text", "content": "Wide column"}
      ]
    },
    {
      "width": "30%",
      "elements": [
        {"type": "text", "content": "Medium"}
      ]
    },
    {
      "width": "30%",
      "elements": [
        {"type": "text", "content": "Medium"}
      ]
    }
  ]
}
```

### Columns with Images

```json
{
  "type": "columns",
  "columnGap": 5,
  "columns": [
    {
      "width": "50%",
      "elements": [
        {
          "type": "image",
          "source": {"type": "placeholder", "value": "/path/to/image.jpg"},
          "layout": {"width": 60, "height": 40},
          "fit": "contain"
        },
        {
          "type": "text",
          "content": "Image caption"
        }
      ]
    },
    {
      "width": "50%",
      "elements": [
        {"type": "text", "content": "Description text here"}
      ]
    }
  ]
}
```

### Sidebar Layout (70/30 split)

```json
{
  "type": "columns",
  "columnGap": 8,
  "columns": [
    {
      "width": "70%",
      "elements": [
        {"type": "text", "content": "Main content area", "style": {"fontSize": 12}}
      ]
    },
    {
      "width": "30%",
      "elements": [
        {"type": "text", "content": "Sidebar info", "style": {"fontSize": 9}}
      ]
    }
  ]
}
```

## What Can Go in Columns?

Each column can contain **any element type**:

- ✅ Text elements
- ✅ Images
- ✅ Lines
- ✅ Spacers
- ✅ Tables
- ✅ Even nested columns!

## Tips

1. **Column widths should add up to 100%** (if using percentages)
2. **Use `columnGap`** to control spacing - don't rely on margins
3. **Heights auto-balance** - the layout continues after the tallest column
4. **Fixed widths** can be used: `"width": 60` (means 60mm)
5. **Mix percentages and fixed**: First calculate fixed widths, then percentages of remaining space

## Using in the Visual Editor

1. Drag the **Columns** element from the sidebar
2. Click on it to open properties
3. Set number of columns and gap
4. Drag elements into each column area
5. Adjust widths in the properties panel

## PHP Example

See [columns-example.php](columns-example.php) for complete working examples.

## Generated Examples

Run `php columns-example.php` to generate:
- `columns-two.pdf` - Two equal columns
- `columns-three.pdf` - Three columns with custom widths
- `columns-with-images.pdf` - Columns containing images and text

## Common Layouts

### Newsletter Style
```json
{
  "columns": [
    {"width": "33.33%", "elements": [...]},
    {"width": "33.33%", "elements": [...]},
    {"width": "33.34%", "elements": [...]}
  ]
}
```

### Article with Sidebar
```json
{
  "columns": [
    {"width": "65%", "elements": [/* main article */]},
    {"width": "35%", "elements": [/* related info */]}
  ]
}
```

### Image Gallery (4 columns)
```json
{
  "columnGap": 3,
  "columns": [
    {"width": "25%", "elements": [{"type": "image", ...}]},
    {"width": "25%", "elements": [{"type": "image", ...}]},
    {"width": "25%", "elements": [{"type": "image", ...}]},
    {"width": "25%", "elements": [{"type": "image", ...}]}
  ]
}
```
