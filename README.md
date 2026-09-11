# dsh-web-url-view

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![dsh](https://img.shields.io/badge/dsh-%3E%3D0.1.2--rc.1-4c6ef5.svg)](https://github.com/deepseek-ai/deepseek-harness)
[![topic](https://img.shields.io/badge/topic-dsh--plugin-8a2be2.svg)](https://github.com/topics/dsh-plugin)

English | [中文](README.zh.md)

Adds a **View URL** page to the left menu of **Settings** in DSH Desktop
(DeepSeek Harness desktop) and in any `dsh web` GUI running the same profile.
The page shows two Web GUI addresses, and the fixed one is **stable across
restarts and reachable from other devices on the same LAN**.

- **Fixed address** (bookmark this): `http://<LAN-IP>:47524/`, e.g.
  `http://192.168.1.88:47524/` — it stays the same no matter how often the
  desktop restarts or how the port and launch token rotate.
- **Current address (one-time)**: the tokenized URL of the running session,
  which changes on every desktop restart.

## Why it exists

The desktop picks a random Web port and a per-process launch token on every
start (the token is a replay-protection secret). The native URL therefore
changes constantly, so it cannot be bookmarked or kept on a phone. The token
should not — and cannot — be pinned, so this plugin pins the **entry point**
instead: an in-process fixed-port forwarder holds one stable address and
performs the authentication handshake against the current session by itself.

## Install

### 1. Plugin market (recommended, once listed)

```sh
dsh plugin --profile web add dshmarket
```

Restart, then search `web-url-view` in **Settings → Plugin Market** and install
with one click.

### 2. From GitHub

```sh
dsh plugin --profile web add github:1032740078/dsh-web-url-view
```

The repository ships **prebuilt artifacts** (`lib/`), so install runs no build
script (pnpm ≥10 blocks them by default anyway).

### 3. Local development

1. Edit `~/Library/Application Support/dsh-desktop/harness/profiles/web/package.json`:
   - add to `dependencies` (use your own absolute path):
     ```json
     "dsh-web-url-view": "link:/absolute/path/to/dsh-web-url-view"
     ```
   - append `"dsh-web-url-view"` to `dsh.profile.bundles`
2. Quit and reopen DSH Desktop (startup heals the profile and applies the
   bundle patch).
3. Open **Settings → View URL**.

## Verify the install

Open **Settings → View URL**; you should see two rows:

| Row | Expected |
| --- | --- |
| Fixed address | `http://<your-LAN-IP>:47524/`, unchanged after restarting the desktop |
| Current address (one-time) | `http://127.0.0.1:<random-port>/?token=<random>`, new on every restart |

Copy the fixed address onto your phone or another device on the same LAN — the
Web GUI should open.

## How it works

The **fixed address is an in-process fixed-port forwarder**
(`FixedEntryServer`), running entirely inside the plugin's host half:

- It binds `0.0.0.0:47524` (configurable) as a reverse proxy and advertises the
  machine's LAN IP.
- It targets the CURRENT harness instance: on the first request it performs the
  same `?token=` handshake a browser would, using the in-process launch token,
  and holds the browser-session cookie internally — tokens and cookies never
  leave the process or reach a browser.
- After a desktop restart the new harness process rebinds the SAME fixed port
  and refreshes the session against the new launch token, so the address never
  changes from a browser's point of view.
- Both plain HTTP and WebSocket upgrades (`/api/remote.mux`, the live session
  channel) are forwarded; `Host`/`Origin` are rewritten per the harness trust
  fence, and response `Set-Cookie` headers are absorbed by the forwarder so they
  never pollute the browser's cookie jar.
- The one-time address still uses the original `webUrlView/current` RPC backed
  by the host's `connection.authenticatedUrl()` — the same function the `dsh web`
  supervisor uses to print its startup URL.

## Configuration (port / bind host / off switch)

Default fixed port `47524`, bound to `0.0.0.0` (all interfaces). To change the
port, restrict the bind, or disable the fixed address, override the row config in
the desktop profile's `cordis.patch.yml` and restart the desktop:

```yaml
- id: web-url-view
  name: dsh-web-url-view
  config:
    # Fixed entry listen port; 0 disables the fixed address. Default 47524.
    fixedPort: 47524
    # Bind interface. Default 0.0.0.0 (all interfaces, LAN-reachable); use 127.0.0.1 for localhost only.
    fixedHost: 0.0.0.0
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `fixedPort` | number | `47524` | Fixed entry listen port. `0` or an invalid value (>65535) disables the fixed address, leaving only the one-time address. |
| `fixedHost` | string | `0.0.0.0` | Fixed entry bind interface. `0.0.0.0` = all interfaces (LAN-reachable); `127.0.0.1` = localhost only. |

The LAN address is **auto-detected**: it prefers the IPv4 of the default-route
interface and skips loopback, link-local (`169.254.*`) and common virtual
interfaces (docker/veth/vmnet/utun/…). When nothing usable is found it falls
back to `127.0.0.1`, so localhost keeps working.

## Security boundary (important)

The fixed entry **holds a session cookie inside the proxy**, therefore:

- With the default `0.0.0.0` bind, **any device on the same LAN can open the Web
  GUI, with no extra password.** That default exists to serve the "open it on my
  phone" use case.
- Use it on trusted LANs only. On public or shared networks set
  `fixedHost: 127.0.0.1` (localhost only) or `fixedPort: 0` (disable the fixed
  address entirely).
- The forwarder listens on the fixed port and nothing else: it opens no extra
  API and never writes browser cookies.

## Troubleshooting

Log lines are prefixed with `[dsh-web-url-view]`:

- macOS: `~/Library/Logs/DSH Desktop/harness.log`
- Windows: `%APPDATA%\DSH Desktop\Logs\harness.log`

| Symptom | What to check |
| --- | --- |
| Fixed address shows "unavailable" | Port already taken → change `fixedPort`; or `fixedPort` is `0` |
| No "View URL" entry in Settings | `dsh.profile.bundles` in the profile `package.json` must list `dsh-web-url-view` |
| Fixed address will not open | Find `fixed entry listening on ...` in the log — it reports the bind result and the advertised address |
| Desktop exits unexpectedly | Search the log for `unhandled rejection` and paste the stack carrying the `lib/index.js` line number into an issue |

## Repository layout

```
src/                  Plugin sources (TypeScript)
  index.ts            apply(): mounts the service and the fixed-entry forwarder
  service.ts          webUrlView Typert Remote service (returns both addresses)
  fixed-entry.ts      Fixed-port reverse proxy (HTTP + WebSocket, internal handshake)
  lan.ts              LAN IPv4 detection (prefers the default-route interface)
  wire.ts             RPC descriptor + zod codecs shared by host and client
  typert.host.ts      TYPERT manifest
  client/             Settings-page UI (React + CSS Modules + zh/en dictionaries)
lib/                  Prebuilt artifacts (committed so github: installs need no build)
  index.js            Host bundle (zero bare imports, node builtins only)
  client.js           Browser bundle (module-loader format, react as the only external)
  types/**            Type declarations emitted by tsc
cordis.patch.yml      Bundle patch: inserts the web-url-view row into the profile
tsconfig.json         Build config (valid only inside the harness monorepo, see below)
tsdown.config.ts      Build config (same)
```

## Rebuilding from source

`src/` is the complete readable source. `tsconfig.json` and `tsdown.config.ts`
reuse the deepseek-harness monorepo's shared UI-plugin preset
(`packages/client/tsdown.client.ts`, which owns CSS Modules compilation, the
bundle-purity gate and the module-loader wrapper), so a build **requires the
harness checkout**:

```sh
# 1. Clone the harness sources
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness

# 2. Place this repository at the conventional path
git clone https://github.com/1032740078/dsh-web-url-view.git packages/client/dsh-web-url-view

# 3. Install and build (tsc emits types, tsdown emits both bundles)
pnpm install
pnpm --filter dsh-web-url-view typecheck   # tsc -b
pnpm --filter dsh-web-url-view bundle      # tsdown
```

Artifacts land in `packages/client/dsh-web-url-view/lib/`. After changing either
half, sync the new `lib/` back into your plugin directory and restart the desktop.

## Compatibility

- Requires DSH `>=0.1.2-rc.1` (`engines.dsh` in `package.json`); developed and
  verified against that version.
- Host capabilities used: `connection.authenticatedUrl()`, `webServer.port`, the
  `settings.section` slot, and Typert Remote
  (`@deepseek-ai/dsh-typert-protocol`).
- The browser bundle externalizes `react` only; the host bundle has zero bare
  imports (every runtime value is inlined).

## License

[MIT](LICENSE) © RobinLiang

