/**
 * The client-side Remote face of the `webUrlView` namespace: the hand-written
 * `TypertRemoteContribution` mounted through `ctx.remote.$mount`, plus the
 * declaration merging that types `ctx.remote.webUrlView`. The descriptor
 * list is shared with the host `./typert` manifest (`../wire.ts`), so the
 * two faces can never drift.
 *
 * @module dsh-web-url-view/client/remote
 */

import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { WEB_URL_VIEW_INVOCATIONS } from '../wire.ts'
import type { WebUrlViewResult } from '../wire.ts'

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespace$webUrlView {
    /** Mint the current launch-token URL for this page's origin. */
    current: (origin: string) => Promise<RemoteResult<WebUrlViewResult>>
  }
  interface TypertRemoteMap {
    'webUrlView/current': (origin: string) => Promise<RemoteResult<WebUrlViewResult>>
  }
  interface TypertRemoteNamespaceMap {
    webUrlView: TypertRemoteNamespace$webUrlView
  }
}

/** The client Remote contribution for the `webUrlView` namespace. */
export const WEB_URL_VIEW_REMOTE = Object.freeze({
  package: 'dsh-web-url-view',
  descriptors: WEB_URL_VIEW_INVOCATIONS,
} satisfies TypertRemoteContribution)
