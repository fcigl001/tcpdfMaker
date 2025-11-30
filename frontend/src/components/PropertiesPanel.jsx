import React, { useState } from 'react'
import { useLayoutStore } from '../store/layoutStore'
import { MousePointer, Plus, Trash2, Edit3 } from 'lucide-react'
import StyleEditorModal from './StyleEditorModal'

function PropertiesPanel() {
  const { activeTab, setActiveTab } = useLayoutStore()

  return (
    <aside className="properties-panel">
      <div className="properties-tabs">
        <button
          className={`properties-tab ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          Properties
        </button>
        <button
          className={`properties-tab ${activeTab === 'page' ? 'active' : ''}`}
          onClick={() => setActiveTab('page')}
        >
          Page
        </button>
        <button
          className={`properties-tab ${activeTab === 'styles' ? 'active' : ''}`}
          onClick={() => setActiveTab('styles')}
        >
          Styles
        </button>
      </div>

      <div className="properties-content">
        {activeTab === 'properties' && <ElementProperties />}
        {activeTab === 'page' && <PageSettings />}
        {activeTab === 'styles' && <StylesManager />}
      </div>
    </aside>
  )
}

function ElementProperties() {
  const { selectedElementId, getElementById, updateElement, layout } = useLayoutStore()

  if (!selectedElementId) {
    return (
      <div className="properties-empty">
        <MousePointer className="properties-empty-icon" />
        <p className="properties-empty-text">
          Select an element to edit its properties
        </p>
      </div>
    )
  }

  const element = getElementById(selectedElementId)
  if (!element) return null

  const handleChange = (path, value) => {
    updateElement(selectedElementId, path, value)
  }

  const styleOptions = Object.keys(layout.styles)

  return (
    <div>
      <div className="form-section">
        <h4 className="form-section-title">Element: {element.type}</h4>

        <div className="form-group">
          <label className="form-label">Layout Mode</label>
          <select
            className="form-input form-select"
            value={element.layout?.mode || 'flow'}
            onChange={(e) => handleChange('layout.mode', e.target.value)}
          >
            <option value="flow">Flow</option>
            <option value="absolute">Absolute</option>
          </select>
        </div>

        {element.layout?.mode === 'absolute' && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">X (mm)</label>
              <input
                type="number"
                className="form-input"
                value={element.layout?.x || 0}
                onChange={(e) => handleChange('layout.x', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Y (mm)</label>
              <input
                type="number"
                className="form-input"
                value={element.layout?.y || 0}
                onChange={(e) => handleChange('layout.y', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Width</label>
            <input
              type="text"
              className="form-input"
              value={element.layout?.width || 'auto'}
              placeholder="auto or number"
              onChange={(e) => {
                const val = e.target.value
                handleChange('layout.width', val === 'auto' ? 'auto' : parseFloat(val) || 'auto')
              }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Height</label>
            <input
              type="text"
              className="form-input"
              value={element.layout?.height || 'auto'}
              placeholder="auto or number"
              onChange={(e) => {
                const val = e.target.value
                handleChange('layout.height', val === 'auto' ? 'auto' : parseFloat(val) || 'auto')
              }}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Alignment</label>
          <select
            className="form-input form-select"
            value={element.layout?.align || 'left'}
            onChange={(e) => handleChange('layout.align', e.target.value)}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>

      <div className="form-section">
        <h4 className="form-section-title">Margins (mm)</h4>
        <div className="form-row form-row-4">
          <div className="form-group">
            <label className="form-label">Top</label>
            <input
              type="number"
              className="form-input"
              value={element.layout?.marginTop || 0}
              onChange={(e) => handleChange('layout.marginTop', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Right</label>
            <input
              type="number"
              className="form-input"
              value={element.layout?.marginRight || 0}
              onChange={(e) => handleChange('layout.marginRight', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Bottom</label>
            <input
              type="number"
              className="form-input"
              value={element.layout?.marginBottom || 0}
              onChange={(e) => handleChange('layout.marginBottom', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Left</label>
            <input
              type="number"
              className="form-input"
              value={element.layout?.marginLeft || 0}
              onChange={(e) => handleChange('layout.marginLeft', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4 className="form-section-title">Style</h4>
        <div className="form-group">
          <label className="form-label">Style Reference</label>
          <select
            className="form-input form-select"
            value={element.styleRef || ''}
            onChange={(e) => handleChange('styleRef', e.target.value || null)}
          >
            <option value="">None</option>
            {styleOptions.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <TypeSpecificProperties element={element} onChange={handleChange} />

      <div className="form-section">
        <h4 className="form-section-title">Advanced</h4>
        <div className="form-group">
          <label className="form-label">Visibility Condition</label>
          <input
            type="text"
            className="form-input"
            value={element.visibilityCondition || ''}
            placeholder="e.g., {{show_section}}"
            onChange={(e) => handleChange('visibilityCondition', e.target.value || null)}
          />
        </div>
      </div>
    </div>
  )
}

function TypeSpecificProperties({ element, onChange }) {
  const { layout } = useLayoutStore()

  switch (element.type) {
    case 'text':
      return (
        <div className="form-section">
          <h4 className="form-section-title">Text Content</h4>
          <div className="form-group">
            <label className="form-label">Content</label>
            <textarea
              className="form-input form-textarea"
              value={element.content || ''}
              rows={4}
              onChange={(e) => onChange('content', e.target.value)}
            />
          </div>
        </div>
      )

    case 'image':
      return (
        <div className="form-section">
          <h4 className="form-section-title">Image Source</h4>
          <div className="form-group">
            <label className="form-label">Source Type</label>
            <select
              className="form-input form-select"
              value={element.source?.type || 'placeholder'}
              onChange={(e) => onChange('source.type', e.target.value)}
            >
              <option value="placeholder">Placeholder</option>
              <option value="static">Static Path</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Value</label>
            <input
              type="text"
              className="form-input"
              value={element.source?.value || ''}
              placeholder="{{variable}} or /path/to/image.png"
              onChange={(e) => onChange('source.value', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Fit Mode</label>
            <select
              className="form-input form-select"
              value={element.fit || 'contain'}
              onChange={(e) => onChange('fit', e.target.value)}
            >
              <option value="contain">Contain</option>
              <option value="cover">Cover</option>
              <option value="stretch">Stretch</option>
            </select>
          </div>
        </div>
      )

    case 'line':
      return (
        <div className="form-section">
          <h4 className="form-section-title">Line Style</h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Width</label>
              <input
                type="number"
                className="form-input"
                value={element.style?.lineWidth || 0.5}
                step="0.1"
                onChange={(e) => onChange('style.lineWidth', parseFloat(e.target.value) || 0.5)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="form-color-group">
                <input
                  type="color"
                  className="form-color-input"
                  value={element.style?.lineColor || '#000000'}
                  onChange={(e) => onChange('style.lineColor', e.target.value)}
                />
                <input
                  type="text"
                  className="form-input"
                  value={element.style?.lineColor || '#000000'}
                  onChange={(e) => onChange('style.lineColor', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )

    case 'columns':
      return (
        <div className="form-section">
          <h4 className="form-section-title">Column Settings</h4>
          <div className="form-group">
            <label className="form-label">Number of Columns</label>
            <select
              className="form-input form-select"
              value={element.columns?.length || 2}
              onChange={(e) => {
                const count = parseInt(e.target.value)
                const currentCount = element.columns?.length || 2
                let newColumns = [...(element.columns || [])]

                if (count > currentCount) {
                  for (let i = currentCount; i < count; i++) {
                    newColumns.push({ width: `${Math.floor(100/count)}%`, elements: [] })
                  }
                } else {
                  newColumns = newColumns.slice(0, count)
                }

                // Recalculate widths
                newColumns = newColumns.map((col, i) => ({
                  ...col,
                  width: i === count - 1
                    ? `${100 - Math.floor(100/count) * (count - 1)}%`
                    : `${Math.floor(100/count)}%`
                }))

                onChange('columns', newColumns)
              }}
            >
              <option value="2">2 Columns</option>
              <option value="3">3 Columns</option>
              <option value="4">4 Columns</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Column Gap (mm)</label>
            <input
              type="number"
              className="form-input"
              value={element.columnGap || 4}
              onChange={(e) => onChange('columnGap', parseFloat(e.target.value) || 4)}
            />
          </div>
          {element.columns?.map((col, idx) => (
            <div key={idx} className="form-group">
              <label className="form-label">Column {idx + 1} Width</label>
              <input
                type="text"
                className="form-input"
                value={col.width}
                placeholder="50% or 90"
                onChange={(e) => onChange(`columns[${idx}].width`, e.target.value)}
              />
            </div>
          ))}
        </div>
      )

    case 'table':
      return <TableProperties element={element} onChange={onChange} layout={layout} />

    default:
      return null
  }
}

function TableProperties({ element, onChange, layout }) {
  const styleOptions = Object.keys(layout.styles)

  const addHeaderCell = () => {
    const cells = [...(element.header?.cells || [])]
    cells.push({ text: 'New Column', width: 45, align: 'left' })
    onChange('header.cells', cells)
  }

  const deleteHeaderCell = (idx) => {
    const cells = [...(element.header?.cells || [])]
    cells.splice(idx, 1)
    onChange('header.cells', cells)
  }

  const addBodyColumn = () => {
    const columns = [...(element.body?.columns || [])]
    columns.push({ key: 'new_key', width: 45, align: 'left', format: 'text' })
    onChange('body.columns', columns)
  }

  const deleteBodyColumn = (idx) => {
    const columns = [...(element.body?.columns || [])]
    columns.splice(idx, 1)
    onChange('body.columns', columns)
  }

  return (
    <>
      <div className="form-section">
        <h4 className="form-section-title">Table Header</h4>
        <div className="form-group">
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={element.header?.visible ?? true}
              onChange={(e) => onChange('header.visible', e.target.checked)}
            />
            <span className="form-checkbox-label">Show Header</span>
          </label>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Header Style</label>
            <select
              className="form-input form-select"
              value={element.header?.styleRef || ''}
              onChange={(e) => onChange('header.styleRef', e.target.value || null)}
            >
              <option value="">None</option>
              {styleOptions.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Row Height</label>
            <input
              type="number"
              className="form-input"
              value={element.header?.rowHeight || 8}
              onChange={(e) => onChange('header.rowHeight', parseFloat(e.target.value) || 8)}
            />
          </div>
        </div>

        <div className="table-editor">
          <div className="table-editor-header">
            <span>Header Cells</span>
            <button className="btn btn-sm" onClick={addHeaderCell}>
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="table-editor-body">
            {element.header?.cells?.map((cell, idx) => (
              <div key={idx} className="table-editor-row">
                <input
                  type="text"
                  value={cell.text || ''}
                  placeholder="Header text"
                  onChange={(e) => onChange(`header.cells[${idx}].text`, e.target.value)}
                />
                <input
                  type="number"
                  value={cell.width || 45}
                  onChange={(e) => onChange(`header.cells[${idx}].width`, parseFloat(e.target.value) || 45)}
                />
                <select
                  value={cell.align || 'left'}
                  onChange={(e) => onChange(`header.cells[${idx}].align`, e.target.value)}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
                <button className="table-editor-delete" onClick={() => deleteHeaderCell(idx)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4 className="form-section-title">Table Body</h4>
        <div className="form-group">
          <label className="form-label">Row Source (placeholder)</label>
          <input
            type="text"
            className="form-input"
            value={element.body?.rowSource?.value || ''}
            placeholder="{{table_rows}}"
            onChange={(e) => onChange('body.rowSource.value', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Row Style</label>
          <select
            className="form-input form-select"
            value={element.body?.rowStyleRef || ''}
            onChange={(e) => onChange('body.rowStyleRef', e.target.value || null)}
          >
            <option value="">None</option>
            {styleOptions.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={element.body?.stripe?.enabled ?? true}
              onChange={(e) => onChange('body.stripe.enabled', e.target.checked)}
            />
            <span className="form-checkbox-label">Enable Row Striping</span>
          </label>
        </div>
        {element.body?.stripe?.enabled && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Odd Row</label>
              <input
                type="color"
                className="form-color-input"
                value={element.body?.stripe?.oddFillColor || '#FFFFFF'}
                onChange={(e) => onChange('body.stripe.oddFillColor', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Even Row</label>
              <input
                type="color"
                className="form-color-input"
                value={element.body?.stripe?.evenFillColor || '#F7F7F7'}
                onChange={(e) => onChange('body.stripe.evenFillColor', e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="table-editor" style={{ marginTop: 12 }}>
          <div className="table-editor-header">
            <span>Data Columns</span>
            <button className="btn btn-sm" onClick={addBodyColumn}>
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="table-editor-body">
            {element.body?.columns?.map((col, idx) => (
              <div key={idx} className="table-editor-row">
                <input
                  type="text"
                  value={col.key || ''}
                  placeholder="Data key"
                  onChange={(e) => onChange(`body.columns[${idx}].key`, e.target.value)}
                />
                <input
                  type="number"
                  value={col.width || 45}
                  onChange={(e) => onChange(`body.columns[${idx}].width`, parseFloat(e.target.value) || 45)}
                />
                <select
                  value={col.align || 'left'}
                  onChange={(e) => onChange(`body.columns[${idx}].align`, e.target.value)}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
                <select
                  value={col.format || 'text'}
                  onChange={(e) => onChange(`body.columns[${idx}].format`, e.target.value)}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="currency">Currency</option>
                  <option value="percentage">Percent</option>
                  <option value="date">Date</option>
                </select>
                <button className="table-editor-delete" onClick={() => deleteBodyColumn(idx)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4 className="form-section-title">Borders</h4>
        <div className="form-row">
          <div className="form-group">
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={element.borders?.outer ?? true}
                onChange={(e) => onChange('borders.outer', e.target.checked)}
              />
              <span className="form-checkbox-label">Outer Border</span>
            </label>
          </div>
          <div className="form-group">
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={element.borders?.inner ?? true}
                onChange={(e) => onChange('borders.inner', e.target.checked)}
              />
              <span className="form-checkbox-label">Inner Borders</span>
            </label>
          </div>
        </div>
      </div>
    </>
  )
}

function PageSettings() {
  const { layout, updatePageSettings } = useLayoutStore()

  return (
    <div>
      <div className="form-section">
        <h4 className="form-section-title">Document Meta</h4>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            type="text"
            className="form-input"
            value={layout.meta.title || ''}
            onChange={(e) => updatePageSettings('meta.title', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-input form-textarea"
            value={layout.meta.description || ''}
            rows={2}
            onChange={(e) => updatePageSettings('meta.description', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Author</label>
          <input
            type="text"
            className="form-input"
            value={layout.meta.author || ''}
            onChange={(e) => updatePageSettings('meta.author', e.target.value)}
          />
        </div>
      </div>

      <div className="form-section">
        <h4 className="form-section-title">Page Settings</h4>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Size</label>
            <select
              className="form-input form-select"
              value={layout.page.size || 'A4'}
              onChange={(e) => updatePageSettings('page.size', e.target.value)}
            >
              <option value="A4">A4</option>
              <option value="Letter">Letter</option>
              <option value="Legal">Legal</option>
              <option value="A3">A3</option>
              <option value="A5">A5</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Orientation</label>
            <select
              className="form-input form-select"
              value={layout.page.orientation || 'P'}
              onChange={(e) => updatePageSettings('page.orientation', e.target.value)}
            >
              <option value="P">Portrait</option>
              <option value="L">Landscape</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4 className="form-section-title">Margins (mm)</h4>
        <div className="form-row form-row-4">
          <div className="form-group">
            <label className="form-label">Top</label>
            <input
              type="number"
              className="form-input"
              value={layout.page.margins.top || 0}
              onChange={(e) => updatePageSettings('page.margins.top', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Right</label>
            <input
              type="number"
              className="form-input"
              value={layout.page.margins.right || 0}
              onChange={(e) => updatePageSettings('page.margins.right', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Bottom</label>
            <input
              type="number"
              className="form-input"
              value={layout.page.margins.bottom || 0}
              onChange={(e) => updatePageSettings('page.margins.bottom', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Left</label>
            <input
              type="number"
              className="form-input"
              value={layout.page.margins.left || 0}
              onChange={(e) => updatePageSettings('page.margins.left', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4 className="form-section-title">Auto Page Break</h4>
        <div className="form-group">
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={layout.page.autoPageBreak ?? true}
              onChange={(e) => updatePageSettings('page.autoPageBreak', e.target.checked)}
            />
            <span className="form-checkbox-label">Enable Auto Page Break</span>
          </label>
        </div>
        <div className="form-group">
          <label className="form-label">Break Margin (mm)</label>
          <input
            type="number"
            className="form-input"
            value={layout.page.autoPageBreakMargin || 15}
            onChange={(e) => updatePageSettings('page.autoPageBreakMargin', parseFloat(e.target.value) || 15)}
          />
        </div>
      </div>

      <div className="form-section">
        <h4 className="form-section-title">Header</h4>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Repeat</label>
            <select
              className="form-input form-select"
              value={layout.header.repeatOnPages || 'all'}
              onChange={(e) => updatePageSettings('header.repeatOnPages', e.target.value)}
            >
              <option value="all">All Pages</option>
              <option value="first-only">First Only</option>
              <option value="except-first">Except First</option>
              <option value="none">None</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Height (mm)</label>
            <input
              type="number"
              className="form-input"
              value={layout.header.height || 25}
              onChange={(e) => updatePageSettings('header.height', parseFloat(e.target.value) || 25)}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4 className="form-section-title">Footer</h4>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Repeat</label>
            <select
              className="form-input form-select"
              value={layout.footer.repeatOnPages || 'all'}
              onChange={(e) => updatePageSettings('footer.repeatOnPages', e.target.value)}
            >
              <option value="all">All Pages</option>
              <option value="first-only">First Only</option>
              <option value="except-first">Except First</option>
              <option value="none">None</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Height (mm)</label>
            <input
              type="number"
              className="form-input"
              value={layout.footer.height || 20}
              onChange={(e) => updatePageSettings('footer.height', parseFloat(e.target.value) || 20)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StylesManager() {
  const { layout, addStyle, updateStyle, deleteStyle, renameStyle } = useLayoutStore()
  const [editingStyle, setEditingStyle] = useState(null)

  const handleAddStyle = () => {
    const name = `style${Object.keys(layout.styles).length + 1}`
    addStyle(name, {
      fontFamily: 'helvetica',
      fontSize: 10,
      fontStyle: '',
      textColor: '#333333',
      fillColor: null,
      borderColor: null,
      lineHeight: 1.4
    })
    setEditingStyle(name)
  }

  const handleSaveStyle = (oldName, newName, style) => {
    if (oldName !== newName) {
      renameStyle(oldName, newName)
    }
    updateStyle(newName, style)
    setEditingStyle(null)
  }

  const handleDeleteStyle = (name) => {
    if (confirm(`Delete style "${name}"?`)) {
      deleteStyle(name)
      setEditingStyle(null)
    }
  }

  return (
    <div>
      <div className="form-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h4 className="form-section-title" style={{ margin: 0, border: 'none', padding: 0 }}>Named Styles</h4>
          <button className="btn btn-sm" onClick={handleAddStyle}>
            <Plus size={14} /> Add Style
          </button>
        </div>

        <div className="styles-list">
          {Object.entries(layout.styles).map(([name, style]) => (
            <div
              key={name}
              className="style-item"
              onClick={() => setEditingStyle(name)}
            >
              <div className="style-item-info">
                <span className="style-item-name">{name}</span>
                <span className="style-item-preview">
                  {style.fontFamily} {style.fontSize}pt {style.fontStyle || 'Regular'}
                </span>
              </div>
              <Edit3 size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
          ))}
        </div>
      </div>

      {editingStyle && (
        <StyleEditorModal
          styleName={editingStyle}
          style={layout.styles[editingStyle]}
          onSave={handleSaveStyle}
          onDelete={handleDeleteStyle}
          onClose={() => setEditingStyle(null)}
        />
      )}
    </div>
  )
}

export default PropertiesPanel
