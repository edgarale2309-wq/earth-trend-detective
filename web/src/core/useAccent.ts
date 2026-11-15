import { useEffect } from 'react'

/** Writes data-variable on <html>; CSS redefines only --accent (text and elements, never backgrounds). */
export function useAccent(id: string) {
  useEffect(() => {
    document.documentElement.dataset.variable = id
  }, [id])
}
