/**
 * `dsh-web-url-view` — host entry. Mounts the `webUrlView` Typert Remote
 * service that mints the launch-token URL of the served Web GUI, and exposes
 * the same module as the package's `./typert` manifest (see
 * `src/typert.host.ts`). The browser half (`src/client/`) renders the
 * "View URL" settings section that consumes the namespace.
 *
 * Function plugin — no default export (the Loader unwraps
 * `exports.default ?? exports`).
 *
 * @module dsh-web-url-view
 */

import type { Context } from '@deepseek-ai/cordis'
import { WebUrlViewService } from './service.ts'
import { detectLanAddress } from './lan.ts'
import { TYPERT } from './typert.host.ts'
import { FixedEntryServer } from './fixed-entry.ts'

export const name = 'dsh-web-url-view'

export { TYPERT }

declare module '@deepseek-ai/cordis' {
  interface Context {
    /**
     * Harness web server facts (declared structurally: the owning package
     * types stay out of this bundle).
     */
    webServer: {
      /** Listen host of the served GUI. */
      host: string
      /** Listening port of the served GUI. */
      port: number
    }
  }
}

/** Default fixed-port forwarder bind port. */
const DEFAULT_FIXED_PORT = 47524
/** Default fixed entry bind interface: all interfaces, so other LAN devices can connect. */
const DEFAULT_FIXED_HOST = '0.0.0.0'

/** Plugin configuration; all fields optional (documented defaults). */
export interface Config {
  /** Fixed entry bind port; 0 disables the fixed address. Default 47524. */
  fixedPort?: number
  /** Fixed entry bind interface. Default 0.0.0.0 (all interfaces, LAN-reachable). */
  fixedHost?: string
}

/** The plugin declares no services of its own (the service class injects `connection`). */
export const inject: readonly string[] = []

/**
 * Mount the `webUrlView` service and the fixed-port forwarder once their
 * `connection`/`webServer` dependencies activate. The forwarder shares the
 * plugin's effect lifecycle: a harness restart recreates this process, which
 * rebinds the SAME fixed port and refreshes the session against the new
 * launch token automatically — that is what makes the fixed address stable.
 * @param ctx - plugin context.
 * @param config - optional plugin config (see {@link Config}).
 */
export async function apply(ctx: Context, config: Config | undefined): Promise<void> {
  const fixedPort = typeof config?.fixedPort === 'number' ? Math.trunc(config.fixedPort) : DEFAULT_FIXED_PORT
  const fixedHost = typeof config?.fixedHost === 'string' && config.fixedHost !== ''
    ? config.fixedHost
    : DEFAULT_FIXED_HOST

  await ctx.plugin(WebUrlViewService)
  console.info('[dsh-web-url-view] host mounted: webUrlView/current is available')

  if (fixedPort <= 0 || fixedPort > 65535) {
    console.info(`[dsh-web-url-view] fixed entry disabled (fixedPort=${String(fixedPort)})`)
    return
  }

  // The forwarder lives exactly as long as the plugin fiber that owns it.
  // The inject list includes 'webUrlView' on purpose: the service registers
  // through ctx.plugin() above, but its own `connection` dependency keeps its
  // fiber PENDING until the harness connection is actually provided — which
  // can be after apply() returned. Declaring it as an inject dependency makes
  // this callback run only once the service fiber is ACTIVE, so the strict
  // ctx.get() below is guaranteed to return the same global instance the
  // gateway dispatches to.
  ctx.inject(['connection', 'webServer', 'webUrlView'], (scope) => {
    scope.effect(() => {
      const serverPort = scope.webServer.port
      // 注入列表已包含 'webUrlView':回调仅在服务激活后执行,严格 get 必然命中。
      const service = ctx.get('webUrlView') as WebUrlViewService
      // Whatever the listen host (`127.0.0.1` or `0.0.0.0`), this process can
      // always reach its own server through loopback, and the harness trust
      // fence accepts a loopback Host — so loopback is the connect address
      // and the authority we name in forwarded headers.
      const connectHost = '127.0.0.1'
      // 对外展示主机名:探测内网 IP(优先默认路由网卡),供局域网设备访问;
      // 找不到可用的内网 IP 时回退到回环,保证本机总能通过固定地址打开。
      const advertiseHost = detectLanAddress() ?? '127.0.0.1'
      const entry = new FixedEntryServer(fixedHost, fixedPort, {
        authority: `${connectHost}:${String(serverPort)}`,
        hostname: connectHost,
        port: serverPort,
        advertiseHost,
        // Authenticate through the service instance (never through `scope`):
        // the inject scope is tied to this fiber and becomes inactive the
        // moment the plugin reloads, while the forwarder must keep serving
        // across requests. The service's own ctx stays live for the whole
        // mount.
        authenticate: () => service.mintFixedUrl(`http://${connectHost}:${String(serverPort)}`),
      })
      entry.start()
      if (service === undefined) {
        // Diagnostic: without the service the fixed URL can never be set.
        console.error('[dsh-web-url-view] attachFixed skipped: service is undefined')
        return async () => {
          await entry.close()
        }
      }
      try {
        service.attachFixed(entry)
      } catch (error) {
        // A throw here is invisible to harness.log (cordis sends it to
        // logger.error, not stdout): surface it on stdout with the full
        // message so one restart pinpoints the cause.
        console.error(`[dsh-web-url-view] attachFixed failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`)
      }
      return async () => {
        service.attachFixed(null)
        await entry.close()
      }
    }, 'dsh-web-url-view: fixed entry')
  })
}
