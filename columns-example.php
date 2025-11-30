<?php
/**
 * Columns Layout Example
 * Demonstrates text and images in columns
 */

require_once __DIR__ . '/frontend/vendor/autoload.php';
require_once __DIR__ . '/src/JsonToPdfGenerator.php';

// Example 1: Two Equal Columns with Text
$twoColumnsLayout = [
    'version' => '1.0',
    'meta' => ['title' => 'Two Column Layout'],
    'page' => [
        'size' => 'A4',
        'orientation' => 'P',
        'margins' => ['top' => 20, 'right' => 15, 'bottom' => 20, 'left' => 15]
    ],
    'body' => [
        'elements' => [
            [
                'type' => 'text',
                'content' => 'Two Column Example',
                'style' => ['fontSize' => 20, 'fontStyle' => 'B'],
                'layout' => ['marginBottom' => 10]
            ],
            [
                'type' => 'columns',
                'columnGap' => 5,  // Space between columns in mm
                'columns' => [
                    [
                        'width' => '50%',  // First column takes 50% width
                        'elements' => [
                            [
                                'type' => 'text',
                                'content' => 'Left Column',
                                'style' => ['fontSize' => 14, 'fontStyle' => 'B'],
                                'layout' => ['marginBottom' => 5]
                            ],
                            [
                                'type' => 'text',
                                'content' => 'This is the left column content. You can add multiple elements here including text, images, lines, and spacers.',
                                'style' => ['fontSize' => 10]
                            ]
                        ]
                    ],
                    [
                        'width' => '50%',  // Second column takes 50% width
                        'elements' => [
                            [
                                'type' => 'text',
                                'content' => 'Right Column',
                                'style' => ['fontSize' => 14, 'fontStyle' => 'B'],
                                'layout' => ['marginBottom' => 5]
                            ],
                            [
                                'type' => 'text',
                                'content' => 'This is the right column content. Columns automatically balance their heights.',
                                'style' => ['fontSize' => 10]
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]
];

$pdf1 = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
$pdf1->SetCreator('TCPDF Columns Example');
$generator1 = new JsonToPdfGenerator($pdf1, $twoColumnsLayout, []);
$generator1->generate();
$pdf1->Output(__DIR__ . '/columns-two.pdf', 'F');
echo "✓ Two columns PDF saved to: columns-two.pdf\n";

// Example 2: Three Columns with Different Widths
$threeColumnsLayout = [
    'version' => '1.0',
    'meta' => ['title' => 'Three Column Layout'],
    'page' => [
        'size' => 'A4',
        'orientation' => 'P',
        'margins' => ['top' => 20, 'right' => 15, 'bottom' => 20, 'left' => 15]
    ],
    'body' => [
        'elements' => [
            [
                'type' => 'text',
                'content' => 'Three Column Example (Custom Widths)',
                'style' => ['fontSize' => 20, 'fontStyle' => 'B'],
                'layout' => ['marginBottom' => 10]
            ],
            [
                'type' => 'columns',
                'columnGap' => 4,
                'columns' => [
                    [
                        'width' => '40%',  // Wider first column
                        'elements' => [
                            [
                                'type' => 'text',
                                'content' => 'Wide Column (40%)',
                                'style' => ['fontSize' => 12, 'fontStyle' => 'B'],
                                'layout' => ['marginBottom' => 5]
                            ],
                            [
                                'type' => 'text',
                                'content' => 'This column takes up 40% of the available width.',
                                'style' => ['fontSize' => 9]
                            ]
                        ]
                    ],
                    [
                        'width' => '30%',  // Medium column
                        'elements' => [
                            [
                                'type' => 'text',
                                'content' => 'Medium (30%)',
                                'style' => ['fontSize' => 12, 'fontStyle' => 'B'],
                                'layout' => ['marginBottom' => 5]
                            ],
                            [
                                'type' => 'text',
                                'content' => 'This takes 30% width.',
                                'style' => ['fontSize' => 9]
                            ]
                        ]
                    ],
                    [
                        'width' => '30%',  // Another medium column
                        'elements' => [
                            [
                                'type' => 'text',
                                'content' => 'Another 30%',
                                'style' => ['fontSize' => 12, 'fontStyle' => 'B'],
                                'layout' => ['marginBottom' => 5]
                            ],
                            [
                                'type' => 'text',
                                'content' => 'Also 30% width.',
                                'style' => ['fontSize' => 9]
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]
];

$pdf2 = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
$pdf2->SetCreator('TCPDF Columns Example');
$generator2 = new JsonToPdfGenerator($pdf2, $threeColumnsLayout, []);
$generator2->generate();
$pdf2->Output(__DIR__ . '/columns-three.pdf', 'F');
echo "✓ Three columns PDF saved to: columns-three.pdf\n";

// Example 3: Columns with Images and Text
$columnsWithImagesLayout = [
    'version' => '1.0',
    'meta' => ['title' => 'Columns with Images'],
    'page' => [
        'size' => 'A4',
        'orientation' => 'P',
        'margins' => ['top' => 20, 'right' => 15, 'bottom' => 20, 'left' => 15]
    ],
    'body' => [
        'elements' => [
            [
                'type' => 'text',
                'content' => 'Columns with Images Example',
                'style' => ['fontSize' => 20, 'fontStyle' => 'B'],
                'layout' => ['marginBottom' => 10]
            ],
            [
                'type' => 'columns',
                'columnGap' => 5,
                'columns' => [
                    [
                        'width' => '50%',
                        'elements' => [
                            [
                                'type' => 'text',
                                'content' => 'Column 1: With Image',
                                'style' => ['fontSize' => 14, 'fontStyle' => 'B'],
                                'layout' => ['marginBottom' => 5]
                            ],
                            // You can add an image here if you have one
                            // [
                            //     'type' => 'image',
                            //     'source' => ['type' => 'placeholder', 'value' => '/path/to/image.jpg'],
                            //     'layout' => ['width' => 60, 'height' => 40],
                            //     'fit' => 'contain'
                            // ],
                            [
                                'type' => 'text',
                                'content' => 'You can place images above or below text in columns.',
                                'style' => ['fontSize' => 10]
                            ],
                            [
                                'type' => 'spacer',
                                'layout' => ['height' => 5]
                            ],
                            [
                                'type' => 'line',
                                'style' => ['lineWidth' => 0.3, 'lineColor' => '#CCCCCC']
                            ]
                        ]
                    ],
                    [
                        'width' => '50%',
                        'elements' => [
                            [
                                'type' => 'text',
                                'content' => 'Column 2: More Content',
                                'style' => ['fontSize' => 14, 'fontStyle' => 'B'],
                                'layout' => ['marginBottom' => 5]
                            ],
                            [
                                'type' => 'text',
                                'content' => 'Each column can contain any type of element:',
                                'style' => ['fontSize' => 10],
                                'layout' => ['marginBottom' => 3]
                            ],
                            [
                                'type' => 'text',
                                'content' => '• Text elements\n• Images\n• Lines\n• Spacers\n• Even nested tables!',
                                'style' => ['fontSize' => 9]
                            ]
                        ]
                    ]
                ]
            ],
            [
                'type' => 'spacer',
                'layout' => ['height' => 10]
            ],
            [
                'type' => 'text',
                'content' => 'Content continues after columns in normal flow.',
                'style' => ['fontSize' => 10]
            ]
        ]
    ]
];

$pdf3 = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
$pdf3->SetCreator('TCPDF Columns Example');
$generator3 = new JsonToPdfGenerator($pdf3, $columnsWithImagesLayout, []);
$generator3->generate();
$pdf3->Output(__DIR__ . '/columns-with-images.pdf', 'F');
echo "✓ Columns with images PDF saved to: columns-with-images.pdf\n";

echo "\nDone! Check the generated PDFs.\n";
