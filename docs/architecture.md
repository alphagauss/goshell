# goshell 架构草案

## 目标

从 `D:\opensource\qssh` 迁移到当前仓库，后端保持 Go，前端改为 React。优先复制可复用代码，只在目录结构、模块路径、Wails 绑定和 React 迁移处做必要改动。

## 目录边界

- `main.go`：只负责嵌入前端产物和启动应用。
- `internal/wailsapi`：Wails 桌面适配层，负责创建应用、注册服务、窗口、托盘和事件循环。
- `internal/ssh`：SSH、SFTP、终端、配置、窗口、监控等业务服务。
- `internal/ai`：AI 配置、会话、工具调用和日志。
- `internal/cloud`：云端同步客户端和服务端。
- `frontend`：React + TypeScript + Vite 前端，前端只通过本地 API adapter 访问 Wails 生成绑定。
- `build`、`Taskfile.yml`：从源项目平移的 Wails 构建配置，暂不调整。

## Wails API 适配

后端适配层放在 `internal/wailsapi`，对外只暴露 `Run(assets embed.FS, trayIcon []byte)`。这样根入口保持稳定，后续服务注册、事件命名、窗口行为都集中在一个地方调整。

前端适配层放在 `frontend/src/lib/wails`。React 组件不直接散落引用生成的 `frontend/bindings/*`，而是通过 `sshApi`、`configApi`、`cloudApi`、`aiApi`、`eventsApi` 等薄封装访问，避免后续 Wails 包路径变化影响组件。

## 分阶段验证

1. Go/Wails 框架迁移：`go test ./...`。
2. React 前端骨架：`npm run build`。
3. 前后端集成：重新生成 Wails bindings，执行 Go 与前端构建。
