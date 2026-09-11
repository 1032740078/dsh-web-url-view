/**
 * Localized copy for the "View URL" settings section. The harness locale
 * registry accepts only the `en` | `zh` UI language codes today, so this
 * plugin ships those two dictionaries and follows the app's UI language.
 *
 * @module dsh-web-url-view/client/locales
 */
/** Chinese (simplified) copy — source of truth for every key. */
export declare const zh: {
    /** Left-side settings navigation label. */
    readonly nav: "查看 URL";
    /** Page heading. */
    readonly title: "Web 访问地址";
    /** Fixed address row label. */
    readonly fixedUrlLabel: "固定地址";
    /** Fixed address row guidance. */
    readonly fixedUrlHint: "长期不变:桌面端重启后自动指向新会话,显示的是本机内网地址,同一局域网的设备也能访问。";
    /** Fixed address unavailable feedback. */
    readonly fixedUnavailable: "暂不可用(被停用或端口被占用),详见 harness.log 中 [dsh-web-url-view] 日志。";
    /** Current (one-time) address row label. */
    readonly currentUrlLabel: "当前地址(临时)";
    /** Current address row guidance. */
    readonly currentUrlHint: "带会话令牌的一次性地址,桌面端每次重启都会变化,适用于临时发给需要访问的浏览器。";
    /** Copy button. */
    readonly copy: "复制";
    /** Copy button after a successful copy. */
    readonly copied: "已复制";
    /** Copy failure feedback. */
    readonly copyFailed: "复制失败,请手动选中文本复制";
    /** Loading feedback. */
    readonly loading: "获取中…";
    /** Load failure feedback. */
    readonly loadFailed: "获取链接失败:{{message}}";
    /** Retry button shown after a load failure. */
    readonly retry: "重试";
};
/** English copy mirroring {@link zh} key by key. */
export declare const en: Record<keyof typeof zh, string>;
/** Typed key union of every dictionary entry. */
export type WebUrlViewKey = keyof typeof zh;
//# sourceMappingURL=locales.d.ts.map