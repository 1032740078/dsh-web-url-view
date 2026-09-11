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

import { WEB_URL_VIEW_INVOCATIONS } from './wire.ts'

/** Host Typert manifest (validated by `@deepseek-ai/dsh-typert-loader`). */
export const TYPERT = Object.freeze({
  package: 'dsh-web-url-view',
  face: 'host',
  schemas: Object.freeze([]),
  invocations: WEB_URL_VIEW_INVOCATIONS,
  model: Object.freeze({
    services: Object.freeze([]),
    events: Object.freeze([]),
    objects: Object.freeze([]),
  }),
})
