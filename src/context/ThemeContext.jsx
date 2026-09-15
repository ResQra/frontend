import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const ACCENT_PRESETS = [
  { id: 'blue', name: 'Maritime Blue', color: '#0284c7', bg: 'bg-sky-600' },
  { id: 'crimson', name: 'Emergency Crimson', color: '#dc2626', bg: 'bg-red-600' },
  { id: 'teal', name: 'Tactical Teal', color: '#0d9488', bg: 'bg-teal-600' },
  { id: 'amber', name: 'Alert Amber', color: '#d97706', bg: 'bg-amber-600' },
  { id: 'slate', name: 'Command Slate', color: '#1e293b', bg: 'bg-slate-800' },
]

export function ThemeProvider({ children }) {
  const [accent, setAccent] = useState('blue')

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent)
  }, [accent])

  return (
    <ThemeContext.Provider value={{ accent, setAccent, presets: ACCENT_PRESETS }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
