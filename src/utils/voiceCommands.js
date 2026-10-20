import { isNavTab } from '../hooks/useNavigationHandoff'

/** Session actions are not destinations; everything else must name a real tab. */
const SESSION_ACTIONS = new Set(['stop'])

export const VOICE_CONFIG = {
  de: {
    lang: 'de-DE',
    greeting:
      'Freisprechmodus aktiv. Sage: Diagnose, Saison, Kontrolle, Lernen, Stock, weiter oder stop.',
    bye: 'Freisprechmodus beendet.',
    commands: {
      stop:     ['stop', 'stopp', 'beenden', 'ende', 'aus'],
      diagnose: ['diagnose', 'diagnostizieren', 'problem'],
      season:   ['saison', 'woche', 'aufgaben'],
      inspect:  ['kontrolle', 'kontrollieren', 'inspektion'],
      learn:    ['lernen', 'wissen', 'bibliothek', 'wissensbibliothek'],
      myhive:   ['mein stock', 'stock', 'profil', 'verlauf'],
      next:     ['weiter', 'nächste', 'nächster'],
      repeat:   ['nochmal', 'wiederholen', 'wiederhole', 'lesen', 'lies'],
    },
    speech: {
      openDiagnose: 'Diagnose wird geöffnet.',
      openSeason:   'Saison wird geöffnet.',
      openInspect:  'Kontrolle wird geöffnet.',
      openLearn:    'Wissensbibliothek wird geöffnet.',
      openMyHive:   'Mein Stock wird geöffnet.',
      next:         'Weiter.',
      repeat:       'Wiederhole.',
      unknown:      'Nicht verstanden. Versuche: Diagnose, Saison, Kontrolle, Lernen oder Stock.',
    },
  },
  en: {
    lang: 'en-GB',
    greeting:
      'Hands-free mode active. Say: diagnose, season, inspect, learn, my hive, next, or stop.',
    bye: 'Hands-free mode ended.',
    commands: {
      stop:     ['stop', 'exit', 'quit', 'end'],
      diagnose: ['diagnose', 'diagnosis', 'problem'],
      season:   ['season', 'tasks', 'week'],
      inspect:  ['inspect', 'inspection', 'control'],
      learn:    ['learn', 'knowledge', 'library', 'guide'],
      myhive:   ['my hive', 'hive', 'profile', 'log', 'history'],
      next:     ['next', 'forward'],
      repeat:   ['read', 'repeat', 'again'],
    },
    speech: {
      openDiagnose: 'Opening diagnose.',
      openSeason:   'Opening season.',
      openInspect:  'Opening inspect.',
      openLearn:    'Opening knowledge library.',
      openMyHive:   'Opening my hive.',
      next:         'Next.',
      repeat:       'Repeating.',
      unknown:      "Didn't catch that. Try diagnose, season, inspect, learn, or my hive.",
    },
  },
}

export function matchCommand(transcript, commandMap) {
  const lower = (transcript ?? '').toLowerCase()
  for (const [action, phrases] of Object.entries(commandMap)) {
    for (const phrase of phrases) {
      if (lower.includes(phrase)) return action
    }
  }
  return null
}

/**
 * Given a raw transcript and the active locale, resolve what should
 * happen: the tab to navigate to (or 'stop', or null for a no-nav
 * command/unrecognised phrase) and the text to speak back. Callers
 * apply the side effects themselves.
 *
 * Which phrases may navigate is the navigation handoff module's
 * vocabulary, not this table's: a phrase that no longer names a real tab
 * degrades to the unknown response instead of reaching the shell.
 */
export function dispatchVoiceCommand(transcript, locale) {
  const config = VOICE_CONFIG[locale] ?? VOICE_CONFIG.en
  const command = matchCommand(transcript, config.commands)
  const resolved = resolveCommand(command, config)
  if (resolved.action && !SESSION_ACTIONS.has(resolved.action) && !isNavTab(resolved.action)) {
    return { action: null, spokenText: config.speech.unknown }
  }
  return resolved
}

function resolveCommand(command, config) {
  switch (command) {
    case 'stop':
      return { action: 'stop', spokenText: config.bye }
    case 'diagnose':
      return { action: 'diagnose', spokenText: config.speech.openDiagnose }
    case 'season':
      return { action: 'season', spokenText: config.speech.openSeason }
    case 'inspect':
      return { action: 'inspect', spokenText: config.speech.openInspect }
    case 'learn':
      return { action: 'learn', spokenText: config.speech.openLearn }
    case 'myhive':
      return { action: 'myhive', spokenText: config.speech.openMyHive }
    case 'next':
      return { action: null, spokenText: config.speech.next }
    case 'repeat':
      return { action: null, spokenText: config.speech.repeat }
    default:
      return { action: null, spokenText: config.speech.unknown }
  }
}
