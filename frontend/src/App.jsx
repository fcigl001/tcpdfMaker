import React, { useState } from 'react'
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import { useLayoutStore, createDefaultElement } from './store/layoutStore'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import PropertiesPanel from './components/PropertiesPanel'
import ImportExportModal from './components/ImportExportModal'
import { Type, Image, Minus, MoveVertical, Columns, Table, ScissorsLineDashed } from 'lucide-react'

const ELEMENT_ICONS = {
  text: Type,
  image: Image,
  line: Minus,
  spacer: MoveVertical,
  columns: Columns,
  table: Table,
  pageBreak: ScissorsLineDashed
}

function App() {
  const [modalState, setModalState] = useState({ open: false, mode: null })
  const [activeId, setActiveId] = useState(null)
  const [activeType, setActiveType] = useState(null)

  const {
    layout,
    selectedSection,
    addElement,
    reorderElements,
    moveElementToSection,
    getElementById
  } = useLayoutStore()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  )

  const handleDragStart = (event) => {
    const { active } = event

    if (active.data.current?.type === 'component') {
      // Dragging from palette
      setActiveType(active.data.current.componentType)
      setActiveId(null)
    } else if (active.data.current?.type === 'element') {
      // Dragging existing element
      setActiveId(active.id)
      setActiveType(active.data.current.elementType)
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event

    setActiveId(null)
    setActiveType(null)

    if (!over) return

    // Dropping from component palette
    if (active.data.current?.type === 'component') {
      const componentType = active.data.current.componentType
      const targetSection = over.data.current?.section || selectedSection

      if (over.data.current?.type === 'drop-zone') {
        addElement(componentType, targetSection)
      } else if (over.data.current?.type === 'element') {
        // Insert before the target element
        const element = addElement(componentType, targetSection)
        // Reorder to correct position
        const elements = layout[targetSection].elements
        const newIndex = elements.findIndex(e => e.id === over.id)
        const currentIndex = elements.length - 1
        if (newIndex !== -1 && newIndex !== currentIndex) {
          reorderElements(targetSection, currentIndex, newIndex)
        }
      }
      return
    }

    // Reordering existing elements
    if (active.data.current?.type === 'element') {
      const fromSection = active.data.current.section
      const toSection = over.data.current?.section

      if (over.data.current?.type === 'drop-zone' && fromSection !== toSection) {
        // Moving to different section
        moveElementToSection(active.id, fromSection, toSection)
      } else if (over.data.current?.type === 'element' && over.id !== active.id) {
        // Reordering within same section or moving between sections
        if (fromSection === over.data.current?.section) {
          // Same section - reorder
          const elements = layout[fromSection].elements
          const oldIndex = elements.findIndex(e => e.id === active.id)
          const newIndex = elements.findIndex(e => e.id === over.id)
          if (oldIndex !== -1 && newIndex !== -1) {
            reorderElements(fromSection, oldIndex, newIndex)
          }
        } else {
          // Different section - move then reorder
          const targetSection = over.data.current?.section
          const targetElements = layout[targetSection].elements
          const targetIndex = targetElements.findIndex(e => e.id === over.id)
          moveElementToSection(active.id, fromSection, targetSection, targetIndex)
        }
      }
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setActiveType(null)
  }

  const openModal = (mode) => setModalState({ open: true, mode })
  const closeModal = () => setModalState({ open: false, mode: null })

  // Render drag overlay content
  const renderDragOverlay = () => {
    if (!activeType) return null

    const Icon = ELEMENT_ICONS[activeType] || Type
    const element = activeId ? getElementById(activeId) : null
    const label = element
      ? getElementLabel(element)
      : activeType.charAt(0).toUpperCase() + activeType.slice(1)

    return (
      <div className="drag-overlay">
        <div className="drag-overlay-content">
          <Icon size={16} />
          <span>{label}</span>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="app">
        <Header
          onNew={() => useLayoutStore.getState().resetLayout()}
          onImport={() => openModal('import')}
          onExport={() => openModal('export')}
        />

        <div className="main-content">
          <Sidebar />
          <Canvas />
          <PropertiesPanel />
        </div>
      </div>

      <DragOverlay>
        {(activeId || activeType) && renderDragOverlay()}
      </DragOverlay>

      {modalState.open && (
        <ImportExportModal
          mode={modalState.mode}
          onClose={closeModal}
        />
      )}
    </DndContext>
  )
}

function getElementLabel(element) {
  switch (element.type) {
    case 'text':
      return element.content?.substring(0, 25) || 'Text'
    case 'image':
      return element.source?.value || 'Image'
    case 'spacer':
      return `Spacer ${element.layout?.height || 10}mm`
    case 'columns':
      return `${element.columns?.length || 2} Columns`
    case 'table':
      return `Table (${element.header?.cells?.length || 0} cols)`
    case 'line':
      return 'Line'
    case 'pageBreak':
      return 'Page Break'
    default:
      return element.type
  }
}

export default App
