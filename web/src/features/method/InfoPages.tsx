import { useTranslation } from 'react-i18next'
import { AppBar } from '../../shared/AppBar'

export function MethodPage() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen">
      <AppBar back />
      <main id="main" className="mx-auto max-w-[720px] px-4 py-10">
        <h1 className="font-display text-3xl font-semibold">{t('method.title')}</h1>
        <p className="mt-3 text-ink-muted">{t('method.intro')}</p>
        {([1, 2, 3, 4, 5, 6] as const).map((n) => (
          <section key={n} className="mt-8">
            <h2 className="font-display text-xl font-semibold">{t(`method.s${n}t`)}</h2>
            <p className="mt-2">{t(`method.s${n}`)}</p>
          </section>
        ))}
        <section className="mt-8"><h2 className="font-display text-xl font-semibold">{t('method.valT')}</h2><p className="mt-2">{t('method.val')}</p></section>
        <section className="mt-8"><h2 className="font-display text-xl font-semibold">{t('method.srcT')}</h2><p className="mt-2">{t('method.src')}</p></section>
      </main>
    </div>
  )
}

export function AboutPage() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen">
      <AppBar back />
      <main id="main" className="mx-auto max-w-[720px] px-4 py-10">
        <h1 className="font-display text-3xl font-semibold">{t('about.title')}</h1>
        <p className="mt-4">{t('about.challenge')}</p>
        <p className="mt-3 text-ink-muted">{t('about.team')}</p>
        <a className="mt-3 inline-block underline underline-offset-4" href="https://github.com/edgarale2309-wq/earth-trend-detective" target="_blank" rel="noreferrer">{t('about.repo')}</a>
        <h2 className="mt-8 font-display text-xl font-semibold">{t('about.aiT')}</h2>
        <p className="mt-2">{t('about.ai')}</p>
      </main>
    </div>
  )
}
