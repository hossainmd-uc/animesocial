'use client'

import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Initial dark mode check
    const checkDarkMode = () => {
      const darkModeActive = document.documentElement.classList.contains('dark')
      setIsDarkMode(darkModeActive)
    }
    
    checkDarkMode()
    
    // Watch for changes to the HTML class
    const observer = new MutationObserver(() => {
      checkDarkMode()
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  return { isDarkMode, mounted }
} 