# Standalone TCPDF Usage

This guide shows how to use TCPDF and the JsonToPdfGenerator without the React frontend.

## What You Need

Just 3 things:

1. **TCPDF library** - Located at `frontend/vendor/tecnickcom/tcpdf/`
2. **JsonToPdfGenerator.php** - Located at `src/JsonToPdfGenerator.php`
3. **Your PHP script** - To generate PDFs

## Quick Start

### Option 1: Run the Example

```bash
php standalone-example.php
```

This will create `output.pdf` in your project directory.

### Option 2: Create Your Own Script

```php
<?php
require_once 'frontend/vendor/autoload.php';
require_once 'src/JsonToPdfGenerator.php';

$layout = [
    'version' => '1.0',
    'page' => ['size' => 'A4', 'orientation' => 'P'],
    'body' => [
        'elements' => [
            [
                'type' => 'text',
                'content' => 'Hello {{name}}!',
                'style' => ['fontSize' => 20]
            ]
        ]
    ]
];

$data = ['name' => 'John'];

$pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
$generator = new JsonToPdfGenerator($pdf, $layout, $data);
$generator->generate();

// Save to file
$pdf->Output('output.pdf', 'F');
```

## Using Just TCPDF (No Generator)

If you just want to use TCPDF directly:

```php
<?php
require_once 'frontend/vendor/autoload.php';

$pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
$pdf->SetCreator('My App');
$pdf->SetTitle('My PDF');

$pdf->AddPage();

// Set font
$pdf->SetFont('helvetica', 'B', 20);

// Add text
$pdf->Cell(0, 10, 'Hello World!', 0, 1, 'C');

// Output
$pdf->Output('simple.pdf', 'F');
```

## Package Files

### I created archives for you:

1. **tcpdf-only.tar.gz** (15MB)
   - Just the TCPDF library
   - Extract and use anywhere

2. **tcpdf-package.tar.gz** (15MB)
   - TCPDF + JsonToPdfGenerator
   - Everything you need for JSON-based PDF generation

### Extract and Use:

```bash
# Extract
tar -xzf tcpdf-package.tar.gz

# Use in your project
cd tcpdf-package
php -r "
require_once 'tcpdf/tcpdf.php';
require_once 'JsonToPdfGenerator.php';

\$pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
\$pdf->AddPage();
\$pdf->SetFont('helvetica', '', 12);
\$pdf->Cell(0, 10, 'Hello!', 0, 1);
\$pdf->Output('test.pdf', 'F');
echo 'Created test.pdf';
"
```

## Deployment

To use this in production:

1. **Copy these files** to your server:
   - `frontend/vendor/` (or just the TCPDF folder)
   - `src/JsonToPdfGenerator.php`

2. **Or use Composer** (recommended):
   ```bash
   composer require tecnickcom/tcpdf
   ```
   Then copy just `JsonToPdfGenerator.php`

3. **Require in your code**:
   ```php
   require_once 'vendor/autoload.php';
   require_once 'JsonToPdfGenerator.php';
   ```

## No Frontend Needed

The React frontend is just an editor. Once you have your JSON layout, you can:

- Save it to a file
- Store it in a database
- Generate PDFs server-side only
- Use it in CLI scripts
- Integrate into any PHP application

## Examples

See the `standalone-example.php` file for complete working examples including:
- Simple text PDFs
- Using placeholders
- Multiple elements
- Custom styling

## TCPDF Documentation

Official TCPDF docs: https://tcpdf.org/

The JsonToPdfGenerator is just a wrapper that makes TCPDF easier to use with JSON layouts.

## Summary

**Minimum files needed:**
```
your-project/
├── vendor/tecnickcom/tcpdf/  (or use composer)
├── JsonToPdfGenerator.php
└── your-script.php
```

That's it! No Node.js, no React, no web server needed for PDF generation.
