/**
 * The hand-written Typert HOST manifest for `dsh-web-url-view`, exported as
 * `./typert` so the harness typert-loader registers the `webUrlView`
 * invocation automatically when this plugin mounts. Same shape as generator
 * output (validated by the loader): package face, no model/schemas, and the
 * canonical invocation list shared with the client Remote contribution
 * (`src/client/remote.ts`).
 *
 * The manifest rides the same bundle as the host entry (`./typert` maps to
 * `./lib/index.js`), so mounting this package activates both the plugin and
 * its wire vocabulary in one artifact.
 *
 * @module dsh-web-url-view/typert
 */
/** Host Typert manifest (validated by `@deepseek-ai/dsh-typert-loader`). */
export declare const TYPERT: Readonly<{
    package: "dsh-web-url-view";
    face: "host";
    schemas: readonly never[];
    invocations: readonly Readonly<{
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
    model: Readonly<{
        services: readonly never[];
        events: readonly never[];
        objects: readonly never[];
    }>;
}>;
//# sourceMappingURL=typert.host.d.ts.map