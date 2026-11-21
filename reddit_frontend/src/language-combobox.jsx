import React, { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Search, X, Check } from 'lucide-react'
import { getLanguageBrandIcon } from './get-language-brand-icon'
import { LANGUAGE_CATEGORIES, getLanguageOption, searchLanguages } from './language-options'

export const LanguageCombobox = React.memo(function LanguageCombobox({
  selectedLang = 'python',
  onSelectLang
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const currentOption = useMemo(() => getLanguageOption(selectedLang), [selectedLang])
  const filteredLanguages = useMemo(() => {
    return searchLanguages(searchQuery, activeCategory)
  }, [searchQuery, activeCategory])

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setSearchQuery('')
      setActiveCategory('all')
    }
  }, [isOpen])

  // Close on click outside or Escape
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleSelect = (opt) => {
    onSelectLang(opt.id, opt.sample)
    setIsOpen(false)
  }

  return (
    <div className="lang-combobox-container" ref={containerRef}>
      <button
        type="button"
        className={`lang-combobox-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        title="Select programming language & format"
      >
        <span className="lang-combobox-icon">{getLanguageBrandIcon(selectedLang, 15)}</span>
        <span className="lang-combobox-label">{currentOption.label}</span>
        <ChevronDown size={12} className={`lang-combobox-arrow ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="lang-combobox-popover" onClick={e => e.stopPropagation()}>
          {/* Search bar */}
          <div className="lang-combobox-search-bar">
            <Search size={13} className="lang-search-icon" />
            <input
              ref={inputRef}
              type="text"
              className="lang-combobox-search-input"
              placeholder="Search 35+ languages (e.g. rust, sql, ts)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="lang-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="lang-combobox-categories">
            {LANGUAGE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`lang-category-pill ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Languages List */}
          <div className="lang-combobox-list">
            {filteredLanguages.length === 0 ? (
              <div className="lang-combobox-empty">
                No language found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredLanguages.map(opt => {
                const isSelected = opt.id === selectedLang
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`lang-combobox-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(opt)}
                  >
                    <span className="lang-item-left">
                      <span className="lang-item-icon">{getLanguageBrandIcon(opt.id, 16)}</span>
                      <span className="lang-item-label">{opt.label}</span>
                      <span className="lang-item-id">```{opt.id}</span>
                    </span>
                    <span className="lang-item-right">
                      <span className="lang-item-category">{opt.category}</span>
                      {isSelected && <Check size={13} className="lang-item-check" />}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
})
