import { createElement, useCallback, useRef, useState } from 'react'
import { strings as s } from '../i18n/strings'
import NextActionNotice from '../components/NextActionNotice'
import { haptics } from '../utils/haptics'
import { runWithViewTransition } from '../utils/viewTransitions'

/**
 * Every destination the shell can show, in the order BottomNav renders
 * them. This is the single source of the tab vocabulary: BottomNav builds
 * its buttons from it, voice commands resolve against it, and a handoff
 * target naming anything else is refused.
 */
export const NAV_TABS = [
  { key: 'season',   label: s.nav_season,   emoji: '📅' },
  { key: 'diagnose', label: s.nav_diagnose, emoji: '🔎' },
  { key: 'inspect',  label: s.nav_inspect,  emoji: '📋' },
  { key: 'learn',    label: s.nav_learn,    emoji: '📚' },
  { key: 'myhive',   label: s.nav_myhive,   emoji: '🐝' },
]

/** Shown when a deep link does not name a real tab. */
export const DEFAULT_TAB = 'season'

export function isNavTab(tab) {
  return NAV_TABS.some((entry) => entry.key === tab)
}

/** The `?tab=` deep link, restricted to tabs the app actually has. */
export function initialTabFromLocation(search = window.location.search) {
  const requested = new URLSearchParams(search).get('tab')
  return isNavTab(requested) ? requested : DEFAULT_TAB
}

/**
 * The colony half of the target: judged against live records, because a
 * colony can be removed at any moment, including after the handoff landed.
 */
export function isColonyTargetMissing(target, colonies = []) {
  return Boolean(target?.colonyId) && !colonies.some((colony) => colony.id === target.colonyId)
}

/**
 * The task half of the target: judged against the scope the screen
 * reported when it consumed the handoff. A seasonal task only exists in
 * the week the beekeeper is looking at, so the verdict belongs to the
 * selection, not to whatever week is on screen later.
 */
export function isTaskTargetMissing(target, taskIds = null) {
  return Boolean(target?.taskId) && taskIds !== null && !taskIds.includes(target.taskId)
}

/**
 * The one decision: is the record this handoff points at still there?
 * Either half can fail on its own; a handoff nobody judged yet is never
 * "unavailable" for want of data.
 */
export function isTargetUnavailable(target, { colonies = [], taskIds = null } = {}) {
  if (!target) return false
  return isColonyTargetMissing(target, colonies) || isTaskTargetMissing(target, taskIds)
}

/**
 * A next action carries a tab and, optionally, the record it is about. The
 * seam keeps that shape explicit so a screen cannot smuggle anything else
 * into the handoff, and stamps the monotonic selection id that lets every
 * consumer tell a new selection from a re-render.
 */
function createHandoff(target, selectionId) {
  const handoff = { tab: target.tab, selectionId }
  if (target.colonyId) handoff.colonyId = target.colonyId
  if (target.taskId) handoff.taskId = target.taskId
  if (target.warning) handoff.warning = target.warning
  return handoff
}

/**
 * Owns the navigation handoff end to end: which tab is showing, what the
 * current handoff is, whether its target still exists, and the one notice
 * that says so. The shell composes the result; it keeps no handoff state
 * of its own.
 *
 * ## Lifetime
 *
 * A handoff is dispatched once, with a selection id that only ever grows,
 * and consumed once: navigating anywhere else clears it, and the scope a
 * screen reports for a selection is kept for that selection alone — a
 * later week change cannot rewrite a handoff the beekeeper already acted
 * on. The colony half is judged against live records; the task half
 * against the scope reported at consumption.
 */
export function useNavigationHandoff({ colonies = [], inspections = [] }) {
  const [activeTab, setActiveTab] = useState(() => initialTabFromLocation())
  const [handoff, setHandoff] = useState(null)
  const [taskScope, setTaskScope] = useState(null)
  const handoffRef = useRef(null)
  const sequence = useRef(0)

  // Every tab change — from the nav bar, from voice, or from a next action
  // — gets the same haptic tap and the same native-feeling cross-fade.
  const changeTab = useCallback((tab, target = null) => {
    if (!isNavTab(tab)) return
    haptics.tap()
    runWithViewTransition(() => {
      handoffRef.current = target
      setHandoff(target)
      setActiveTab(tab)
    })
  }, [])

  /** Plain navigation: the nav bar and hands-free commands. */
  const navigate = useCallback((tab) => changeTab(tab), [changeTab])

  /** Hand a next action's target to the screen that can act on it. */
  const dispatch = useCallback((target) => {
    if (!isNavTab(target?.tab)) return
    sequence.current += 1
    const selection = createHandoff(target, sequence.current)
    changeTab(selection.tab, selection)
  }, [changeTab])

  /**
   * Called by the screen that owns the target, once per selection, with
   * the ids its target could resolve against right now. Later reports for
   * the same selection are ignored: the verdict was already made.
   */
  const reportTargetScope = useCallback((taskIds) => {
    const selectionId = handoffRef.current?.selectionId ?? null
    setTaskScope((previous) => (previous?.selectionId === selectionId ? previous : { selectionId, taskIds }))
  }, [])

  const scopedTaskIds = handoff && taskScope?.selectionId === handoff.selectionId ? taskScope.taskIds : null
  const colonyMissing = isColonyTargetMissing(handoff, colonies)
  const targetUnavailable = isTargetUnavailable(handoff, { colonies, taskIds: scopedTaskIds })

  return {
    activeTab,
    navigate,
    dispatch,
    handoff,
    notice: targetUnavailable ? createElement(NextActionNotice, { key: handoff.selectionId }) : null,
    reportTargetScope,
    // What the handoff target is allowed to see: a colony that no longer
    // exists must not be pre-selected, and its records must not be offered
    // as a starting point for diagnosis.
    handoffInspections: colonyMissing ? [] : inspections,
    handoffColonyId: colonyMissing ? undefined : handoff?.colonyId,
  }
}
