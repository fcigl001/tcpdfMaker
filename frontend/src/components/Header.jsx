import React from 'react'
import { FileText, Plus, Upload, Download } from 'lucide-react'

function Header({ onNew, onImport, onExport }) {
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
        <button className="btn btn-primary" onClick={onExport}>
          <Download size={16} />
          Export JSON
        </button>
      </div>
    </header>
  )
}

export default Header
