import { create } from 'zustand'

// Default styles
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
}

// Generate unique ID
let idCounter = 0
const generateId = () => `element-${++idCounter}`

// Create default element based on type
const createDefaultElement = (type) => {
  const baseElement = {
    id: generateId(),
    type,
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
  }

  switch (type) {
    case 'text':
      return {
        ...baseElement,
        content: 'Enter your text here...',
        styleRef: 'bodyText'
      }

    case 'image':
      return {
        ...baseElement,
        source: { type: 'placeholder', value: '{{image_path}}' },
        fit: 'contain',
        layout: { ...baseElement.layout, width: 50, height: 30 }
      }

    case 'line':
      return {
        ...baseElement,
        style: { lineWidth: 0.5, lineColor: '#000000' },
        layout: { ...baseElement.layout, height: 1 }
      }

    case 'spacer':
      return {
        ...baseElement,
        layout: { ...baseElement.layout, height: 10 }
      }

    case 'columns':
      return {
        ...baseElement,
        columns: [
          { width: '50%', elements: [] },
          { width: '50%', elements: [] }
        ],
        columnGap: 4
      }

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
          rowSource: { type: 'placeholder', value: '{{table_rows}}' },
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
        borders: { outer: true, inner: true }
      }

    case 'pageBreak':
      return {
        ...baseElement,
        layout: { ...baseElement.layout, height: 0 }
      }

    default:
      return baseElement
  }
}

// Initial layout state
const createInitialLayout = () => ({
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
    margins: { top: 20, right: 15, bottom: 20, left: 15 },
    autoPageBreak: true,
    autoPageBreakMargin: 15
  },
  styles: { ...DEFAULT_STYLES },
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
})

export const useLayoutStore = create((set, get) => ({
  // Layout data
  layout: createInitialLayout(),

  // UI state
  selectedElementId: null,
  selectedSection: 'body',
  activeTab: 'properties',
  zoom: 75,

  // Actions
  setSelectedElement: (id) => set({ selectedElementId: id }),
  setSelectedSection: (section) => set({ selectedSection: section }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setZoom: (zoom) => set({ zoom: Math.min(150, Math.max(25, zoom)) }),

  // Reset layout
  resetLayout: () => {
    idCounter = 0
    set({
      layout: createInitialLayout(),
      selectedElementId: null
    })
  },

  // Add element to section
  addElement: (type, section = null, columnInfo = null) => {
    const element = createDefaultElement(type)
    const targetSection = section || get().selectedSection

    set((state) => {
      const newLayout = { ...state.layout }

      if (columnInfo) {
        // Adding to a column
        const { parentId, columnIndex } = columnInfo
        const parentElement = findElementById(newLayout, parentId)
        if (parentElement && parentElement.columns) {
          parentElement.columns[columnIndex].elements.push(element)
        }
      } else {
        // Adding to section
        newLayout[targetSection].elements.push(element)
      }

      return {
        layout: newLayout,
        selectedElementId: element.id,
        activeTab: 'properties'
      }
    })

    return element
  },

  // Delete element
  deleteElement: (id) => {
    set((state) => {
      const newLayout = { ...state.layout }
      deleteElementFromLayout(newLayout, id)
      return {
        layout: newLayout,
        selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
      }
    })
  },

  // Move element within section
  moveElement: (id, direction) => {
    set((state) => {
      const newLayout = JSON.parse(JSON.stringify(state.layout))
      const location = findElementLocation(newLayout, id)

      if (!location) return state

      const { array, index } = location
      const newIndex = direction === 'up' ? index - 1 : index + 1

      if (newIndex < 0 || newIndex >= array.length) return state

      const temp = array[index]
      array[index] = array[newIndex]
      array[newIndex] = temp

      return { layout: newLayout }
    })
  },

  // Reorder elements (for drag and drop)
  reorderElements: (section, oldIndex, newIndex) => {
    set((state) => {
      const newLayout = { ...state.layout }
      const elements = [...newLayout[section].elements]
      const [removed] = elements.splice(oldIndex, 1)
      elements.splice(newIndex, 0, removed)
      newLayout[section].elements = elements
      return { layout: newLayout }
    })
  },

  // Move element to different section
  moveElementToSection: (elementId, fromSection, toSection, toIndex = null) => {
    set((state) => {
      const newLayout = JSON.parse(JSON.stringify(state.layout))

      // Find and remove from source
      const fromElements = newLayout[fromSection].elements
      const elementIndex = fromElements.findIndex(e => e.id === elementId)
      if (elementIndex === -1) return state

      const [element] = fromElements.splice(elementIndex, 1)

      // Add to destination
      const toElements = newLayout[toSection].elements
      if (toIndex !== null && toIndex >= 0) {
        toElements.splice(toIndex, 0, element)
      } else {
        toElements.push(element)
      }

      return { layout: newLayout }
    })
  },

  // Update element property
  updateElement: (id, path, value) => {
    set((state) => {
      const newLayout = JSON.parse(JSON.stringify(state.layout))
      const element = findElementById(newLayout, id)

      if (!element) return state

      setNestedValue(element, path, value)
      return { layout: newLayout }
    })
  },

  // Update page settings
  updatePageSettings: (path, value) => {
    set((state) => {
      const newLayout = JSON.parse(JSON.stringify(state.layout))
      setNestedValue(newLayout, path, value)
      return { layout: newLayout }
    })
  },

  // Style management
  addStyle: (name, style) => {
    set((state) => ({
      layout: {
        ...state.layout,
        styles: { ...state.layout.styles, [name]: style }
      }
    }))
  },

  updateStyle: (name, style) => {
    set((state) => ({
      layout: {
        ...state.layout,
        styles: { ...state.layout.styles, [name]: style }
      }
    }))
  },

  deleteStyle: (name) => {
    set((state) => {
      const newStyles = { ...state.layout.styles }
      delete newStyles[name]
      return {
        layout: { ...state.layout, styles: newStyles }
      }
    })
  },

  renameStyle: (oldName, newName) => {
    set((state) => {
      const newStyles = { ...state.layout.styles }
      newStyles[newName] = newStyles[oldName]
      delete newStyles[oldName]
      return {
        layout: { ...state.layout, styles: newStyles }
      }
    })
  },

  // Import/Export
  exportLayout: () => {
    return JSON.stringify(get().layout, null, 2)
  },

  importLayout: (jsonString) => {
    try {
      const data = JSON.parse(jsonString)

      // Validate required keys
      const requiredKeys = ['version', 'meta', 'page', 'styles', 'header', 'footer', 'body']
      const missingKeys = requiredKeys.filter(key => !(key in data))

      if (missingKeys.length > 0) {
        return { success: false, error: `Missing required keys: ${missingKeys.join(', ')}` }
      }

      // Update ID counter
      let maxId = 0
      const findMaxId = (elements) => {
        elements.forEach(el => {
          const match = el.id?.match(/element-(\d+)/)
          if (match) maxId = Math.max(maxId, parseInt(match[1]))
          if (el.columns) {
            el.columns.forEach(col => findMaxId(col.elements || []))
          }
        })
      }

      findMaxId(data.header?.elements || [])
      findMaxId(data.body?.elements || [])
      findMaxId(data.footer?.elements || [])
      idCounter = maxId

      set({ layout: data, selectedElementId: null })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get element by ID
  getElementById: (id) => findElementById(get().layout, id),

  // Get elements for section
  getSectionElements: (section) => get().layout[section]?.elements || []
}))

// Helper functions
function findElementById(layout, id) {
  for (const section of ['header', 'body', 'footer']) {
    const found = findInElements(layout[section]?.elements || [], id)
    if (found) return found
  }
  return null
}

function findInElements(elements, id) {
  for (const element of elements) {
    if (element.id === id) return element
    if (element.columns) {
      for (const col of element.columns) {
        const found = findInElements(col.elements || [], id)
        if (found) return found
      }
    }
  }
  return null
}

function findElementLocation(layout, id) {
  for (const section of ['header', 'body', 'footer']) {
    const elements = layout[section]?.elements || []
    const result = findLocationInElements(elements, id, { section })
    if (result) return result
  }
  return null
}

function findLocationInElements(elements, id, parentInfo) {
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].id === id) {
      return { array: elements, index: i, ...parentInfo }
    }
    if (elements[i].columns) {
      for (let j = 0; j < elements[i].columns.length; j++) {
        const col = elements[i].columns[j]
        const result = findLocationInElements(col.elements || [], id, {
          ...parentInfo,
          parentElement: elements[i],
          columnIndex: j
        })
        if (result) return result
      }
    }
  }
  return null
}

function deleteElementFromLayout(layout, id) {
  for (const section of ['header', 'body', 'footer']) {
    if (deleteFromElements(layout[section].elements, id)) return true
  }
  return false
}

function deleteFromElements(elements, id) {
  const index = elements.findIndex(e => e.id === id)
  if (index !== -1) {
    elements.splice(index, 1)
    return true
  }
  for (const element of elements) {
    if (element.columns) {
      for (const col of element.columns) {
        if (deleteFromElements(col.elements || [], id)) return true
      }
    }
  }
  return false
}

function setNestedValue(obj, path, value) {
  const parts = path.split('.')
  let current = obj

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/)

    if (arrayMatch) {
      const [, prop, idx] = arrayMatch
      if (!current[prop]) current[prop] = []
      if (!current[prop][idx]) current[prop][idx] = {}
      current = current[prop][idx]
    } else {
      if (!current[part]) current[part] = {}
      current = current[part]
    }
  }

  const lastPart = parts[parts.length - 1]
  const lastArrayMatch = lastPart.match(/^(\w+)\[(\d+)\]$/)

  if (lastArrayMatch) {
    const [, prop, idx] = lastArrayMatch
    if (!current[prop]) current[prop] = []
    current[prop][idx] = value
  } else {
    current[lastPart] = value
  }
}

export { createDefaultElement, generateId }
