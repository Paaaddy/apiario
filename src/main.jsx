import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './fonts/inter.css'
import './fonts/playfair-display.css'
import './fonts/fraunces.css'
import './fonts/jetbrains-mono.css'
import './index.css'
import { registerPwaAutoUpdate } from './pwa/registerAutoUpdate'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)


registerPwaAutoUpdate()
