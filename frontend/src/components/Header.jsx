import { useState } from 'react'
import { FileText, Plus, Upload, Download, Eye, FileDown } from 'lucide-react'
import { useLayoutStore } from '../store/layoutStore'

function Header({ onNew, onImport, onExport }) {
  const [generating, setGenerating] = useState(false)
  const layout = useLayoutStore(state => state.layout)

  const generatePDF = async (action = 'preview') => {
    setGenerating(true)
    try {
      const response = await fetch('http://localhost:8000/api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          layout: layout,
          data: {
            // Sample data - you can add a data editor later
            client: { name: 'John Doe' },
            report_title: 'Sample Report',
          },
          action: action
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      if (action === 'download') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'document.pdf'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const result = await response.json()
        if (result.success && result.pdf) {
          const pdfBlob = base64ToBlob(result.pdf, 'application/pdf')
          const url = window.URL.createObjectURL(pdfBlob)
          window.open(url, '_blank')
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Make sure the PHP server is running.')
    } finally {
      setGenerating(false)
    }
  }

  const base64ToBlob = (base64, type) => {
    const binStr = atob(base64)
    const len = binStr.length
    const arr = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      arr[i] = binStr.charCodeAt(i)
    }
    return new Blob([arr], { type: type })
  }

  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-brand-icon">
          <FileText size={18} />
        </div>
        <h1>PDF Layout Editor</h1>
      </div>

      <div className="header-actions">
        <button className="btn btn-ghost" onClick={onNew}>
          <Plus size={16} />
          New
        </button>
        <button className="btn btn-ghost" onClick={onImport}>
          <Upload size={16} />
          Import
        </button>
        <button className="btn btn-ghost" onClick={onExport}>
          <Download size={16} />
          Export JSON
        </button>
        <div style={{ borderLeft: '1px solid #e5e7eb', height: '24px', margin: '0 8px' }}></div>
        <button
          className="btn btn-ghost"
          onClick={() => generatePDF('preview')}
          disabled={generating}
        >
          <Eye size={16} />
          {generating ? 'Generating...' : 'Preview PDF'}
        </button>
        <button
          className="btn btn-primary"
          onClick={() => generatePDF('download')}
          disabled={generating}
        >
          <FileDown size={16} />
          {generating ? 'Generating...' : 'Download PDF'}
        </button>
      </div>
    </header>
  )
}

export default Header
