/**
 * Fixed-port entry forwarder: an in-process HTTP/WebSocket reverse proxy that
 * gives the Web GUI a STABLE address across desktop restarts.
 *
 * Why it exists: the desktop assigns a random port and launch token on every
 * start, so the canonical URL printed by the harness changes constantly. This
 * server binds one fixed loopback port per process and transparently forwards
 * everything to the CURRENT harness instance, minting the browser-session
 * cookie internally through the same `?token=` exchange a real browser would
 * perform. Browsers only ever talk to the fixed address and never see a
 * token or a target cookie.
 *
 * Request rewriting (mirrors what the harness trust fence requires):
 * - `Host` is rewritten to the real harness authority (loopback defense
 *   checks Host, so it must name the actual server).
 * - `Origin` is rewritten to the real harness authority whenever it names
 *   this forwarder, so the same-origin fence passes.
 * - `Cookie` is replaced by the internally held browser-session cookie.
 * - `Set-Cookie` from responses is swallowed: browsers must not retain
 *   target-authority cookies.
 *
 * WebSocket upgrades (`/api/remote.mux`) are forwarded the same way; the
 * target computes `Sec-WebSocket-Accept` from the client key we pass through,
 * so the raw 101 response headers are relayed verbatim.
 *
 * @module dsh-web-url-view/fixed-entry
 */
/** One remote server this forwarder targets. */
export interface ForwardTarget {
    /** Real harness authority written into forwarded `Host`/`Origin` headers (`host:port`). */
    readonly authority: string;
    /** Loopback connect address of the harness web server. */
    readonly hostname: string;
    /** Port of the harness web server. */
    readonly port: number;
    /** Mint the launch-token handshake URL for the current process. */
    readonly authenticate: () => string;
    /**
     * Host-name to advertise in the fixed URL (`http://<advertiseHost>:<port>`).
     * This is the machine's reachable LAN IPv4, so a device on the same LAN can
     * open the fixed address; it is distinct from the loopback connect host.
     */
    readonly advertiseHost: string;
}
/**
 * The in-process fixed-port forwarder. One instance per plugin body; bind
 * once on {@link start}, dispose through {@link close}.
 */
export declare class FixedEntryServer {
    private readonly bindHost;
    private readonly port;
    private readonly target;
    private readonly server;
    private sessionCookie;
    /** Epoch ms when the held cookie was minted (the server grants 24h). */
    private sessionAt;
    /** Single-flight handshake: concurrent first requests share one exchange. */
    private handshakePromise;
    private listening;
    /**
     * @param bindHost - interface to bind (`127.0.0.1`; LAN binds are configurable but discouraged).
     * @param port - fixed port to bind.
     * @param target - current harness web server to forward to.
     */
    constructor(bindHost: string, port: number, target: ForwardTarget);
    /**
     * Stable entry URL once listening, else null (not yet bound or failed).
     * Names the advertised LAN host so other LAN devices can open the fixed
     * address directly; the bind host itself may be `0.0.0.0`.
     */
    get url(): string | null;
    /** Bind the fixed port (non-blocking). */
    start(): void;
    /** Release the port and drop the held session cookie. */
    close(): Promise<void>;
    /** Whether the held session cookie is still plausibly valid (server grants 24h). */
    private get sessionFresh();
    /**
     * Perform one token exchange against the current harness and capture the
     * browser-session cookie. Single-flight; resolves null when the exchange
     * failed (reported on the `[dsh-web-url-view]` log).
     * @returns the `name=value` cookie pair, or null on failure.
     */
    private handshake;
    /**
     * Rewrite inbound headers for forwarding: swap Host, rewrite a
     * self-addressed Origin, drop forwarder-owned markers, and attach the held
     * session cookie (or remove a client-supplied one).
     * @param inbound - headers received on the fixed port.
     * @param cookie - session cookie to attach, or null to send none.
     * @returns header map ready for `http.request`.
     */
    private rewrite;
    /** Resolve the cookie to attach now: fresh session or a one-off handshake. */
    private currentCookie;
    /**
     * Forward one plain HTTP request (any method; streaming body and response).
     * A 401 on the first attempt triggers one handshake + replay; a second 401
     * is relayed to the browser unchanged.
     * @param request - inbound request from the fixed port.
     * @param response - outbound response to the fixed-port client.
     */
    private forward;
    /**
     * One dispatch leg; recursion depth is capped by the attempt counter.
     * @param request - inbound request.
     * @param response - outbound response.
     * @param cookie - cookie to attach on this leg.
     * @param attempts - completed legs so far (0 = first try).
     */
    private dispatch;
    /**
     * Forward one WebSocket upgrade to the current harness. The client key is
     * passed through untouched so the target's accept header matches the
     * browser; the raw 101 response headers are relayed verbatim and the two
     * sockets are piped together. A refused first attempt refreshes the session
     * once and retries.
     * @param request - inbound upgrade request.
     * @param socket - inbound TCP socket (pre-upgrade).
     * @param head - bytes already buffered past the upgrade request.
     */
    private forwardUpgrade;
    /**
     * One WebSocket dispatch leg; recursion depth is capped by the attempt counter.
     * @param request - inbound upgrade request.
     * @param socket - inbound TCP socket.
     * @param head - buffered bytes past the upgrade request.
     * @param cookie - cookie to attach on this leg.
     * @param attempts - completed legs so far (0 = first try).
     */
    private dispatchUpgrade;
    /** Write a plain-text failure response when nothing was sent yet. */
    private fail;
}
//# sourceMappingURL=fixed-entry.d.ts.map