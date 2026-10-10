import { useCallback, useEffect, useRef } from 'react'
import { protectReload } from '../pwa/reloadSafety'

export function useDraftProtection() {
  const token = useRef({})
  const markDraft = useCallback(() => protectReload(token.current, true), [])
  const clearDraft = useCallback(() => protectReload(token.current, false), [])
  useEffect(() => clearDraft, [clearDraft])
  return { markDraft, clearDraft }
}
