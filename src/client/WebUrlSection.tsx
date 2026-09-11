/**
 * The "View URL" settings section: shows the two addresses of the Web GUI —
 * the stable fixed entry and the current tokenized one — as selectable text
 * with per-row copy buttons. All copy is localized; every interaction is a
 * one-shot RPC read or clipboard feedback — the section holds no
 * subscription state.
 *
 * @module dsh-web-url-view/client/WebUrlSection
 */

import { useEffect, useId, useRef, useState } from 'react'
import type { WebUrlViewResult } from '../wire.ts'
import type { WebUrlViewKey } from './locales.ts'
import css from './WebUrlSection.module.css'

/** Registration-side injected face: the one RPC this page needs. */
export interface WebUrlSectionInjected {
  /** Read the current fixed + tokenized addresses from the host. */
  readUrl: () => Promise<WebUrlViewResult>
}

/** Full component props assembled by the settings-section renderer. */
export interface WebUrlSectionProps extends WebUrlSectionInjected {
  /** Close the settings panel (shell-owned affordance). */
  close: () => void
  /** Locale seat bound to this entry's dictionary namespace. */
  t: (key: WebUrlViewKey) => string
}

/** One-shot load outcome; `request` bumps re-run the same load. */
type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly result: WebUrlViewResult }

/** Legacy copy fallback (Chromium keeps `execCommand` for user gestures). */
function legacyCopy(value: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false
  } finally {
    textarea.remove()
  }
  return copied
}

/** One address row: label + hint + read-only input + copy button. */
function UrlRow(props: {
  /** Field id seed (unique per row). */
  id: string
  /** Row label. */
  label: string
  /** Row hint shown under the input. */
  hint: string
  /** Address value (empty means unavailable). */
  value: string
  /** Unavailable feedback text. */
  unavailable: string
  /** Copy button idle label. */
  copy: string
  /** Copy button feedback after a successful copy. */
  copied: string
  /** Copy failure feedback. */
  copyFailed: string
}): React.ReactElement {
  const { id, label, hint, value, unavailable, copy, copied, copyFailed } = props
  const [flash, setFlash] = useState<'idle' | 'copied' | 'failed'>('idle')
  // One armed reset timer at a time; cleared on unmount.
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => {
    if (resetTimer.current !== undefined) clearTimeout(resetTimer.current)
  }, [])

  /** Arm the two-second "已复制" feedback then restore the idle label. */
  const flashCopied = (): void => {
    setFlash('copied')
    if (resetTimer.current !== undefined) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => {
      setFlash('idle')
    }, 2000)
  }

  /** Copy through the Clipboard API, falling back to selection copy. */
  const copyValue = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text)
      flashCopied()
      return
    } catch {
      // Fall through to the legacy path (non-secure contexts, denied grants).
    }
    if (legacyCopy(text)) {
      flashCopied()
    } else {
      setFlash('failed')
    }
  }

  return (
    <div className={css.block}>
      <p className={css.fieldLabel} id={id}>{label}</p>
      <div className={css.row}>
        <input
          aria-labelledby={id}
          className={css.url}
          type="text"
          readOnly
          value={value}
          placeholder={unavailable}
          // Selecting on focus makes the manual copy path one click away.
          onFocus={(event) => event.currentTarget.select()}
          spellCheck={false}
        />
        <button
          type="button"
          className={css.action}
          onClick={() => { void copyValue(value) }}
        >
          {flash === 'copied' ? copied : copy}
        </button>
      </div>
      <p className={css.blockHint}>{flash === 'failed' ? copyFailed : hint}</p>
    </div>
  )
}

/** Render the section content. */
export function WebUrlSection({ readUrl, t }: WebUrlSectionProps): React.ReactElement {
  const sectionId = useId()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [reload, setReload] = useState(0)

  // Fetch the addresses once per mount and per manual reload.
  useEffect(() => {
    let current = true
    setState({ status: 'loading' })
    void Promise.resolve()
      .then(() => readUrl())
      .then(
        (result) => {
          if (!current) return
          setState({ status: 'ready', result })
        },
        (error: unknown) => {
          if (!current) return
          const message = error instanceof Error ? error.message : String(error)
          setState({ status: 'error', message })
        },
      )
    return () => {
      current = false
    }
  }, [readUrl, reload])

  const retry = (): void => {
    setReload(value => value + 1)
  }

  return (
    <section className={css.section} aria-labelledby={sectionId}>
      <h2 className={css.heading} id={sectionId}>{t('title')}</h2>
      {state.status === 'loading' && (
        <p className={css.status}>{t('loading')}</p>
      )}
      {state.status === 'error' && (
        <div className={css.errorBox}>
          <p className={css.status}>{t('loadFailed').replace('{{message}}', state.message)}</p>
          <button type="button" className={css.action} onClick={retry}>{t('retry')}</button>
        </div>
      )}
      {state.status === 'ready' && (
        <>
          <UrlRow
            id={`${sectionId}-fixed`}
            label={t('fixedUrlLabel')}
            hint={t('fixedUrlHint')}
            value={state.result.fixedUrl ?? ''}
            unavailable={t('fixedUnavailable')}
            copy={t('copy')}
            copied={t('copied')}
            copyFailed={t('copyFailed')}
          />
          <UrlRow
            id={`${sectionId}-current`}
            label={t('currentUrlLabel')}
            hint={t('currentUrlHint')}
            value={state.result.url}
            unavailable={''}
            copy={t('copy')}
            copied={t('copied')}
            copyFailed={t('copyFailed')}
          />
        </>
      )}
    </section>
  )
}
