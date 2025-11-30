# JSON to PDF Generator for TCPDF

A PHP library that renders PDF documents from JSON layout descriptions using TCPDF.

## Requirements

- PHP 7.4+
- TCPDF library (installed via Composer)

## Installation

```bash
composer require tecnickcom/tcpdf
```

Then include the generator:

```php
require_once 'src/JsonToPdfGenerator.php';
```

## Quick Start

```php
$json = file_get_contents('layout.json');

$data = [
    'client' => ['name' => 'John Doe'],
    'logo_path' => '/path/to/logo.png',
    'table_rows' => [
        ['property_name' => 'Office A', 'location' => 'New York', 'value' => 1500000, 'yield' => 7.5],
        ['property_name' => 'Retail B', 'location' => 'Chicago', 'value' => 890000, 'yield' => 8.2],
    ]
];

$pdf = createPdfFromJson($json, $data);
$pdf->Output('report.pdf', 'I');
```

## JSON Layout Schema

### Root Structure

```json
{
  "version": "1.0",
  "meta": {
    "title": "Document Title",
    "description": "Document description",
    "author": "Author Name"
  },
  "page": { },
  "styles": { },
  "header": { },
  "footer": { },
  "body": { }
}
```

### Page Configuration

```json
{
  "page": {
    "size": "A4",
    "orientation": "P",
    "units": "mm",
    "margins": {
      "top": 20,
      "right": 15,
      "bottom": 20,
      "left": 15
    },
    "autoPageBreak": true,
    "autoPageBreakMargin": 15
  }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `size` | string/array | "A4", "Letter", or [width, height] in mm |
| `orientation` | string | "P" (portrait) or "L" (landscape) |
| `units` | string | "mm", "cm", "in", "pt" |
| `margins` | object | Page margins |
| `autoPageBreak` | boolean | Enable automatic page breaks |
| `autoPageBreakMargin` | number | Bottom margin for auto page break |

### Styles

Define reusable styles:

```json
{
  "styles": {
    "heading": {
      "fontFamily": "helvetica",
      "fontSize": 16,
      "fontStyle": "B",
      "textColor": "#333333",
      "lineHeight": 1.4
    },
    "bodyText": {
      "fontFamily": "helvetica",
      "fontSize": 10,
      "fontStyle": "",
      "textColor": "#666666"
    }
  }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `fontFamily` | string | Font name (helvetica, times, courier) |
| `fontSize` | number | Font size in points |
| `fontStyle` | string | "", "B", "I", "BI" |
| `textColor` | string | Hex color "#RRGGBB" |
| `fillColor` | string | Background color |
| `lineColor` | string | Border/line color |
| `lineHeight` | number | Line height multiplier |

### Header & Footer

```json
{
  "header": {
    "repeatOnPages": "all",
    "height": 25,
    "elements": [ ]
  },
  "footer": {
    "repeatOnPages": "all",
    "height": 20,
    "elements": [ ]
  }
}
```

| `repeatOnPages` | Description |
|-----------------|-------------|
| `"all"` | Show on all pages |
| `"first-only"` | Show only on first page |
| `"except-first"` | Show on all pages except first |
| `"none"` | Do not show |

## Element Types

### Common Layout Properties

All elements support:

```json
{
  "layout": {
    "mode": "flow",
    "x": 0,
    "y": 0,
    "width": "auto",
    "height": "auto",
    "marginTop": 0,
    "marginBottom": 0,
    "marginLeft": 0,
    "marginRight": 0,
    "align": "left"
  },
  "styleRef": "bodyText",
  "style": { }
}
```

| Property | Description |
|----------|-------------|
| `mode` | "flow" (follows document flow) or "absolute" |
| `width` | Number in mm or "auto" |
| `align` | "left", "center", "right", "justify" |
| `styleRef` | Reference to a named style |
| `style` | Inline style overrides |

### Text Element

```json
{
  "type": "text",
  "content": "Report for {{client.name}}",
  "styleRef": "heading"
}
```

### Image Element

```json
{
  "type": "image",
  "source": {
    "type": "placeholder",
    "value": "{{logo_path}}"
  },
  "layout": {
    "width": 40,
    "height": 20
  },
  "fit": "contain"
}
```

| `fit` | Description |
|-------|-------------|
| `"contain"` | Scale to fit within bounds |
| `"cover"` | Scale to cover bounds |
| `"stretch"` | Stretch to exact dimensions |

### Line Element

```json
{
  "type": "line",
  "style": {
    "lineWidth": 0.5,
    "lineColor": "#CCCCCC"
  }
}
```

### Spacer Element

```json
{
  "type": "spacer",
  "layout": {
    "height": 10
  }
}
```

### Columns Element

```json
{
  "type": "columns",
  "columnGap": 4,
  "columns": [
    {
      "width": "50%",
      "elements": [ ]
    },
    {
      "width": "50%",
      "elements": [ ]
    }
  ]
}
```

### Table Element

```json
{
  "type": "table",
  "header": {
    "visible": true,
    "styleRef": "tableHeader",
    "rowHeight": 8,
    "cells": [
      { "text": "Property", "width": 60, "align": "left" },
      { "text": "Value", "width": 40, "align": "right" }
    ]
  },
  "body": {
    "rowSource": {
      "type": "placeholder",
      "value": "{{table_rows}}"
    },
    "rowStyleRef": "bodyText",
    "rowHeight": "auto",
    "stripe": {
      "enabled": true,
      "oddFillColor": "#FFFFFF",
      "evenFillColor": "#F7F7F7"
    },
    "columns": [
      { "key": "property_name", "width": 60, "align": "left", "format": "text" },
      { "key": "value", "width": 40, "align": "right", "format": "currency" }
    ]
  },
  "borders": {
    "outer": true,
    "inner": true
  }
}
```

| Format | Output |
|--------|--------|
| `text` | Raw value |
| `currency` | $1,234.56 |
| `percentage` | 7.50% |
| `number` | 1,234.56 |
| `date` | 2024-01-15 |

### Page Break Element

```json
{
  "type": "pageBreak"
}
```

## Placeholders

Use `{{placeholder}}` syntax in content:

| Placeholder | Description |
|-------------|-------------|
| `{{page_number}}` | Current page number |
| `{{page_count}}` | Total page count |
| `{{key}}` | Value from data array |
| `{{object.property}}` | Nested value from data array |

## API Reference

### `createPdfFromJson(string $json, array $data = []): TCPDF`

Creates and returns a configured TCPDF instance.

```php
$pdf = createPdfFromJson($json, $data);
$pdf->Output('file.pdf', 'D');
```

### `generateReportPdf(TCPDF $pdf, array $layout, array $data = []): void`

Renders the layout onto an existing TCPDF instance.

```php
$pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
$layout = json_decode($json, true);
generateReportPdf($pdf, $layout, $data);
$pdf->Output('file.pdf', 'I');
```

### `JsonToPdfGenerator` Class

For advanced usage:

```php
$pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
$layout = json_decode($json, true);

$generator = new JsonToPdfGenerator($pdf, $layout, $data);
$generator->generate();

$pdf->Output('file.pdf', 'D');
```

## Output Modes

```php
$pdf->Output('file.pdf', 'I');  // Inline (browser)
$pdf->Output('file.pdf', 'D');  // Download
$pdf->Output('file.pdf', 'F');  // Save to file
$pdf->Output('file.pdf', 'S');  // Return as string
```

## License

MIT
