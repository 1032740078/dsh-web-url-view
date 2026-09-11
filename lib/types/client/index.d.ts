/**
 * `dsh-web-url-view`, browser half: mounts the `webUrlView` Remote
 * contribution, then registers the "View URL" page into the settings
 * section list (`settings.section`, id `web-url-view`). All data arrives
 * through the `remote.webUrlView` namespace — the section issues no other
 * RPC and holds no state beyond the last fetched URL.
 *
 * @module dsh-web-url-view/client
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis';
import { type WebUrlViewKey } from './locales.ts';
export type { WebUrlSectionInjected, WebUrlSectionProps } from './WebUrlSection.tsx';
export type { WebUrlViewKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** "View URL" settings page copy. */
        'settings.webUrlView': WebUrlViewKey;
    }
}
/** Dictionary namespace owned by this plugin. */
export declare const NS = "settings.webUrlView";
/** Plugin name: matches the package name, the graph row id, and the bundle id. */
export declare const name = "dsh-web-url-view";
/** Services the section reads; `remote.webUrlView` appears once this plugin mounts its contribution. */
export declare const inject: string[];
/**
 * Browser plugin body: dictionaries, the Remote contribution mount, and the
 * settings section registration.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): Promise<void>;
//# sourceMappingURL=index.d.ts.map