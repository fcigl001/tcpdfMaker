<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/../src/JsonToPdfGenerator.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit();
}

$input = file_get_contents('php://input');
$request = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input: ' . json_last_error_msg()]);
    exit();
}

$layout = $request['layout'] ?? null;
$data = $request['data'] ?? [];
$action = $request['action'] ?? 'preview';

if (!$layout) {
    http_response_code(400);
    echo json_encode(['error' => 'Layout is required']);
    exit();
}

try {
    $layoutArray = is_string($layout) ? json_decode($layout, true) : $layout;

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid layout JSON: ' . json_last_error_msg());
    }

    $page = $layoutArray['page'] ?? [];
    $orientation = $page['orientation'] ?? 'P';
    $units = $page['units'] ?? 'mm';
    $size = $page['size'] ?? 'A4';

    $pdf = new TCPDF($orientation, $units, $size, true, 'UTF-8', false);
    $pdf->SetCreator('JsonToPdfGenerator');

    $meta = $layoutArray['meta'] ?? [];
    if (isset($meta['title'])) {
        $pdf->SetTitle($meta['title']);
    }
    if (isset($meta['author'])) {
        $pdf->SetAuthor($meta['author']);
    }

    $generator = new JsonToPdfGenerator($pdf, $layoutArray, $data);
    $generator->generate();

    if ($action === 'download') {
        $filename = $meta['title'] ?? 'document';
        $filename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $filename) . '.pdf';

        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Access-Control-Allow-Origin: *');

        echo $pdf->Output('', 'S');
    } else {
        $pdfContent = base64_encode($pdf->Output('', 'S'));

        echo json_encode([
            'success' => true,
            'pdf' => $pdfContent,
            'message' => 'PDF generated successfully'
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to generate PDF: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
