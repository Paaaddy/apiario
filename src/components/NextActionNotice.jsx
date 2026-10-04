import { useEffect, useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'

export default function NextActionNotice() {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const timeout = setTimeout(() => setVisible(false), 5000)
    return () => clearTimeout(timeout)
  }, [])
  return visible ? <p role="status" className="p-4 text-brown-mid">{t(s.next_action_unavailable)}</p> : null
}
