import { describe, it, expect } from 'vitest'
import { matchCommand, dispatchVoiceCommand, VOICE_CONFIG } from './voiceCommands'

describe('matchCommand', () => {
  it('matches a phrase to its action', () => {
    expect(matchCommand('please diagnose this', VOICE_CONFIG.en.commands)).toBe('diagnose')
  })

  it('returns null when no phrase matches', () => {
    expect(matchCommand('gibberish', VOICE_CONFIG.en.commands)).toBeNull()
  })

  it('is case-insensitive', () => {
    expect(matchCommand('STOP', VOICE_CONFIG.en.commands)).toBe('stop')
  })
})

describe('dispatchVoiceCommand', () => {
  it('resolves a navigation command to its tab and spoken text (en)', () => {
    expect(dispatchVoiceCommand('open season', 'en')).toEqual({
      action: 'season',
      spokenText: VOICE_CONFIG.en.speech.openSeason,
    })
  })

  it('resolves a navigation command in German', () => {
    expect(dispatchVoiceCommand('saison', 'de')).toEqual({
      action: 'season',
      spokenText: VOICE_CONFIG.de.speech.openSeason,
    })
  })

  it('resolves stop to the stop action and bye text', () => {
    expect(dispatchVoiceCommand('stop', 'en')).toEqual({
      action: 'stop',
      spokenText: VOICE_CONFIG.en.bye,
    })
  })

  it('resolves the removed next/repeat phrases to the unknown response', () => {
    const phrases = {
      en: ['next', 'forward', 'read', 'repeat', 'again', 'read again'],
      de: ['weiter', 'nächste', 'nächster', 'nochmal', 'wiederholen', 'wiederhole', 'lesen', 'lies'],
    }
    for (const [locale, list] of Object.entries(phrases)) {
      for (const phrase of list) {
        expect(dispatchVoiceCommand(phrase, locale)).toEqual({
          action: null,
          spokenText: VOICE_CONFIG[locale].speech.unknown,
        })
      }
    }
  })

  it('no longer lists next/repeat in any locale config', () => {
    for (const config of Object.values(VOICE_CONFIG)) {
      expect(config.commands).not.toHaveProperty('next')
      expect(config.commands).not.toHaveProperty('repeat')
      expect(config.speech).not.toHaveProperty('next')
      expect(config.speech).not.toHaveProperty('repeat')
    }
  })

  it('falls back to the unknown response for unmatched transcripts', () => {
    expect(dispatchVoiceCommand('banana', 'en')).toEqual({
      action: null,
      spokenText: VOICE_CONFIG.en.speech.unknown,
    })
  })

  it('falls back to English config for an unsupported locale', () => {
    expect(dispatchVoiceCommand('stop', 'fr')).toEqual({
      action: 'stop',
      spokenText: VOICE_CONFIG.en.bye,
    })
  })
})
