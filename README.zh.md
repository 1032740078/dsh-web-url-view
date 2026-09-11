# dsh-web-url-view

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![dsh](https://img.shields.io/badge/dsh-%3E%3D0.1.2--rc.1-4c6ef5.svg)](https://github.com/deepseek-ai/deepseek-harness)
[![topic](https://img.shields.io/badge/topic-dsh--plugin-8a2be2.svg)](https://github.com/topics/dsh-plugin)

[English](README.md) | 中文

在 DSH Desktop（DeepSeek Harness 桌面端）的 **设置 → 左侧菜单** 中新增一个「查看 URL」页面，
提供两条 Web 界面访问地址，其中**固定地址长期不变，且同一局域网的其它设备也能直接打开**。

- **固定地址**（推荐收藏）：`http://<内网IP>:47524/`，例如 `http://192.168.1.88:47524/`
  桌面端重启多少次、端口与 token 怎么变，这条地址都照常可用。
- **当前地址（临时）**：带启动 token 的一次性地址，每次重启都会变化，适合临时发给某个浏览器。

## 为什么需要它

DSH Desktop 每次启动都会随机分配 Web 端口和一次性启动 token（防重放的进程级机密），
所以官方打印的访问链接**每次都不一样**，没法收藏、也没法在手机上长期使用。
token 本身不应该、也不可能被固定 —— 本插件改而固定**入口**：用一个进程内的固定端口转发器
长期占住同一个地址，让它自己去跟当前会话完成鉴权握手。

## 安装

### 方式一：插件市场（推荐，审核收录后可用）

```sh
dsh plugin --profile web add dshmarket
```

重启后在 **设置 → 插件市场** 搜索 `web-url-view`，一键安装。

### 方式二：从 GitHub 安装

```sh
dsh plugin --profile web add github:1032740078/dsh-web-url-view
```

仓库内已包含**预构建产物**（`lib/`），因此安装时无需执行任何构建脚本（pnpm ≥10 默认也禁止执行）。

### 方式三：本地开发接入

1. 编辑 `~/Library/Application Support/dsh-desktop/harness/profiles/web/package.json`：
   - `dependencies` 增加一行（路径按实际位置）：
     ```json
     "dsh-web-url-view": "link:/绝对路径/dsh-web-url-view"
     ```
   - `dsh.profile.bundles` 数组追加 `"dsh-web-url-view"`
2. 完全退出并重新打开 DSH Desktop（启动时 heal profile 并应用 bundle 补丁）。
3. 打开 **设置 → 查看 URL** 验证。

## 验证安装成功

打开 **设置 → 查看 URL**，应当看到两行：

| 行 | 期望 |
| --- | --- |
| 固定地址 | `http://<本机内网IP>:47524/`，重启桌面端后**保持不变** |
| 当前地址（临时） | `http://127.0.0.1:<随机端口>/?token=<随机串>`，每次重启都变 |

固定地址复制到手机或另一台同局域网设备上打开，应当能正常进入 Web 界面。

## 工作原理

**固定地址 = 进程内的固定端口转发器**（`FixedEntryServer`）：

- Host 端在 `0.0.0.0:47524`（可配置）起一个反向代理，对外显示本机内网 IP；
- 它实时指向**当前** harness 实例：首次请求时用进程内 launch token 自动完成 `?token=` 握手，
  并把浏览器会话 cookie 存在代理内部 —— token 与目标 cookie 都不出进程，浏览器永远看不到；
- 桌面端重启 → 新 harness 进程 → 插件重新绑定**同一个固定端口**并自动换新会话，
  对浏览器而言地址从未变过；
- 转发覆盖普通 HTTP 与 WebSocket（`/api/remote.mux`，会话实时通道）；
  转发时按 harness 信任围栏的要求改写 `Host`/`Origin`，并把响应 `Set-Cookie` 收进代理内部，
  不污染浏览器 cookie。
- 「当前地址」走 `webUrlView/current` RPC：复用宿主 `connection.authenticatedUrl()`，
  与桌面端打印的官方链接一致。

## 配置（端口 / 绑定地址 / 开关）

默认固定端口 `47524`，绑定 `0.0.0.0`（所有网卡）。如需改端口、关闭或仅绑定回环，
在桌面 profile 的 `cordis.patch.yml` 中整行覆盖该插件行的 config（编辑后重启桌面端）：

```yaml
- id: web-url-view
  name: dsh-web-url-view
  config:
    # 固定入口监听端口；0 = 关闭固定地址。默认 47524。
    fixedPort: 47524
    # 绑定接口。默认 0.0.0.0（所有网卡，局域网可访问）；仅本机使用可改 127.0.0.1。
    fixedHost: 0.0.0.0
```

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `fixedPort` | number | `47524` | 固定入口监听端口。`0` 或不合法值（>65535）= 关闭固定地址，设置页只显示临时地址。 |
| `fixedHost` | string | `0.0.0.0` | 固定入口绑定接口。`0.0.0.0` = 所有网卡（局域网可访问）；`127.0.0.1` = 仅本机。 |

内网地址是**自动探测**的：优先取默认路由所在网卡的 IPv4，排除回环、link-local（`169.254.*`）
与常见虚拟网卡（docker/veth/vmnet/utun 等）；探测不到时回退 `127.0.0.1`（本机仍可用）。

## 安全边界（重要）

固定入口在**代理内部持有会话 cookie**，所以：

- 绑定 `0.0.0.0`（默认）时，**同一局域网的任何设备都能打开 Web 界面，没有额外密码**。
  这是为了满足「用手机访问」的需求而做的默认选择。
- 只在可信局域网使用。公网 / 共享网络环境请改为 `fixedHost: 127.0.0.1`（仅本机），
  或设 `fixedPort: 0` 完全关闭固定地址。
- 转发器只监听固定端口本身；不额外开放任何 API，也不写入浏览器 cookie。

## 日志与排错

日志前缀 `[dsh-web-url-view]`：

- macOS：`~/Library/Logs/DSH Desktop/harness.log`
- Windows：`%APPDATA%\DSH Desktop\Logs\harness.log`

| 现象 | 排查方向 |
| --- | --- |
| 固定地址显示「暂不可用」 | 端口被占用 → 换 `fixedPort`；或 `fixedPort` 被设为 0 |
| 设置页没有「查看 URL」这一项 | 检查 profile `package.json` 的 `dsh.profile.bundles` 是否包含 `dsh-web-url-view` |
| 固定地址打不开 | 看日志里 `fixed entry listening on ...` 一行确认绑定结果与 advertised 地址 |
| 桌面端异常退出 | 日志搜 `unhandled rejection`，把带 `lib/index.js` 行号的堆栈贴到 issue |

## 仓库结构

```
src/                  插件源码（TypeScript）
  index.ts            apply():装配服务与固定入口转发器
  service.ts          webUrlView Typert Remote 服务（返回两条地址）
  fixed-entry.ts      固定端口反向代理（HTTP + WebSocket 转发、内部握手）
  lan.ts              内网 IP 探测（优先默认路由网卡）
  wire.ts             host/client 共用的 RPC 描述与 zod codec
  typert.host.ts      TYPERT manifest
  client/             设置页 UI（React + CSS Modules + 中英文字典）
lib/                  预构建产物（入库：让 github: 安装无需构建）
  index.js            Host 端 bundle（零裸导入，仅依赖 node 内建）
  client.js           浏览器端 bundle（module-loader 格式，仅外部引用 react）
  types/**            tsc 生成的类型声明
cordis.patch.yml      bundle 补丁：向 profile 插入 web-url-view 插件行
tsconfig.json         构建配置（仅在 harness 单仓内有效，见下）
tsdown.config.ts      构建配置（同上）
```

## 从源码重建

`src/` 是完整可读源码；`tsconfig.json` 与 `tsdown.config.ts` 复用 deepseek-harness 单仓的
共享 UI 插件预设（`packages/client/tsdown.client.ts`，内含 CSS Modules 编译、bundle 纯净度
校验与 module-loader 封装），因此**必须放回 harness 单仓内才能构建**：

```sh
# 1. 克隆 harness 源码
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness

# 2. 把本仓库放到约定位置
git clone https://github.com/1032740078/dsh-web-url-view.git packages/client/dsh-web-url-view

# 3. 安装依赖并构建（tsc 出类型 + tsdown 出两个 bundle）
pnpm install
pnpm --filter dsh-web-url-view typecheck   # tsc -b
pnpm --filter dsh-web-url-view bundle      # tsdown
```

产物在 `packages/client/dsh-web-url-view/lib/`。改完 `src/` 任一侧后，
把新的 `lib/` 同步回插件目录并重启桌面端即生效。

## 兼容性

- 需要 DSH `>=0.1.2-rc.1`（`package.json` 的 `engines.dsh`），开发与验证基于该版本。
- 依赖的宿主能力：`connection.authenticatedUrl()`、`webServer.port`、`settings.section` 槽位、
  Typert Remote（`@deepseek-ai/dsh-typert-protocol`）。
- 浏览器端只外部引用 `react`；Host 端零裸导入（所有 runtime 值已内联）。

## License

[MIT](LICENSE) © RobinLiang

