import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * The "View URL" settings section: shows the two addresses of the Web GUI —
 * the stable fixed entry and the current tokenized one — as selectable text
 * with per-row copy buttons. All copy is localized; every interaction is a
 * one-shot RPC read or clipboard feedback — the section holds no
 * subscription state.
 *
 * @module dsh-web-url-view/client/WebUrlSection
 */
import { useEffect, useId, useRef, useState } from 'react';
import css from './WebUrlSection.module.css';
/** Legacy copy fallback (Chromium keeps `execCommand` for user gestures). */
function legacyCopy(value) {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    let copied = false;
    try {
        copied = document.execCommand('copy');
    }
    catch {
        copied = false;
    }
    finally {
        textarea.remove();
    }
    return copied;
}
/** One address row: label + hint + read-only input + copy button. */
function UrlRow(props) {
    const { id, label, hint, value, unavailable, copy, copied, copyFailed } = props;
    const [flash, setFlash] = useState('idle');
    // One armed reset timer at a time; cleared on unmount.
    const resetTimer = useRef(undefined);
    useEffect(() => () => {
        if (resetTimer.current !== undefined)
            clearTimeout(resetTimer.current);
    }, []);
    /** Arm the two-second "已复制" feedback then restore the idle label. */
    const flashCopied = () => {
        setFlash('copied');
        if (resetTimer.current !== undefined)
            clearTimeout(resetTimer.current);
        resetTimer.current = setTimeout(() => {
            setFlash('idle');
        }, 2000);
    };
    /** Copy through the Clipboard API, falling back to selection copy. */
    const copyValue = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            flashCopied();
            return;
        }
        catch {
            // Fall through to the legacy path (non-secure contexts, denied grants).
        }
        if (legacyCopy(text)) {
            flashCopied();
        }
        else {
            setFlash('failed');
        }
    };
    return (_jsxs("div", { className: css.block, children: [_jsx("p", { className: css.fieldLabel, id: id, children: label }), _jsxs("div", { className: css.row, children: [_jsx("input", { "aria-labelledby": id, className: css.url, type: "text", readOnly: true, value: value, placeholder: unavailable, 
                        // Selecting on focus makes the manual copy path one click away.
                        onFocus: (event) => event.currentTarget.select(), spellCheck: false }), _jsx("button", { type: "button", className: css.action, onClick: () => { void copyValue(value); }, children: flash === 'copied' ? copied : copy })] }), _jsx("p", { className: css.blockHint, children: flash === 'failed' ? copyFailed : hint })] }));
}
/** Render the section content. */
export function WebUrlSection({ readUrl, t }) {
    const sectionId = useId();
    const [state, setState] = useState({ status: 'loading' });
    const [reload, setReload] = useState(0);
    // Fetch the addresses once per mount and per manual reload.
    useEffect(() => {
        let current = true;
        setState({ status: 'loading' });
        void Promise.resolve()
            .then(() => readUrl())
            .then((result) => {
            if (!current)
                return;
            setState({ status: 'ready', result });
        }, (error) => {
            if (!current)
                return;
            const message = error instanceof Error ? error.message : String(error);
            setState({ status: 'error', message });
        });
        return () => {
            current = false;
        };
    }, [readUrl, reload]);
    const retry = () => {
        setReload(value => value + 1);
    };
    return (_jsxs("section", { className: css.section, "aria-labelledby": sectionId, children: [_jsx("h2", { className: css.heading, id: sectionId, children: t('title') }), state.status === 'loading' && (_jsx("p", { className: css.status, children: t('loading') })), state.status === 'error' && (_jsxs("div", { className: css.errorBox, children: [_jsx("p", { className: css.status, children: t('loadFailed').replace('{{message}}', state.message) }), _jsx("button", { type: "button", className: css.action, onClick: retry, children: t('retry') })] })), state.status === 'ready' && (_jsxs(_Fragment, { children: [_jsx(UrlRow, { id: `${sectionId}-fixed`, label: t('fixedUrlLabel'), hint: t('fixedUrlHint'), value: state.result.fixedUrl ?? '', unavailable: t('fixedUnavailable'), copy: t('copy'), copied: t('copied'), copyFailed: t('copyFailed') }), _jsx(UrlRow, { id: `${sectionId}-current`, label: t('currentUrlLabel'), hint: t('currentUrlHint'), value: state.result.url, unavailable: '', copy: t('copy'), copied: t('copied'), copyFailed: t('copyFailed') })] }))] }));
}
//# sourceMappingURL=WebUrlSection.js.map