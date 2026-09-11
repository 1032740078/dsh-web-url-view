/**
 * The client-side Remote face of the `webUrlView` namespace: the hand-written
 * `TypertRemoteContribution` mounted through `ctx.remote.$mount`, plus the
 * declaration merging that types `ctx.remote.webUrlView`. The descriptor
 * list is shared with the host `./typert` manifest (`../wire.ts`), so the
 * two faces can never drift.
 *
 * @module dsh-web-url-view/client/remote
 */
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol';
import type { WebUrlViewResult } from '../wire.ts';
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespace$webUrlView {
        /** Mint the current launch-token URL for this page's origin. */
        current: (origin: string) => Promise<RemoteResult<WebUrlViewResult>>;
    }
    interface TypertRemoteMap {
        'webUrlView/current': (origin: string) => Promise<RemoteResult<WebUrlViewResult>>;
    }
    interface TypertRemoteNamespaceMap {
        webUrlView: TypertRemoteNamespace$webUrlView;
    }
}
/** The client Remote contribution for the `webUrlView` namespace. */
export declare const WEB_URL_VIEW_REMOTE: Readonly<{
    package: string;
    descriptors: readonly Readonly<{
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
                schema: import("zod").ZodString;
            }>;
        }>[];
        readonly result: Readonly<{
            mode: "strict";
            typeSymbol: "dsh-web-url-view/types#WebUrlViewResult";
            schema: import("zod").ZodObject<{
                url: import("zod").ZodString;
                fixedUrl: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            }, import("zod/v4/core").$strip>;
        }>;
        readonly sourceLocation: Readonly<{
            file: "src/wire.ts";
            line: 1;
            column: 1;
        }>;
    }>[];
}>;
//# sourceMappingURL=remote.d.ts.map