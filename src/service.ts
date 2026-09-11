/**
 * Host half of `dsh-web-url-view`: a `webUrlView` Typert Remote service that
 * mints the launch-token URL for the page origin the browser reports. The
 * token itself never leaves the Host — the service calls
 * `connection.authenticatedUrl()` (the same Host function the `dsh web`
 * supervisor uses to print its startup URL) and returns only the finished
 * URL over the wire.
 *
 * @module dsh-web-url-view/service
 */

import type { Context } from '@deepseek-ai/cordis'
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { WebUrlViewResult } from './wire.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /**
     * Browser-session connection host service (declared structurally: the
     * owning package types stay out of this bundle).
     */
    connection: {
      /** Add this process's launch token to the ordinary application URL. */
      authenticatedUrl(baseUrl: string): string
    }
  }
}

/** Origins the page may legitimately report for this Host. */
const LOOPBACK_HOSTNAMES = new Set(['127.0.0.1', 'localhost', '::1'])
/** RFC1918 private IPv4 ranges (LAN bindings). */
const PRIVATE_IPV4 = /^(?:10\.|127\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/u

/** Monotonic instance counter: lets logs prove which instance served what. */
let nextInstanceId = 0

/** Stable per-instance tag for diagnostics (`#1`, `#2`, ...). */
export function instanceId(service: WebUrlViewService): string {
  return `#${service.__instanceId}`
}

/**
 * Whether one absolute origin is acceptable input for token minting.
 * Loopback and private-LAN hosts only; credentials, paths, queries, and
 * fragments are rejected because `authenticatedUrl` would discard them
 * anyway and a crafted suffix must never reach the minting step.
 * @param origin - absolute origin as reported by `window.location.origin`.
 * @returns whether the origin may be authenticated.
 */
function isTrustedOrigin(origin: string): boolean {
  let url: URL
  try {
    url = new URL(origin)
  } catch {
    return false
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  if (url.username !== '' || url.password !== '') return false
  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') return false
  const hostname = url.hostname
  if (LOOPBACK_HOSTNAMES.has(hostname)) return true
  // IPv6 loopback arrives expanded (`0:0:0:0:0:0:0:1`), never as `::1`.
  if (hostname === '0:0:0:0:0:0:0:1') return true
  return PRIVATE_IPV4.test(hostname)
}

/**
 * The `webUrlView` Remote service: mints the current authenticated GUI URL
 * for one trusted browser origin.
 */
/** Surface of the fixed-port forwarder the service reports; owned by the plugin body. */
export interface FixedEntryFace {
  /** Stable entry URL once the forwarder is listening, else null. */
  readonly url: string | null
}

export class WebUrlViewService extends TypertRemoteService {
  /** Hard service dependency: the browser-session connection host. */
  static inject = ['connection']

  /** In-process fixed-port forwarder attached by the plugin body, if any. */
  private fixed: FixedEntryFace | null = null

  /** Unique per-instance id for diagnostics (see `instanceId`). */
  readonly __instanceId = ++nextInstanceId

  /**
   * @param ctx - context carrying the `connection` service.
   */
  constructor(ctx: Context) {
    super(ctx, 'webUrlView')
  }

  /**
   * Attach (or detach) the fixed-port forwarder whose status the service
   * reports. Called by the plugin body under its own effect lifecycle.
   * @param fixed - forwarder face, or null when disabled or stopped.
   */
  attachFixed(fixed: FixedEntryFace | null): void {
    this.fixed = fixed
    console.info(`[dsh-web-url-view] attachFixed on instance ${instanceId(this)}: fixed entry is now ${fixed?.url ?? 'null'}`)
  }

  /**
   * Mint the launch-token URL for the origin the browser reported.
   * Read-only: touches no configuration and mutates no registry.
   * @param origin - absolute origin from `window.location.origin`.
   * @returns the tokenized root URL, externally openable in any browser.
   */
  current(origin: string): WebUrlViewResult {
    // Logged on every call: the instance id proves whether the gateway
    // dispatches to the same instance the plugin body attached the fixed
    // entry to.
    console.info(`[dsh-web-url-view] current(${origin}) on instance ${instanceId(this)}`)
    if (!isTrustedOrigin(origin)) {
      // Reject loudly: an untrusted origin must never reach token minting.
      throw new Error(`webUrlView: origin rejected (must be a loopback or private-LAN http(s) origin): ${origin}`)
    }
    let url: string
    try {
      url = this.ctx.connection.authenticatedUrl(origin)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      throw new Error(`webUrlView: could not mint the authenticated URL for ${origin}: ${reason}`)
    }
    // The URLs carry a session secret; only the origin is logged.
    const fixedUrl = this.fixed?.url ?? null
    console.info(`[dsh-web-url-view] current() for ${origin}: url minted, fixedUrl=${fixedUrl ?? 'null'}`)
    return { url, fixedUrl }
  }

  /**
   * Mint the authenticated URL for the fixed-port forwarder's handshake.
   * Read-only like `current()` but without logging and without re-checking
   * the origin (the forwarder only ever asks for its own loopback server).
   * Reads `connection` through the service's own ctx — never through a
   * plugin scope, which may be disposed while the forwarder keeps serving.
   * @param origin - the forwarder's own absolute loopback origin.
   * @returns the tokenized root URL for that origin.
   */
  mintFixedUrl(origin: string): string {
    return this.ctx.connection.authenticatedUrl(origin)
  }
}
