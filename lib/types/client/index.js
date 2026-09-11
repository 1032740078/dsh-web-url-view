/**
 * `dsh-web-url-view`, browser half: mounts the `webUrlView` Remote
 * contribution, then registers the "View URL" page into the settings
 * section list (`settings.section`, id `web-url-view`). All data arrives
 * through the `remote.webUrlView` namespace — the section issues no other
 * RPC and holds no state beyond the last fetched URL.
 *
 * @module dsh-web-url-view/client
 */
import { WebUrlSection } from "./WebUrlSection.js";
import { en, zh } from "./locales.js";
import { WEB_URL_VIEW_REMOTE } from "./remote.js";
/** Dictionary namespace owned by this plugin. */
export const NS = 'settings.webUrlView';
/** Plugin name: matches the package name, the graph row id, and the bundle id. */
export const name = 'dsh-web-url-view';
/** Services the section reads; `remote.webUrlView` appears once this plugin mounts its contribution. */
export const inject = ['slots', 'locale', 'remote'];
/**
 * Browser plugin body: dictionaries, the Remote contribution mount, and the
 * settings section registration.
 * @param ctx - client root context.
 */
export async function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-web-url-view: dictionaries');
    // $mount registers the 'remote.webUrlView' namespace service and owns its
    // removal for this fiber's lifetime.
    await ctx.remote.$mount(WEB_URL_VIEW_REMOTE);
    ctx.inject(['remote.webUrlView'], (scope) => {
        // The slots service owner moved across harness lines; read it through the
        // local structural contract so both lines compile against the same shape.
        const slots = scope.get('slots');
        const t = scope.locale.bind(NS);
        const unwrap = (result, method) => {
            if (!result.ok) {
                throw new Error(`webUrlView.${method} failed: ${result.error.code}: ${result.error.message}`);
            }
            return result.value;
        };
        const readUrl = async () => unwrap(await scope.remote.webUrlView.current(window.location.origin), 'current');
        slots.inject('settings.section', () => slots.register({
            name: 'settings.section',
            id: 'web-url-view',
            // After the built-in sections; the shell sorts ascending.
            order: 200,
            label: () => t('nav'),
            locale: NS,
            inject: () => ({ readUrl }),
        }, WebUrlSection));
    });
}
//# sourceMappingURL=index.js.map