import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

function StyleEditorModal({ styleName, style, onSave, onDelete, onClose }) {
  const [name, setName] = useState(styleName)
  const [formData, setFormData] = useState({
    fontFamily: style.fontFamily || 'helvetica',
    fontSize: style.fontSize || 10,
    fontStyle: style.fontStyle || '',
    textColor: style.textColor || '#333333',
    fillColor: style.fillColor || '',
    borderColor: style.borderColor || '',
    lineHeight: style.lineHeight || 1.4
  })

  useEffect(() => {
    setName(styleName)
    setFormData({
      fontFamily: style.fontFamily || 'helvetica',
      fontSize: style.fontSize || 10,
      fontStyle: style.fontStyle || '',
      textColor: style.textColor || '#333333',
      fillColor: style.fillColor || '',
      borderColor: style.borderColor || '',
      lineHeight: style.lineHeight || 1.4
    })
  }, [styleName, style])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a style name')
      return
    }

    onSave(styleName, name.trim(), {
      ...formData,
      fillColor: formData.fillColor || null,
      borderColor: formData.borderColor || null
    })
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3 className="modal-title">Edit Style</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Style Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Font Family</label>
              <select
                className="form-input form-select"
                value={formData.fontFamily}
                onChange={(e) => handleChange('fontFamily', e.target.value)}
              >
                <option value="helvetica">Helvetica</option>
                <option value="times">Times</option>
                <option value="courier">Courier</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Font Size</label>
              <input
                type="number"
                className="form-input"
                value={formData.fontSize}
                min="6"
                max="72"
                onChange={(e) => handleChange('fontSize', parseFloat(e.target.value) || 10)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Font Style</label>
              <select
                className="form-input form-select"
                value={formData.fontStyle}
                onChange={(e) => handleChange('fontStyle', e.target.value)}
              >
                <option value="">Regular</option>
                <option value="B">Bold</option>
                <option value="I">Italic</option>
                <option value="BI">Bold Italic</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Line Height</label>
              <input
                type="number"
                className="form-input"
                value={formData.lineHeight}
                min="0.5"
                max="3"
                step="0.1"
                onChange={(e) => handleChange('lineHeight', parseFloat(e.target.value) || 1.4)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Text Color</label>
            <div className="form-color-group">
              <input
                type="color"
                className="form-color-input"
                value={formData.textColor || '#333333'}
                onChange={(e) => handleChange('textColor', e.target.value)}
              />
              <input
                type="text"
                className="form-input"
                value={formData.textColor || ''}
                placeholder="#333333"
                onChange={(e) => handleChange('textColor', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Fill Color (optional)</label>
            <div className="form-color-group">
              <input
                type="color"
                className="form-color-input"
                value={formData.fillColor || '#ffffff'}
                onChange={(e) => handleChange('fillColor', e.target.value)}
              />
              <input
                type="text"
                className="form-input"
                value={formData.fillColor || ''}
                placeholder="none"
                onChange={(e) => handleChange('fillColor', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Border Color (optional)</label>
            <div className="form-color-group">
              <input
                type="color"
                className="form-color-input"
                value={formData.borderColor || '#000000'}
                onChange={(e) => handleChange('borderColor', e.target.value)}
              />
              <input
                type="text"
                className="form-input"
                value={formData.borderColor || ''}
                placeholder="none"
                onChange={(e) => handleChange('borderColor', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-danger" onClick={() => onDelete(styleName)}>
            Delete
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default StyleEditorModal
