/**
 * `dsh-web-url-view`, browser half: mounts the `webUrlView` Remote
 * contribution, then registers the "View URL" page into the settings
 * section list (`settings.section`, id `web-url-view`). All data arrives
 * through the `remote.webUrlView` namespace — the section issues no other
 * RPC and holds no state beyond the last fetched URL.
 *
 * @module dsh-web-url-view/client
 */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: the api-remotes client declares the 'remote' service on the
// client Context (the shell graph owns the runtime value; this package reads
// the merged contract).
import type {} from '@deepseek-ai/dsh-api-remotes/client'
// Type-only: pulls ctx.locale into this program.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type { WebUrlViewResult } from '../wire.ts'
import { WebUrlSection, type WebUrlSectionInjected } from './WebUrlSection.tsx'
import { en, zh, type WebUrlViewKey } from './locales.ts'
import { WEB_URL_VIEW_REMOTE } from './remote.ts'

export type { WebUrlSectionInjected, WebUrlSectionProps } from './WebUrlSection.tsx'
export type { WebUrlViewKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** "View URL" settings page copy. */
    'settings.webUrlView': WebUrlViewKey
  }
}

/** Dictionary namespace owned by this plugin. */
export const NS = 'settings.webUrlView'

/** Plugin name: matches the package name, the graph row id, and the bundle id. */
export const name = 'dsh-web-url-view'

/** Services the section reads; `remote.webUrlView` appears once this plugin mounts its contribution. */
export const inject = ['slots', 'locale', 'remote']

/**
 * Minimal structural contract of the client slots registry this section
 * registers into, named locally so the browser half compiles against the
 * settings slot surface without importing its owner package at runtime.
 */
interface SettingsSectionSlots {
  inject(slot: string, callback: () => unknown): void
  register(options: {
    name: 'settings.section'
    id: 'web-url-view'
    order: number
    label: () => string
    locale: string
    inject: () => WebUrlSectionInjected
  }, component: unknown): () => void
}

/**
 * Browser plugin body: dictionaries, the Remote contribution mount, and the
 * settings section registration.
 * @param ctx - client root context.
 */
export async function apply(ctx: ClientContext): Promise<void> {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-web-url-view: dictionaries')

  // $mount registers the 'remote.webUrlView' namespace service and owns its
  // removal for this fiber's lifetime.
  await ctx.remote.$mount(WEB_URL_VIEW_REMOTE)

  ctx.inject(['remote.webUrlView'], (scope) => {
    // The slots service owner moved across harness lines; read it through the
    // local structural contract so both lines compile against the same shape.
    const slots = scope.get('slots') as unknown as SettingsSectionSlots
    const t = scope.locale.bind(NS)
    const unwrap = (result: RemoteResult<WebUrlViewResult>, method: string): WebUrlViewResult => {
      if (!result.ok) {
        throw new Error(`webUrlView.${method} failed: ${result.error.code}: ${result.error.message}`)
      }
      return result.value
    }
    const readUrl = async (): Promise<WebUrlViewResult> =>
      unwrap(await scope.remote.webUrlView.current(window.location.origin), 'current')
    slots.inject('settings.section', () => slots.register({
      name: 'settings.section',
      id: 'web-url-view',
      // After the built-in sections; the shell sorts ascending.
      order: 200,
      label: () => t('nav'),
      locale: NS,
      inject: (): WebUrlSectionInjected => ({ readUrl }),
    }, WebUrlSection))
  })
}
