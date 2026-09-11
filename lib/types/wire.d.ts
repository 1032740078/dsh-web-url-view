/**
 * Wire vocabulary for the `webUrlView` Remote namespace: the result type,
 * its zod v4 strict codec, and the invocation descriptor shared verbatim by
 * the host Typert manifest (`./typert.host.ts`) and the client Remote
 * contribution (`./client/remote.ts`). One canonical source keeps the two
 * faces from drifting apart.
 *
 * The page origin crosses the wire because the Host cannot always derive the
 * address the browser used (loopback, LAN, or an SSH-forwarded address are
 * all valid, and the Host only knows its bound port). The Host re-validates
 * every origin before minting a tokenized URL.
 *
 * @module dsh-web-url-view/wire
 */
import { z } from 'zod';
/** Result of one `webUrlView/current` invocation. */
export interface WebUrlViewResult {
    /**
     * Root URL of the served GUI carrying the process launch token as its sole
     * authentication input (`http://<host>:<port>/?token=<launchToken>`).
     * Opening it in any browser mints a fresh browser-session cookie. This
     * address changes whenever the desktop restarts.
     */
    readonly url: string;
    /**
     * Stable entry URL of the in-process fixed-port forwarder
     * (`http://<lan-ip>:<fixedPort>/`); never changes across restarts. The
     * forwarder holds the launch token internally and refreshes its browser
     * session automatically. Hosts the machine's LAN IPv4 so other devices on
     * the same network can also open it. `null` when the fixed entry is
     * disabled or failed to bind (see `[dsh-web-url-view]` log lines).
     */
    readonly fixedUrl: string | null;
}
/** Strict wire codec for {@link WebUrlViewResult} (zod v4, both Typert faces). */
export declare const WEB_URL_VIEW_RESULT_SCHEMA: z.ZodObject<{
    url: z.ZodString;
    fixedUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
/** Strict wire codec for the origin parameter (a plain absolute origin). */
export declare const ORIGIN_SCHEMA: z.ZodString;
/**
 * The `webUrlView/current` invocation descriptor, shared verbatim by the
 * host `TYPERT` manifest and the client `TypertRemoteContribution`.
 * Hand-written in the exact shape the Typert generator emits; validated by
 * the typert loader and the client registry at mount time.
 */
export declare const CURRENT_URL_DESCRIPTOR: Readonly<{
    readonly id: "dsh-web-url-view#webUrlView/current";
    readonly service: "webUrlView";
    readonly namespace: "webUrlView";
    readonly method: "current";
    readonly invocation: Readonly<{
        kind: "direct";
    }>;
    readonly parameters: readonly Readonly<{
        name: "origin";
        wire: "origin";
        source: "json";
        codec: Readonly<{
            mode: "strict";
            typeSymbol: "dsh-web-url-view/types#origin";
            schema: z.ZodString;
        }>;
    }>[];
    readonly result: Readonly<{
        mode: "strict";
        typeSymbol: "dsh-web-url-view/types#WebUrlViewResult";
        schema: z.ZodObject<{
            url: z.ZodString;
            fixedUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>;
    }>;
    readonly sourceLocation: Readonly<{
        file: "src/wire.ts";
        line: 1;
        column: 1;
    }>;
}>;
/** Canonical invocation list of this package (host manifest + client Remote). */
export declare const WEB_URL_VIEW_INVOCATIONS: readonly Readonly<{
    readonly id: "dsh-web-url-view#webUrlView/current";
    readonly service: "webUrlView";
    readonly namespace: "webUrlView";
    readonly method: "current";
    readonly invocation: Readonly<{
        kind: "direct";
    }>;
    readonly parameters: readonly Readonly<{
        name: "origin";
        wire: "origin";
        source: "json";
        codec: Readonly<{
            mode: "strict";
            typeSymbol: "dsh-web-url-view/types#origin";
            schema: z.ZodString;
        }>;
    }>[];
    readonly result: Readonly<{
        mode: "strict";
        typeSymbol: "dsh-web-url-view/types#WebUrlViewResult";
        schema: z.ZodObject<{
            url: z.ZodString;
            fixedUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>;
    }>;
    readonly sourceLocation: Readonly<{
        file: "src/wire.ts";
        line: 1;
        column: 1;
    }>;
}>[];
//# sourceMappingURL=wire.d.ts.map