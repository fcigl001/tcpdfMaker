import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { useLayoutStore } from '../store/layoutStore'
import {
  Type,
  Image,
  Minus,
  MoveVertical,
  Columns,
  Table,
  ScissorsLineDashed,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2
} from 'lucide-react'

const COMPONENTS = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'image', label: 'Image', icon: Image },
  { type: 'line', label: 'Line', icon: Minus },
  { type: 'spacer', label: 'Spacer', icon: MoveVertical },
  { type: 'columns', label: 'Columns', icon: Columns },
  { type: 'table', label: 'Table', icon: Table },
  { type: 'pageBreak', label: 'Page Break', icon: ScissorsLineDashed }
]

function DraggableComponent({ type, label, icon: Icon }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: {
      type: 'component',
      componentType: type
    }
  })

  return (
    <div
      ref={setNodeRef}
      className={`component-item ${isDragging ? 'dragging' : ''}`}
      {...listeners}
      {...attributes}
    >
      <div className="component-icon">
        <Icon size={18} />
      </div>
      <span className="component-label">{label}</span>
    </div>
  )
}

function LayoutTree() {
  const {
    layout,
    selectedElementId,
    setSelectedElement,
    moveElement,
    deleteElement,
    setActiveTab
  } = useLayoutStore()

  const sections = [
    { key: 'header', label: 'Header' },
    { key: 'body', label: 'Body' },
    { key: 'footer', label: 'Footer' }
  ]

  const handleElementClick = (id) => {
    setSelectedElement(id)
    setActiveTab('properties')
  }

  const getElementLabel = (element) => {
    switch (element.type) {
      case 'text':
        return element.content?.substring(0, 20) || ''
      case 'image':
        return element.source?.value || 'Image'
      case 'spacer':
        return `${element.layout?.height || 10}mm`
      case 'columns':
        return `${element.columns?.length || 2} cols`
      case 'table':
        return `${element.header?.cells?.length || 0} cols`
      default:
        return ''
    }
  }

  return (
    <div className="layout-tree">
      {sections.map(({ key, label }) => (
        <div key={key} className="tree-section">
          <div className="tree-section-header">
            <span>{label}</span>
            <span className="tree-section-count">
              {layout[key].elements.length}
            </span>
          </div>
          {layout[key].elements.length > 0 && (
            <div className="tree-elements">
              {layout[key].elements.map((element, index) => (
                <div
                  key={element.id}
                  className={`tree-element ${selectedElementId === element.id ? 'selected' : ''}`}
                  onClick={() => handleElementClick(element.id)}
                >
                  <div className="tree-element-info">
                    <span className="tree-element-type">{element.type}</span>
                    <span className="tree-element-label">
                      {getElementLabel(element)}
                    </span>
                  </div>
                  <div className="canvas-element-actions">
                    <button
                      className="element-action-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        moveElement(element.id, 'up')
                      }}
                      disabled={index === 0}
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      className="element-action-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        moveElement(element.id, 'down')
                      }}
                      disabled={index === layout[key].elements.length - 1}
                    >
                      <ChevronDown size={12} />
                    </button>
                    <button
                      className="element-action-btn delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteElement(element.id)
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">Components</h3>
        <div className="component-grid">
          {COMPONENTS.map((component) => (
            <DraggableComponent key={component.type} {...component} />
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">Layout Tree</h3>
        <LayoutTree />
      </div>
    </aside>
  )
}

export default Sidebar
