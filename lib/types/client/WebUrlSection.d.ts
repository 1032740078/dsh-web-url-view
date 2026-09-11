/**
 * The "View URL" settings section: shows the two addresses of the Web GUI —
 * the stable fixed entry and the current tokenized one — as selectable text
 * with per-row copy buttons. All copy is localized; every interaction is a
 * one-shot RPC read or clipboard feedback — the section holds no
 * subscription state.
 *
 * @module dsh-web-url-view/client/WebUrlSection
 */
import type { WebUrlViewResult } from '../wire.ts';
import type { WebUrlViewKey } from './locales.ts';
/** Registration-side injected face: the one RPC this page needs. */
export interface WebUrlSectionInjected {
    /** Read the current fixed + tokenized addresses from the host. */
    readUrl: () => Promise<WebUrlViewResult>;
}
/** Full component props assembled by the settings-section renderer. */
export interface WebUrlSectionProps extends WebUrlSectionInjected {
    /** Close the settings panel (shell-owned affordance). */
    close: () => void;
    /** Locale seat bound to this entry's dictionary namespace. */
    t: (key: WebUrlViewKey) => string;
}
/** Render the section content. */
export declare function WebUrlSection({ readUrl, t }: WebUrlSectionProps): React.ReactElement;
//# sourceMappingURL=WebUrlSection.d.ts.map