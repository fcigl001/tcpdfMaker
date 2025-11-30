<?php
/**
 * Standalone TCPDF Example
 *
 * This file shows how to use TCPDF and the JsonToPdfGenerator
 * without the React frontend.
 */

// Include TCPDF
require_once __DIR__ . '/frontend/vendor/autoload.php';

// Include the JSON to PDF Generator
require_once __DIR__ . '/src/JsonToPdfGenerator.php';

// Example 1: Simple PDF
$simpleLayout = [
    'version' => '1.0',
    'meta' => [
        'title' => 'My Simple PDF',
        'author' => 'John Doe'
    ],
    'page' => [
        'size' => 'A4',
        'orientation' => 'P',
        'margins' => [
            'top' => 20,
            'right' => 15,
            'bottom' => 20,
            'left' => 15
        ]
    ],
    'body' => [
        'elements' => [
            [
                'type' => 'text',
                'content' => 'Hello from TCPDF!',
                'style' => [
                    'fontSize' => 32,
                    'fontStyle' => 'B',
                    'textColor' => '#333333'
                ],
                'layout' => [
                    'marginBottom' => 10
                ]
            ],
            [
                'type' => 'text',
                'content' => 'This PDF was generated using the JSON layout system.',
                'style' => [
                    'fontSize' => 12
                ]
            ],
            [
                'type' => 'spacer',
                'layout' => ['height' => 10]
            ],
            [
                'type' => 'line',
                'style' => [
                    'lineWidth' => 0.5,
                    'lineColor' => '#CCCCCC'
                ]
            ]
        ]
    ]
];

// Generate PDF
$pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
$pdf->SetCreator('TCPDF Generator');

$generator = new JsonToPdfGenerator($pdf, $simpleLayout, []);
$generator->generate();

// Output options:
// 'I' = Display in browser
// 'D' = Force download
// 'F' = Save to file
// 'S' = Return as string

// Save to file
$pdf->Output(__DIR__ . '/output1.pdf', 'F');
echo "PDF saved to: " . __DIR__ . "/output1.pdf\n";

// Or display in browser
// $pdf->Output('document.pdf', 'I');

// Or force download
// $pdf->Output('document.pdf', 'D');
