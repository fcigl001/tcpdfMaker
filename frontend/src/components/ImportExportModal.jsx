import React, { useState, useEffect } from 'react'
import { X, Download, Upload } from 'lucide-react'
import { useLayoutStore } from '../store/layoutStore'

function ImportExportModal({ mode, onClose }) {
  const { exportLayout, importLayout } = useLayoutStore()
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (mode === 'export') {
      setContent(exportLayout())
    } else {
      setContent('')
    }
    setError('')
  }, [mode, exportLayout])

  const handleImport = () => {
    const result = importLayout(content)
    if (result.success) {
      onClose()
    } else {
      setError(result.error)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'layout.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    onClose()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      alert('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const isExport = mode === 'export'

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">
            {isExport ? 'Export Layout JSON' : 'Import Layout JSON'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <textarea
            className="modal-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            readOnly={isExport}
            placeholder={isExport ? '' : 'Paste your JSON here...'}
            spellCheck={false}
          />

          {error && (
            <div className="modal-error">
              Import failed: {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>

          {isExport ? (
            <>
              <button className="btn btn-secondary" onClick={handleCopy}>
                Copy to Clipboard
              </button>
              <button className="btn btn-primary" onClick={handleDownload}>
                <Download size={16} />
                Download
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={handleImport}>
              <Upload size={16} />
              Import
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImportExportModal
