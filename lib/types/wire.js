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
/** Strict wire codec for {@link WebUrlViewResult} (zod v4, both Typert faces). */
export const WEB_URL_VIEW_RESULT_SCHEMA = z.object({
    url: z.string(),
    // Optional: a pre-upgrade host bundle answers without the field; the
    // client treats the absence as "fixed address unknown".
    fixedUrl: z.string().nullable().optional(),
});
/** Strict wire codec for the origin parameter (a plain absolute origin). */
export const ORIGIN_SCHEMA = z.string();
/**
 * The `webUrlView/current` invocation descriptor, shared verbatim by the
 * host `TYPERT` manifest and the client `TypertRemoteContribution`.
 * Hand-written in the exact shape the Typert generator emits; validated by
 * the typert loader and the client registry at mount time.
 */
export const CURRENT_URL_DESCRIPTOR = Object.freeze({
    id: 'dsh-web-url-view#webUrlView/current',
    service: 'webUrlView',
    namespace: 'webUrlView',
    method: 'current',
    invocation: Object.freeze({ kind: 'direct' }),
    parameters: Object.freeze([Object.freeze({
            name: 'origin',
            wire: 'origin',
            source: 'json',
            codec: Object.freeze({
                mode: 'strict',
                typeSymbol: 'dsh-web-url-view/types#origin',
                schema: ORIGIN_SCHEMA,
            }),
        })]),
    result: Object.freeze({
        mode: 'strict',
        typeSymbol: 'dsh-web-url-view/types#WebUrlViewResult',
        schema: WEB_URL_VIEW_RESULT_SCHEMA,
    }),
    sourceLocation: Object.freeze({ file: 'src/wire.ts', line: 1, column: 1 }),
});
/** Canonical invocation list of this package (host manifest + client Remote). */
export const WEB_URL_VIEW_INVOCATIONS = Object.freeze([
    CURRENT_URL_DESCRIPTOR,
]);
//# sourceMappingURL=wire.js.map