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

  it('resolves next/repeat to a null action with their own spoken text', () => {
    expect(dispatchVoiceCommand('next', 'en')).toEqual({ action: null, spokenText: VOICE_CONFIG.en.speech.next })
    expect(dispatchVoiceCommand('repeat', 'en')).toEqual({ action: null, spokenText: VOICE_CONFIG.en.speech.repeat })
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
