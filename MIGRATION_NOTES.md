# MIGRATION_NOTES

最后更新：2026-06-18

## 1. 文档目的

本文件用于跟踪 `alphagauss/goshell`（本地位置： `D:\opensource\qssh\`） 从 `nanxiangxi/qssh` 迁移到 React 前端后的功能补齐工作。

当前项目已经完成了 Go/Wails 侧的代码位置调整，以及 React + TypeScript + Vite 的基础前端框架。但当前 React 前端还不能视为 qssh Vue 前端的功能等价迁移版本。后续迁移应以本文件为总账本，逐项恢复源项目的前端功能、交互、状态管理、事件流和边界处理。

## 2. 完整迁移口径

本次迁移的目标不是简单“能打开窗口、能连上 SSH”，而是：

1. 以后端能力为基准，React 前端应完整覆盖原 qssh Vue 前端已经实现的用户功能。
2. Vue/Pinia 代码不要求原样照搬，但用户可见功能、关键交互、Wails API 调用、事件订阅、状态生命周期必须等价。
3. 如果某个原功能决定不迁移，必须在本文档中明确标记为“不迁移/暂缓迁移”，并说明原因。
4. 每个模块必须有“源项目入口、当前 React 落点、缺失功能、迁移步骤、验收标准”。
5. “完成”不以 UI 外壳存在为准，而以真实可操作、可恢复、可测试为准。

## 3. 当前已完成内容

### 3.1 Go/Wails 侧

- 已将 qssh 后端相关代码迁移到 goshell 的新目录结构中。
- 已保留 Wails v3 调用方式。
- 已生成或接入前端 bindings。
- 后端功能原则上作为能力来源，不是本阶段重构重点。

### 3.2 React 前端基础

- 已建立 React + TypeScript + Vite 前端。
- 已建立基础页面、标题栏、状态行、按钮、Tabs 等 UI 基础组件。
- 已有首页连接表单、连接列表、设置面板、SSH 工作区、终端面板、文件面板、监控面板、AI 面板、端口转发、防火墙、进程守护、日志、命令面板等 React 外壳。
- 已能调用部分 Wails API 进行连接、打开 SSH 窗口、启动 shell session、列文件等基础操作。

### 3.3 当前不能视为完成的原因

当前 React 版更接近“最小可用骨架”，不是 qssh Vue 前端的完整功能复刻。尤其是以下能力尚未完成：

- Dockview 多面板布局与右键菜单。
- 多终端 session 管理。
- 结构化终端、命令块、命令历史、补全、搜索、录制、交互式临时终端。
- 完整 SFTP 文件管理器。
- 完整 AI 助手、AI 配置、模型列表、审批、工具执行、终端联动。
- 批量命令面板。
- 完整端口转发管理，包括 local/remote、启动/停止/编辑/删除、流量统计。
- 完整设置页，包括终端设置、快捷键、高级分组行为、云同步、导入导出。
- 原项目 store 和 utils 的 React 等价层。
- 全局消息、确认弹窗、日志系统、危险命令确认。

## 4. 迁移基准与文件映射总表

| 模块 | qssh 源文件/目录 | goshell 当前落点 | 当前状态 | 迁移目标 |
|---|---|---|---|---|
| 首页框架 | `frontend/src/views/Home/*` | `frontend/src/components/home/*`、`App.tsx` | 部分完成 | 恢复首页导航、连接流、设置、云端、导入导出 |
| 新建连接 | `views/Home/NewConnection.vue`、`ConnectionOptionsDialog.vue` | `components/home/ConnectionForm.tsx` | 部分完成 | 恢复已有窗口时的 prompt/join_default/new_window 分支 |
| 连接列表 | `stores/sshConnections.js`、Home 相关组件 | `ConnectionsPanel.tsx` | 部分完成 | 恢复连接分组、保存、编辑、打开策略、状态刷新 |
| 设置 | `views/Home/Settings.vue` | `SettingsPanel.tsx` | 严重缺失 | 恢复终端、快捷键、高级、窗口、云端、导入导出设置 |
| 云端 | `CloudPanel.vue`、`utils/cloudClient.js`、`CloudService` | `CloudPanel.tsx` 或 Settings 内嵌 | 未等价 | 明确是否保留私有云端同步；如保留，完整迁移 |
| SSH 工作区 | `views/SSH/Terminal.vue`、`layout/DockviewLayout.vue` | `SSHWorkspace.tsx` | 严重偏离 | 从 Radix Tabs 改为 React Dockview 或等价多面板布局 |
| 顶部书签栏 | `layout/TopBookmarkBar.vue` | 缺失 | 缺失 | 恢复快速连接/书签入口 |
| 左/右/底部工具栏 | `LeftPanel.vue`、`RightToolbar.vue`、`BottomToolbar.vue` | 缺失或分散 | 缺失 | 恢复面板开关、状态、快捷操作 |
| 结构化终端 | `panels/Terminal/StructuredTerminalPanel.vue` | `TerminalPanel.tsx` | 骨架 | 恢复结构化/经典双模式与完整终端能力 |
| 终端子组件 | `panels/Terminal/components/*` | 缺失 | 缺失 | 迁移 TerminalBlock、CompletionPopup、CommandHistoryDialog 等 |
| 终端 composables | `panels/Terminal/composables/*` | 缺失 | 缺失 | 迁移为 React hooks |
| 终端工具 | `panels/Terminal/utils/*` | 缺失 | 缺失 | 迁移 sessionManager、highlightAddon 等 |
| 文件管理器 | `panels/FileManager/*` | `FilePanel.tsx` | 骨架 | 恢复完整 SFTP 管理器 |
| 监控 | `panels/MonitorPanel.vue` | `MonitorPanel.tsx` | 部分 | 恢复图表/刷新/进程资源/网络等源功能 |
| AI 助手 | `panels/AIChatPanel.vue`、`utils/aiToolExecutor.js` | `AIChatPanel.tsx` | 骨架 | 恢复设置、模型、流式、审批、工具、终端联动 |
| 批量命令 | `panels/BatchCommandPanel.vue` | `CommandPanel.tsx` | 不等价 | 恢复多连接批量命令执行 |
| 端口转发 | `panels/PortForwardPanel.vue` | `PortForwardPanel.tsx` | 部分 | 恢复 local/remote、启停、编辑、删除、统计 |
| 防火墙 | `panels/FirewallPanel.vue` | `FirewallPanel.tsx` | 部分 | 恢复规则读取、添加、删除、启停、状态识别 |
| 进程守护 | `panels/ProcessGuardPanel.vue` | `ProcessGuardPanel.tsx` | 部分 | 恢复服务/进程守护规则和操作 |
| 日志 | `panels/LogsPanel.vue`、`utils/logger.js` | `LogsPanel.tsx` | 不等价 | 恢复应用日志、操作日志、终端命令日志 |
| 状态管理 | `stores/*` | React state 分散 | 缺失 | 建立 React store/hooks，避免每个面板各自造状态 |
| 工具函数 | `utils/*` | `lib/*` 少量 | 缺失 | 迁移 message、confirm、logger、sshEvents、commandRunner 等 |
| 全局样式 | `styles/*`、各 Vue scoped style | `styles/*` | 部分 | 恢复主题变量、Dockview、终端、文件管理器、弹窗样式 |

## 5. 基础设施迁移清单

### 5.1 前端依赖差异

源项目前端依赖包含以下高级能力相关库：

- `dockview-vue`：多面板布局。
- `xterm` 及 `xterm-addon-fit/search/serialize/web-links`：终端、搜索、序列化、链接识别。
- `marked`、`highlight.js`：AI Markdown 和代码高亮。
- `jszip`：批量下载/压缩相关能力。
- `monaco-editor`、CodeMirror 相关包：文件预览/编辑、代码编辑。
- `pinia`：全局状态管理。
- `splitpanes`、`vue-splitpane`：分栏布局。

当前 React 依赖主要是 Radix UI、React、lucide-react、`@xterm/xterm`、`@xterm/addon-fit`、`@xterm/addon-web-links`。后续需要补齐或明确替代方案：

- Dockview：建议使用 `dockview` 的 React 版本或直接使用官方 React 适配能力。
- xterm 搜索：补 `@xterm/addon-search`。
- xterm 序列化/录制：评估 `@xterm/addon-serialize` 或自实现。
- Markdown/代码高亮：补 `marked`、`highlight.js`。
- 文件编辑器：选 CodeMirror 6 或 Monaco，建议优先 CodeMirror 6，体积更轻。
- 批量下载/压缩：补 `jszip`，或确认后端已负责压缩。
- React 状态层：建议用 Zustand，或先用 Context + reducer，但不要继续把复杂状态散落在组件内部。

### 5.2 Wails API 与类型层

必须先统一 `frontend/src/lib/wails.ts` 或等价 API 封装：

- 所有后端服务方法必须按模块拆分：`sshApi`、`configApi`、`aiApi`、`portForwardApi`、`cloudApi`、`eventsApi`。
- 所有事件 payload 必须统一大小写：`connID/connId`、`sessionID/sessionId`、`groupID/groupId` 不允许在不同组件里混用。
- 为所有关键模型补 TypeScript 类型：`SSHConfig`、`ConnectionInfo`、`SSHGroup`、`FileInfo`、`ForwardItem`、`AIConfig`、`ChatMessage`、`TerminalSession`、`LogEntry`。
- 为 FriendlyError 保留统一错误解析，避免每个面板重复写错误分支。
- 所有 `Events.On` 必须有对应的卸载函数或安全 `Off` 封装，防止窗口重复打开后多次监听。

### 5.3 React 状态层

需要建立与源项目 Pinia store 对应的 React store/hooks：

| 源 store | React 建议 | 责任 |
|---|---|---|
| `config` | `useConfigStore` | 配置读取、写入、主题、终端默认类型、快捷键、云配置 |
| `sshConnections` | `useSSHConnectionsStore` | 连接列表、分组、状态刷新、连接操作 |
| `sshLayout` | `useSSHLayoutStore` | 面板配置、Dockview 面板开关、默认布局 |
| `sshTabs` | `useSSHTabsStore` | SSH 标签/窗口/分组关系 |
| `terminalSessions` | `useTerminalSessionStore` | 多终端 session、AI session、session ready/close |
| `commandHistory` | `useCommandHistoryStore` | 命令历史、收藏、按连接隔离 |
| `aiToolLog` | `useAIToolLogStore` | AI 工具调用、审批、执行日志 |

建议先实现 store，再迁移复杂面板。否则终端、AI、Dockview、日志之间会缺少统一桥接。

### 5.4 全局消息与确认

源项目有 `Message.vue`、`Modal.vue`、`confirm.js`、`logger.js` 等通用工具。React 侧需要等价实现：

- `ToastProvider` / `useToast`：成功、失败、警告提示。
- `ConfirmDialogProvider` / `useConfirm`：危险操作确认。
- `Modal` / `Dialog`：统一弹窗基础样式。
- `logger`：统一操作日志、终端命令日志、文件操作日志、AI 工具日志。

## 6. 模块迁移详单

### 6.1 首页连接流

#### 源项目能力

源项目新建连接流程包括：

- 表单校验：名称、host、port、username、password/privateKey、timeout。
- 测试连接。
- 判断是否已有 SSH 窗口。
- 如果是第一个连接，直接加入默认分组。
- 如果已有窗口，根据 `advanced.groupBehavior`：
  - `prompt`：弹出 `ConnectionOptionsDialog`。
  - `join_default`：自动加入默认分组。
  - `new_window`：新建分组/窗口。
- 连接成功后刷新连接 store。
- 打开 SSH 窗口，并根据 `autoTray` 隐藏主页。

#### 当前 React 状态

`ConnectionForm.tsx` 已有基本表单、测试连接、连接、默认分组/新窗口选择。但它目前把“打开方式”做成固定表单项，而不是完全复刻源项目“已有窗口时再根据配置/弹窗决定”的行为。

#### 缺口

- 缺少 `ConnectionOptionsDialog`。
- 缺少 `prompt` 行为。
- `join_default`、`new_window` 的优先级需要与源项目一致。
- 缺少连接成功后的统一消息提示。
- 缺少保存连接/临时连接策略的完整区分。
- 缺少连接编辑和复用已保存连接的完整流程。

#### 迁移步骤

1. 新增 `components/home/ConnectionOptionsDialog.tsx`。
2. 把 `ConnectionForm.tsx` 的 `pickGroup` 改为源项目语义：先检查已有连接窗口，再读取 `advanced.groupBehavior`。
3. 将“打开方式”表单项改为高级设置控制，不应每次连接都强制用户手动选。
4. 接入 `useSSHConnectionsStore`，连接成功后统一刷新。
5. 接入 `useToast`，替代局部 status 文本作为主提示。
6. 保留局部错误展示用于详细失败信息。

#### 验收标准

- 第一个连接不弹窗，直接打开默认分组。
- 已有连接时，`prompt` 会弹出选择对话框。
- `join_default` 自动加入默认分组。
- `new_window` 自动创建新窗口/新分组。
- 连接成功后连接列表刷新。
- 开启 `autoTray` 时主页隐藏行为正常。

### 6.2 连接列表与连接管理

#### 源项目能力

- 展示所有保存连接和当前连接状态。
- 支持连接、断开、删除。
- 支持分组关系。
- 支持保存/复用连接配置。
- 支持连接列表刷新与状态同步。

#### 当前 React 状态

`ConnectionsPanel.tsx` 已有搜索、排序、连接、断开、删除。

#### 缺口

- 缺少编辑连接。
- 缺少保存当前连接/分组行为。
- 缺少云同步触发。
- 缺少分组视图或至少分组信息展示。
- 连接时直接使用 `connection.group_id || default`，需要确认与源项目分组策略一致。
- 删除操作缺少确认。

#### 迁移步骤

1. 新增连接编辑弹窗。
2. 删除连接前接入 `useConfirm`。
3. 连接操作复用首页连接流的 group strategy。
4. 保存/更新连接后刷新 store。
5. 如保留云同步，连接增删改后触发自动同步。

#### 验收标准

- 已保存连接可以编辑。
- 删除有确认。
- 连接状态可实时刷新。
- 分组关系不丢失。
- 与首页新建连接的打开策略一致。

### 6.3 设置页

#### 源项目能力

设置页包含：

- 终端：默认终端类型、结构化终端交互式操作模式、字体大小、命令发送方式、经典终端代码高亮。
- 快捷键：全局快捷键、切换 SSH 标签、保存分组、云上传、云下载。
- 高级：多个连接时的分组行为。
- 窗口：主题、连接后自动托盘、记忆窗口位置、关闭 SSH 后自动显示首页、清除窗口位置。
- 私有云端：启用、服务器地址、token、连接状态、测试连接、自动上传、自动下载、手动上传/下载。
- 导入/导出配置。

#### 当前 React 状态

`SettingsPanel.tsx` 只包含主题、autoTray、rememberPosition、autoShowHome、清除窗口位置。

#### 缺口

- 终端设置全部缺失。
- 快捷键设置全部缺失。
- 高级分组行为缺失。
- 云端设置缺失或与 CloudPanel 分离不清。
- 导入/导出缺失。
- 主题同步需要确认所有窗口生效。

#### 迁移步骤

1. 把设置页拆为多个 section：终端、快捷键、高级、窗口、私有云端、导入导出。
2. 补齐 `configApi.get/set` 对应封装。
3. 每个设置项都写入原项目相同的 namespace/key。
4. 终端组件读取 `terminal.defaultType`、`terminal.switchMode`、`terminal.fontSize`、`terminal.commandSendMode`、`terminal.codeHighlight`。
5. 连接流读取 `advanced.groupBehavior`。
6. 云端同步设置读取 `cloud.*`。
7. 导入/导出调用后端配置 API 或复用源项目逻辑。

#### 验收标准

- 所有源设置项在 React 设置页中可见、可保存、刷新后仍然生效。
- 终端字体、默认模式、命令发送方式能影响新建终端。
- `advanced.groupBehavior` 能影响连接打开策略。
- 导入导出可用。
- 私有云端同步如保留，则测试连接和上传/下载可用；如不保留，必须在文档中标记为主动移除。

### 6.4 SSH 工作区与 Dockview 布局

#### 源项目能力

源项目 SSH 工作区使用 Dockview：

- 每个连接窗口内可打开多个面板。
- 终端面板可以多实例。
- 非终端面板通常单实例，重复点击激活已有面板。
- tab 右键菜单支持新建终端、关闭、关闭其他、关闭同类型全部。
- 面板变更时向外广播当前面板类型和终端列表。
- AI 可请求创建/关闭 AI 终端。
- 终端 session ready 后通知 AI。
- Dockview 卸载时销毁 AI 工具执行器并清理事件监听。

#### 当前 React 状态

`SSHWorkspace.tsx` 使用 Radix Tabs，将终端、文件、监控、AI、转发、防火墙、守护、日志、命令作为固定 tab。它无法等价表达源项目的多面板、多终端、右键菜单、AI 终端生命周期。

#### 缺口

- 缺少 Dockview 或等价多面板布局。
- 缺少面板注册表。
- 缺少 `addPanel/togglePanel/closePanel/closeOtherPanels/closeAllByType`。
- 缺少多终端 session 创建逻辑。
- 缺少 AI 终端事件处理。
- 缺少 `dockview:terminals-changed` 广播。
- 缺少默认终端类型读取。

#### 迁移步骤

1. 引入 React Dockview。
2. 新增 `components/ssh/layout/DockviewWorkspace.tsx`，替代当前固定 Tabs。
3. 新增 `panelRegistry.tsx`，注册：terminal、fileManager、monitor、aiChat、logs、portForward、firewall、guardian、batchCmd。
4. 新增 `useTerminalSessionStore`。
5. 实现 `addPanel`：终端多实例，其他面板单实例。
6. 实现 tab 右键菜单。
7. 实现 `dockview:terminals-changed` 事件。
8. 实现 AI 创建/关闭终端事件。
9. `SSHWorkspace.tsx` 只负责连接列表和工作区容器，不再承载全部面板 tab。

#### 验收标准

- 能同时打开多个终端。
- 能在同一窗口打开文件、监控、AI、日志等面板。
- 非终端面板重复点击只激活，不重复创建。
- 右键菜单关闭逻辑与源项目一致。
- AI 能创建专用终端，并在 session ready 后收到通知。
- 关闭终端面板会关闭对应 shell session。

### 6.5 终端面板

#### 源项目能力

结构化终端包含：

- 结构化视图与经典 xterm 视图切换。
- 工具栏：连接状态、命令数量、录制、历史、清空、模式切换。
- 命令块：命令、输出、状态、折叠、复制、删除、重新执行。
- 命令输入：回车发送或按钮发送，支持多行命令。
- 命令历史、收藏。
- 命令补全。
- 搜索栏。
- 右键菜单：复制、粘贴、全选、清空、搜索。
- 快捷键说明。
- 交互式临时终端。
- 录制功能。
- 经典终端代码高亮。
- session manager：普通终端和 AI 终端隔离。

#### 当前 React 状态

`TerminalPanel.tsx` 只有单个 xterm，固定 `sessionID = react-${connID}`，启动 shell、写入输入、监听输出、resize、关闭 session。没有结构化视图，也不支持多 session。

#### 缺口

- 固定 sessionID 会导致同一连接无法开多个终端。
- 缺少 Dockview params 传入的 `sessionId/isAI`。
- 缺少结构化模式。
- 缺少命令历史/收藏。
- 缺少命令补全。
- 缺少搜索。
- 缺少录制。
- 缺少右键菜单。
- 缺少清屏、复制、粘贴、全选等操作。
- 缺少配置驱动字体和模式。
- 缺少 `terminal:session-ready` 事件。
- 缺少日志记录。

#### 迁移步骤

1. 先新增 `terminal/sessionManager.ts` 与 `useTerminalSessionStore`。
2. 修改 `TerminalPanel` props：`connID`、`sessionID`、`isAI`，不得内部固定 sessionID。
3. 新增 `ClassicTerminalView.tsx`，负责纯 xterm。
4. 新增 `StructuredTerminalPanel.tsx`，负责结构化终端总容器。
5. 新增 hooks：
   - `useBlockManager`
   - `useCommandHistory`
   - `useCommandCompletion`
   - `useRecording`
   - `useTerminalSearch`
6. 新增组件：
   - `TerminalBlock`
   - `CompletionPopup`
   - `ConfirmSwitch`
   - `InteractivePrompt`
   - `CommandHistoryDialog`
   - `ShortcutsDialog`
   - `TerminalContextMenu`
7. 接入设置：默认终端类型、字体大小、命令发送方式、代码高亮、交互式操作模式。
8. 接入 logger：记录连接事件和命令执行。
9. session 启动完成后 emit `terminal:session-ready`。

#### 验收标准

- 同一连接可以开多个终端，互不串输出。
- AI 终端和普通终端 session 隔离。
- 结构化模式和经典模式可切换。
- 命令块能复制、折叠、删除、重新执行。
- 命令历史和收藏可用。
- 搜索可用。
- 右键菜单可用。
- 录制可用或明确标记暂缓。
- 关闭面板后对应 shell session 被关闭。

### 6.6 文件管理器

#### 源项目能力

源项目文件管理器包含：

- 路径导航、上级目录、刷新。
- 文件表格、排序、选择、多选、全选。
- 文件/目录打开。
- 右键或三点菜单：预览、下载、压缩、重命名、复制/重复、剪切、chmod、删除。
- 新建文件夹。
- 上传文件、上传目录。
- 上传任务面板：进度、成功、失败、取消、重试、清除已完成。
- 搜索、递归搜索、取消搜索。
- 批量下载、批量删除、批量 chmod。
- 文件预览和编辑。
- 权限编辑器。
- 确认弹窗和输入弹窗。
- 操作日志。

#### 当前 React 状态

`FilePanel.tsx` 只支持列目录、输入路径、刷新、双击进入目录。

#### 缺口

当前 React 文件面板缺失绝大多数 SFTP 文件管理功能。

#### 迁移步骤

1. 将 `FilePanel.tsx` 拆分为：
   - `FileManagerPanel.tsx`
   - `FileToolbar.tsx`
   - `FileTable.tsx`
   - `ActionMenu.tsx`
   - `FilePreview.tsx`
   - `PermissionEditor.tsx`
   - `UploadTaskPanel.tsx`
2. 迁移 hooks：
   - `useNavigation`
   - `useFileOperations`
   - `usePermissions`
   - `useUploadTasks`
3. 补全后端 API 封装：list、read、write、upload、download、delete、rename、mkdir、chmod、compress、search。
4. 对危险操作使用 `useConfirm`。
5. 文件编辑器优先用 CodeMirror 6。
6. 批量下载根据后端能力决定：后端打包优先；否则前端 `jszip` 打包。
7. 上传目录需要保留相对路径。
8. 所有操作写日志。

#### 验收标准

- 可以浏览目录、排序、选择、多选。
- 可以上传文件/目录，并显示进度、取消、失败重试。
- 可以下载单文件和批量文件。
- 可以预览和编辑文本文件。
- 可以新建文件夹、重命名、删除、chmod。
- 搜索和递归搜索可用。
- 大文件、空目录、权限不足、网络中断都有错误提示。

### 6.7 AI 助手

#### 源项目能力

源项目 AI 面板包含：

- AI 配置：API endpoint、API key、模型、温度、max tokens、系统提示词。
- 模型拉取。
- 预设模型供应商。
- 配置状态提示。
- Markdown 渲染和代码高亮。
- 代码块命令执行按钮。
- 快捷问题。
- 快捷功能：运维、安全、性能、报告。
- 目标终端选择：AI 自动或指定终端。
- AI 执行步骤展示。
- 工具结果卡片。
- 深度思考内容展示。
- 危险命令审批：拒绝/执行。
- 取消处理。
- 与 Dockview 终端列表联动。
- AI 创建/关闭终端。
- AI 工具执行器。
- AI 工具日志 store。

#### 当前 React 状态

`AIChatPanel.tsx` 只加载历史、发送消息、显示简单列表。

#### 缺口

当前 React AI 面板还没有恢复源项目核心 AI 运维助手能力。

#### 迁移步骤

1. 引入 `marked` 和 `highlight.js`。
2. 新增 `AISettingsDialog.tsx`。
3. 新增模型拉取和预设供应商。
4. 新增 timeline 数据结构：user、assistant、tool、steps、reasoning、approval。
5. 接入 Wails AI 事件流。
6. 接入 `dockview:terminals-changed`，维护终端列表。
7. 迁移 `aiToolExecutor` 为 React/TS 工具模块。
8. 迁移命令审批和危险命令确认。
9. 支持指定终端执行或自动创建 AI 终端。
10. 接入 `useAIToolLogStore`。

#### 验收标准

- 未配置 AI 时提示清楚。
- 能保存和加载 AI 配置。
- 能获取模型列表。
- AI 回复支持 Markdown 和代码高亮。
- shell 代码块可触发执行，但危险命令必须审批。
- 执行过程、工具结果、reasoning、审批状态都能展示。
- 能选择目标终端。
- AI 自动创建终端时能收到 ready 事件并执行命令。
- 可以取消当前处理。

### 6.8 批量命令

#### 源项目能力

- 选择多个连接。
- 输入命令。
- 批量执行。
- 展示每个连接的执行状态、输出、错误。
- 支持常用命令模板。
- 危险命令确认。
- 日志记录。

#### 当前 React 状态

`CommandPanel.tsx` 不能视为 `BatchCommandPanel.vue` 的等价迁移。它更像当前连接的简单命令工具。

#### 迁移步骤

1. 新增 `BatchCommandPanel.tsx`，不要用当前 `CommandPanel` 冒充完成。
2. 接入连接 store，支持多连接选择。
3. 后端 API 若已有批量执行，直接封装；否则前端并发调用单连接命令 API。
4. 输出按连接分组展示。
5. 危险命令执行前必须确认。
6. 写入操作日志。

#### 验收标准

- 可以选择多个连接批量执行命令。
- 每个连接状态独立展示。
- 成功/失败/超时都能识别。
- 支持取消或至少不阻塞 UI。

### 6.9 端口转发

#### 源项目能力

- 展示转发规则表格。
- 支持名称。
- 支持 local 与 remote 两种类型。
- 展示监听地址、目标地址、连接数、流量、状态。
- 支持添加、编辑、启动、停止、删除。
- 表单有解释和校验。
- 名称可本地持久化。
- 监听事件刷新状态。

#### 当前 React 状态

`PortForwardPanel.tsx` 只支持简单表单和 `AddLocalForward`，没有 local/remote 类型切换，没有启动/停止/编辑/删除，没有统计展示。

#### 迁移步骤

1. 扩展 `ForwardItem` 类型。
2. 新增 add/edit dialog。
3. 支持 `type: local | remote`。
4. 补 API：AddLocalForward、AddRemoteForward、StartForward、StopForward、UpdateForward、RemoveForward。
5. 展示连接数、总连接数、上传/下载流量。
6. 用 localStorage 或后端字段保存名称。
7. 订阅端口转发状态事件。

#### 验收标准

- local/remote 都能创建。
- 可以启动、停止、编辑、删除。
- 状态和流量能刷新。
- 端口输入有校验。
- 删除前有确认。

### 6.10 防火墙面板

#### 源项目能力

应以源 `FirewallPanel.vue` 为准恢复：

- 读取防火墙状态。
- 展示规则列表。
- 添加/删除规则。
- 启用/禁用防火墙或规则。
- 识别常见系统防火墙工具，如 ufw、firewalld、iptables，具体以后端能力为准。
- 操作前确认。
- 操作后刷新。
- 写日志。

#### 当前 React 状态

当前 React 防火墙面板只是基础外壳或简单命令式操作，不足以视为迁移完成。

#### 迁移步骤

1. 对照源 `FirewallPanel.vue` 完整梳理后端 API。
2. 建立规则模型类型。
3. 实现状态读取、规则表格、添加规则弹窗、删除确认。
4. 所有危险操作写确认和日志。

#### 验收标准

- 能查看状态。
- 能查看规则。
- 能添加和删除规则。
- 操作失败有明确错误提示。

### 6.11 进程守护面板

#### 源项目能力

- 查看守护规则或进程/服务列表。
- 添加守护项。
- 启动、停止、重启。
- 删除守护项。
- 状态刷新。
- 日志记录。

#### 当前 React 状态

当前 React 仅有基础列表和操作外壳，未确认与源项目完全等价。

#### 迁移步骤

1. 对照源 `ProcessGuardPanel.vue` 补齐字段和操作。
2. 建立守护项类型。
3. 实现添加/编辑弹窗。
4. 对停止、删除等操作加确认。
5. 状态定时刷新或事件刷新。

#### 验收标准

- 守护项能增删改查。
- 启停重启可用。
- 状态刷新准确。

### 6.12 监控面板

#### 源项目能力

- 展示系统资源信息。
- CPU、内存、磁盘、网络等基础指标。
- 可能包含进程/服务状态。
- 自动刷新或手动刷新。

#### 当前 React 状态

当前已有 `MonitorPanel.tsx`，但需要逐项对照源 `MonitorPanel.vue`，确认是否缺失图表、刷新周期、字段、错误提示和样式。

#### 迁移步骤

1. 对照源模板和脚本逐项列出指标字段。
2. 补全 React 数据类型。
3. 补全刷新逻辑。
4. 如源项目有图表，补图表组件或明确暂缓。

#### 验收标准

- 源项目展示的所有指标，React 均能展示。
- 刷新逻辑可控。
- 连接断开时有提示。

### 6.13 日志面板

#### 源项目能力

源项目日志不是简单 `journalctl` 输出，而是应用内 logger 记录：

- 连接事件。
- 终端命令。
- 文件操作。
- AI 工具调用。
- 端口转发/防火墙/守护操作。
- 错误日志。
- 日志级别和类型。

#### 当前 React 状态

当前 `LogsPanel.tsx` 若只是展示远程日志或 journalctl，不等价。

#### 迁移步骤

1. 迁移 `utils/logger.js` 为 `lib/logger.ts`。
2. 建立全局 log store。
3. 所有模块操作统一写日志。
4. `LogsPanel.tsx` 展示应用操作日志。
5. 如需远程系统日志，应作为单独子功能，不替代应用日志。

#### 验收标准

- 连接、命令、文件、AI、端口、防火墙、守护操作都会产生日志。
- 日志能按类型/级别过滤。
- 日志能清空或导出，如源项目支持则迁移。

### 6.14 顶部书签与工具栏

#### 源项目能力

源 SSH 布局包含顶部书签栏、左侧/右侧/底部工具栏等布局辅助组件，用于快速打开面板、显示状态或执行快捷动作。

#### 当前 React 状态

当前 `SSHWorkspace.tsx` 将功能压成一个固定 tabs，不等价。

#### 迁移步骤

1. 对照 `layout` 目录完整列出所有布局组件。
2. 新增 React 对应组件。
3. 工具栏按钮调用 Dockview 的 `togglePanel/addPanel`，而不是切换固定 tab。
4. 书签栏接入连接 store。

#### 验收标准

- 工具栏与源项目布局接近。
- 点击工具栏能打开/关闭对应面板。
- 书签或快速连接入口可用。

## 7. 高风险偏差清单

后续迁移必须优先修复以下高风险点：

1. **终端 sessionID 固定**：当前 `react-${connID}` 会阻止多终端能力，并可能造成输出串线。
2. **Tabs 替代 Dockview**：固定 tabs 无法承载源项目核心多面板、多终端、右键菜单和 AI 终端联动。
3. **连接分组行为变化**：当前“打开方式”表单与源项目 `advanced.groupBehavior` 的 prompt 流程不一致。
4. **设置项缺失导致功能无法配置**：终端默认类型、字体、发送模式、代码高亮等缺失，会影响终端迁移。
5. **React 依赖不足**：未引入 Markdown/highlight、CodeMirror、Dockview、xterm search/serialize 等库，相关功能无法完整实现。
6. **事件命名大小写混乱**：`connID/connId`、`sessionID/sessionId` 混用会导致事件无法匹配。
7. **没有统一 store**：复杂功能如果继续写在组件内部，会导致 AI、终端、Dockview、日志互相无法协作。
8. **危险操作缺少确认**：文件删除、批量命令、防火墙、进程、端口删除等必须恢复确认机制。
9. **AI 工具执行缺少审批**：不能直接执行 AI 生成的命令，必须保留审批和安全分析。
10. **日志语义被替换**：远程系统日志不能替代源项目应用操作日志。

## 8. 推荐迁移顺序

### Phase 0：盘点与基础设施锁定

目标：先保证后续迁移不返工。

- 列出所有 qssh 前端文件。
- 列出所有 goshell React 文件。
- 建立完整 source-to-target 映射。
- 补齐依赖。
- 统一 Wails API 封装和类型。
- 建立 React store 基础。
- 建立 toast、confirm、logger。

验收：不实现大功能，但后续模块能共用统一 API、类型、store、消息和日志。

### Phase 1：首页、连接流、设置、云端

目标：恢复所有功能的配置入口。

- 完成连接分组行为。
- 完成连接列表编辑/删除/状态刷新。
- 完成设置页所有 section。
- 完成导入/导出。
- 明确云同步是否保留；如保留，完整迁移。

验收：所有配置项可保存并影响后续功能。

### Phase 2：SSH 工作区与 Dockview

目标：先恢复承载复杂面板的布局系统。

- 引入 Dockview React。
- 实现面板 registry。
- 实现 add/toggle/close 面板。
- 实现右键菜单。
- 实现终端列表事件和 AI 终端事件。

验收：可以打开多个终端和多个工具面板，关闭面板会清理资源。

### Phase 3：终端完整迁移

目标：恢复结构化终端，这是核心优先级最高模块。

- 多 session。
- 结构化/经典双模式。
- 命令块、历史、补全、搜索、录制、快捷键、右键菜单。
- 配置驱动字体和模式。
- AI session ready 事件。

验收：终端行为基本等价 qssh。

### Phase 4：文件管理器完整迁移

目标：恢复 SFTP 文件管理能力。

- 文件表格、排序、选择。
- 上传/下载/批量/预览/编辑/权限/搜索/任务进度。
- 操作确认和日志。

验收：可作为日常 SFTP 文件管理器使用。

### Phase 5：AI 助手与批量命令

目标：恢复 AI 运维和多连接命令能力。

- AI 配置、模型、Markdown、审批、工具执行、终端联动。
- 批量命令面板。
- AI 工具日志。

验收：AI 可安全地辅助执行命令，批量命令可按连接展示结果。

### Phase 6：端口转发、防火墙、进程守护、监控、日志

目标：恢复运维工具面板。

- 端口转发 local/remote、启停、编辑、删除、统计。
- 防火墙规则管理。
- 进程守护管理。
- 监控指标补齐。
- 应用日志补齐。

验收：源项目对应工具面板的功能全部可用。

### Phase 7：样式、体验、回归测试

目标：清理迁移痕迹，保证产品体验统一。

- 主题变量统一。
- 弹窗、表格、工具栏、Dockview、终端样式统一。
- 键盘快捷键。
- 空状态、错误状态、加载状态。
- 打包测试。

验收：从用户体验看不再像临时 React 骨架，而是完整桌面 SSH 工具。

## 9. Codex 执行用 step 清单

### step-001：建立前端迁移总账本

目标：把本文档放入仓库根目录 `MIGRATION_NOTES.md`，作为唯一迁移账本。

状态：已完成

重构方案：
- 保留 `MIGRATION_NOTES.md` 作为仓库根目录唯一迁移账本。
- 后续所有 step、缺口记录、阶段推进和验收标准都继续回写到这里，不再另起迁移文档。

落点：

- `MIGRATION_NOTES.md`

验收：文档包含模块映射、缺口、阶段、验收标准。

### step-002：补齐依赖和类型基础

目标：补齐 Dockview、Markdown、高亮、CodeMirror、xterm search/serialize、jszip 等依赖，并统一 Wails API 类型。

状态：已完成

重构方案：
- 在 `frontend/package.json` 中补齐 Dockview、Marked、highlight.js、JSZip、xterm search/serialize，以及 CodeMirror 6 相关依赖。
- 新增 `frontend/src/types/*`，把 App、SSH、AI、Cloud、事件、日志、终端和 Wails 返回值拆成可复用的公共模型。
- 将 `frontend/src/lib/wails/types.ts` 改成统一导出入口，并把 `frontend/src/lib/wails/services.ts` 收紧成显式接口。
- 顺手把当前已用到的组件对齐到新的类型边界，避免继续堆积临时 `interface` 和 `any`。

落点：

- `frontend/package.json`
- `frontend/src/lib/wails/index.ts`
- `frontend/src/lib/wails/services.ts`
- `frontend/src/lib/wails/types.ts`
- `frontend/src/types/*`

验收：`npm run build` 或对应包管理器 build 通过；无未声明类型导致的编译错误。

### step-003：实现全局 toast、confirm、logger

目标：恢复消息提示、危险操作确认和应用操作日志。

状态：已完成

重构方案：
- 新增 `frontend/src/components/ui/toast.tsx` 和 `frontend/src/components/ui/confirm.tsx`，分别提供全局提示和危险操作确认的上下文能力。
- 新增 `frontend/src/lib/logger.ts` 与 `frontend/src/stores/logStore.ts`，把应用操作日志统一写入内存/本地持久化存储，并保留控制台输出。
- 在首页连接流、连接列表和设置页接入 toast、confirm、logger，确保危险操作可确认、成功失败可提示、关键动作可落日志。
- 在 `main.tsx` 挂载全局 Provider，补齐弹窗与提示样式，保证能力可被后续所有模块复用。

落点：

- `frontend/src/components/ui/toast.tsx`
- `frontend/src/components/ui/confirm.tsx`
- `frontend/src/lib/logger.ts`
- `frontend/src/stores/logStore.ts`
- `frontend/src/components/home/ConnectionForm.tsx`
- `frontend/src/components/home/ConnectionsPanel.tsx`
- `frontend/src/components/home/SettingsPanel.tsx`
- `frontend/src/main.tsx`
- `frontend/src/styles/app.css`

验收：任一模块可调用 toast/confirm/logger。

### step-004：实现 React store 基础

目标：建立 config、connections、layout、terminalSessions、commandHistory、aiToolLog 等 store。

状态：已完成

重构方案：
- 新增 `frontend/src/stores/createStore.ts` 作为轻量 external store 基础，避免后续每个模块重复实现订阅、发布和 `useSyncExternalStore` 接线。
- 按迁移清单补齐 `config`、`sshConnections`、`sshLayout`、`terminalSessions`、`commandHistory`、`aiToolLog` 六个 store 文件，先把状态骨架和常用更新动作立起来。
- 让 `useAppData.ts` 在加载和事件刷新时同步写入 config / connections store，避免页面层继续各自维护同一份后端快照。
- 让 `App.tsx` 直接读取 `sshLayoutStore` 的首页视图状态，确认 store 不只是“文件存在”，而是已经进入页面级使用链路。

落点：

- `frontend/src/stores/createStore.ts`
- `frontend/src/stores/configStore.ts`
- `frontend/src/stores/sshConnectionsStore.ts`
- `frontend/src/stores/sshLayoutStore.ts`
- `frontend/src/stores/terminalSessionsStore.ts`
- `frontend/src/stores/commandHistoryStore.ts`
- `frontend/src/stores/aiToolLogStore.ts`
- `frontend/src/hooks/useAppData.ts`
- `frontend/src/App.tsx`

验收：设置页、连接页、SSH 工作区可共用 store，不再重复请求和散落状态。

### step-005：恢复首页连接流

目标：恢复 `prompt/join_default/new_window` 行为和连接选择弹窗。

状态：已完成

重构方案：
- 新增 `frontend/src/components/home/ConnectionOptionsDialog.tsx`，把已有连接窗口时的选择动作独立成可复用弹窗，不再混在表单内部硬编码。
- 修改 `ConnectionForm.tsx` 的分组选择逻辑，按 `advanced.groupBehavior` 处理 `prompt`、`join_default`、`new_window`，并在无活动分组时直接落到默认分组。
- 去掉表单里的“打开方式”手动选择项，避免它和高级设置冲突；当用户在弹窗里取消时，连接流程应平滑中断，不产生误连。
- 保留测试连接、自动托盘、成功/失败提示和日志记录，确保连接主链路没有被这次分流改坏。

落点：

- `frontend/src/components/home/ConnectionForm.tsx`
- `frontend/src/components/home/ConnectionOptionsDialog.tsx`

验收：三个分组策略均按源项目行为工作。

### step-006：恢复完整设置页

目标：迁移终端、快捷键、高级、窗口、云端、导入导出设置。

状态：已完成

重构方案：
- 把设置页拆成终端、快捷键、高级、窗口、私有云端、导入/导出几个独立 section，避免一个大面板继续堆所有表单逻辑。
- 新增 `CloudSettingsSection.tsx` 和 `ImportExportSection.tsx`，把云同步配置和配置文件导入/导出独立出来，使用明确的保存、连接、上传、下载和导入确认流程。
- 在 `SettingsPanel.tsx` 中按后端真实配置字段写入 `terminal.*`、`shortcuts.*`、`advanced.*`、`ui.*`、`cloud.*`，并通过 `HomeWorkspace.tsx` 透传连接列表给云端 section。
- 保留清除窗口位置这类危险操作的确认和日志，同时让设置变更能回写配置并在刷新后重新载入。

落点：

- `frontend/src/components/home/SettingsPanel.tsx`
- `frontend/src/components/home/CloudSettingsSection.tsx`
- `frontend/src/components/home/ImportExportSection.tsx`
- `frontend/src/components/home/HomeWorkspace.tsx`
- `frontend/src/styles/app.css`

验收：所有源项目设置项可见、可保存、刷新后仍生效。

### step-007：用 Dockview 重建 SSH 工作区

目标：替换固定 Tabs，恢复多面板布局。

状态：已完成

重构方案：
- 新增 `DockviewWorkspace.tsx`，用 `dockview-react` 替代固定 Tabs 作为 SSH 面板容器，并在顶部保留可点击的面板工具条。
- 新增 `panelRegistry.tsx`，把终端、文件、监控、AI、转发、防火墙、守护、日志、命令这些面板统一注册到 Dockview 组件映射里。
- 新增 `PanelContextMenu.tsx`，把右键菜单里的“新建终端”“关闭同类型全部”等行为收口成 Dockview 侧的统一逻辑。
- 通过 `dockview:terminals-changed` 广播当前终端面板列表和活动面板，给后续 AI/终端联动预留统一事件桥。
- 在 `SSHWorkspace.tsx` 中保留连接切换侧栏与状态壳，去掉固定 Tabs，改为把当前连接传给 Dockview 工作区中的各个面板。

落点：

- `frontend/src/components/ssh/SSHWorkspace.tsx`
- `frontend/src/components/ssh/layout/DockviewWorkspace.tsx`
- `frontend/src/components/ssh/layout/panelRegistry.tsx`
- `frontend/src/components/ssh/layout/PanelContextMenu.tsx`
- `frontend/src/types/events.ts`
- `frontend/src/styles/app.css`

验收：可多终端、多面板、右键关闭、AI 终端事件可用。

### step-008：恢复终端 session 管理

目标：修复固定 sessionID，建立多终端 session 生命周期。

状态：已完成

重构方案：
- 新增 `frontend/src/components/ssh/terminal/sessionManager.ts`，把终端 session 的创建、注册、更新和销毁收口成统一入口。
- 把 `TerminalPanel.tsx` 改成显式接收 `connID`、`sessionID`、`isAI`，不再在组件内部拼固定 `react-${connID}`。
- 让 `DockviewWorkspace.tsx` 在打开终端面板时生成唯一 sessionID，并把它透传给 `panelRegistry.tsx` 和 `TerminalPanel.tsx`，从源头保证多终端互不串线。
- 在终端启动完成后 emit `terminal:session-ready`，并同步更新 `terminalSessionsStore`，保证 session 生命周期、ready 状态和关闭清理都可追踪。

落点：

- `frontend/src/components/ssh/TerminalPanel.tsx`
- `frontend/src/components/ssh/terminal/sessionManager.ts`
- `frontend/src/stores/terminalSessionsStore.ts`
- `frontend/src/components/ssh/layout/DockviewWorkspace.tsx`
- `frontend/src/components/ssh/layout/panelRegistry.tsx`
- `frontend/src/types/events.ts`
- `frontend/src/types/terminal.ts`

验收：同一连接多个终端互不串线；关闭面板关闭对应 session。

### step-009：迁移结构化终端

目标：恢复结构化视图、经典视图、命令块、历史、补全、搜索、录制、右键菜单。

状态：已完成

重构方案：

- 将终端拆成 `ClassicTerminalView` 和 `StructuredTerminalPanel` 两层，经典终端继续承载 xterm 会话，结构化视图负责块化输出与交互控件。
- 提取 `useBlockManager`、`useCommandHistory`、`useCommandCompletion`、`useRecording`、`useTerminalSearch`，分别管理输出块、命令历史、补全、录制和搜索。
- 新增 `TerminalToolbar`、`TerminalBlock`、`TerminalSearchBar`、`CompletionPopup`、`CommandHistoryDialog`、`TerminalContextMenu`、`TerminalStatusBar`，补齐结构化终端的主要交互。
- 为结构化终端补齐样式，包含视图切换、块列表、搜索框、补全弹层、历史弹窗和状态栏。
- 保留经典终端会话生命周期与 `terminal:session-ready` 事件，避免切换视图时中断连接。

验证：

- `cd frontend && npm run build`

### step-010：迁移完整文件管理器

目标：恢复 SFTP 文件管理器。

落点：

- `frontend/src/components/ssh/file-manager/FileManagerPanel.tsx`
- `frontend/src/components/ssh/file-manager/components/*`
- `frontend/src/components/ssh/file-manager/hooks/*`
- `frontend/src/components/ssh/file-manager/utils/*`

验收：上传、下载、预览、编辑、权限、搜索、批量操作均可用。

### step-011：迁移 AI 助手

目标：恢复 AI 配置、模型、Markdown、高亮、审批、工具执行、终端联动。

落点：

- `frontend/src/components/ssh/AIChatPanel.tsx`
- `frontend/src/components/ssh/ai/*`
- `frontend/src/lib/aiToolExecutor.ts`
- `frontend/src/stores/aiToolLogStore.ts`

验收：AI 可安全审批并执行命令，能创建/使用终端。

### step-012：迁移批量命令

目标：恢复源 `BatchCommandPanel`。

落点：

- `frontend/src/components/ssh/BatchCommandPanel.tsx`

验收：可选择多个连接并批量执行命令，逐连接展示结果。

### step-013：迁移端口转发

目标：恢复 local/remote、启停、编辑、删除、统计。

落点：

- `frontend/src/components/ssh/PortForwardPanel.tsx`

验收：local/remote 都可用，状态和流量刷新正常。

### step-014：迁移防火墙、进程守护、监控

目标：补齐运维工具面板。

落点：

- `frontend/src/components/ssh/FirewallPanel.tsx`
- `frontend/src/components/ssh/ProcessGuardPanel.tsx`
- `frontend/src/components/ssh/MonitorPanel.tsx`

验收：所有源项目字段和操作可用。

### step-015：迁移日志面板

目标：恢复应用日志，而不是只展示远程系统日志。

落点：

- `frontend/src/components/ssh/LogsPanel.tsx`
- `frontend/src/lib/logger.ts`
- `frontend/src/stores/logStore.ts`

验收：各模块操作均产生可过滤日志。

### step-016：样式与交互回归

目标：统一主题、布局、弹窗、表格、终端、Dockview、文件管理器样式。

落点：

- `frontend/src/styles/*`
- 各模块 CSS/Tailwind class

验收：深色/浅色主题都正常；窗口尺寸变化、Dockview resize、终端 fit 正常。

### step-017：完整回归测试

目标：确保迁移完整。

验收命令：

```bash
cd frontend
npm run build

cd ..
go test ./...
wails3 build
```

手工验收场景：

1. 新建连接、测试连接、连接成功、打开 SSH 窗口。
2. 已有窗口时分别测试 prompt、join_default、new_window。
3. 同一连接打开多个终端，执行不同命令不串线。
4. 结构化终端与经典终端切换。
5. 文件上传、下载、预览、编辑、删除、chmod。
6. AI 配置模型并执行安全命令。
7. AI 生成危险命令时出现审批。
8. 批量命令对多个连接执行。
9. 端口转发 local/remote 创建、启动、停止、删除。
10. 防火墙规则增删。
11. 进程守护启停。
12. 日志面板能看到上述操作日志。
13. 关闭 SSH 窗口后 session 和事件监听正确清理。
14. 打包后的桌面应用可运行。

## 10. 不迁移或暂缓项记录区

后续如果决定不迁移某些功能，必须写在这里。

| 功能 | 决策 | 原因 | 替代方案 |
|---|---|---|---|
| 私有云端同步 | 待定 | 用户曾表示不需要 AI 和云端同步功能，但当前需再次确认项目目标 | 如不迁移，应从设置、快捷键、服务调用中移除入口 |
| AI 助手 | 待定 | 用户曾表示不需要 AI，但当前迁移完整性要求需先列入账本 | 如不迁移，应明确删除 AI 面板和相关工具 |

注意：在未明确删除前，本文档仍将它们视为源项目功能缺口。

## 11. 后续执行原则

1. 每完成一个 step，必须更新本文档中的状态。
2. 不要把“组件已创建”当成“功能已完成”。
3. 不要先做大面积样式美化，应先恢复数据流、事件流和操作闭环。
4. 每个危险操作必须有确认。
5. 每个异步操作必须有 loading、success、error 状态。
6. 每个 Wails event 订阅必须有清理。
7. 每个复杂功能必须有手工验收记录。
8. React 版可以重新设计组件结构，但不能无意改变源项目用户行为。
