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
import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { WebUrlViewResult } from './wire.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        /**
         * Browser-session connection host service (declared structurally: the
         * owning package types stay out of this bundle).
         */
        connection: {
            /** Add this process's launch token to the ordinary application URL. */
            authenticatedUrl(baseUrl: string): string;
        };
    }
}
/** Stable per-instance tag for diagnostics (`#1`, `#2`, ...). */
export declare function instanceId(service: WebUrlViewService): string;
/**
 * The `webUrlView` Remote service: mints the current authenticated GUI URL
 * for one trusted browser origin.
 */
/** Surface of the fixed-port forwarder the service reports; owned by the plugin body. */
export interface FixedEntryFace {
    /** Stable entry URL once the forwarder is listening, else null. */
    readonly url: string | null;
}
export declare class WebUrlViewService extends TypertRemoteService {
    /** Hard service dependency: the browser-session connection host. */
    static inject: string[];
    /** In-process fixed-port forwarder attached by the plugin body, if any. */
    private fixed;
    /** Unique per-instance id for diagnostics (see `instanceId`). */
    readonly __instanceId: number;
    /**
     * @param ctx - context carrying the `connection` service.
     */
    constructor(ctx: Context);
    /**
     * Attach (or detach) the fixed-port forwarder whose status the service
     * reports. Called by the plugin body under its own effect lifecycle.
     * @param fixed - forwarder face, or null when disabled or stopped.
     */
    attachFixed(fixed: FixedEntryFace | null): void;
    /**
     * Mint the launch-token URL for the origin the browser reported.
     * Read-only: touches no configuration and mutates no registry.
     * @param origin - absolute origin from `window.location.origin`.
     * @returns the tokenized root URL, externally openable in any browser.
     */
    current(origin: string): WebUrlViewResult;
    /**
     * Mint the authenticated URL for the fixed-port forwarder's handshake.
     * Read-only like `current()` but without logging and without re-checking
     * the origin (the forwarder only ever asks for its own loopback server).
     * Reads `connection` through the service's own ctx — never through a
     * plugin scope, which may be disposed while the forwarder keeps serving.
     * @param origin - the forwarder's own absolute loopback origin.
     * @returns the tokenized root URL for that origin.
     */
    mintFixedUrl(origin: string): string;
}
//# sourceMappingURL=service.d.ts.map