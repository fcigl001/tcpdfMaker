<?php

declare(strict_types=1);

/**
 * JSON to PDF Generator using TCPDF
 * Renders PDF documents from a JSON layout description.
 */
class JsonToPdfGenerator
{
    private TCPDF $pdf;
    private array $layout;
    private array $data;
    private array $styles = [];
    private float $pageWidth;
    private float $pageHeight;
    private float $contentWidth;
    private float $leftMargin;
    private float $rightMargin;
    private float $topMargin;
    private float $bottomMargin;
    private float $headerHeight = 0;
    private float $footerHeight = 0;
    private string $headerRepeat = 'all';
    private string $footerRepeat = 'all';
    private int $currentPageNumber = 0;

    public function __construct(TCPDF $pdf, array $layout, array $data = [])
    {
        $this->pdf = $pdf;
        $this->layout = $layout;
        $this->data = $data;
        $this->styles = $layout['styles'] ?? [];
    }

    public function generate(): void
    {
        $this->applyMeta();
        $this->applyPageSettings();
        $this->setupHeaderFooter();
        $this->pdf->AddPage();
        $this->currentPageNumber = 1;
        $this->renderBody();
    }

    private function applyMeta(): void
    {
        $meta = $this->layout['meta'] ?? [];
        if (isset($meta['title'])) {
            $this->pdf->SetTitle($meta['title']);
        }
        if (isset($meta['author'])) {
            $this->pdf->SetAuthor($meta['author']);
        }
        if (isset($meta['description'])) {
            $this->pdf->SetSubject($meta['description']);
        }
    }

    private function applyPageSettings(): void
    {
        $page = $this->layout['page'] ?? [];

        $this->leftMargin = $page['margins']['left'] ?? 15;
        $this->rightMargin = $page['margins']['right'] ?? 15;
        $this->topMargin = $page['margins']['top'] ?? 20;
        $this->bottomMargin = $page['margins']['bottom'] ?? 20;

        $this->pdf->SetMargins($this->leftMargin, $this->topMargin, $this->rightMargin);

        $autoPageBreak = $page['autoPageBreak'] ?? true;
        $autoPageBreakMargin = $page['autoPageBreakMargin'] ?? 15;
        $this->pdf->SetAutoPageBreak($autoPageBreak, $autoPageBreakMargin);

        $this->pageWidth = $this->pdf->getPageWidth();
        $this->pageHeight = $this->pdf->getPageHeight();
        $this->contentWidth = $this->pageWidth - $this->leftMargin - $this->rightMargin;
    }

    private function setupHeaderFooter(): void
    {
        $header = $this->layout['header'] ?? null;
        $footer = $this->layout['footer'] ?? null;

        if ($header) {
            $this->headerHeight = $header['height'] ?? 0;
            $this->headerRepeat = $header['repeatOnPages'] ?? 'all';
        }

        if ($footer) {
            $this->footerHeight = $footer['height'] ?? 0;
            $this->footerRepeat = $footer['repeatOnPages'] ?? 'all';
        }

        $generator = $this;

        $this->pdf->setHeaderCallback(function($pdf) use ($generator) {
            $generator->renderHeader($pdf);
        });

        $this->pdf->setFooterCallback(function($pdf) use ($generator) {
            $generator->renderFooter($pdf);
        });

        if ($this->headerHeight > 0) {
            $this->pdf->SetHeaderMargin(5);
            $this->pdf->setHeaderData();
        } else {
            $this->pdf->setPrintHeader(false);
        }

        if ($this->footerHeight > 0) {
            $this->pdf->SetFooterMargin($this->footerHeight);
        } else {
            $this->pdf->setPrintFooter(false);
        }
    }

    public function renderHeader(TCPDF $pdf): void
    {
        $header = $this->layout['header'] ?? null;
        if (!$header || empty($header['elements'])) {
            return;
        }

        $pageNum = $pdf->getPage();
        if (!$this->shouldRenderOnPage($this->headerRepeat, $pageNum)) {
            return;
        }

        $startY = $this->topMargin - $this->headerHeight;
        if ($startY < 5) {
            $startY = 5;
        }

        $pdf->SetY($startY);
        $pdf->SetX($this->leftMargin);

        foreach ($header['elements'] as $element) {
            $this->renderElement($element, $this->headerHeight, $startY);
        }
    }

    public function renderFooter(TCPDF $pdf): void
    {
        $footer = $this->layout['footer'] ?? null;
        if (!$footer || empty($footer['elements'])) {
            return;
        }

        $pageNum = $pdf->getPage();
        if (!$this->shouldRenderOnPage($this->footerRepeat, $pageNum)) {
            return;
        }

        $startY = $this->pageHeight - $this->bottomMargin;
        $pdf->SetY($startY);
        $pdf->SetX($this->leftMargin);

        foreach ($footer['elements'] as $element) {
            $this->renderElement($element, $this->footerHeight, $startY);
        }
    }

    private function shouldRenderOnPage(string $repeat, int $pageNum): bool
    {
        switch ($repeat) {
            case 'all':
                return true;
            case 'first-only':
                return $pageNum === 1;
            case 'except-first':
                return $pageNum > 1;
            case 'none':
                return false;
            default:
                return true;
        }
    }

    private function renderBody(): void
    {
        $body = $this->layout['body'] ?? [];
        $elements = $body['elements'] ?? [];

        foreach ($elements as $element) {
            $this->renderElement($element);
        }
    }

    private function renderElement(array $element, ?float $containerHeight = null, ?float $containerY = null): void
    {
        $type = $element['type'] ?? '';
        $layout = $element['layout'] ?? [];

        $marginTop = $layout['marginTop'] ?? 0;
        $marginBottom = $layout['marginBottom'] ?? 0;

        if ($marginTop > 0 && ($layout['mode'] ?? 'flow') === 'flow') {
            $this->pdf->SetY($this->pdf->GetY() + $marginTop);
        }

        switch ($type) {
            case 'text':
                $this->renderTextElement($element);
                break;
            case 'image':
                $this->renderImageElement($element, $containerHeight, $containerY);
                break;
            case 'line':
                $this->renderLineElement($element);
                break;
            case 'spacer':
                $this->renderSpacerElement($element);
                break;
            case 'columns':
                $this->renderColumnsElement($element);
                break;
            case 'table':
                $this->renderTableElement($element);
                break;
            case 'pageBreak':
                $this->renderPageBreakElement();
                break;
        }

        if ($marginBottom > 0 && ($layout['mode'] ?? 'flow') === 'flow') {
            $this->pdf->SetY($this->pdf->GetY() + $marginBottom);
        }
    }

    private function applyStyle(?string $styleRef, ?array $styleOverride): void
    {
        $style = [];

        if ($styleRef && isset($this->styles[$styleRef])) {
            $style = $this->styles[$styleRef];
        }

        if ($styleOverride) {
            $style = array_merge($style, $styleOverride);
        }

        $fontFamily = $style['fontFamily'] ?? 'helvetica';
        $fontSize = $style['fontSize'] ?? 10;
        $fontStyle = $style['fontStyle'] ?? '';

        $this->pdf->SetFont($fontFamily, $fontStyle, $fontSize);

        if (isset($style['textColor'])) {
            $this->setColorFromHex('text', $style['textColor']);
        }

        if (isset($style['fillColor']) && $style['fillColor']) {
            $this->setColorFromHex('fill', $style['fillColor']);
        }

        if (isset($style['lineColor'])) {
            $this->setColorFromHex('draw', $style['lineColor']);
        }

        if (isset($style['lineWidth'])) {
            $this->pdf->SetLineWidth($style['lineWidth']);
        }
    }

    private function setColorFromHex(string $type, string $hex): void
    {
        $hex = ltrim($hex, '#');
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));

        switch ($type) {
            case 'text':
                $this->pdf->SetTextColor($r, $g, $b);
                break;
            case 'fill':
                $this->pdf->SetFillColor($r, $g, $b);
                break;
            case 'draw':
                $this->pdf->SetDrawColor($r, $g, $b);
                break;
        }
    }

    private function hexToRgb(string $hex): array
    {
        $hex = ltrim($hex, '#');
        return [
            hexdec(substr($hex, 0, 2)),
            hexdec(substr($hex, 2, 2)),
            hexdec(substr($hex, 4, 2))
        ];
    }

    private function renderTextElement(array $element): void
    {
        $content = $element['content'] ?? '';
        $layout = $element['layout'] ?? [];
        $styleRef = $element['styleRef'] ?? null;
        $styleOverride = $element['style'] ?? null;

        $this->applyStyle($styleRef, $styleOverride);

        $content = $this->replacePlaceholders($content);

        $mode = $layout['mode'] ?? 'flow';
        $width = $layout['width'] ?? 'auto';
        $height = $layout['height'] ?? 0;
        $align = $this->mapAlign($layout['align'] ?? 'left');

        if ($width === 'auto') {
            $width = $this->contentWidth;
        }

        if ($mode === 'absolute') {
            $x = $this->leftMargin + ($layout['x'] ?? 0);
            $y = $layout['y'] ?? $this->pdf->GetY();
            $this->pdf->SetXY($x, $y);
        }

        $style = array_merge($this->styles[$styleRef] ?? [], $styleOverride ?? []);
        $lineHeight = $style['lineHeight'] ?? 1.4;
        $fontSize = $style['fontSize'] ?? 10;
        $cellHeight = $fontSize * $lineHeight * 0.3528;

        $fill = isset($style['fillColor']) && $style['fillColor'];

        $this->pdf->MultiCell($width, $cellHeight, $content, 0, $align, $fill, 1);
    }

    private function renderImageElement(array $element, ?float $containerHeight = null, ?float $containerY = null): void
    {
        $source = $element['source'] ?? [];
        $layout = $element['layout'] ?? [];
        $fit = $element['fit'] ?? 'contain';

        $imagePath = $source['value'] ?? '';
        $imagePath = $this->replacePlaceholders($imagePath);

        $x = $this->leftMargin + ($layout['x'] ?? 0);
        $y = $layout['y'] ?? $this->pdf->GetY();

        if ($y < 0 && $containerY !== null && $containerHeight !== null) {
            $y = $containerY + $containerHeight + $y;
        }

        $width = $layout['width'] ?? 0;
        $height = $layout['height'] ?? 0;

        if ($width === 'auto') {
            $width = 0;
        }
        if ($height === 'auto') {
            $height = 0;
        }

        if (file_exists($imagePath)) {
            $this->pdf->Image($imagePath, $x, $y, $width, $height, '', '', '', false, 300, '', false, false, 0, $fit);
        }
    }

    private function renderLineElement(array $element): void
    {
        $style = $element['style'] ?? [];
        $layout = $element['layout'] ?? [];

        $lineWidth = $style['lineWidth'] ?? 0.2;
        $lineColor = $style['lineColor'] ?? '#000000';

        $this->pdf->SetLineWidth($lineWidth);
        $this->setColorFromHex('draw', $lineColor);

        $y = $this->pdf->GetY();
        $x1 = $this->leftMargin + ($layout['marginLeft'] ?? 0);
        $x2 = $this->pageWidth - $this->rightMargin - ($layout['marginRight'] ?? 0);

        $this->pdf->Line($x1, $y, $x2, $y);
        $this->pdf->SetY($y + 1);
    }

    private function renderSpacerElement(array $element): void
    {
        $layout = $element['layout'] ?? [];
        $height = $layout['height'] ?? 5;

        $this->pdf->SetY($this->pdf->GetY() + $height);
    }

    private function renderColumnsElement(array $element): void
    {
        $columns = $element['columns'] ?? [];
        $columnGap = $element['columnGap'] ?? 4;
        $layout = $element['layout'] ?? [];

        if (empty($columns)) {
            return;
        }

        $numColumns = count($columns);
        $totalGap = $columnGap * ($numColumns - 1);
        $availableWidth = $this->contentWidth - $totalGap;

        $columnWidths = [];
        $fixedWidth = 0;
        $percentageColumns = [];

        foreach ($columns as $index => $column) {
            $width = $column['width'] ?? 'auto';
            if (is_string($width) && strpos($width, '%') !== false) {
                $percentageColumns[$index] = floatval($width) / 100;
            } else {
                $columnWidths[$index] = is_numeric($width) ? $width : $availableWidth / $numColumns;
                $fixedWidth += $columnWidths[$index];
            }
        }

        $remainingWidth = $availableWidth - $fixedWidth;
        foreach ($percentageColumns as $index => $percentage) {
            $columnWidths[$index] = $availableWidth * $percentage;
        }

        ksort($columnWidths);

        $startY = $this->pdf->GetY();
        $maxY = $startY;
        $currentX = $this->leftMargin;

        foreach ($columns as $index => $column) {
            $colWidth = $columnWidths[$index] ?? ($availableWidth / $numColumns);
            $elements = $column['elements'] ?? [];

            $this->pdf->SetXY($currentX, $startY);

            $originalContentWidth = $this->contentWidth;
            $originalLeftMargin = $this->leftMargin;

            $this->contentWidth = $colWidth;
            $this->leftMargin = $currentX;

            foreach ($elements as $el) {
                $this->renderElement($el);
            }

            $this->contentWidth = $originalContentWidth;
            $this->leftMargin = $originalLeftMargin;

            $maxY = max($maxY, $this->pdf->GetY());
            $currentX += $colWidth + $columnGap;
        }

        $this->pdf->SetY($maxY);
        $this->pdf->SetX($this->leftMargin);
    }

    private function renderTableElement(array $element): void
    {
        $tableHeader = $element['header'] ?? [];
        $tableBody = $element['body'] ?? [];
        $borders = $element['borders'] ?? [];
        $layout = $element['layout'] ?? [];

        $showHeader = $tableHeader['visible'] ?? true;
        $headerStyleRef = $tableHeader['styleRef'] ?? null;
        $headerRowHeight = $tableHeader['rowHeight'] ?? 8;
        $headerCells = $tableHeader['cells'] ?? [];

        $rowSource = $tableBody['rowSource'] ?? [];
        $rowStyleRef = $tableBody['rowStyleRef'] ?? null;
        $rowHeight = $tableBody['rowHeight'] ?? 'auto';
        $stripe = $tableBody['stripe'] ?? [];
        $bodyColumns = $tableBody['columns'] ?? [];

        $outerBorder = $borders['outer'] ?? false;
        $innerBorder = $borders['inner'] ?? false;

        $borderStyle = '';
        if ($outerBorder && $innerBorder) {
            $borderStyle = 1;
        } elseif ($outerBorder) {
            $borderStyle = 'LTR';
        } elseif ($innerBorder) {
            $borderStyle = 'TB';
        }

        if ($showHeader && !empty($headerCells)) {
            $this->applyStyle($headerStyleRef, null);

            $headerStyle = $this->styles[$headerStyleRef] ?? [];
            if (isset($headerStyle['fillColor'])) {
                $this->setColorFromHex('fill', $headerStyle['fillColor']);
            }

            foreach ($headerCells as $cell) {
                $cellWidth = $cell['width'] ?? 30;
                $cellText = $cell['text'] ?? '';
                $cellAlign = $this->mapAlign($cell['align'] ?? 'left');

                $fill = isset($headerStyle['fillColor']) && $headerStyle['fillColor'];
                $this->pdf->Cell($cellWidth, $headerRowHeight, $cellText, $borderStyle, 0, $cellAlign, $fill);
            }
            $this->pdf->Ln();
        }

        $rowsVariable = $this->extractVariableName($rowSource['value'] ?? '');

        $stripeEnabled = $stripe['enabled'] ?? false;
        $oddFillColor = $stripe['oddFillColor'] ?? '#FFFFFF';
        $evenFillColor = $stripe['evenFillColor'] ?? '#F7F7F7';

        $rows = $this->data[$rowsVariable] ?? [];

        $rowIndex = 0;
        foreach ($rows as $row) {
            $this->applyStyle($rowStyleRef, null);

            if ($stripeEnabled) {
                $fillColor = ($rowIndex % 2 === 0) ? $oddFillColor : $evenFillColor;
                $this->setColorFromHex('fill', $fillColor);
            }

            $maxCellHeight = $rowHeight === 'auto' ? $headerRowHeight : $rowHeight;

            foreach ($bodyColumns as $column) {
                $colWidth = $column['width'] ?? 30;
                $colKey = $column['key'] ?? '';
                $colAlign = $this->mapAlign($column['align'] ?? 'left');
                $colFormat = $column['format'] ?? 'text';

                $cellValue = $row[$colKey] ?? '';
                $cellValue = $this->formatCellValue($cellValue, $colFormat);

                $fill = $stripeEnabled;
                $this->pdf->Cell($colWidth, $maxCellHeight, $cellValue, $borderStyle, 0, $colAlign, $fill);
            }
            $this->pdf->Ln();
            $rowIndex++;
        }
    }

    private function renderPageBreakElement(): void
    {
        $this->pdf->AddPage();
        $this->currentPageNumber++;
    }

    private function mapAlign(string $align): string
    {
        switch ($align) {
            case 'left':
                return 'L';
            case 'center':
                return 'C';
            case 'right':
                return 'R';
            case 'justify':
                return 'J';
            default:
                return 'L';
        }
    }

    private function replacePlaceholders(string $content): string
    {
        $content = str_replace('{{page_number}}', $this->pdf->getAliasNumPage(), $content);
        $content = str_replace('{{page_count}}', $this->pdf->getAliasNbPages(), $content);

        foreach ($this->data as $key => $value) {
            if (is_string($value) || is_numeric($value)) {
                $content = str_replace('{{' . $key . '}}', (string)$value, $content);
            }
        }

        if (preg_match_all('/\{\{([a-zA-Z_][a-zA-Z0-9_.]*)\}\}/', $content, $matches)) {
            foreach ($matches[1] as $match) {
                $value = $this->getNestedValue($match);
                if ($value !== null) {
                    $content = str_replace('{{' . $match . '}}', (string)$value, $content);
                }
            }
        }

        return $content;
    }

    private function getNestedValue(string $path)
    {
        $parts = explode('.', $path);
        $value = $this->data;

        foreach ($parts as $part) {
            if (is_array($value) && isset($value[$part])) {
                $value = $value[$part];
            } else {
                return null;
            }
        }

        return is_scalar($value) ? $value : null;
    }

    private function extractVariableName(string $placeholder): string
    {
        return trim($placeholder, '{}');
    }

    private function formatCellValue($value, string $format): string
    {
        switch ($format) {
            case 'currency':
                return $this->formatCurrency($value);
            case 'percentage':
                return $this->formatPercentage($value);
            case 'date':
                return $this->formatDate($value);
            case 'number':
                return $this->formatNumber($value);
            default:
                return (string)$value;
        }
    }

    protected function formatCurrency($value): string
    {
        if (!is_numeric($value)) {
            return (string)$value;
        }
        return '$' . number_format((float)$value, 2);
    }

    protected function formatPercentage($value): string
    {
        if (!is_numeric($value)) {
            return (string)$value;
        }
        return number_format((float)$value, 2) . '%';
    }

    protected function formatDate($value): string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }
        if (is_string($value)) {
            $timestamp = strtotime($value);
            if ($timestamp !== false) {
                return date('Y-m-d', $timestamp);
            }
        }
        return (string)$value;
    }

    protected function formatNumber($value): string
    {
        if (!is_numeric($value)) {
            return (string)$value;
        }
        return number_format((float)$value, 2);
    }
}

function generateReportPdf(TCPDF $pdf, array $layout, array $data = []): void
{
    $generator = new JsonToPdfGenerator($pdf, $layout, $data);
    $generator->generate();
}

function createPdfFromJson(string $json, array $data = []): TCPDF
{
    $layout = json_decode($json, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new InvalidArgumentException('Invalid JSON: ' . json_last_error_msg());
    }

    $page = $layout['page'] ?? [];
    $orientation = $page['orientation'] ?? 'P';
    $units = $page['units'] ?? 'mm';
    $size = $page['size'] ?? 'A4';

    $pdf = new TCPDF($orientation, $units, $size, true, 'UTF-8', false);
    $pdf->SetCreator('JsonToPdfGenerator');

    generateReportPdf($pdf, $layout, $data);

    return $pdf;
}

// Example usage:
//
// $json = file_get_contents('layout.json');
// $data = [
//     'client' => [
//         'name' => 'John Doe',
//         'email' => 'john@example.com'
//     ],
//     'report_title' => 'Investment Report Q4 2024',
//     'logo_path' => '/path/to/logo.png',
//     'table_rows' => [
//         ['property_name' => 'Office Building A', 'location' => 'New York', 'value' => 1500000, 'yield' => 7.5],
//         ['property_name' => 'Retail Center B', 'location' => 'Los Angeles', 'value' => 2300000, 'yield' => 6.8],
//         ['property_name' => 'Warehouse C', 'location' => 'Chicago', 'value' => 890000, 'yield' => 8.2],
//     ]
// ];
//
// $pdf = createPdfFromJson($json, $data);
// $pdf->Output('report.pdf', 'I');
//
// Or using the class directly:
//
// $layout = json_decode($json, true);
// $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
// $generator = new JsonToPdfGenerator($pdf, $layout, $data);
// $generator->generate();
// $pdf->Output('report.pdf', 'D');
