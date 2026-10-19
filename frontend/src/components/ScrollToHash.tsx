import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** React Router does not scroll to #anchors by itself. */
export function ScrollToHash() {
  const { hash, pathname } = useLocation()
  useEffect(() => {
    if (!hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView?.()
  }, [hash, pathname])
  return null
}
