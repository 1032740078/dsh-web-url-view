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
import { createServer, request as httpRequest } from 'node:http';
/** Hop-by-hop and forwarder-owned headers regenerated on every leg. */
const OWNED_HEADERS = new Set([
    'host', 'cookie', 'connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'proxy-connection',
]);
/**
 * The in-process fixed-port forwarder. One instance per plugin body; bind
 * once on {@link start}, dispose through {@link close}.
 */
export class FixedEntryServer {
    bindHost;
    port;
    target;
    server;
    sessionCookie = null;
    /** Epoch ms when the held cookie was minted (the server grants 24h). */
    sessionAt = 0;
    /** Single-flight handshake: concurrent first requests share one exchange. */
    handshakePromise = null;
    listening = false;
    /**
     * @param bindHost - interface to bind (`127.0.0.1`; LAN binds are configurable but discouraged).
     * @param port - fixed port to bind.
     * @param target - current harness web server to forward to.
     */
    constructor(bindHost, port, target) {
        this.bindHost = bindHost;
        this.port = port;
        this.target = target;
        this.server = createServer((request, response) => {
            void this.forward(request, response).catch((error) => {
                // A per-connection failure must never escape as an unhandled
                // rejection: log it and tear the connection down only.
                console.error(`[dsh-web-url-view] fixed entry request failed: ${error instanceof Error ? error.message : String(error)}`);
                if (!response.destroyed)
                    response.destroy();
            });
            // The browser side may vanish mid-request (refresh, tab close, killed
            // client); without a listener the write error would crash the host.
            response.on('error', () => { });
        });
        // 'upgrade' is a separate event; 'request' never sees WebSocket handshakes.
        this.server.on('upgrade', (request, socket, head) => {
            void this.forwardUpgrade(request, socket, head).catch((error) => {
                console.error(`[dsh-web-url-view] fixed entry upgrade failed: ${error instanceof Error ? error.message : String(error)}`);
                if (!socket.destroyed)
                    socket.destroy();
            });
            // Pre-upgrade socket errors (half-open probes) must not crash the host.
            socket.on('error', () => { });
        });
        this.server.on('error', (error) => {
            // A bind failure must not take the rest of the plugin down: report it
            // and keep the fixed address reported as unavailable.
            console.error(`[dsh-web-url-view] fixed entry on ${bindHost}:${port} failed: ${error instanceof Error ? error.message : String(error)}`);
        });
        // Malformed or dead client sockets (port scans, aborted connections):
        // the default response is a 400; make the teardown explicit and quiet.
        this.server.on('clientError', (error, socket) => {
            console.error(`[dsh-web-url-view] fixed entry client error: ${error instanceof Error ? error.message : String(error)}`);
            if (!socket.destroyed)
                socket.destroy();
        });
    }
    /**
     * Stable entry URL once listening, else null (not yet bound or failed).
     * Names the advertised LAN host so other LAN devices can open the fixed
     * address directly; the bind host itself may be `0.0.0.0`.
     */
    get url() {
        return this.listening ? `http://${this.target.advertiseHost}:${this.port}` : null;
    }
    /** Bind the fixed port (non-blocking). */
    start() {
        this.server.listen(this.port, this.bindHost, () => {
            this.listening = true;
            console.info(`[dsh-web-url-view] fixed entry listening on ${this.bindHost}:${this.port} (advertised http://${this.target.advertiseHost}:${this.port}) -> ${this.target.authority}`);
        });
    }
    /** Release the port and drop the held session cookie. */
    async close() {
        this.listening = false;
        this.sessionCookie = null;
        const server = this.server;
        // Close lingering keep-alive sockets so a restarted harness never finds
        // the fixed port still occupied by this process's stale sockets.
        server.closeAllConnections?.();
        await new Promise((resolve) => {
            server.close(() => resolve());
        });
        console.info(`[dsh-web-url-view] fixed entry on ${this.bindHost}:${this.port} closed`);
    }
    /** Whether the held session cookie is still plausibly valid (server grants 24h). */
    get sessionFresh() {
        return this.sessionCookie !== null && Date.now() - this.sessionAt < 22 * 60 * 60 * 1000;
    }
    /**
     * Perform one token exchange against the current harness and capture the
     * browser-session cookie. Single-flight; resolves null when the exchange
     * failed (reported on the `[dsh-web-url-view]` log).
     * @returns the `name=value` cookie pair, or null on failure.
     */
    async handshake() {
        if (this.handshakePromise !== null)
            return this.handshakePromise;
        this.handshakePromise = (async () => {
            let url;
            try {
                // authenticate()（服务 ctx 的 connection 读取）可能在插件重载边界抛错；
                // 手握手失败必须转为会话刷新失败,绝不作为 unhandled rejection 逃逸。
                url = this.target.authenticate();
            }
            catch (error) {
                console.error(`[dsh-web-url-view] fixed entry handshake: authenticate() failed: ${error instanceof Error ? error.message : String(error)}`);
                return null;
            }
            let response;
            try {
                response = await fetch(url, { redirect: 'manual', headers: { accept: 'text/html' } });
            }
            catch (error) {
                console.error(`[dsh-web-url-view] fixed entry handshake to ${url} failed: ${error instanceof Error ? error.message : String(error)}`);
                return null;
            }
            try {
                await response.body?.cancel();
            }
            catch {
                // A manual-redirect response carries no readable body; best effort.
            }
            const setCookies = typeof response.headers.getSetCookie === 'function'
                ? response.headers.getSetCookie()
                : [];
            const cookie = setCookies.find((entry) => entry.startsWith('dsh-auth-'));
            if (cookie === undefined) {
                console.error(`[dsh-web-url-view] fixed entry handshake to ${url} returned HTTP ${response.status} without a dsh-auth cookie`);
                return null;
            }
            // Keep only the name=value pair; attributes belong to a browser jar.
            this.sessionCookie = cookie.split(';')[0]?.trim() ?? null;
            this.sessionAt = Date.now();
            console.info(`[dsh-web-url-view] fixed entry session refreshed (HTTP ${response.status})`);
            return this.sessionCookie;
        })().finally(() => {
            this.handshakePromise = null;
        });
        return this.handshakePromise;
    }
    /**
     * Rewrite inbound headers for forwarding: swap Host, rewrite a
     * self-addressed Origin, drop forwarder-owned markers, and attach the held
     * session cookie (or remove a client-supplied one).
     * @param inbound - headers received on the fixed port.
     * @param cookie - session cookie to attach, or null to send none.
     * @returns header map ready for `http.request`.
     */
    rewrite(inbound, cookie) {
        const headers = {};
        for (const [key, value] of Object.entries(inbound)) {
            if (value === undefined)
                continue;
            if (OWNED_HEADERS.has(key.toLowerCase()))
                continue;
            if (key.toLowerCase() === 'origin') {
                // Rewrite only origins that name this forwarder (its port); foreign
                // origins stay untouched so the target fence still rejects them.
                try {
                    const origin = new URL(String(value));
                    if (origin.port === String(this.port)) {
                        headers.origin = `http://${this.target.authority}`;
                        continue;
                    }
                }
                catch {
                    // Keep the malformed origin verbatim for the target fence.
                }
            }
            headers[key] = value;
        }
        headers.host = this.target.authority;
        if (cookie !== null)
            headers.cookie = cookie;
        return headers;
    }
    /** Resolve the cookie to attach now: fresh session or a one-off handshake. */
    async currentCookie() {
        if (this.sessionFresh)
            return this.sessionCookie;
        return await this.handshake();
    }
    /**
     * Forward one plain HTTP request (any method; streaming body and response).
     * A 401 on the first attempt triggers one handshake + replay; a second 401
     * is relayed to the browser unchanged.
     * @param request - inbound request from the fixed port.
     * @param response - outbound response to the fixed-port client.
     */
    async forward(request, response) {
        await this.dispatch(request, response, await this.currentCookie(), 0);
    }
    /**
     * One dispatch leg; recursion depth is capped by the attempt counter.
     * @param request - inbound request.
     * @param response - outbound response.
     * @param cookie - cookie to attach on this leg.
     * @param attempts - completed legs so far (0 = first try).
     */
    async dispatch(request, response, cookie, attempts) {
        const upstream = httpRequest({
            hostname: this.target.hostname,
            port: this.target.port,
            method: request.method,
            path: request.url,
            headers: this.rewrite(request.headers, cookie),
        }, (upstreamResponse) => {
            // Session rotated or expired: refresh once and replay the same request.
            if (upstreamResponse.statusCode === 401 && attempts === 0) {
                upstreamResponse.resume();
                void this.handshake().then((fresh) => {
                    if (fresh === null) {
                        this.fail(response, 401, 'fixed entry: session refresh failed');
                        return;
                    }
                    void this.dispatch(request, response, fresh, attempts + 1);
                });
                return;
            }
            upstreamResponse.on('error', (error) => {
                console.error(`[dsh-web-url-view] fixed entry upstream response error: ${error instanceof Error ? error.message : String(error)}`);
                if (!response.destroyed)
                    response.destroy();
            });
            response.writeHead(upstreamResponse.statusCode ?? 502, stripHopHeaders(upstreamResponse.headers));
            upstreamResponse.pipe(response);
        });
        upstream.on('error', (error) => {
            console.error(`[dsh-web-url-view] fixed entry upstream error: ${error instanceof Error ? error.message : String(error)}`);
            this.fail(response, 502, 'fixed entry: harness web server unreachable');
        });
        // The inbound body stream can die (aborted client); without a listener
        // the pipe teardown would surface an unhandled 'error' on the request.
        request.on('error', () => {
            upstream.destroy();
        });
        request.on('aborted', () => {
            upstream.destroy();
        });
        request.pipe(upstream);
    }
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
    async forwardUpgrade(request, socket, head) {
        await this.dispatchUpgrade(request, socket, head, await this.currentCookie(), 0);
    }
    /**
     * One WebSocket dispatch leg; recursion depth is capped by the attempt counter.
     * @param request - inbound upgrade request.
     * @param socket - inbound TCP socket.
     * @param head - buffered bytes past the upgrade request.
     * @param cookie - cookie to attach on this leg.
     * @param attempts - completed legs so far (0 = first try).
     */
    async dispatchUpgrade(request, socket, head, cookie, attempts) {
        const headers = this.rewrite(request.headers, cookie);
        headers.connection = 'Upgrade';
        headers.upgrade = String(request.headers.upgrade ?? 'websocket');
        const upstream = httpRequest({
            hostname: this.target.hostname,
            port: this.target.port,
            method: 'GET',
            path: request.url,
            headers,
        });
        upstream.on('upgrade', (upstreamResponse, upstreamSocket, upstreamHead) => {
            // Relay the target's raw 101 (accept computed from the client key we
            // forwarded), then splice the sockets together.
            const buffered = Buffer.concat([head, upstreamHead]);
            socket.write(`HTTP/1.1 101 Switching Protocols\r\n${rawHeaderText(upstreamResponse.rawHeaders)}`);
            if (buffered.length > 0)
                upstreamSocket.unshift(buffered);
            upstreamSocket.pipe(socket);
            socket.pipe(upstreamSocket);
            upstreamSocket.on('error', () => socket.destroy());
            socket.on('error', () => upstreamSocket.destroy());
        });
        upstream.on('response', (upstreamResponse) => {
            upstreamResponse.resume();
            // A refused upgrade with a stale cookie refreshes the session once and
            // retries on the SAME client socket; only give up when that fails.
            if (upstreamResponse.statusCode === 401 && attempts === 0) {
                void this.handshake().then((fresh) => {
                    if (fresh !== null) {
                        void this.dispatchUpgrade(request, socket, head, fresh, attempts + 1);
                    }
                    else {
                        if (!socket.destroyed)
                            socket.destroy();
                    }
                });
                return;
            }
            if (!socket.destroyed)
                socket.destroy();
        });
        upstream.on('error', (error) => {
            console.error(`[dsh-web-url-view] fixed entry upgrade error: ${error instanceof Error ? error.message : String(error)}`);
            socket.destroy();
        });
        upstream.end();
    }
    /** Write a plain-text failure response when nothing was sent yet. */
    fail(response, status, message) {
        if (response.destroyed || response.headersSent)
            return;
        try {
            response.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
            response.end(message);
        }
        catch (error) {
            // The client may have vanished between the destroyed check and the
            // write; a per-connection failure must never escape the handler.
            console.error(`[dsh-web-url-view] fixed entry fail() write error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
/**
 * Strip hop-by-hop and forwarder-owned headers from an upstream response;
 * Content-Length stays because the body is piped verbatim, while
 * Transfer-Encoding is removed so Node picks the outbound framing.
 * @param headers - upstream response headers.
 * @returns safe header map for `writeHead`.
 */
function stripHopHeaders(headers) {
    const out = {};
    for (const [key, value] of Object.entries(headers)) {
        if (value === undefined)
            continue;
        const lower = key.toLowerCase();
        if (lower === 'connection' || lower === 'keep-alive' || lower === 'transfer-encoding'
            || lower === 'upgrade' || lower === 'set-cookie' || lower === 'proxy-connection') {
            continue;
        }
        out[key] = value;
    }
    return out;
}
/**
 * Serialize raw header pairs into `Name: value` lines plus the terminator.
 * EVERY header of the 101 response is relayed verbatim — including
 * `Connection: Upgrade`, which is what tells the browser's HTTP parser this
 * response completes the WebSocket handshake (dropping it would surface the
 * 101 as an ordinary response and break the upgrade).
 */
function rawHeaderText(rawHeaders) {
    let text = '';
    for (let index = 0; index < rawHeaders.length; index += 2) {
        const name = rawHeaders[index];
        const value = rawHeaders[index + 1];
        if (name === undefined || value === undefined)
            continue;
        text += `${name}: ${value}\r\n`;
    }
    return `${text}\r\n`;
}
//# sourceMappingURL=fixed-entry.js.map