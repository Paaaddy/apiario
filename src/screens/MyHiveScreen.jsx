import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'
import LanguageToggle from '../components/LanguageToggle'
import LogSection from './LogSection'
import ProfileSection from './ProfileSection'
import PwaInstallHint from '../components/PwaInstallHint'

export default function MyHiveScreen({ profile, onUpdate, log = [], onAddEntry, onDeleteEntry, pwaInstall = { isInstalled: true, installSupported: false, promptInstall: () => {} } }) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-honey px-6 pt-10 pb-6 sticky top-0 z-20 border-b border-honey-dark/20">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-2xl font-bold text-brown">🐝 {t(s.myhive_title)}</h1>
            <p className="text-brown-light text-sm mt-1">{t(s.myhive_subtitle)}</p>
          </div>
          <LanguageToggle />
        </div>
      </div>

      <div className="px-4 pt-6">
        <div className="mb-4">
          <PwaInstallHint
            isInstalled={pwaInstall.isInstalled}
            installSupported={pwaInstall.installSupported}
            onInstall={pwaInstall.promptInstall}
            compact
            dismissible
          />
        </div>
        <LogSection log={log} onAddEntry={onAddEntry} onDeleteEntry={onDeleteEntry} />
        <ProfileSection profile={profile} onUpdate={onUpdate} />
      </div>
    </div>
  )
}
