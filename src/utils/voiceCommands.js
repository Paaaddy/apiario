export const VOICE_CONFIG = {
  de: {
    lang: 'de-DE',
    greeting:
      'Freisprechmodus aktiv. Sage: Diagnose, Saison, Stock, weiter oder stop.',
    bye: 'Freisprechmodus beendet.',
    commands: {
      stop:     ['stop', 'stopp', 'beenden', 'ende', 'aus'],
      diagnose: ['diagnose', 'diagnostizieren', 'problem'],
      season:   ['saison', 'woche', 'aufgaben'],
      myhive:   ['mein stock', 'stock', 'profil', 'verlauf'],
      next:     ['weiter', 'nächste', 'nächster'],
      repeat:   ['nochmal', 'wiederholen', 'wiederhole', 'lesen', 'lies'],
    },
    speech: {
      openDiagnose: 'Diagnose wird geöffnet.',
      openSeason:   'Saison wird geöffnet.',
      openMyHive:   'Mein Stock wird geöffnet.',
      next:         'Weiter.',
      repeat:       'Wiederhole.',
      unknown:      'Nicht verstanden. Versuche: Diagnose, Saison oder Stock.',
    },
  },
  en: {
    lang: 'en-GB',
    greeting:
      'Hands-free mode active. Say: diagnose, season, my hive, next, or stop.',
    bye: 'Hands-free mode ended.',
    commands: {
      stop:     ['stop', 'exit', 'quit', 'end'],
      diagnose: ['diagnose', 'diagnosis', 'problem'],
      season:   ['season', 'tasks', 'week'],
      myhive:   ['my hive', 'hive', 'profile', 'log', 'history'],
      next:     ['next', 'forward'],
      repeat:   ['read', 'repeat', 'again'],
    },
    speech: {
      openDiagnose: 'Opening diagnose.',
      openSeason:   'Opening season.',
      openMyHive:   'Opening my hive.',
      next:         'Next.',
      repeat:       'Repeating.',
      unknown:      "Didn't catch that. Try diagnose, season, or my hive.",
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
 */
export function dispatchVoiceCommand(transcript, locale) {
  const config = VOICE_CONFIG[locale] ?? VOICE_CONFIG.en
  const command = matchCommand(transcript, config.commands)
  switch (command) {
    case 'stop':
      return { action: 'stop', spokenText: config.bye }
    case 'diagnose':
      return { action: 'diagnose', spokenText: config.speech.openDiagnose }
    case 'season':
      return { action: 'season', spokenText: config.speech.openSeason }
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
