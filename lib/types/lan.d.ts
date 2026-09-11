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
/**
 * Detect the machine's reachable LAN IPv4 address.
 *
 * Candidates come from `os.networkInterfaces()`: IPv4, non-internal, not
 * link-local, in a private range, and on a non-virtual interface. The
 * default-route interface wins; otherwise the first remaining (stable
 * iteration order) candidate is used.
 * @returns the LAN IPv4 address, or null when none is reachable.
 */
export declare function detectLanAddress(): string | null;
//# sourceMappingURL=lan.d.ts.map