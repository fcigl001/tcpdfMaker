import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useLayoutStore } from '../store/layoutStore'
import {
  ZoomIn,
  ZoomOut,
  Type,
  Image,
  Minus,
  MoveVertical,
  Columns,
  Table,
  ScissorsLineDashed,
  Trash2,
  GripVertical,
  Plus
} from 'lucide-react'

const PAGE_SIZES = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
  A3: { width: 297, height: 420 },
  A5: { width: 148, height: 210 }
}

const ELEMENT_ICONS = {
  text: Type,
  image: Image,
  line: Minus,
  spacer: MoveVertical,
  columns: Columns,
  table: Table,
  pageBreak: ScissorsLineDashed
}

function DropZone({ section, isEmpty }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `dropzone-${section}`,
    data: {
      type: 'drop-zone',
      section
    }
  })

  if (!isEmpty) {
    return <div ref={setNodeRef} style={{ minHeight: 20 }} />
  }

  return (
    <div
      ref={setNodeRef}
      className={`drop-zone ${isOver ? 'is-over' : ''}`}
    >
      <div className="drop-zone-empty">
        <Plus className="drop-zone-empty-icon" />
        <span>Drag components here</span>
      </div>
    </div>
  )
}

function SortableElement({ element, section }) {
  const {
    selectedElementId,
    setSelectedElement,
    deleteElement,
    setActiveTab
  } = useLayoutStore()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: element.id,
    data: {
      type: 'element',
      elementType: element.type,
      section
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const Icon = ELEMENT_ICONS[element.type] || Type
  const isSelected = selectedElementId === element.id

  const handleClick = (e) => {
    e.stopPropagation()
    setSelectedElement(element.id)
    setActiveTab('properties')
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    deleteElement(element.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`canvas-element element-${element.type} ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={handleClick}
      {...attributes}
    >
      <div className="canvas-element-header">
        <div className="canvas-element-type" {...listeners}>
          <GripVertical size={14} className="canvas-element-type-icon" style={{ cursor: 'grab' }} />
          <Icon size={14} className="canvas-element-type-icon" />
          <span>{element.type}</span>
        </div>
        <div className="canvas-element-actions">
          <button className="element-action-btn delete" onClick={handleDelete}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <ElementContent element={element} />
    </div>
  )
}

function ElementContent({ element }) {
  switch (element.type) {
    case 'text':
      return (
        <div className="canvas-element-content">
          {element.content || 'Empty text...'}
        </div>
      )

    case 'image':
      return (
        <div className="element-image-placeholder">
          <Image size={24} />
          <span>{element.source?.value || 'Image'}</span>
        </div>
      )

    case 'line':
      return <div className="element-line-preview" />

    case 'spacer':
      return (
        <div className="canvas-element-content" style={{ textAlign: 'center' }}>
          {element.layout?.height || 10}mm
        </div>
      )

    case 'columns':
      return (
        <div className="element-columns-container">
          {element.columns?.map((col, idx) => (
            <div key={idx} className="element-column">
              <div className="element-column-label">
                Col {idx + 1} ({col.width})
              </div>
              {col.elements?.map((el) => (
                <div key={el.id} className="canvas-element-content" style={{ fontSize: 10, padding: '2px 4px' }}>
                  {el.type}
                </div>
              ))}
            </div>
          ))}
        </div>
      )

    case 'table':
      return (
        <div className="element-table-preview">
          {element.header?.visible && (
            <div className="element-table-header">
              {element.header.cells?.map(c => c.text).join(' | ')}
            </div>
          )}
          <div className="element-table-row">
            {element.body?.columns?.map(c => `{${c.key}}`).join(' | ')}
          </div>
          <div className="element-table-row" style={{ background: '#f7f7f7' }}>
            {element.body?.columns?.map(c => `{${c.key}}`).join(' | ')}
          </div>
        </div>
      )

    case 'pageBreak':
      return (
        <div className="element-page-break-line">
          PAGE BREAK
        </div>
      )

    default:
      return null
  }
}

function PageSection({ section, label, height, elements }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `section-${section}`,
    data: {
      type: 'drop-zone',
      section
    }
  })

  const sectionClass = section === 'body' ? 'body-section' : `${section}-section`

  return (
    <div
      ref={setNodeRef}
      className={`page-section ${sectionClass} ${isOver ? 'is-over' : ''}`}
      style={{ minHeight: height || 60 }}
    >
      <span className="section-label">{label}</span>
      <div className="drop-zone" style={{ minHeight: Math.max(40, height - 20) }}>
        {elements.length === 0 ? (
          <DropZone section={section} isEmpty={true} />
        ) : (
          <>
            {elements.map((element) => (
              <SortableElement
                key={element.id}
                element={element}
                section={section}
              />
            ))}
            <DropZone section={section} isEmpty={false} />
          </>
        )}
      </div>
    </div>
  )
}

function Canvas() {
  const {
    layout,
    zoom,
    setZoom,
    selectedSection,
    setSelectedSection,
    setSelectedElement
  } = useLayoutStore()

  const pageSize = PAGE_SIZES[layout.page.size] || PAGE_SIZES.A4
  let width = pageSize.width
  let height = pageSize.height

  if (layout.page.orientation === 'L') {
    [width, height] = [height, width]
  }

  const scale = zoom / 100
  const scaledWidth = width * scale * 2.5
  const scaledHeight = height * scale * 2.5

  const handleCanvasClick = () => {
    setSelectedElement(null)
  }

  return (
    <main className="canvas-area">
      <div className="canvas-toolbar">
        <div className="canvas-toolbar-left">
          <div className="zoom-controls">
            <button
              className="zoom-btn"
              onClick={() => setZoom(zoom - 10)}
              disabled={zoom <= 25}
            >
              <ZoomOut size={16} />
            </button>
            <span className="zoom-value">{zoom}%</span>
            <button
              className="zoom-btn"
              onClick={() => setZoom(zoom + 10)}
              disabled={zoom >= 150}
            >
              <ZoomIn size={16} />
            </button>
          </div>

          <div className="section-tabs">
            {['header', 'body', 'footer'].map((section) => (
              <button
                key={section}
                className={`section-tab ${selectedSection === section ? 'active' : ''}`}
                onClick={() => setSelectedSection(section)}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="canvas-container" onClick={handleCanvasClick}>
        <div
          className="page-canvas"
          style={{
            width: scaledWidth,
            minHeight: scaledHeight,
            padding: `${layout.page.margins.top * scale * 2.5}px ${layout.page.margins.right * scale * 2.5}px ${layout.page.margins.bottom * scale * 2.5}px ${layout.page.margins.left * scale * 2.5}px`
          }}
        >
          <PageSection
            section="header"
            label="Header"
            height={layout.header.height * scale * 2.5}
            elements={layout.header.elements}
          />

          <PageSection
            section="body"
            label="Body"
            height={(height - layout.header.height - layout.footer.height - layout.page.margins.top - layout.page.margins.bottom) * scale * 2.5}
            elements={layout.body.elements}
          />

          <PageSection
            section="footer"
            label="Footer"
            height={layout.footer.height * scale * 2.5}
            elements={layout.footer.elements}
          />
        </div>
      </div>
    </main>
  )
}

export default Canvas
