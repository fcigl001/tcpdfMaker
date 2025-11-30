/**
 * PDF Layout Editor - Main Application Logic
 *
 * A browser-based layout editor for designing PDF reports.
 * Exports/imports JSON matching the TCPDF generator schema.
 */

// ========================================
// CONFIGURATION & CONSTANTS
// ========================================

const PAGE_SIZES = {
    'A4': { width: 210, height: 297 },
    'Letter': { width: 215.9, height: 279.4 },
    'Legal': { width: 215.9, height: 355.6 },
    'A3': { width: 297, height: 420 },
    'A5': { width: 148, height: 210 }
};

const DEFAULT_STYLES = {
    h1: {
        fontFamily: 'helvetica',
        fontSize: 18,
        fontStyle: 'B',
        textColor: '#222222',
        fillColor: null,
        borderColor: null,
        lineHeight: 1.2
    },
    bodyText: {
        fontFamily: 'helvetica',
        fontSize: 10,
        fontStyle: '',
        textColor: '#333333',
        fillColor: null,
        borderColor: null,
        lineHeight: 1.4
    },
    tableHeader: {
        fontFamily: 'helvetica',
        fontSize: 9,
        fontStyle: 'B',
        textColor: '#FFFFFF',
        fillColor: '#0066CC',
        borderColor: '#FFFFFF',
        lineHeight: 1.2
    }
};

// ========================================
// STATE MANAGEMENT
// ========================================

let elementIdCounter = 0;
let selectedElementId = null;
let selectedSection = 'body';
let editingStyleName = null;
let previewScale = 1.0;

// Main layout object matching the schema
let layout = null;

/**
 * Generate a unique element ID
 */
function generateElementId() {
    return `element-${++elementIdCounter}`;
}

/**
 * Initialize layout with default values
 */
function initLayout() {
    elementIdCounter = 0;
    layout = {
        version: '1.0',
        meta: {
            title: 'Untitled Report',
            description: '',
            author: 'PIERS Layout Engine'
        },
        page: {
            size: 'A4',
            orientation: 'P',
            units: 'mm',
            margins: {
                top: 20,
                right: 15,
                bottom: 20,
                left: 15
            },
            autoPageBreak: true,
            autoPageBreakMargin: 15
        },
        styles: JSON.parse(JSON.stringify(DEFAULT_STYLES)),
        header: {
            repeatOnPages: 'all',
            height: 25,
            elements: []
        },
        footer: {
            repeatOnPages: 'all',
            height: 20,
            elements: []
        },
        body: {
            elements: []
        }
    };
}

// ========================================
// ELEMENT FACTORIES
// ========================================

/**
 * Create a new element with default values based on type
 */
function createElement(type) {
    const baseElement = {
        id: generateElementId(),
        type: type,
        layout: {
            mode: 'flow',
            x: 0,
            y: 0,
            width: 'auto',
            height: 'auto',
            marginTop: 0,
            marginBottom: 5,
            marginLeft: 0,
            marginRight: 0,
            align: 'left'
        },
        styleRef: null,
        style: null,
        visibilityCondition: null
    };

    switch (type) {
        case 'text':
            return {
                ...baseElement,
                content: 'Enter your text here...',
                styleRef: 'bodyText'
            };

        case 'image':
            return {
                ...baseElement,
                source: {
                    type: 'placeholder',
                    value: '{{image_path}}'
                },
                fit: 'contain',
                layout: {
                    ...baseElement.layout,
                    width: 50,
                    height: 30
                }
            };

        case 'line':
            return {
                ...baseElement,
                style: {
                    lineWidth: 0.5,
                    lineColor: '#000000'
                },
                layout: {
                    ...baseElement.layout,
                    height: 1
                }
            };

        case 'spacer':
            return {
                ...baseElement,
                layout: {
                    ...baseElement.layout,
                    height: 10
                }
            };

        case 'columns':
            return {
                ...baseElement,
                columns: [
                    { width: '50%', elements: [] },
                    { width: '50%', elements: [] }
                ],
                columnGap: 4
            };

        case 'columns-3':
            return {
                ...baseElement,
                type: 'columns',
                columns: [
                    { width: '33%', elements: [] },
                    { width: '33%', elements: [] },
                    { width: '34%', elements: [] }
                ],
                columnGap: 4
            };

        case 'table':
            return {
                ...baseElement,
                header: {
                    visible: true,
                    styleRef: 'tableHeader',
                    rowHeight: 8,
                    cells: [
                        { text: 'Column 1', width: 45, align: 'left' },
                        { text: 'Column 2', width: 45, align: 'left' },
                        { text: 'Column 3', width: 45, align: 'right' },
                        { text: 'Column 4', width: 45, align: 'right' }
                    ]
                },
                body: {
                    rowSource: {
                        type: 'placeholder',
                        value: '{{table_rows}}'
                    },
                    rowStyleRef: 'bodyText',
                    rowHeight: 'auto',
                    stripe: {
                        enabled: true,
                        oddFillColor: '#FFFFFF',
                        evenFillColor: '#F7F7F7'
                    },
                    columns: [
                        { key: 'col1', width: 45, align: 'left', format: 'text' },
                        { key: 'col2', width: 45, align: 'left', format: 'text' },
                        { key: 'col3', width: 45, align: 'right', format: 'currency' },
                        { key: 'col4', width: 45, align: 'right', format: 'percentage' }
                    ]
                },
                borders: {
                    outer: true,
                    inner: true
                }
            };

        case 'pageBreak':
            return {
                ...baseElement,
                layout: {
                    ...baseElement.layout,
                    height: 0
                }
            };

        default:
            return baseElement;
    }
}

// ========================================
// ELEMENT MANIPULATION
// ========================================

/**
 * Get elements array for a section
 */
function getSectionElements(section) {
    switch (section) {
        case 'header': return layout.header.elements;
        case 'footer': return layout.footer.elements;
        case 'body':
        default: return layout.body.elements;
    }
}

/**
 * Find element by ID recursively (handles nested columns)
 */
function findElementById(id, elements = null) {
    if (!elements) {
        // Search all sections
        let result = findElementById(id, layout.header.elements);
        if (result) return result;
        result = findElementById(id, layout.body.elements);
        if (result) return result;
        result = findElementById(id, layout.footer.elements);
        return result;
    }

    for (const element of elements) {
        if (element.id === id) return element;
        if (element.type === 'columns' && element.columns) {
            for (const col of element.columns) {
                const found = findElementById(id, col.elements);
                if (found) return found;
            }
        }
    }
    return null;
}

/**
 * Find parent array and index for an element
 */
function findElementLocation(id, elements = null, parentInfo = null) {
    if (!elements) {
        let result = findElementLocation(id, layout.header.elements, { section: 'header', elements: layout.header.elements });
        if (result) return result;
        result = findElementLocation(id, layout.body.elements, { section: 'body', elements: layout.body.elements });
        if (result) return result;
        result = findElementLocation(id, layout.footer.elements, { section: 'footer', elements: layout.footer.elements });
        return result;
    }

    for (let i = 0; i < elements.length; i++) {
        if (elements[i].id === id) {
            return { array: elements, index: i, ...parentInfo };
        }
        if (elements[i].type === 'columns' && elements[i].columns) {
            for (let colIdx = 0; colIdx < elements[i].columns.length; colIdx++) {
                const col = elements[i].columns[colIdx];
                const found = findElementLocation(id, col.elements, {
                    ...parentInfo,
                    parentElement: elements[i],
                    columnIndex: colIdx
                });
                if (found) return found;
            }
        }
    }
    return null;
}

/**
 * Add element to section
 */
function addElement(type, section = selectedSection, targetColumnId = null, columnIndex = null) {
    const element = createElement(type);

    if (targetColumnId !== null && columnIndex !== null) {
        // Adding to a specific column
        const columnElement = findElementById(targetColumnId);
        if (columnElement && columnElement.columns && columnElement.columns[columnIndex]) {
            columnElement.columns[columnIndex].elements.push(element);
        }
    } else {
        getSectionElements(section).push(element);
    }

    selectedElementId = element.id;
    renderAll();
    return element;
}

/**
 * Delete element by ID
 */
function deleteElement(id) {
    const location = findElementLocation(id);
    if (location) {
        location.array.splice(location.index, 1);
        if (selectedElementId === id) {
            selectedElementId = null;
        }
        renderAll();
    }
}

/**
 * Move element up or down
 */
function moveElement(id, direction) {
    const location = findElementLocation(id);
    if (!location) return;

    const { array, index } = location;
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= array.length) return;

    const temp = array[index];
    array[index] = array[newIndex];
    array[newIndex] = temp;

    renderAll();
}

/**
 * Update element property using dot notation path
 */
function updateElementProperty(elementId, path, value) {
    const element = findElementById(elementId);
    if (!element) return;

    const parts = path.split('.');
    let obj = element;

    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);

        if (arrayMatch) {
            const prop = arrayMatch[1];
            const idx = parseInt(arrayMatch[2]);
            if (!obj[prop]) obj[prop] = [];
            if (!obj[prop][idx]) obj[prop][idx] = {};
            obj = obj[prop][idx];
        } else {
            if (!obj[part]) obj[part] = {};
            obj = obj[part];
        }
    }

    const lastPart = parts[parts.length - 1];
    const lastArrayMatch = lastPart.match(/^(\w+)\[(\d+)\]$/);

    if (lastArrayMatch) {
        const prop = lastArrayMatch[1];
        const idx = parseInt(lastArrayMatch[2]);
        if (!obj[prop]) obj[prop] = [];
        obj[prop][idx] = value;
    } else {
        obj[lastPart] = value;
    }

    renderAll();
}

// ========================================
// RENDERING - LAYOUT TREE
// ========================================

/**
 * Render the layout tree in the left panel
 */
function renderLayoutTree() {
    const container = document.getElementById('layout-tree');
    container.innerHTML = '';

    // Render each section
    ['header', 'body', 'footer'].forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'tree-section';
        sectionDiv.innerHTML = `
            <div class="tree-section-header" data-section="${section}">
                <span>${section.charAt(0).toUpperCase() + section.slice(1)}</span>
                <span class="element-count">(${getSectionElements(section).length})</span>
            </div>
            <div class="tree-elements" id="tree-${section}"></div>
        `;
        container.appendChild(sectionDiv);

        const elementsContainer = sectionDiv.querySelector('.tree-elements');
        renderElementsToTree(getSectionElements(section), elementsContainer, section);
    });
}

/**
 * Render elements recursively to tree
 */
function renderElementsToTree(elements, container, section) {
    elements.forEach(element => {
        const elementDiv = document.createElement('div');
        elementDiv.className = `tree-element${element.id === selectedElementId ? ' selected' : ''}`;
        elementDiv.dataset.id = element.id;

        const label = getElementLabel(element);
        elementDiv.innerHTML = `
            <div class="tree-element-info">
                <span class="tree-element-type">${element.type}</span>
                <span class="tree-element-label">${escapeHtml(label)}</span>
            </div>
            <div class="tree-element-actions">
                <button class="tree-action-btn" data-action="up" title="Move up">↑</button>
                <button class="tree-action-btn" data-action="down" title="Move down">↓</button>
                <button class="tree-action-btn delete" data-action="delete" title="Delete">×</button>
            </div>
        `;

        elementDiv.addEventListener('click', (e) => {
            if (e.target.closest('.tree-element-actions')) return;
            selectElement(element.id);
        });

        elementDiv.querySelectorAll('.tree-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                if (action === 'delete') {
                    deleteElement(element.id);
                } else {
                    moveElement(element.id, action);
                }
            });
        });

        container.appendChild(elementDiv);

        // Render nested columns
        if (element.type === 'columns' && element.columns) {
            element.columns.forEach((col, colIdx) => {
                const colDiv = document.createElement('div');
                colDiv.className = 'tree-column';
                colDiv.innerHTML = `
                    <div class="tree-column-header">
                        Column ${colIdx + 1} (${col.width})
                        <button class="tree-action-btn" data-action="add-to-column"
                                data-parent="${element.id}" data-col="${colIdx}">+</button>
                    </div>
                `;

                colDiv.querySelector('[data-action="add-to-column"]').addEventListener('click', () => {
                    showColumnAddMenu(element.id, colIdx);
                });

                container.appendChild(colDiv);
                renderElementsToTree(col.elements, colDiv, section);
            });
        }
    });
}

/**
 * Show menu to add element to column
 */
function showColumnAddMenu(parentId, colIndex) {
    const type = prompt('Enter element type (text, image, line, spacer):');
    if (type && ['text', 'image', 'line', 'spacer'].includes(type)) {
        addElement(type, null, parentId, colIndex);
    }
}

/**
 * Get display label for element
 */
function getElementLabel(element) {
    switch (element.type) {
        case 'text':
            return element.content ? element.content.substring(0, 30) : '';
        case 'image':
            return element.source?.value || 'Image';
        case 'spacer':
            return `${element.layout?.height || 10}mm`;
        case 'columns':
            return `${element.columns?.length || 2} columns`;
        case 'table':
            return `${element.header?.cells?.length || 0} cols`;
        case 'line':
            return 'Horizontal line';
        case 'pageBreak':
            return 'Page break';
        default:
            return '';
    }
}

// ========================================
// RENDERING - PREVIEW
// ========================================

/**
 * Render the page preview
 */
function renderPreview() {
    const previewContainer = document.getElementById('page-preview');
    const headerPreview = document.getElementById('preview-header');
    const bodyPreview = document.getElementById('preview-body');
    const footerPreview = document.getElementById('preview-footer');

    // Calculate page dimensions
    const pageSize = PAGE_SIZES[layout.page.size] || PAGE_SIZES['A4'];
    let width = pageSize.width;
    let height = pageSize.height;

    if (layout.page.orientation === 'L') {
        [width, height] = [height, width];
    }

    // Scale for preview
    const scaledWidth = width * previewScale;
    const scaledHeight = height * previewScale;

    previewContainer.style.width = `${scaledWidth}px`;
    previewContainer.style.height = `${scaledHeight}px`;
    previewContainer.style.transform = `scale(${previewScale})`;
    previewContainer.style.transformOrigin = 'top left';
    previewContainer.style.width = `${width}px`;
    previewContainer.style.height = `${height}px`;

    // Set margins
    const margins = layout.page.margins;
    previewContainer.style.padding = `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`;

    // Render sections
    const headerHeight = layout.header.height * previewScale;
    const footerHeight = layout.footer.height * previewScale;

    headerPreview.style.height = `${layout.header.height}px`;
    headerPreview.innerHTML = '<span class="preview-section-label">Header</span>';
    renderElementsToPreview(layout.header.elements, headerPreview);

    footerPreview.style.height = `${layout.footer.height}px`;
    footerPreview.innerHTML = '<span class="preview-section-label">Footer</span>';
    renderElementsToPreview(layout.footer.elements, footerPreview);

    bodyPreview.style.minHeight = `${height - layout.header.height - layout.footer.height - margins.top - margins.bottom}px`;
    bodyPreview.innerHTML = '';
    renderElementsToPreview(layout.body.elements, bodyPreview);
}

/**
 * Render elements to preview area
 */
function renderElementsToPreview(elements, container) {
    elements.forEach(element => {
        const elementDiv = createPreviewElement(element);
        container.appendChild(elementDiv);
    });
}

/**
 * Create preview element DOM
 */
function createPreviewElement(element) {
    const div = document.createElement('div');
    div.className = `preview-element${element.id === selectedElementId ? ' selected' : ''}`;
    div.dataset.id = element.id;

    if (element.layout?.mode === 'absolute') {
        div.classList.add('absolute');
        div.style.left = `${element.layout.x}px`;
        div.style.top = `${element.layout.y}px`;
    }

    if (element.layout?.width && element.layout.width !== 'auto') {
        div.style.width = `${element.layout.width}px`;
    }

    if (element.layout?.height && element.layout.height !== 'auto') {
        div.style.height = `${element.layout.height}px`;
    }

    // Apply margins
    if (element.layout) {
        div.style.marginTop = `${element.layout.marginTop || 0}px`;
        div.style.marginBottom = `${element.layout.marginBottom || 0}px`;
        div.style.marginLeft = `${element.layout.marginLeft || 0}px`;
        div.style.marginRight = `${element.layout.marginRight || 0}px`;
    }

    div.addEventListener('click', (e) => {
        e.stopPropagation();
        selectElement(element.id);
    });

    switch (element.type) {
        case 'text':
            div.innerHTML = `
                <div class="preview-element-type">Text</div>
                <div class="preview-element-content">${escapeHtml(element.content?.substring(0, 50) || '')}</div>
            `;
            break;

        case 'image':
            div.innerHTML = `
                <div class="preview-element-type">Image</div>
                <div class="preview-element-content">${escapeHtml(element.source?.value || '')}</div>
            `;
            div.style.background = '#f0f0f0';
            break;

        case 'line':
            div.className += ' preview-line';
            div.style.height = `${element.style?.lineWidth || 1}px`;
            div.style.background = element.style?.lineColor || '#000';
            break;

        case 'spacer':
            div.className += ' preview-spacer';
            div.innerHTML = `<div class="preview-element-type">Spacer ${element.layout?.height || 10}mm</div>`;
            break;

        case 'columns':
            div.innerHTML = '<div class="preview-element-type">Columns</div>';
            const columnsDiv = document.createElement('div');
            columnsDiv.className = 'preview-columns';

            element.columns?.forEach((col, idx) => {
                const colDiv = document.createElement('div');
                colDiv.className = 'preview-column';
                colDiv.style.flex = col.width.includes('%') ?
                    `0 0 ${col.width}` :
                    `0 0 ${col.width}px`;

                renderElementsToPreview(col.elements, colDiv);
                columnsDiv.appendChild(colDiv);
            });

            div.appendChild(columnsDiv);
            break;

        case 'table':
            div.innerHTML = '<div class="preview-element-type">Table</div>';
            const tableDiv = document.createElement('div');
            tableDiv.className = 'preview-table';

            if (element.header?.visible && element.header.cells) {
                const headerRow = document.createElement('div');
                headerRow.className = 'preview-table-header';
                headerRow.textContent = element.header.cells.map(c => c.text).join(' | ');
                tableDiv.appendChild(headerRow);
            }

            // Sample rows
            for (let i = 0; i < 2; i++) {
                const row = document.createElement('div');
                row.className = 'preview-table-row';
                row.style.background = element.body?.stripe?.enabled && i % 2 === 1 ?
                    element.body.stripe.evenFillColor :
                    element.body.stripe?.oddFillColor || '#fff';
                row.textContent = element.body?.columns?.map(c => `{${c.key}}`).join(' | ') || 'Data rows...';
                tableDiv.appendChild(row);
            }

            div.appendChild(tableDiv);
            break;

        case 'pageBreak':
            div.className += ' preview-page-break';
            div.innerHTML = '--- PAGE BREAK ---';
            break;

        default:
            div.innerHTML = `<div class="preview-element-type">${element.type}</div>`;
    }

    return div;
}

// ========================================
// RENDERING - PROPERTIES PANEL
// ========================================

/**
 * Render properties panel for selected element
 */
function renderPropertiesPanel() {
    const panel = document.getElementById('properties-panel');

    if (!selectedElementId) {
        panel.innerHTML = '<p class="placeholder-text">Select an element to edit its properties</p>';
        return;
    }

    const element = findElementById(selectedElementId);
    if (!element) {
        panel.innerHTML = '<p class="placeholder-text">Element not found</p>';
        return;
    }

    let html = `<h4>Element: ${element.type}</h4>`;

    // Common layout properties
    html += `
        <div class="form-group">
            <label>Layout Mode</label>
            <select class="form-input" data-path="layout.mode">
                <option value="flow" ${element.layout?.mode === 'flow' ? 'selected' : ''}>Flow</option>
                <option value="absolute" ${element.layout?.mode === 'absolute' ? 'selected' : ''}>Absolute</option>
            </select>
        </div>
    `;

    if (element.layout?.mode === 'absolute') {
        html += `
            <div class="form-row">
                <div class="form-group">
                    <label>X (mm)</label>
                    <input type="number" class="form-input" data-path="layout.x" value="${element.layout?.x || 0}">
                </div>
                <div class="form-group">
                    <label>Y (mm)</label>
                    <input type="number" class="form-input" data-path="layout.y" value="${element.layout?.y || 0}">
                </div>
            </div>
        `;
    }

    html += `
        <div class="form-row">
            <div class="form-group">
                <label>Width</label>
                <input type="text" class="form-input" data-path="layout.width"
                       value="${element.layout?.width || 'auto'}" placeholder="auto or number">
            </div>
            <div class="form-group">
                <label>Height</label>
                <input type="text" class="form-input" data-path="layout.height"
                       value="${element.layout?.height || 'auto'}" placeholder="auto or number">
            </div>
        </div>
        <div class="form-group">
            <label>Alignment</label>
            <select class="form-input" data-path="layout.align">
                <option value="left" ${element.layout?.align === 'left' ? 'selected' : ''}>Left</option>
                <option value="center" ${element.layout?.align === 'center' ? 'selected' : ''}>Center</option>
                <option value="right" ${element.layout?.align === 'right' ? 'selected' : ''}>Right</option>
            </select>
        </div>
        <h4>Margins (mm)</h4>
        <div class="form-row four-col">
            <div class="form-group">
                <label>Top</label>
                <input type="number" class="form-input" data-path="layout.marginTop" value="${element.layout?.marginTop || 0}">
            </div>
            <div class="form-group">
                <label>Right</label>
                <input type="number" class="form-input" data-path="layout.marginRight" value="${element.layout?.marginRight || 0}">
            </div>
            <div class="form-group">
                <label>Bottom</label>
                <input type="number" class="form-input" data-path="layout.marginBottom" value="${element.layout?.marginBottom || 0}">
            </div>
            <div class="form-group">
                <label>Left</label>
                <input type="number" class="form-input" data-path="layout.marginLeft" value="${element.layout?.marginLeft || 0}">
            </div>
        </div>
    `;

    // Style reference
    const styleOptions = Object.keys(layout.styles).map(name =>
        `<option value="${name}" ${element.styleRef === name ? 'selected' : ''}>${name}</option>`
    ).join('');

    html += `
        <div class="form-group">
            <label>Style Reference</label>
            <select class="form-input" data-path="styleRef">
                <option value="">None</option>
                ${styleOptions}
            </select>
        </div>
    `;

    // Type-specific properties
    html += renderTypeSpecificProperties(element);

    // Visibility condition
    html += `
        <h4>Advanced</h4>
        <div class="form-group">
            <label>Visibility Condition</label>
            <input type="text" class="form-input" data-path="visibilityCondition"
                   value="${element.visibilityCondition || ''}" placeholder="e.g., {{show_section}}">
        </div>
    `;

    panel.innerHTML = html;

    // Attach event listeners
    panel.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('change', handlePropertyChange);
        if (input.type === 'text' || input.type === 'number' || input.tagName === 'TEXTAREA') {
            input.addEventListener('input', debounce(handlePropertyChange, 300));
        }
    });

    // Attach table-specific listeners
    attachTableEditorListeners();
}

/**
 * Render type-specific properties
 */
function renderTypeSpecificProperties(element) {
    let html = '';

    switch (element.type) {
        case 'text':
            html += `
                <h4>Text Content</h4>
                <div class="form-group">
                    <label>Content</label>
                    <textarea class="form-input" data-path="content" rows="4">${escapeHtml(element.content || '')}</textarea>
                </div>
            `;
            break;

        case 'image':
            html += `
                <h4>Image Source</h4>
                <div class="form-group">
                    <label>Source Type</label>
                    <select class="form-input" data-path="source.type">
                        <option value="placeholder" ${element.source?.type === 'placeholder' ? 'selected' : ''}>Placeholder</option>
                        <option value="static" ${element.source?.type === 'static' ? 'selected' : ''}>Static Path</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Value</label>
                    <input type="text" class="form-input" data-path="source.value"
                           value="${escapeHtml(element.source?.value || '')}" placeholder="{{variable}} or /path/to/image.png">
                </div>
                <div class="form-group">
                    <label>Fit Mode</label>
                    <select class="form-input" data-path="fit">
                        <option value="contain" ${element.fit === 'contain' ? 'selected' : ''}>Contain</option>
                        <option value="cover" ${element.fit === 'cover' ? 'selected' : ''}>Cover</option>
                        <option value="stretch" ${element.fit === 'stretch' ? 'selected' : ''}>Stretch</option>
                    </select>
                </div>
            `;
            break;

        case 'line':
            html += `
                <h4>Line Style</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label>Line Width</label>
                        <input type="number" class="form-input" data-path="style.lineWidth"
                               value="${element.style?.lineWidth || 0.5}" step="0.1">
                    </div>
                    <div class="form-group">
                        <label>Line Color</label>
                        <div class="color-input-group">
                            <input type="color" class="form-input-color" data-path="style.lineColor"
                                   value="${element.style?.lineColor || '#000000'}">
                            <input type="text" class="form-input" data-path="style.lineColor"
                                   value="${element.style?.lineColor || '#000000'}">
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'spacer':
            // Height already covered in common layout
            break;

        case 'columns':
            html += `
                <h4>Column Settings</h4>
                <div class="form-group">
                    <label>Number of Columns</label>
                    <select class="form-input" id="column-count">
                        <option value="2" ${element.columns?.length === 2 ? 'selected' : ''}>2 Columns</option>
                        <option value="3" ${element.columns?.length === 3 ? 'selected' : ''}>3 Columns</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Column Gap (mm)</label>
                    <input type="number" class="form-input" data-path="columnGap" value="${element.columnGap || 4}">
                </div>
            `;

            // Column widths
            element.columns?.forEach((col, idx) => {
                html += `
                    <div class="form-group">
                        <label>Column ${idx + 1} Width</label>
                        <input type="text" class="form-input" data-path="columns[${idx}].width"
                               value="${col.width}" placeholder="50% or 90">
                    </div>
                `;
            });
            break;

        case 'table':
            html += renderTableProperties(element);
            break;
    }

    return html;
}

/**
 * Render table-specific properties
 */
function renderTableProperties(element) {
    let html = `
        <h4>Table Header</h4>
        <div class="form-group">
            <label class="checkbox-label">
                <input type="checkbox" data-path="header.visible" ${element.header?.visible ? 'checked' : ''}>
                Show Header
            </label>
        </div>
        <div class="form-group">
            <label>Header Style</label>
            <select class="form-input" data-path="header.styleRef">
                <option value="">None</option>
                ${Object.keys(layout.styles).map(name =>
                    `<option value="${name}" ${element.header?.styleRef === name ? 'selected' : ''}>${name}</option>`
                ).join('')}
            </select>
        </div>
        <div class="form-group">
            <label>Header Row Height</label>
            <input type="number" class="form-input" data-path="header.rowHeight" value="${element.header?.rowHeight || 8}">
        </div>

        <h4>Header Cells</h4>
        <div class="table-editor" id="header-cells-editor">
            <div class="table-editor-header">
                <span>Header Cells</span>
                <button class="btn btn-small" id="add-header-cell">+ Add</button>
            </div>
            <div class="table-editor-rows">
    `;

    element.header?.cells?.forEach((cell, idx) => {
        html += `
            <div class="table-editor-row" data-index="${idx}">
                <input type="text" data-cell-prop="text" value="${escapeHtml(cell.text || '')}" placeholder="Header text">
                <input type="number" data-cell-prop="width" value="${cell.width || 50}" style="width:50px">
                <select data-cell-prop="align">
                    <option value="left" ${cell.align === 'left' ? 'selected' : ''}>Left</option>
                    <option value="center" ${cell.align === 'center' ? 'selected' : ''}>Center</option>
                    <option value="right" ${cell.align === 'right' ? 'selected' : ''}>Right</option>
                </select>
                <button class="delete-btn" data-action="delete-header-cell">×</button>
            </div>
        `;
    });

    html += `
            </div>
        </div>

        <h4>Table Body</h4>
        <div class="form-group">
            <label>Row Source (placeholder)</label>
            <input type="text" class="form-input" data-path="body.rowSource.value"
                   value="${element.body?.rowSource?.value || ''}" placeholder="{{table_rows}}">
        </div>
        <div class="form-group">
            <label>Row Style</label>
            <select class="form-input" data-path="body.rowStyleRef">
                <option value="">None</option>
                ${Object.keys(layout.styles).map(name =>
                    `<option value="${name}" ${element.body?.rowStyleRef === name ? 'selected' : ''}>${name}</option>`
                ).join('')}
            </select>
        </div>

        <h4>Striping</h4>
        <div class="form-group">
            <label class="checkbox-label">
                <input type="checkbox" data-path="body.stripe.enabled" ${element.body?.stripe?.enabled ? 'checked' : ''}>
                Enable Row Striping
            </label>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Odd Row Color</label>
                <input type="color" class="form-input-color" data-path="body.stripe.oddFillColor"
                       value="${element.body?.stripe?.oddFillColor || '#FFFFFF'}">
            </div>
            <div class="form-group">
                <label>Even Row Color</label>
                <input type="color" class="form-input-color" data-path="body.stripe.evenFillColor"
                       value="${element.body?.stripe?.evenFillColor || '#F7F7F7'}">
            </div>
        </div>

        <h4>Body Columns</h4>
        <div class="table-editor" id="body-columns-editor">
            <div class="table-editor-header">
                <span>Data Columns</span>
                <button class="btn btn-small" id="add-body-column">+ Add</button>
            </div>
            <div class="table-editor-rows">
    `;

    element.body?.columns?.forEach((col, idx) => {
        html += `
            <div class="table-editor-row" data-index="${idx}">
                <input type="text" data-col-prop="key" value="${escapeHtml(col.key || '')}" placeholder="Data key">
                <input type="number" data-col-prop="width" value="${col.width || 50}" style="width:50px">
                <select data-col-prop="align">
                    <option value="left" ${col.align === 'left' ? 'selected' : ''}>Left</option>
                    <option value="center" ${col.align === 'center' ? 'selected' : ''}>Center</option>
                    <option value="right" ${col.align === 'right' ? 'selected' : ''}>Right</option>
                </select>
                <select data-col-prop="format">
                    <option value="text" ${col.format === 'text' ? 'selected' : ''}>Text</option>
                    <option value="number" ${col.format === 'number' ? 'selected' : ''}>Number</option>
                    <option value="currency" ${col.format === 'currency' ? 'selected' : ''}>Currency</option>
                    <option value="percentage" ${col.format === 'percentage' ? 'selected' : ''}>Percentage</option>
                    <option value="date" ${col.format === 'date' ? 'selected' : ''}>Date</option>
                </select>
                <button class="delete-btn" data-action="delete-body-column">×</button>
            </div>
        `;
    });

    html += `
            </div>
        </div>

        <h4>Borders</h4>
        <div class="form-row">
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" data-path="borders.outer" ${element.borders?.outer ? 'checked' : ''}>
                    Outer Border
                </label>
            </div>
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" data-path="borders.inner" ${element.borders?.inner ? 'checked' : ''}>
                    Inner Borders
                </label>
            </div>
        </div>
    `;

    return html;
}

/**
 * Attach table editor event listeners
 */
function attachTableEditorListeners() {
    const element = findElementById(selectedElementId);
    if (!element || element.type !== 'table') return;

    // Header cells
    const addHeaderBtn = document.getElementById('add-header-cell');
    if (addHeaderBtn) {
        addHeaderBtn.addEventListener('click', () => {
            if (!element.header.cells) element.header.cells = [];
            element.header.cells.push({ text: 'New Column', width: 45, align: 'left' });
            renderAll();
        });
    }

    document.querySelectorAll('[data-action="delete-header-cell"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('.table-editor-row');
            const idx = parseInt(row.dataset.index);
            element.header.cells.splice(idx, 1);
            renderAll();
        });
    });

    document.querySelectorAll('[data-cell-prop]').forEach(input => {
        input.addEventListener('change', (e) => {
            const row = input.closest('.table-editor-row');
            const idx = parseInt(row.dataset.index);
            const prop = input.dataset.cellProp;
            let value = input.value;
            if (prop === 'width') value = parseFloat(value);
            element.header.cells[idx][prop] = value;
            renderPreview();
        });
    });

    // Body columns
    const addBodyBtn = document.getElementById('add-body-column');
    if (addBodyBtn) {
        addBodyBtn.addEventListener('click', () => {
            if (!element.body.columns) element.body.columns = [];
            element.body.columns.push({ key: 'new_key', width: 45, align: 'left', format: 'text' });
            renderAll();
        });
    }

    document.querySelectorAll('[data-action="delete-body-column"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('.table-editor-row');
            const idx = parseInt(row.dataset.index);
            element.body.columns.splice(idx, 1);
            renderAll();
        });
    });

    document.querySelectorAll('[data-col-prop]').forEach(input => {
        input.addEventListener('change', (e) => {
            const row = input.closest('.table-editor-row');
            const idx = parseInt(row.dataset.index);
            const prop = input.dataset.colProp;
            let value = input.value;
            if (prop === 'width') value = parseFloat(value);
            element.body.columns[idx][prop] = value;
            renderPreview();
        });
    });

    // Column count change
    const columnCountSelect = document.getElementById('column-count');
    if (columnCountSelect) {
        columnCountSelect.addEventListener('change', (e) => {
            const newCount = parseInt(e.target.value);
            const currentCount = element.columns.length;

            if (newCount > currentCount) {
                for (let i = currentCount; i < newCount; i++) {
                    element.columns.push({ width: `${Math.floor(100/newCount)}%`, elements: [] });
                }
            } else if (newCount < currentCount) {
                element.columns = element.columns.slice(0, newCount);
            }

            // Recalculate widths
            const widthPercent = Math.floor(100 / newCount);
            element.columns.forEach((col, i) => {
                col.width = i === newCount - 1 ? `${100 - widthPercent * (newCount - 1)}%` : `${widthPercent}%`;
            });

            renderAll();
        });
    }
}

/**
 * Handle property input change
 */
function handlePropertyChange(e) {
    const input = e.target;
    const path = input.dataset.path;
    if (!path) return;

    let value = input.type === 'checkbox' ? input.checked : input.value;

    // Handle numeric values
    if (input.type === 'number') {
        value = parseFloat(value) || 0;
    }

    // Handle "auto" string for width/height
    if ((path.endsWith('.width') || path.endsWith('.height')) && value === 'auto') {
        // Keep as string
    } else if ((path.endsWith('.width') || path.endsWith('.height')) && !isNaN(parseFloat(value))) {
        value = parseFloat(value);
    }

    // Handle null values
    if (value === '' && (path.includes('styleRef') || path.includes('Condition'))) {
        value = null;
    }

    updateElementProperty(selectedElementId, path, value);
}

// ========================================
// RENDERING - STYLES TAB
// ========================================

/**
 * Render styles list
 */
function renderStylesList() {
    const container = document.getElementById('styles-list');
    container.innerHTML = '';

    Object.entries(layout.styles).forEach(([name, style]) => {
        const item = document.createElement('div');
        item.className = 'style-item';
        item.innerHTML = `
            <span class="style-item-name">${name}</span>
            <span class="style-item-preview">${style.fontFamily} ${style.fontSize}pt ${style.fontStyle || 'Regular'}</span>
        `;
        item.addEventListener('click', () => openStyleEditor(name));
        container.appendChild(item);
    });
}

/**
 * Open style editor modal
 */
function openStyleEditor(styleName = null) {
    editingStyleName = styleName;
    const modal = document.getElementById('style-modal-overlay');
    const title = document.getElementById('style-modal-title');
    const deleteBtn = document.getElementById('style-modal-delete');

    if (styleName) {
        title.textContent = 'Edit Style';
        deleteBtn.style.display = 'block';
        const style = layout.styles[styleName];

        document.getElementById('style-name').value = styleName;
        document.getElementById('style-font-family').value = style.fontFamily || 'helvetica';
        document.getElementById('style-font-size').value = style.fontSize || 10;
        document.getElementById('style-font-style').value = style.fontStyle || '';
        document.getElementById('style-line-height').value = style.lineHeight || 1.4;
        document.getElementById('style-text-color').value = style.textColor || '#333333';
        document.getElementById('style-text-color-hex').value = style.textColor || '#333333';
        document.getElementById('style-fill-color').value = style.fillColor || '#ffffff';
        document.getElementById('style-fill-color-hex').value = style.fillColor || '';
        document.getElementById('style-border-color').value = style.borderColor || '#000000';
        document.getElementById('style-border-color-hex').value = style.borderColor || '';
    } else {
        title.textContent = 'New Style';
        deleteBtn.style.display = 'none';
        document.getElementById('style-name').value = '';
        document.getElementById('style-font-family').value = 'helvetica';
        document.getElementById('style-font-size').value = 10;
        document.getElementById('style-font-style').value = '';
        document.getElementById('style-line-height').value = 1.4;
        document.getElementById('style-text-color').value = '#333333';
        document.getElementById('style-text-color-hex').value = '#333333';
        document.getElementById('style-fill-color').value = '#ffffff';
        document.getElementById('style-fill-color-hex').value = '';
        document.getElementById('style-border-color').value = '#000000';
        document.getElementById('style-border-color-hex').value = '';
    }

    modal.classList.remove('hidden');
}

/**
 * Save style from modal
 */
function saveStyle() {
    const name = document.getElementById('style-name').value.trim();
    if (!name) {
        alert('Please enter a style name');
        return;
    }

    const textColor = document.getElementById('style-text-color-hex').value || null;
    const fillColor = document.getElementById('style-fill-color-hex').value || null;
    const borderColor = document.getElementById('style-border-color-hex').value || null;

    const style = {
        fontFamily: document.getElementById('style-font-family').value,
        fontSize: parseFloat(document.getElementById('style-font-size').value) || 10,
        fontStyle: document.getElementById('style-font-style').value,
        textColor: textColor,
        fillColor: fillColor,
        borderColor: borderColor,
        lineHeight: parseFloat(document.getElementById('style-line-height').value) || 1.4
    };

    // If renaming, delete old style
    if (editingStyleName && editingStyleName !== name) {
        delete layout.styles[editingStyleName];
    }

    layout.styles[name] = style;
    closeStyleModal();
    renderStylesList();
}

/**
 * Delete style
 */
function deleteStyle() {
    if (!editingStyleName) return;

    if (confirm(`Delete style "${editingStyleName}"?`)) {
        delete layout.styles[editingStyleName];
        closeStyleModal();
        renderStylesList();
    }
}

/**
 * Close style modal
 */
function closeStyleModal() {
    document.getElementById('style-modal-overlay').classList.add('hidden');
    editingStyleName = null;
}

// ========================================
// RENDERING - PAGE SETTINGS
// ========================================

/**
 * Render page settings from layout
 */
function renderPageSettings() {
    document.getElementById('meta-title').value = layout.meta.title || '';
    document.getElementById('meta-description').value = layout.meta.description || '';
    document.getElementById('meta-author').value = layout.meta.author || '';

    document.getElementById('page-size').value = layout.page.size || 'A4';
    document.getElementById('page-orientation').value = layout.page.orientation || 'P';

    document.getElementById('margin-top').value = layout.page.margins.top || 0;
    document.getElementById('margin-right').value = layout.page.margins.right || 0;
    document.getElementById('margin-bottom').value = layout.page.margins.bottom || 0;
    document.getElementById('margin-left').value = layout.page.margins.left || 0;

    document.getElementById('auto-page-break').checked = layout.page.autoPageBreak !== false;
    document.getElementById('auto-break-margin').value = layout.page.autoPageBreakMargin || 15;

    document.getElementById('header-repeat').value = layout.header.repeatOnPages || 'all';
    document.getElementById('header-height').value = layout.header.height || 25;

    document.getElementById('footer-repeat').value = layout.footer.repeatOnPages || 'all';
    document.getElementById('footer-height').value = layout.footer.height || 20;
}

/**
 * Attach page settings listeners
 */
function attachPageSettingsListeners() {
    // Meta
    document.getElementById('meta-title').addEventListener('change', (e) => {
        layout.meta.title = e.target.value;
    });
    document.getElementById('meta-description').addEventListener('change', (e) => {
        layout.meta.description = e.target.value;
    });
    document.getElementById('meta-author').addEventListener('change', (e) => {
        layout.meta.author = e.target.value;
    });

    // Page
    document.getElementById('page-size').addEventListener('change', (e) => {
        layout.page.size = e.target.value;
        renderPreview();
    });
    document.getElementById('page-orientation').addEventListener('change', (e) => {
        layout.page.orientation = e.target.value;
        renderPreview();
    });

    // Margins
    ['top', 'right', 'bottom', 'left'].forEach(side => {
        document.getElementById(`margin-${side}`).addEventListener('change', (e) => {
            layout.page.margins[side] = parseFloat(e.target.value) || 0;
            renderPreview();
        });
    });

    // Auto page break
    document.getElementById('auto-page-break').addEventListener('change', (e) => {
        layout.page.autoPageBreak = e.target.checked;
    });
    document.getElementById('auto-break-margin').addEventListener('change', (e) => {
        layout.page.autoPageBreakMargin = parseFloat(e.target.value) || 15;
    });

    // Header
    document.getElementById('header-repeat').addEventListener('change', (e) => {
        layout.header.repeatOnPages = e.target.value;
    });
    document.getElementById('header-height').addEventListener('change', (e) => {
        layout.header.height = parseFloat(e.target.value) || 25;
        renderPreview();
    });

    // Footer
    document.getElementById('footer-repeat').addEventListener('change', (e) => {
        layout.footer.repeatOnPages = e.target.value;
    });
    document.getElementById('footer-height').addEventListener('change', (e) => {
        layout.footer.height = parseFloat(e.target.value) || 20;
        renderPreview();
    });
}

// ========================================
// IMPORT / EXPORT
// ========================================

/**
 * Export layout to JSON string
 */
function exportLayoutJson() {
    return JSON.stringify(layout, null, 2);
}

/**
 * Import layout from JSON string
 */
function importLayoutJson(jsonString) {
    try {
        const data = JSON.parse(jsonString);

        // Validate required keys
        const requiredKeys = ['version', 'meta', 'page', 'styles', 'header', 'footer', 'body'];
        const missingKeys = requiredKeys.filter(key => !(key in data));

        if (missingKeys.length > 0) {
            throw new Error(`Missing required keys: ${missingKeys.join(', ')}`);
        }

        // Update element ID counter based on imported elements
        let maxId = 0;
        const findMaxId = (elements) => {
            elements.forEach(el => {
                const match = el.id?.match(/element-(\d+)/);
                if (match) {
                    maxId = Math.max(maxId, parseInt(match[1]));
                }
                if (el.type === 'columns' && el.columns) {
                    el.columns.forEach(col => findMaxId(col.elements || []));
                }
            });
        };

        findMaxId(data.header?.elements || []);
        findMaxId(data.body?.elements || []);
        findMaxId(data.footer?.elements || []);
        elementIdCounter = maxId;

        layout = data;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Show export modal
 */
function showExportModal() {
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const textarea = document.getElementById('modal-textarea');
    const error = document.getElementById('modal-error');
    const confirmBtn = document.getElementById('modal-confirm');

    title.textContent = 'Export JSON';
    textarea.value = exportLayoutJson();
    textarea.readOnly = true;
    error.classList.add('hidden');
    confirmBtn.textContent = 'Download';
    confirmBtn.onclick = downloadJson;

    modal.classList.remove('hidden');
}

/**
 * Show import modal
 */
function showImportModal() {
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const textarea = document.getElementById('modal-textarea');
    const error = document.getElementById('modal-error');
    const confirmBtn = document.getElementById('modal-confirm');

    title.textContent = 'Import JSON';
    textarea.value = '';
    textarea.readOnly = false;
    textarea.placeholder = 'Paste your JSON here...';
    error.classList.add('hidden');
    confirmBtn.textContent = 'Import';
    confirmBtn.onclick = handleImport;

    modal.classList.remove('hidden');
}

/**
 * Handle import confirmation
 */
function handleImport() {
    const textarea = document.getElementById('modal-textarea');
    const error = document.getElementById('modal-error');

    const result = importLayoutJson(textarea.value);

    if (result.success) {
        closeModal();
        selectedElementId = null;
        renderAll();
    } else {
        error.textContent = `Import failed: ${result.error}`;
        error.classList.remove('hidden');
    }
}

/**
 * Download JSON as file
 */
function downloadJson() {
    const json = exportLayoutJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layout.meta.title || 'layout'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    closeModal();
}

/**
 * Close modal
 */
function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}

// ========================================
// UI HELPERS
// ========================================

/**
 * Select an element
 */
function selectElement(id) {
    selectedElementId = id;
    renderLayoutTree();
    renderPreview();
    renderPropertiesPanel();

    // Switch to properties tab
    switchTab('properties');
}

/**
 * Switch tab
 */
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabName}`);
    });
}

/**
 * Render all components
 */
function renderAll() {
    renderLayoutTree();
    renderPreview();
    renderPropertiesPanel();
    renderStylesList();
    renderPageSettings();
}

/**
 * Escape HTML entities
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize the application
 */
function init() {
    // Initialize layout
    initLayout();

    // Add some sample elements
    addElement('text', 'header');
    const headerText = layout.header.elements[0];
    headerText.content = '{{company_name}} - Investment Report';
    headerText.styleRef = 'h1';

    addElement('text', 'footer');
    const footerText = layout.footer.elements[0];
    footerText.content = 'Page {{page_number}} of {{total_pages}}';

    addElement('text', 'body');
    addElement('table', 'body');

    selectedElementId = null;

    // Attach event listeners
    attachEventListeners();

    // Initial render
    renderAll();
}

/**
 * Attach all event listeners
 */
function attachEventListeners() {
    // Component palette
    document.querySelectorAll('.component-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            addElement(type === 'columns-2' ? 'columns' : type);
        });
    });

    // Section selector
    document.querySelectorAll('input[name="target-section"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectedSection = e.target.value;
        });
    });

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Preview zoom
    document.getElementById('preview-zoom').addEventListener('change', (e) => {
        previewScale = parseFloat(e.target.value);
        renderPreview();
    });

    // Header buttons
    document.getElementById('btn-new').addEventListener('click', () => {
        if (confirm('Create a new layout? Unsaved changes will be lost.')) {
            initLayout();
            selectedElementId = null;
            renderAll();
        }
    });

    document.getElementById('btn-import').addEventListener('click', showImportModal);
    document.getElementById('btn-export').addEventListener('click', showExportModal);

    // Modal
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    // Style modal
    document.getElementById('btn-add-style').addEventListener('click', () => openStyleEditor(null));
    document.getElementById('style-modal-close').addEventListener('click', closeStyleModal);
    document.getElementById('style-modal-cancel').addEventListener('click', closeStyleModal);
    document.getElementById('style-modal-save').addEventListener('click', saveStyle);
    document.getElementById('style-modal-delete').addEventListener('click', deleteStyle);
    document.getElementById('style-modal-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeStyleModal();
    });

    // Style color sync
    ['text', 'fill', 'border'].forEach(type => {
        const colorPicker = document.getElementById(`style-${type}-color`);
        const hexInput = document.getElementById(`style-${type}-color-hex`);

        colorPicker.addEventListener('input', (e) => {
            hexInput.value = e.target.value;
        });

        hexInput.addEventListener('input', (e) => {
            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                colorPicker.value = e.target.value;
            }
        });
    });

    // Page settings
    attachPageSettingsListeners();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' && selectedElementId && !e.target.matches('input, textarea')) {
            deleteElement(selectedElementId);
        }
        if (e.key === 'Escape') {
            closeModal();
            closeStyleModal();
        }
    });

    // Click outside to deselect
    document.getElementById('page-preview').addEventListener('click', (e) => {
        if (e.target.id === 'page-preview' ||
            e.target.id === 'preview-header' ||
            e.target.id === 'preview-body' ||
            e.target.id === 'preview-footer') {
            selectedElementId = null;
            renderLayoutTree();
            renderPreview();
            renderPropertiesPanel();
        }
    });
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
