/**
 * `dsh-web-url-view` — host entry. Mounts the `webUrlView` Typert Remote
 * service that mints the launch-token URL of the served Web GUI, and exposes
 * the same module as the package's `./typert` manifest (see
 * `src/typert.host.ts`). The browser half (`src/client/`) renders the
 * "View URL" settings section that consumes the namespace.
 *
 * Function plugin — no default export (the Loader unwraps
 * `exports.default ?? exports`).
 *
 * @module dsh-web-url-view
 */
import type { Context } from '@deepseek-ai/cordis';
import { TYPERT } from './typert.host.ts';
export declare const name = "dsh-web-url-view";
export { TYPERT };
declare module '@deepseek-ai/cordis' {
    interface Context {
        /**
         * Harness web server facts (declared structurally: the owning package
         * types stay out of this bundle).
         */
        webServer: {
            /** Listen host of the served GUI. */
            host: string;
            /** Listening port of the served GUI. */
            port: number;
        };
    }
}
/** Plugin configuration; all fields optional (documented defaults). */
export interface Config {
    /** Fixed entry bind port; 0 disables the fixed address. Default 47524. */
    fixedPort?: number;
    /** Fixed entry bind interface. Default 0.0.0.0 (all interfaces, LAN-reachable). */
    fixedHost?: string;
}
/** The plugin declares no services of its own (the service class injects `connection`). */
export declare const inject: readonly string[];
/**
 * Mount the `webUrlView` service and the fixed-port forwarder once their
 * `connection`/`webServer` dependencies activate. The forwarder shares the
 * plugin's effect lifecycle: a harness restart recreates this process, which
 * rebinds the SAME fixed port and refreshes the session against the new
 * launch token automatically — that is what makes the fixed address stable.
 * @param ctx - plugin context.
 * @param config - optional plugin config (see {@link Config}).
 */
export declare function apply(ctx: Context, config: Config | undefined): Promise<void>;
//# sourceMappingURL=index.d.ts.map