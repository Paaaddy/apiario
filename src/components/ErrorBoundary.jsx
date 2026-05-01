import { Component } from 'react'

const MESSAGES = {
  de: {
    heading: 'Etwas ist schiefgelaufen',
    body: 'Der Bienenstock hatte ein unerwartetes Problem. Deine Daten sind sicher.',
    reload: 'App neu laden',
  },
  en: {
    heading: 'Something went wrong',
    body: 'The hive had an unexpected problem. Your data is safe.',
    reload: 'Reload app',
  },
}

function getLocale() {
  try {
    const stored = localStorage.getItem('apiario-locale')
    return stored === 'en' ? 'en' : 'de'
  } catch {
    return 'de'
  }
}

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[Apiario] Uncaught error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      const m = MESSAGES[getLocale()]
      return (
        <div className="min-h-full bg-cream flex flex-col items-center justify-center p-8 text-center">
          <div className="text-5xl mb-4">🐝</div>
          <h1 className="font-serif text-2xl text-brown font-bold mb-2">
            {m.heading}
          </h1>
          <p className="text-brown-mid text-sm mb-6">{m.body}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-honey text-brown font-semibold px-6 py-3 rounded-xl active:bg-honey-dark transition-colors"
          >
            {m.reload}
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-6 text-left text-xs text-red-700 bg-red-50 rounded-xl p-4 w-full max-w-sm overflow-auto">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
