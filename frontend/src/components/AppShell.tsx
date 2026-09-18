import type { ReactNode } from 'react'
import { getNavigationLabel } from '../utils'
import type { Language } from '../i18n'

type AppShellTranslations = {
  appName: string
  systemName: string
  navigation: Record<string, string>
  languageLabel: string
  languageEnglish: string
  languageUrdu: string
  roles: {
    superAdmin: string
    committeeAdmin: string
    member: string
  }
  signOut: string
  ui: {
    accessRestricted: string
    onlySuperAdminManageUsers: string
  }
}

type AppShellProps = {
  activePage: string
  setActivePage: (page: string) => void
  isSuperAdmin: boolean
  isSelectedCommitteeAdmin: boolean
  userRole: string
  username: string
  language: Language
  setLanguage: (language: Language) => void
  logout: () => void | Promise<void>
  appT: AppShellTranslations
  children: ReactNode
}

export default function AppShell({
  activePage,
  setActivePage,
  isSuperAdmin,
  isSelectedCommitteeAdmin,
  userRole,
  username,
  language,
  setLanguage,
  logout,
  appT,
  children,
}: AppShellProps) {
  const navigation = isSuperAdmin
    ? [
        'Dashboard',
        'Committees',
        'Users',
        'Members',
        'Contributions',
        'Death Support',
        'Dues',
        'Goods',
        'Assets',
        'Settlements',
      ]
    : isSelectedCommitteeAdmin
      ? [
          'Dashboard',
          'Members',
          'Contributions',
          'Death Support',
          'Dues',
          'Goods',
          'Assets',
          'Settlements',
        ]
      : [
          'Dashboard',
          'My Contributions',
          'My Death Support',
          'My Dues',
          'My Goods',
          'My Financial Position',
          'My Settlement',
        ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div
            className="product-logo product-logo--sidebar"
            aria-label="Death Committee System"
          >
            <svg
              viewBox="0 0 40 40"
              role="img"
              aria-hidden="true"
            >
              <path
                d="M8 28.5 20 21l12 7.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 21.5 20 14l12 7.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 14.5 20 7l12 7.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="20" cy="7" r="2.2" fill="currentColor" />
              <circle cx="8" cy="28.5" r="2.2" fill="currentColor" />
              <circle cx="32" cy="28.5" r="2.2" fill="currentColor" />
            </svg>
          </div>

          <div className="brand-text">
            <strong>{appT.appName}</strong>
            <span>{appT.systemName}</span>
          </div>
        </div>

        <nav>
          {navigation.map((page) => (
            <button
              key={page}
              className={`nav-item ${activePage === page ? 'active' : ''}`}
              onClick={() => {
                if (page === 'Users' && userRole !== 'super_admin') return
                setActivePage(page)
              }}
            >
              {appT.navigation[page] ?? getNavigationLabel(page)}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              {appT.appName.toUpperCase()} {appT.systemName.toUpperCase()}
            </p>
            <h2>
              {appT.navigation[activePage] ?? getNavigationLabel(activePage)}
            </h2>
          </div>

          <div className="topbar-account">
            <div
              className="app-language-switcher"
              aria-label={appT.languageLabel}
            >
              <button
                type="button"
                className={language === 'en' ? 'active' : ''}
                onClick={() => setLanguage('en')}
                aria-pressed={language === 'en'}
              >
                {appT.languageEnglish}
              </button>

              <button
                type="button"
                className={language === 'ur' ? 'active' : ''}
                onClick={() => setLanguage('ur')}
                aria-pressed={language === 'ur'}
              >
                {appT.languageUrdu}
              </button>
            </div>

            <div className="topbar-account-copy">
              <strong>{username}</strong>
              <span>
                {userRole === 'super_admin'
                  ? appT.roles.superAdmin
                  : userRole === 'committee_admin'
                    ? appT.roles.committeeAdmin
                    : appT.roles.member}
              </span>
            </div>

            <button
              type="button"
              className="topbar-signout"
              onClick={() => void logout()}
            >
              {appT.signOut}
            </button>
          </div>
        </header>

        <section className="content">
          {activePage === 'Users' && userRole !== 'super_admin' ? (
            <section className="module-placeholder">
              <div className="module-placeholder-icon">DC</div>
              <p className="eyebrow">ACCESS</p>
              <h1>{appT.ui.accessRestricted}</h1>
              <p>{appT.ui.onlySuperAdminManageUsers}</p>
            </section>
          ) : (
            children
          )}
        </section>
      </main>
    </div>
  )
}
