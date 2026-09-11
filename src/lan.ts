/**
 * LAN address detection for the fixed-port forwarder's advertised URL.
 *
 * The forwarder binds `0.0.0.0` so any device on the same LAN can reach the
 * Web GUI, but the address a user should open is the machine's real LAN IPv4
 * (`http://192.168.x.y:<fixedPort>`), never `0.0.0.0` nor loopback. This
 * picks that address: prefer the interface the default route uses (the one
 * that actually reaches the network), then fall back to the first plausible
 * RFC1918 IPv4 on a non-virtual, non-internal interface. When nothing is
 * usable it returns null and the caller falls back to loopback.
 *
 * @module dsh-web-url-view/lan
 */

import { execFileSync } from 'node:child_process'
import { networkInterfaces } from 'node:os'

/** Interface-name prefixes that are almost never a reachable LAN link. */
const VIRTUAL_IFACE = /^(?:docker|veth|br-|virbr|vmnet|vEthernet|utun|tun|tap|lo|lo0|tailscale|wg|ppp)/i
/** RFC1918 private IPv4 (excludes loopback, link-local, CGNAT). */
const PRIVATE_IPV4 = /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/u
/** IPv4 link-local (APIPA) — never routable beyond the link. */
const LINK_LOCAL = /^169\.254\./u

/** One candidate interface with its reachable IPv4 address. */
interface Candidate {
  readonly name: string
  readonly address: string
}

/**
 * Name of the interface the default route egresses on (the one that actually
 * reaches the Internet/LAN), or null when it cannot be determined.
 * @returns default-route interface name, or null.
 */
function defaultInterfaceName(): string | null {
  try {
    if (process.platform === 'darwin') {
      // `route -n get default` prints e.g. `interface: en0`.
      const out = execFileSync('route', ['-n', 'get', 'default'], { encoding: 'utf8' })
      return out.match(/interface:\s*(\S+)/)?.[1] ?? null
    }
    if (process.platform === 'linux') {
      // `ip route show default` prints e.g. `default via 192.168.1.1 dev wlan0`.
      const out = execFileSync('ip', ['route', 'show', 'default'], { encoding: 'utf8' })
      return out.match(/dev\s+(\S+)/)?.[1] ?? null
    }
  } catch {
    // No route tool / not supported; fall through to the interface scan.
  }
  return null
}

/**
 * Detect the machine's reachable LAN IPv4 address.
 *
 * Candidates come from `os.networkInterfaces()`: IPv4, non-internal, not
 * link-local, in a private range, and on a non-virtual interface. The
 * default-route interface wins; otherwise the first remaining (stable
 * iteration order) candidate is used.
 * @returns the LAN IPv4 address, or null when none is reachable.
 */
export function detectLanAddress(): string | null {
  const candidates: Candidate[] = []
  for (const [name, addresses] of Object.entries(networkInterfaces())) {
    if (VIRTUAL_IFACE.test(name)) continue
    for (const info of addresses ?? []) {
      if (info.family !== 'IPv4') continue
      if (info.internal) continue
      if (LINK_LOCAL.test(info.address)) continue
      if (!PRIVATE_IPV4.test(info.address)) continue
      candidates.push({ name, address: info.address })
    }
  }
  if (candidates.length === 0) return null
  const preferred = defaultInterfaceName()
  if (preferred !== null) {
    const hit = candidates.find((candidate) => candidate.name === preferred)
    if (hit !== undefined) return hit.address
  }
  const first = candidates[0]
  return first === undefined ? null : first.address
}
