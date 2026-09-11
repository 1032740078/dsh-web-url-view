/**
 * The client-side Remote face of the `webUrlView` namespace: the hand-written
 * `TypertRemoteContribution` mounted through `ctx.remote.$mount`, plus the
 * declaration merging that types `ctx.remote.webUrlView`. The descriptor
 * list is shared with the host `./typert` manifest (`../wire.ts`), so the
 * two faces can never drift.
 *
 * @module dsh-web-url-view/client/remote
 */
import { WEB_URL_VIEW_INVOCATIONS } from "../wire.js";
/** The client Remote contribution for the `webUrlView` namespace. */
export const WEB_URL_VIEW_REMOTE = Object.freeze({
    package: 'dsh-web-url-view',
    descriptors: WEB_URL_VIEW_INVOCATIONS,
});
//# sourceMappingURL=remote.js.map