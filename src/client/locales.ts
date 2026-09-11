/**
 * Localized copy for the "View URL" settings section. The harness locale
 * registry accepts only the `en` | `zh` UI language codes today, so this
 * plugin ships those two dictionaries and follows the app's UI language.
 *
 * @module dsh-web-url-view/client/locales
 */

/** Chinese (simplified) copy — source of truth for every key. */
export const zh = {
  /** Left-side settings navigation label. */
  nav: '查看 URL',
  /** Page heading. */
  title: 'Web 访问地址',
  /** Fixed address row label. */
  fixedUrlLabel: '固定地址',
  /** Fixed address row guidance. */
  fixedUrlHint: '长期不变:桌面端重启后自动指向新会话,显示的是本机内网地址,同一局域网的设备也能访问。',
  /** Fixed address unavailable feedback. */
  fixedUnavailable: '暂不可用(被停用或端口被占用),详见 harness.log 中 [dsh-web-url-view] 日志。',
  /** Current (one-time) address row label. */
  currentUrlLabel: '当前地址(临时)',
  /** Current address row guidance. */
  currentUrlHint: '带会话令牌的一次性地址,桌面端每次重启都会变化,适用于临时发给需要访问的浏览器。',
  /** Copy button. */
  copy: '复制',
  /** Copy button after a successful copy. */
  copied: '已复制',
  /** Copy failure feedback. */
  copyFailed: '复制失败,请手动选中文本复制',
  /** Loading feedback. */
  loading: '获取中…',
  /** Load failure feedback. */
  loadFailed: '获取链接失败:{{message}}',
  /** Retry button shown after a load failure. */
  retry: '重试',
} as const

/** English copy mirroring {@link zh} key by key. */
export const en: Record<keyof typeof zh, string> = {
  nav: 'View URL',
  title: 'Web access addresses',
  fixedUrlLabel: 'Fixed address',
  fixedUrlHint: 'Never changes: it follows the desktop across restarts and shows this machine\u2019s LAN address, so other devices on the same network can open it too.',
  fixedUnavailable: 'Unavailable (disabled or the port is taken); see the [dsh-web-url-view] lines in harness.log.',
  currentUrlLabel: 'Current address (one-time)',
  currentUrlHint: 'A tokenized address for this session only; it changes on every desktop restart.',
  copy: 'Copy',
  copied: 'Copied',
  copyFailed: 'Copy failed — select the text to copy it manually',
  loading: 'Loading…',
  loadFailed: 'Could not fetch the links: {{message}}',
  retry: 'Retry',
}

/** Typed key union of every dictionary entry. */
export type WebUrlViewKey = keyof typeof zh
