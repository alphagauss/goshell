# MIGRATION_NOTES

Last updated: 2026-06-16

## 目标

本项目目标是把 `D:\opensource\qssh\` 完整迁移到当前仓库 `D:\project\goshell\`：

- 后端继续使用 Go，项目结构整理到 `internal/` 下，例如 `internal/ai/`、`internal/cloud/`、`internal/ssh/`、`internal/wailsapi/`。
- Wails 桌面配置先平移，保持窗口、托盘、运行时绑定等基础行为可用。
- 前端从 Vue 迁移为 React，技术栈为 React + TypeScript + Vite + Radix，样式先平移源 Vue 项目的视觉效果。
- 前端实现要以 `D:\opensource\qssh\` 为功能基准，不做兼容 Vue 的折中代码。
- 先设计并稳定 Wails API 适配层，再逐步迁移页面和交互。

本文件记录迁移现状、已完成工作、源项目功能清单、当前 React 缺口和后续待办。当前阶段只整理文档，不修改实现代码。

## 已完成工作

### 阶段 1：Go/Wails 框架迁移

提交：`ff08c2e chore: migrate go wails scaffold`

- 已把源项目后端核心 Go 代码迁移到 `internal/` 结构。
- 已建立 `internal/wailsapi/` 作为 Wails 应用装配层。
- 已保留 Wails 窗口、事件、服务绑定的基础结构。
- 已生成/接入前端可调用的 Wails binding 入口。

### 阶段 2：React + Vite 前端框架

提交：`55238f5 feat: add react wails frontend scaffold`

- 已创建 React + TypeScript + Vite 前端工程。
- 已引入 Radix 风格的基础 UI 组件封装。
- 已建立 `frontend/src/lib/wails/` 适配层：
  - `runtime.ts` 包装 Wails `Events`、`Window`、`Dialogs`。
  - `services.ts` 包装 Go service bindings。
  - `types.ts` 定义当前 React 侧基础类型。
- 已建立基础路由和桌面窗口入口。

### 阶段 3：React SSH 工作区外壳

提交：`1096b3c feat: migrate react ssh workspace`

- 已建立首页工作区、连接表单、连接列表、基础设置、基础云同步面板。
- 已建立 SSH 窗口 React 工作区入口。
- 已能按 group/active connection 加载 SSH 连接列表。
- 已接入基础终端 `xterm` 面板。

### 阶段 4：React SSH 工具面板外壳

提交：`707f149 feat: add react ssh tool panels`

- 已新增 React 版工具面板：
  - Terminal
  - File
  - Monitor
  - AI
  - Port Forward
  - Firewall
  - Process Guard
  - Logs
  - Command
- 已完成少量 API 调用验证式实现，但这些面板目前仍是简化版本，不等价于源 Vue 功能。

### 已做过的基础验证

之前阶段已做过以下验证：

- `npm run build`
- `go test ./...`
- `wails3 build -tags production`

本次只更新迁移文档，未重新运行构建或测试。

## 当前结论

当前 React 版本还没有达到 `D:\opensource\qssh\` 的功能对齐状态。现有页面主要完成了 React/Wails 外壳、基础样式和少量服务调用，很多源项目功能尚未迁移：

- 首页连接、连接列表、设置、云服务只迁移了核心入口。
- SSH 工作区当前是普通 Tabs，不是源项目 Dockview 多面板布局。
- 终端、文件管理、监控、AI、端口转发、防火墙、进程守护、日志等面板均缺少大量交互。
- 部分 React 适配层类型仍是手写 `any`/简化类型，尚未严格对齐 Go binding model。

后续迁移应以源项目功能为基准逐项补齐，而不是继续在当前外壳上只加零散按钮。

## 源项目重点功能清单

以下来自对 `D:\opensource\qssh\frontend\src` 和当前 `internal/` Go 服务的阅读整理。

### 首页连接页

源文件：

- `frontend/src/views/Home/NewConnection.vue`
- `frontend/src/views/Home/ConnectionOptionsDialog.vue`
- `frontend/src/views/Home/layout/SidebarPanel.vue`
- `frontend/src/views/Home/Settings.vue`
- `frontend/src/views/Home/CloudPanel.vue`
- `frontend/src/views/Home/AppLayout.vue`

源功能：

- 新建连接表单支持名称、主机、端口、用户名、密码、私钥、超时等。
- 连接前校验输入，并从后端 FriendlyError 中提取可读错误。
- 支持 `TestConnection`。
- 支持连接时检查已有 SSH 窗口，并根据设置决定加入默认窗口、新建窗口或弹出选择。
- 支持 `ConnectionOptionsDialog` 选择连接打开方式。
- 支持 `CreateGroup`、`GetDefaultGroupID`、`CreateAndConnectWithGroup`、`OpenSSHWindow`。
- 支持连接后自动隐藏主窗口到托盘。
- Sidebar 支持 saved/cache 分组、搜索、排序、右键菜单、快速连接、编辑、保存、取消保存、删除、断开连接。
- Sidebar 监听 `ssh:connections-updated`、`ssh:window-closed` 等事件刷新状态。
- Settings 支持终端类型、自动切换经典终端、命令发送模式、字体大小、代码高亮、快捷键、分组行为、托盘行为、窗口位置记忆、SSH 关闭后显示主页、清除窗口位置、云同步、导入/导出配置。
- Home CloudPanel 是私有云服务管理面板，包含服务状态、端口、Token、设备列表、复制 Token、启动/停止服务等。
- AppLayout/Titlebar 处理窗口最小化、最大化/还原、关闭，并维护最大化状态。

当前 React 状态：

- `ConnectionForm.tsx` 只覆盖基础输入、测试连接、连接、默认/新窗口选择。
- `ConnectionsPanel.tsx` 只覆盖搜索、连接、断开、删除。
- `SettingsPanel.tsx` 只覆盖主题、托盘、窗口位置、自动显示主页、清理窗口位置。
- `CloudPanel.tsx` 只覆盖客户端连接、断开、拉取、推送，未覆盖源项目私有云服务管理。
- 首页缺少源项目的完整 Sidebar 行为、编辑弹窗、保存/取消保存、缓存连接管理、连接打开策略弹窗。

### SSH 窗口与布局

源文件：

- `frontend/src/views/SSH/Terminal.vue`
- `frontend/src/views/SSH/layout/DockviewLayout.vue`
- `frontend/src/views/SSH/layout/TopBookmarkBar.vue`
- `frontend/src/views/SSH/layout/BottomStatusBar.vue`
- `frontend/src/views/SSH/layout/LeftToolBar.vue`
- `frontend/src/views/SSH/layout/RightAIToolbar.vue`
- `frontend/src/views/SSH/TabContent.vue`

源功能：

- SSH 窗口通过 `/#/ssh?group=...&activeConn=...` 加载连接组。
- 监听 `ssh:group-updated` 刷新连接组。
- 窗口卸载时发出 `ssh:window-closed`。
- 顶部书签栏支持连接 tab、切换 active connection、关闭连接、重连、保存连接、云同步上传/下载、窗口控制。
- 底部状态栏显示连接状态、延迟、保存/断开等操作。
- 左右工具栏负责打开终端、文件、监控、AI、日志、端口转发、防火墙、进程守护、批量命令等 Dockview panel。
- Dockview 支持拖拽、分屏、关闭、新建到旁边、关闭同类、关闭其他等上下文菜单。
- Dockview 与终端 session store、AI terminal、batch command panel 互通。

当前 React 状态：

- `SSHWorkspace.tsx` 只是侧边连接列表 + Radix Tabs。
- 没有 Dockview 布局，没有多面板/分屏/上下文菜单。
- 没有 TopBookmarkBar、BottomStatusBar、LeftToolBar、RightAIToolbar 的完整行为。
- 没有完整的窗口卸载事件和 group close 清理链路。

### 终端

源文件：

- `frontend/src/views/SSH/panels/StructuredTerminalPanel.vue`
- `frontend/src/views/SSH/components/Terminal.vue`
- `frontend/src/views/SSH/components/TerminalToolbar.vue`
- `frontend/src/views/SSH/components/TerminalStatusBar.vue`
- `frontend/src/views/SSH/components/TerminalSearchBar.vue`
- `frontend/src/views/SSH/components/TerminalContextMenu.vue`
- `frontend/src/views/SSH/components/CommandHistoryDialog.vue`
- `frontend/src/views/SSH/components/CompletionPopup.vue`
- `frontend/src/views/SSH/components/InteractivePrompt.vue`
- `frontend/src/views/SSH/components/SessionManagerDialog.vue`
- `frontend/src/views/SSH/components/ShortcutsDialog.vue`
- `frontend/src/views/SSH/composables/useTerminal.js`
- `frontend/src/views/SSH/composables/useShellSession.js`
- `frontend/src/views/SSH/composables/useBlockManager.js`
- `frontend/src/views/SSH/composables/useCommandHistory.js`
- `frontend/src/views/SSH/composables/useCommandCompletion.js`
- `frontend/src/views/SSH/composables/useInteractiveMode.js`
- `frontend/src/views/SSH/composables/useRecording.js`

源功能：

- 支持结构化 block terminal 和 classic xterm 两种模式。
- 支持命令输入框、发送按钮、命令历史、快捷命令、自动补全、补全弹窗。
- 支持危险命令分析和交互命令检测，必要时提示切换经典模式。
- 支持搜索、复制、粘贴、全选、右键菜单。
- 支持终端录制、导出、代码高亮、主题、字体设置。
- 支持 SessionManager，多终端 session ID 管理。
- 支持 AI 创建/关闭终端、AI 向指定终端执行命令。
- 支持断线、重连、重连中事件反馈。
- 支持终端 resize、输出事件过滤、关闭 session 清理。

当前 React 状态：

- `TerminalPanel.tsx` 只创建一个 xterm，并使用固定 session ID `react-${connID}`。
- 没有结构化模式、命令块、历史、补全、搜索、录制、右键菜单、主题设置、会话管理。
- 固定 session ID 会限制同一连接下多个终端实例，迁移 Dockview 后必须先修正。

### 文件管理

源文件：

- `frontend/src/views/SSH/panels/FileManagerPanel.vue`
- `frontend/src/views/SSH/components/file-manager/FileToolbar.vue`
- `frontend/src/views/SSH/components/file-manager/FileTable.vue`
- `frontend/src/views/SSH/components/file-manager/ActionMenu.vue`
- `frontend/src/views/SSH/components/file-manager/FilePreview.vue`
- `frontend/src/views/SSH/components/file-manager/CodeEditor.vue`
- `frontend/src/views/SSH/components/file-manager/PermissionEditor.vue`
- `frontend/src/views/SSH/composables/useFileNavigation.js`
- `frontend/src/views/SSH/composables/useFileOperations.js`
- `frontend/src/views/SSH/composables/useFilePermissions.js`
- `frontend/src/views/SSH/composables/useFileUpload.js`

源功能：

- 目录加载、路径面包屑、返回上级、刷新。
- 文件搜索，支持递归搜索、搜索取消、`search-result`/`search-complete` 事件。
- 文件/目录上传、目录上传进度、取消上传。
- 下载文件、批量下载、压缩打包下载、临时文件清理。
- 新建目录、重命名、复制、剪切、删除、批量删除。
- 权限查看和 chmod 编辑。
- 图片、视频、音频、文本预览。
- CodeMirror 编辑文本并保存。
- ActionMenu 和批量选择。

当前 React 状态：

- `FilePanel.tsx` 只支持列目录、输入路径、双击进入目录。
- 没有上传、下载、预览、编辑、搜索、权限、批量操作、压缩、目录上传进度。

### 监控

源文件：

- `frontend/src/views/SSH/panels/MonitorPanel.vue`

源功能：

- 读取 `GetSystemStats` 和 `GetProcessList`。
- 展示 CPU、内存、磁盘、网络、负载等系统卡片。
- 进程表支持排序、刷新、查看进程详情。
- 支持 kill process 和发送 SIGTERM/SIGHUP/SIGINT/SIGQUIT/SIGKILL/SIGSTOP/SIGCONT。
- 有确认弹窗和信号下拉菜单。

当前 React 状态：

- `MonitorPanel.tsx` 只展示少量指标和前 20 个进程。
- 没有排序、详情、kill、signal、确认弹窗、自动刷新策略。
- 当前字段访问是宽松猜测式，需用 Go model/binding 校准字段名。

### AI 面板

源文件：

- `frontend/src/views/SSH/panels/AIChatPanel.vue`
- `frontend/src/utils/aiToolExecutor.js`
- `frontend/src/stores/aiToolLog.js`

源功能：

- AI 配置弹窗，支持 endpoint、api key、模型、预设、temperature、max tokens、system prompt。
- 支持获取模型、保存配置、判断是否已配置。
- 支持聊天历史加载、清空。
- 支持发送消息、取消处理中请求。
- 支持流式输出事件 `ai:stream-chunk`。
- 支持 `ai:message`、`ai:status`、`ai:tool-approval`、`ai:tool-result`。
- 支持工具审批/拒绝：`ApproveTool`、`DenyTool`。
- 支持选择目标终端，结合 Dockview terminal list 执行命令。

当前 React 状态：

- `AIChatPanel.tsx` 只加载历史并调用 `SendMessage`。
- 没有配置 UI、流式输出、工具审批、工具结果、取消、目标终端、AI 工具日志。

### 批量命令

源文件：

- `frontend/src/views/SSH/panels/BatchCommandPanel.vue`

源功能：

- 选择多个连接。
- 选择每个连接的目标终端 session。
- 批量发送命令到多个终端。
- 通过 `dockview:terminals-changed` 获取终端列表。
- 发出 `ai:terminal-exec-start` 等执行事件。

当前 React 状态：

- 没有 BatchCommandPanel 对等实现。
- 当前 `CommandPanel.tsx` 只是单连接 `ExecuteCommand`/命令输出面板，不能替代源批量命令。

### 端口转发

源文件：

- `frontend/src/views/SSH/panels/PortForwardPanel.vue`

源功能：

- 支持 local 和 remote 两类转发。
- 支持新增、编辑、删除、启动、停止。
- 支持命名转发规则并保存本地名称。
- 监听 `port-forward:status` 更新状态。
- 展示 bind address/port、remote host/port、状态、流量等。

当前 React 状态：

- `PortForwardPanel.tsx` 只支持新增 local forward 和列表展示。
- 没有 remote forward、启动、停止、删除、编辑、状态事件、命名规则。

### 防火墙

源文件：

- `frontend/src/views/SSH/panels/FirewallPanel.vue`

源功能：

- 读取 `GetFirewallInfo`，识别 firewall 类型和状态。
- 支持启用/停用防火墙。
- 支持添加规则、删除规则。
- 支持 iptables/firewalld/ufw 不同字段组合。
- 支持运行自定义防火墙命令。

当前 React 状态：

- `FirewallPanel.tsx` 只显示 info JSON 和执行自定义命令。
- 没有规则表、添加规则弹窗、删除规则、启停防火墙、不同防火墙类型表单。

### 进程守护

源文件：

- `frontend/src/views/SSH/panels/ProcessGuardPanel.vue`

源功能：

- 读取 `GetGuardians`。
- 支持创建守护进程，字段包括 name、command、workDir、autoRestart。
- 支持启动、停止、重启、删除。
- 支持查看/刷新日志 `GetGuardianLogs`。
- 支持自动刷新。

当前 React 状态：

- `ProcessGuardPanel.tsx` 只支持列表和 start/stop/restart。
- 没有创建、删除、日志弹窗、自动刷新、workDir/autoRestart。

### 日志

源文件：

- `frontend/src/views/SSH/panels/LogsPanel.vue`
- `frontend/src/utils/logger.js`

源功能：

- 从 logger store 读取结构化日志。
- 支持按类型、等级、关键词过滤。
- 支持详情展开、自动刷新、手动刷新。
- 支持导出日志。

当前 React 状态：

- `LogsPanel.tsx` 只是运行 `journalctl` 命令并显示输出。
- 没有源项目 logger store、过滤、展开、导出、自动刷新。

### Stores 与工具

源文件：

- `frontend/src/stores/config.js`
- `frontend/src/stores/layout.js`
- `frontend/src/stores/sshConnections.js`
- `frontend/src/stores/sshLayout.js`
- `frontend/src/stores/sshTabs.js`
- `frontend/src/stores/terminalSessions.js`
- `frontend/src/stores/commandHistory.js`
- `frontend/src/stores/aiToolLog.js`
- `frontend/src/utils/cloudClient.js`
- `frontend/src/utils/commandAnalyzer.js`
- `frontend/src/utils/commandDescriptions.js`
- `frontend/src/utils/commandRunner.js`
- `frontend/src/utils/commandSecurityAnalyzer.js`
- `frontend/src/utils/confirm.js`
- `frontend/src/utils/logger.js`
- `frontend/src/utils/message.js`
- `frontend/src/utils/sshEvents.js`

待迁移重点：

- Pinia store 需要按 React 习惯迁移为局部 state、Context、Zustand 或轻量 reducer。不要为了迁移而过度抽象。
- `terminalSessions`、`sshLayout`、`aiToolLog`、`commandHistory` 属于功能关键状态，不能只用组件局部 state 替代。
- `confirm`、`message`、`logger`、`sshEvents` 需要 React 版统一实现，否则各面板会继续散落临时状态。

## 已发现或高风险交互问题

这些问题来自阅读当前 React 实现和对比源 Vue 行为，下一阶段需要实机验证。

1. SSH 工作区不是 Dockview，多面板、分屏、上下文菜单、AI/批量命令与终端联动都无法实现源体验。
2. `TerminalPanel.tsx` 使用固定 session ID `react-${connID}`，同一连接打开多个终端时会冲突。
3. SSH 窗口关闭/组件卸载没有完整对齐源项目 `ssh:window-closed` 和 group cleanup 行为。
4. `eventPayload<T>` 通过是否存在 `data` 字段判断事件包装，若真实 payload 本身包含 `data` 字段，可能误解包。
5. `eventsApi.off(name, handler?)` 与 Wails runtime `Off` 的实际签名需要确认，避免监听清理失效。
6. React `services.ts` 对 Go bindings 使用大量 `Record<string, (...args:any[]) => Promise<any>>`，类型保护不足，字段错配不易暴露。
7. `CloudPanel.tsx` 将 `ConnectionInfo[]` 直接传给 `PushSync`，但 Go 侧 `PushSync` 参数是 `[]client.SyncConnection`，需要确认 binding 转换是否正确。
8. `ConnectionForm.tsx` 的 group behavior 只处理 `new_window` 和默认窗口，未实现源项目的 `prompt` 弹窗流程。
9. 保存连接、缓存连接、取消保存、删除缓存/永久连接的语义尚未完整区分。
10. 连接断线、重连中、重连成功/失败事件尚未在 React UI 中完整处理。
11. 各工具面板缺少全局 message/confirm，删除、kill、断开、防火墙变更等危险操作没有统一确认。
12. 多数面板只是单次请求，没有源项目的自动刷新、事件驱动更新和取消机制。
13. 部分 React 面板字段名是猜测式兼容，例如 `cpuPercent`/`memoryPercent`，需要根据生成 binding 和 Go struct 校准。

## 后续分阶段 TODO

### Phase A：稳定 Wails API 适配层和事件模型

目标：先把 React 调 Go、监听事件、model 类型的基础打牢。

待办：

- 用生成的 Wails binding 类型替换 `services.ts` 中大部分 `any`。
- 明确每个 Go service 的 React wrapper 名称和参数，不再靠临时大小写兼容。
- 修正 `eventPayload`，避免真实 payload 带 `data` 时误解包。
- 确认 `Events.On/Off/Emit` 在 Wails v3 runtime 中的真实签名，统一 unsubscribe 行为。
- 为常用事件定义类型：terminal output、connections updated、group updated、connection disconnected/reconnecting/reconnected、AI events、port-forward status、search events、upload progress。
- 校准 `ConnectionInfo`、`SSHConfig`、`SSHGroup`、`SystemStats`、`ProcessInfo`、`FileInfo`、`FirewallInfo`、`GuardianProcess` 等类型。

验收：

- TypeScript 不再需要靠宽松 `any` 调主要业务 API。
- `npm run build` 能暴露 API/字段错配。
- 事件订阅和卸载有一处统一实现。

### Phase B：首页、连接管理、设置、云服务补齐

目标：让 React 首页达到源 Vue 首页功能。

待办：

- 补齐 `ConnectionOptionsDialog`。
- 实现 `groupBehavior = prompt | join_default | new_window` 完整流程。
- 连接前检查已有 SSH 窗口，按设置决定打开方式。
- 连接列表分 saved/cache，支持搜索、排序、右键菜单、编辑、保存、取消保存、删除、断开。
- 补齐 `ssh:connections-updated`、`ssh:window-closed` 驱动刷新。
- 补齐 Settings 全部配置项：终端模式、字体、命令发送、代码高亮、快捷键、分组行为、托盘、窗口位置、自动显示主页、导入导出、云同步。
- 区分 Settings 中的云同步客户端配置和 Home CloudPanel 的私有云服务管理。
- 补齐 Home CloudPanel：服务状态、端口、Token、设备列表、复制 Token、启动/停止服务。

验收：

- 首页连接、保存、缓存、删除、编辑、设置行为与源项目一致。
- 配置变更重启后仍可恢复。
- 主窗口和 SSH 窗口生命周期与源项目一致。

### Phase C：SSH Dockview 工作区和窗口生命周期

目标：替换当前 Tabs 外壳，恢复源项目多面板工作区。

待办：

- 选择 React 版 Dockview 或等价库，迁移 `DockviewLayout.vue` 行为。
- 实现 TopBookmarkBar、BottomStatusBar、LeftToolBar、RightAIToolbar。
- 实现 panel registry：terminal、fileManager、monitor、aiChat、logs、portForward、firewall、processGuard、batchCommand。
- 实现面板上下文菜单：关闭、新建到旁边、关闭同类、关闭其他。
- 实现 connection tab 切换、关闭、保存、断开、重连。
- 实现 `dockview:terminals-changed`。
- 窗口卸载时发出 `ssh:window-closed` 并调用后端 group close/cleanup。

验收：

- 可同时打开多个终端和工具面板。
- AI 和批量命令能获取当前终端列表。
- 关闭 SSH 窗口后连接组和窗口状态正确清理。

### Phase D：终端完整迁移

目标：恢复源项目终端核心体验。

待办：

- 抽出 React 版 terminal session store。
- 支持多个 terminal session ID，避免固定 `react-${connID}`。
- 迁移 classic xterm 和 structured terminal 两种模式。
- 迁移命令块、命令历史、自动补全、快捷命令、搜索、右键菜单、复制/粘贴/全选。
- 迁移命令安全分析、交互命令检测、切换经典模式确认。
- 迁移录制、导出、代码高亮、主题、字体设置。
- 处理断线、重连中、重连成功、重连失败事件。

验收：

- 单连接可开多个终端且互不串输出。
- 结构化和经典模式都可正常执行命令。
- 重连/断线状态可见且不丢 session 清理。

### Phase E：文件管理完整迁移

目标：让 React 文件管理达到源 Vue 功能。

待办：

- 迁移文件表格、工具栏、ActionMenu、PermissionEditor、FilePreview、CodeEditor。
- 迁移目录导航、面包屑、返回上级、刷新。
- 迁移搜索、递归搜索、取消搜索和搜索事件。
- 迁移上传文件、上传目录、进度、取消上传。
- 迁移下载、批量下载、压缩打包下载、临时文件清理。
- 迁移新建目录、重命名、删除、复制、剪切、权限修改。
- 迁移图片/视频/音频/文本预览和文本编辑保存。

验收：

- 常规 SFTP 操作与源项目一致。
- 大目录搜索和上传可取消，进度事件显示正确。
- 文本编辑、预览、权限修改可用。

### Phase F：AI、批量命令、日志工具链

目标：恢复 AI 与终端/工具执行联动。

待办：

- 迁移 AI 配置、模型获取、保存配置、配置校验。
- 迁移聊天历史、流式输出、状态事件、取消处理。
- 迁移工具审批/拒绝、工具结果、AI 工具日志。
- 迁移目标终端选择和 AI terminal executor。
- 迁移 BatchCommandPanel：多连接、多终端、批量发送命令、结果状态。
- 迁移 logger store 和 LogsPanel：类型/等级/关键词过滤、展开、自动刷新、导出。

验收：

- AI 可以流式回复，可以申请工具执行，可以选择目标终端。
- 批量命令可以向多个连接/终端发送。
- 日志面板显示应用结构化日志，不只是 `journalctl` 输出。

### Phase G：监控、端口转发、防火墙、进程守护补齐

目标：补齐 SSH 工具面板。

待办：

- Monitor：系统卡片、进程排序、详情、kill、signal、确认弹窗、自动刷新。
- PortForward：local/remote、添加、编辑、删除、启动、停止、状态事件、命名规则。
- Firewall：规则表、添加规则、删除规则、启停、iptables/firewalld/ufw 类型差异。
- ProcessGuard：创建、删除、启动、停止、重启、日志查看、自动刷新。

验收：

- 每个工具面板功能与源 Vue 对齐。
- 危险操作都有确认。
- 后端事件可实时更新 UI 状态。

### Phase H：视觉与交互 QA

目标：保证 React 版不是功能堆砌，而是可用的桌面应用。

待办：

- 对照 Vue 样式逐个页面校准密度、布局、颜色、hover、active、disabled、empty/loading/error 状态。
- 检查窗口缩放、窄屏、长文本、表格溢出。
- 检查 Titlebar 最大化/还原状态同步。
- 检查键盘操作：Enter 发送、快捷键、Esc 关闭弹窗、Tab 聚焦。
- 检查所有中文文案和错误提示。

验收：

- 主要页面在桌面尺寸下没有明显错位、遮挡、空壳。
- 常用交互路径不需要打开 DevTools 才能判断状态。

## 建议的手工验证矩阵

基础验证：

- `npm run build`
- `go test ./...`
- `wails3 build -tags production`

首页验证：

- 错误主机、错误密码、错误私钥路径的提示。
- 测试连接成功/失败。
- 新建连接加入默认窗口。
- 新建连接打开新窗口。
- `groupBehavior=prompt` 时选择窗口行为。
- 保存连接、取消保存、删除缓存连接、删除永久连接。
- 编辑保存连接后重连。
- 关闭 SSH 窗口后首页连接状态刷新。

SSH 工作区验证：

- 一个连接打开多个终端。
- 一个连接打开多个工具面板。
- 多连接在同一 group 中切换。
- 断开、重连、重连失败。
- 窗口关闭后 group cleanup。

终端验证：

- 普通命令、长输出、交互命令。
- resize 后终端 cols/rows 正确。
- 搜索、复制、粘贴、全选。
- 命令历史、自动补全、快捷命令。
- 结构化模式和经典模式切换。

文件管理验证：

- 列目录、进入目录、返回上级。
- 上传文件、上传目录、取消上传。
- 下载文件、批量下载。
- 搜索和取消搜索。
- 预览图片/文本，编辑文本并保存。
- chmod、删除、重命名、新建目录。

工具面板验证：

- Monitor kill/signal。
- PortForward local/remote start/stop/remove。
- Firewall add/delete/toggle/custom command。
- ProcessGuard create/start/stop/restart/delete/logs。
- AI config/send/stream/tool approval/terminal execution。
- Batch command 多终端执行。
- Logs filter/export/auto refresh。

## 下一步建议

下一次开发建议先做 Phase A。原因是当前 React 层已经能调用一部分 Go API，但适配层仍然偏临时，如果直接继续补 UI，很容易把字段名、事件结构、session ID、unsubscribe 等问题散落到每个组件里。

Phase A 完成后再补首页和 SSH Dockview，后续每个功能面板都能建立在稳定的 API、事件和布局基础上。
