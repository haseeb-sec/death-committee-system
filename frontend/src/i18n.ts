import { useEffect, useState } from 'react'

export type Language = 'en' | 'ur'

export const LANGUAGE_STORAGE_KEY = 'death_committee_language'

export const RTL_LANGUAGES: Language[] = ['ur']

export function isRtlLanguage(language: Language): boolean {
  return RTL_LANGUAGES.includes(language)
}

/**
 * Manages the selected UI language, persisted to localStorage so it
 * is remembered across visits without requiring any backend change
 * or user account. Also keeps <html dir="..."> in sync, since Urdu
 * and Pashto are right-to-left languages and need the whole page
 * (not just text) to mirror correctly.
 */
export function useLanguage(): [Language, (language: Language) => void] {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)

    if (stored === 'en' || stored === 'ur') {
      return stored
    }

    return 'en'
  })

  useEffect(() => {
    document.documentElement.dir = isRtlLanguage(language) ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  function setLanguage(next: Language) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
    setLanguageState(next)
  }

  return [language, setLanguage]
}

export type LoginTranslation = {
  appName: string
  tagline: string
  signInTitle: string
  signInSubtitle: string
  resetTitle: string
  resetSubtitle: string
  username: string
  usernamePlaceholder: string
  password: string
  passwordPlaceholder: string
  signInButton: string
  signingIn: string
  forgotPassword: string
  backToSignIn: string
  recoveryToken: string
  recoveryTokenPlaceholder: string
  newPassword: string
  newPasswordPlaceholder: string
  confirmNewPassword: string
  confirmNewPasswordPlaceholder: string
  resetButton: string
  resetting: string
  languageLabel: string
}

export const loginTranslations: Record<Language, LoginTranslation> = {
  en: {
    appName: 'Death Committee System',
    tagline: 'Manage contributions, support, and dues in one place.',
    signInTitle: 'Sign in',
    signInSubtitle: 'Enter your username and password to continue.',
    resetTitle: 'Reset your password',
    resetSubtitle: 'Use the recovery token given to you by your admin.',
    username: 'Username',
    usernamePlaceholder: 'Enter your username',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    signInButton: 'Sign in',
    signingIn: 'Signing in...',
    forgotPassword: 'Forgot password?',
    backToSignIn: 'Back to sign in',
    recoveryToken: 'Recovery token',
    recoveryTokenPlaceholder: 'Enter your recovery token',
    newPassword: 'New password',
    newPasswordPlaceholder: 'Enter your new password',
    confirmNewPassword: 'Confirm new password',
    confirmNewPasswordPlaceholder: 'Confirm your new password',
    resetButton: 'Reset password',
    resetting: 'Resetting...',
    languageLabel: 'Language',
  },
  ur: {
    appName: 'ڈیتھ کمیٹی سسٹم',
    tagline: 'چندہ، امداد اور واجبات ایک ہی جگہ پر سنبھالیں۔',
    signInTitle: 'سائن ان کریں',
    signInSubtitle: 'جاری رکھنے کے لیے اپنا یوزر نیم اور پاسورڈ درج کریں۔',
    resetTitle: 'پاسورڈ دوبارہ ترتیب دیں',
    resetSubtitle: 'اپنے ایڈمن کی طرف سے دیا گیا ریکوری ٹوکن استعمال کریں۔',
    username: 'یوزر نیم',
    usernamePlaceholder: 'اپنا یوزر نیم درج کریں',
    password: 'پاسورڈ',
    passwordPlaceholder: 'اپنا پاسورڈ درج کریں',
    signInButton: 'سائن ان کریں',
    signingIn: 'سائن ان ہو رہا ہے...',
    forgotPassword: 'پاسورڈ بھول گئے؟',
    backToSignIn: 'واپس سائن ان پر جائیں',
    recoveryToken: 'ریکوری ٹوکن',
    recoveryTokenPlaceholder: 'اپنا ریکوری ٹوکن درج کریں',
    newPassword: 'نیا پاسورڈ',
    newPasswordPlaceholder: 'اپنا نیا پاسورڈ درج کریں',
    confirmNewPassword: 'نئے پاسورڈ کی تصدیق کریں',
    confirmNewPasswordPlaceholder: 'اپنے نئے پاسورڈ کی تصدیق کریں',
    resetButton: 'پاسورڈ ری سیٹ کریں',
    resetting: 'ری سیٹ ہو رہا ہے...',
    languageLabel: 'زبان',
  },
}
