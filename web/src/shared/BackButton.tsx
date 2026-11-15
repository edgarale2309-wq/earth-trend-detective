import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

/** Returns the user to the Home section. */
export function BackButton() {
  const { t } = useTranslation()
  return (
    <Link to="/" className="mb-6 inline-flex h-11 items-center gap-2 rounded-full border border-input-border px-4 text-sm text-ink transition-colors duration-150 hover:bg-deep-purple">
      <ArrowLeft size={16} aria-hidden />{t('nav.back')}
    </Link>
  )
}
